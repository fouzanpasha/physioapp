import { PoseCoordinate } from '../types';

export interface StateMachineResult {
  repCount: number;
  repState: 'waiting_for_start' | 'movement_in_progress' | 'movement_at_end';
  repQuality: 'poor' | 'good' | 'excellent';
  activeArm: 'left' | 'right' | 'both';
  accuracy: number;
  feedback: string;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  points: number;
  debugInfo: {
    distanceToStart: number;
    distanceToEnd: number;
    proximityThreshold: number;
    stateChange: string | null;
  };
}

export interface ExerciseTemplate {
  name: string;
  frames: PoseCoordinate[][];
  duration: number;
  frameCount: number;
  createdAt: string;
}

/**
 * State Machine for Repetition Detection
 * Based on Gemini's approach: waiting_for_start -> movement_in_progress -> movement_at_end -> waiting_for_start
 */
export class RepetitionStateMachine {
  private repCount: number = 0;
  private repState: 'waiting_for_start' | 'movement_in_progress' | 'movement_at_end' = 'waiting_for_start';
  private proximityThreshold: number = 0.15; // Back to more conservative threshold
  private startPoint: any = null;
  private endPoint: any = null;
  private lastStateChange: string | null = null;
  
  // Add state stability tracking to prevent rapid changes
  private stateStartTime: number = 0;
  private stateStabilityThreshold: number = 500; // Must stay in state for 500ms
  private lastStateTransitionTime: number = 0;
  private minTimeBetweenTransitions: number = 1000; // Minimum 1 second between transitions

  constructor(template: ExerciseTemplate) {
    this.initializeTemplatePoints(template);
    this.stateStartTime = Date.now();
    this.lastStateTransitionTime = Date.now();
  }

  /**
   * Initialize start and end points from template
   */
  private initializeTemplatePoints(template: ExerciseTemplate) {
    if (!template.frames || template.frames.length === 0) {
      console.warn('No template frames available for state machine');
      return;
    }

    // Start point is the first frame
    this.startPoint = this.extractWristPosition(template.frames[0]);
    
    // End point is the frame with minimum y-coordinate (highest arm position)
    this.endPoint = this.findPeakPosition(template.frames);
    
    console.log('State Machine initialized:', {
      startPoint: this.startPoint,
      endPoint: this.endPoint,
      totalFrames: template.frames.length
    });
  }

  /**
   * Find the peak position (minimum y-coordinate) in the template
   */
  private findPeakPosition(frames: any[][]): any {
    let minY = Infinity;
    let peakFrame = frames[0];

    for (const frame of frames) {
      const wristPos = this.extractWristPosition(frame);
      if (wristPos && wristPos.y < minY) {
        minY = wristPos.y;
        peakFrame = frame;
      }
    }

    return this.extractWristPosition(peakFrame);
  }

  /**
   * Extract wrist position from a frame (supports both arms)
   */
  private extractWristPosition(frame: any[]): any {
    if (!frame || frame.length < 6) return null;

    // Template frames might have different structure than live pose landmarks
    // Try different possible indices for wrist positions
    const possibleRightWrists = [frame[4], frame[15]]; // Try both possible indices
    const possibleLeftWrists = [frame[5], frame[16]]; // Try both possible indices

    // Find the first valid wrist position
    for (const wrist of possibleRightWrists) {
      if (wrist && typeof wrist.x === 'number' && typeof wrist.y === 'number') {
        console.log('Found right wrist in template:', { x: wrist.x.toFixed(3), y: wrist.y.toFixed(3) });
        return wrist;
      }
    }

    for (const wrist of possibleLeftWrists) {
      if (wrist && typeof wrist.x === 'number' && typeof wrist.y === 'number') {
        console.log('Found left wrist in template:', { x: wrist.x.toFixed(3), y: wrist.y.toFixed(3) });
        return wrist;
      }
    }

    console.warn('No valid wrist position found in template frame');
    return null;
  }

  /**
   * Process current pose and update state machine
   */
  public processPose(poseLandmarks: any[]): StateMachineResult {
    if (!poseLandmarks || poseLandmarks.length < 16) {
      return this.createDefaultResult('No pose data available');
    }

    if (!this.startPoint || !this.endPoint) {
      console.warn('State Machine: Template not properly initialized', {
        startPoint: this.startPoint,
        endPoint: this.endPoint
      });
      return this.createDefaultResult('Template not properly initialized');
    }

    // Determine active arm and get current wrist position
    const { activeArm, currentWrist } = this.determineActiveArm(poseLandmarks);
    
    if (!currentWrist) {
      return this.createDefaultResult('No wrist detected');
    }

    // Calculate distances to key points
    const distanceToStart = this.calculate3DDistance(currentWrist, this.startPoint);
    const distanceToEnd = this.calculate3DDistance(currentWrist, this.endPoint);

    // Debug logging
    console.log('State Machine Debug:', {
      currentWrist: { x: currentWrist.x.toFixed(3), y: currentWrist.y.toFixed(3) },
      startPoint: { x: this.startPoint.x.toFixed(3), y: this.startPoint.y.toFixed(3) },
      endPoint: { x: this.endPoint.x.toFixed(3), y: this.endPoint.y.toFixed(3) },
      distanceToStart: distanceToStart.toFixed(3),
      distanceToEnd: distanceToEnd.toFixed(3),
      proximityThreshold: this.proximityThreshold,
      currentState: this.repState,
      activeArm
    });

    // Process state machine
    const previousState = this.repState;
    this.processStateMachine(distanceToStart, distanceToEnd);

    // Calculate accuracy and feedback
    const accuracy = this.calculateAccuracy(distanceToStart, distanceToEnd);
    const { feedback, status, points } = this.generateFeedback(accuracy, this.repState);

    // Determine rep quality based on accuracy during movement
    const repQuality = this.determineRepQuality(accuracy);

    return {
      repCount: this.repCount,
      repState: this.repState,
      repQuality,
      activeArm,
      accuracy: Math.round(accuracy),
      feedback,
      status,
      points,
      debugInfo: {
        distanceToStart: Math.round(distanceToStart * 1000) / 1000,
        distanceToEnd: Math.round(distanceToEnd * 1000) / 1000,
        proximityThreshold: this.proximityThreshold,
        stateChange: this.lastStateChange
      }
    };
  }

  /**
   * Determine which arm is active and get its wrist position
   */
  private determineActiveArm(poseLandmarks: any[]): { activeArm: 'left' | 'right' | 'both', currentWrist: any } {
    // MediaPipe Pose landmarks: 15=right wrist, 16=left wrist, 11=right shoulder, 12=left shoulder
    const rightWrist = poseLandmarks[15]; // Right wrist
    const rightShoulder = poseLandmarks[11]; // Right shoulder
    const leftWrist = poseLandmarks[16]; // Left wrist
    const leftShoulder = poseLandmarks[12]; // Left shoulder

    console.log('Pose Landmarks Debug:', {
      rightWrist: rightWrist ? { x: rightWrist.x.toFixed(3), y: rightWrist.y.toFixed(3) } : null,
      leftWrist: leftWrist ? { x: leftWrist.x.toFixed(3), y: leftWrist.y.toFixed(3) } : null,
      rightShoulder: rightShoulder ? { x: rightShoulder.x.toFixed(3), y: rightShoulder.y.toFixed(3) } : null,
      leftShoulder: leftShoulder ? { x: leftShoulder.x.toFixed(3), y: leftShoulder.y.toFixed(3) } : null
    });

    let activeArm: 'left' | 'right' | 'both' = 'right';
    let currentWrist = rightWrist;

    if (rightWrist && leftWrist && rightShoulder && leftShoulder) {
      const rightArmHeight = rightShoulder.y - rightWrist.y;
      const leftArmHeight = leftShoulder.y - leftWrist.y;
      
      const rightMoving = Math.abs(rightArmHeight) > 0.1;
      const leftMoving = Math.abs(leftArmHeight) > 0.1;
      
      if (rightMoving && leftMoving) {
        activeArm = 'both';
        currentWrist = rightArmHeight > leftArmHeight ? rightWrist : leftWrist;
      } else if (leftMoving && !rightMoving) {
        activeArm = 'left';
        currentWrist = leftWrist;
      } else {
        activeArm = 'right';
        currentWrist = rightWrist;
      }
    } else if (leftWrist && leftShoulder && (!rightWrist || !rightShoulder)) {
      activeArm = 'left';
      currentWrist = leftWrist;
    }

    return { activeArm, currentWrist };
  }

  /**
   * Process the state machine logic
   */
  private processStateMachine(distanceToStart: number, distanceToEnd: number) {
    const currentTime = Date.now();
    const previousState = this.repState;
    this.lastStateChange = null;

    // Check if enough time has passed since last transition
    const timeSinceLastTransition = currentTime - this.lastStateTransitionTime;
    if (timeSinceLastTransition < this.minTimeBetweenTransitions) {
      console.log('State change blocked - too soon since last transition:', timeSinceLastTransition + 'ms');
      return;
    }

    // Check if we've been in current state long enough
    const timeInCurrentState = currentTime - this.stateStartTime;
    if (timeInCurrentState < this.stateStabilityThreshold) {
      console.log('State change blocked - not stable enough:', timeInCurrentState + 'ms');
      return;
    }

    console.log('Processing State Machine:', {
      currentState: this.repState,
      distanceToStart: distanceToStart.toFixed(3),
      distanceToEnd: distanceToEnd.toFixed(3),
      threshold: this.proximityThreshold,
      repCount: this.repCount,
      timeInCurrentState: timeInCurrentState + 'ms',
      timeSinceLastTransition: timeSinceLastTransition + 'ms'
    });

    let shouldTransition = false;
    let newState: typeof this.repState = this.repState;

    switch (this.repState) {
      case 'waiting_for_start':
        if (distanceToStart < this.proximityThreshold) {
          newState = 'movement_in_progress';
          shouldTransition = true;
        } else {
          console.log('Waiting for start - distance too far:', distanceToStart.toFixed(3));
        }
        break;

      case 'movement_in_progress':
        if (distanceToEnd < this.proximityThreshold) {
          newState = 'movement_at_end';
          shouldTransition = true;
        } else {
          console.log('Movement in progress - not at end yet:', distanceToEnd.toFixed(3));
        }
        break;

      case 'movement_at_end':
        if (distanceToStart < this.proximityThreshold) {
          newState = 'waiting_for_start';
          shouldTransition = true;
          this.repCount++;
        } else {
          console.log('At end position - waiting to return to start:', distanceToStart.toFixed(3));
        }
        break;
    }

    // Only transition if conditions are met
    if (shouldTransition && newState !== this.repState) {
      const oldState = this.repState;
      this.repState = newState;
      this.stateStartTime = currentTime;
      this.lastStateTransitionTime = currentTime;

      // Set appropriate state change message
      if (oldState === 'waiting_for_start' && newState === 'movement_in_progress') {
        this.lastStateChange = 'Start position reached. Movement beginning.';
      } else if (oldState === 'movement_in_progress' && newState === 'movement_at_end') {
        this.lastStateChange = 'End position reached.';
      } else if (oldState === 'movement_at_end' && newState === 'waiting_for_start') {
        this.lastStateChange = `REP COMPLETE! Total reps: ${this.repCount}`;
      }

      console.log('STATE CHANGE:', this.lastStateChange);
    }
  }

  /**
   * Calculate accuracy based on current position and state
   */
  private calculateAccuracy(distanceToStart: number, distanceToEnd: number): number {
    switch (this.repState) {
      case 'waiting_for_start':
        // At start position, accuracy should be high if close to start
        return Math.max(0, 100 - (distanceToStart * 200));
      
      case 'movement_in_progress':
        // During movement, accuracy is based on how close we are to the ideal path
        const pathAccuracy = Math.min(100, 100 - (distanceToStart * 100) - (distanceToEnd * 100));
        return Math.max(0, pathAccuracy);
      
      case 'movement_at_end':
        // At end position, accuracy should be high if close to end
        return Math.max(0, 100 - (distanceToEnd * 200));
      
      default:
        return 0;
    }
  }

  /**
   * Generate feedback based on accuracy and state
   */
  private generateFeedback(accuracy: number, state: string): { feedback: string, status: 'excellent' | 'good' | 'needs_improvement' | 'poor', points: number } {
    let feedback: string;
    let status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    let points: number;

    switch (state) {
      case 'waiting_for_start':
        if (accuracy >= 80) {
          feedback = 'Perfect start position! Begin the movement.';
          status = 'excellent';
          points = 5;
        } else {
          feedback = 'Get into the starting position.';
          status = 'poor';
          points = 0;
        }
        break;

      case 'movement_in_progress':
        if (accuracy >= 80) {
          feedback = 'Excellent form! Keep moving smoothly.';
          status = 'excellent';
          points = 10;
        } else if (accuracy >= 60) {
          feedback = 'Good movement, stay on track.';
          status = 'good';
          points = 7;
        } else {
          feedback = 'Focus on your form and movement path.';
          status = 'needs_improvement';
          points = 3;
        }
        break;

      case 'movement_at_end':
        if (accuracy >= 80) {
          feedback = 'Perfect end position! Now return to start.';
          status = 'excellent';
          points = 10;
        } else if (accuracy >= 60) {
          feedback = 'Good end position. Return to start to complete the rep.';
          status = 'good';
          points = 7;
        } else {
          feedback = 'Raise your arm higher to reach the end position.';
          status = 'needs_improvement';
          points = 3;
        }
        break;

      default:
        feedback = 'Check your form alignment.';
        status = 'poor';
        points = 0;
    }

    return { feedback, status, points };
  }

  /**
   * Determine rep quality based on accuracy
   */
  private determineRepQuality(accuracy: number): 'poor' | 'good' | 'excellent' {
    if (accuracy >= 85) return 'excellent';
    if (accuracy >= 70) return 'good';
    return 'poor';
  }

  /**
   * Calculate 3D Euclidean distance between two points
   */
  private calculate3DDistance(point1: any, point2: any): number {
    if (!point1 || !point2) return 1;

    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Create default result when pose data is invalid
   */
  private createDefaultResult(message: string): StateMachineResult {
    return {
      repCount: this.repCount,
      repState: this.repState,
      repQuality: 'poor',
      activeArm: 'right',
      accuracy: 0,
      feedback: message,
      status: 'poor',
      points: 0,
      debugInfo: {
        distanceToStart: 0,
        distanceToEnd: 0,
        proximityThreshold: this.proximityThreshold,
        stateChange: null
      }
    };
  }

  /**
   * Get current state for debugging
   */
  public getCurrentState() {
    return {
      repCount: this.repCount,
      repState: this.repState,
      startPoint: this.startPoint,
      endPoint: this.endPoint,
      proximityThreshold: this.proximityThreshold
    };
  }

  /**
   * Reset the state machine (useful for new sessions)
   */
  public reset() {
    this.repCount = 0;
    this.repState = 'waiting_for_start';
    this.lastStateChange = null;
    console.log('State Machine Reset');
  }

  /**
   * Adjust proximity threshold (useful for fine-tuning)
   */
  public setProximityThreshold(threshold: number) {
    this.proximityThreshold = threshold;
    console.log('Proximity threshold updated to:', threshold);
  }
} 