import { PoseCoordinate } from '../types';

export interface FormAnalysisResult {
  accuracy: number;
  distance: number;
  feedback: string;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  points: number;
  angles?: {
    shoulderAngle: number;
    elbowAngle: number;
  };
  phase?: 'rest' | 'raising' | 'raised' | 'lowering';
  phaseProgress?: number;
  repQuality?: 'poor' | 'good' | 'excellent';
  activeArm?: 'left' | 'right' | 'both';
}

export interface ExerciseTemplate {
  name: string;
  frames: PoseCoordinate[][];
  duration: number;
  frameCount: number;
  createdAt: string;
}

/**
 * Enhanced form analysis with proper exercise phase detection
 * Compare current pose to template and calculate accuracy based on exercise progress
 */
export function analyzeForm(
  currentPose: any[],
  template: ExerciseTemplate,
  currentFrameIndex: number
): FormAnalysisResult {
  // Validate inputs
  if (!currentPose || !Array.isArray(currentPose) || currentPose.length === 0) {
    console.log('Form Analysis: No pose data available');
    return {
      accuracy: 0,
      distance: 1,
      feedback: "No pose data available",
      status: 'poor',
      points: 0
    };
  }

  if (!template || !template.frames || template.frames.length === 0) {
    console.log('Form Analysis: No template data available');
    return {
      accuracy: 0,
      distance: 1,
      feedback: "No template data available",
      status: 'poor',
      points: 0
    };
  }

  // Extract key landmarks
  const currentKeyLandmarks = extractKeyLandmarks(currentPose);
  const templateKeyLandmarks = template.frames;

  // Validate that we have the expected landmarks
  if (!currentKeyLandmarks || currentKeyLandmarks.length < 6) {
    console.log('Form Analysis: Not enough pose landmarks detected', currentKeyLandmarks?.length);
    return {
      accuracy: 0,
      distance: 1,
      feedback: "Not enough pose landmarks detected",
      status: 'poor',
      points: 0
    };
  }

  // NEW: Calculate exercise phase and accuracy
  const exerciseAnalysis = analyzeExercisePhase(currentKeyLandmarks, templateKeyLandmarks);
  const angles = calculateAngles(currentPose);

  // Debug logging
  console.log('Form Analysis Debug:', {
    frameIndex: currentFrameIndex,
    exercisePhase: exerciseAnalysis.phase,
    phaseProgress: Math.round(exerciseAnalysis.phaseProgress * 100) + '%',
    accuracy: Math.round(exerciseAnalysis.accuracy),
    activeArm: exerciseAnalysis.activeArm,
    angles: angles,
    currentLandmarks: currentKeyLandmarks.length,
    templateLandmarks: templateKeyLandmarks.length,
    currentWrist: currentKeyLandmarks[4], // Right wrist
    templateWrist: templateKeyLandmarks[0]?.[4]
  });

  // Determine status and feedback
  let status: FormAnalysisResult['status'];
  let feedback: string;
  let points: number;

  if (exerciseAnalysis.accuracy >= 80) {
    status = 'excellent';
    feedback = 'Perfect form! Keep it up!';
    points = 10;
  } else if (exerciseAnalysis.accuracy >= 60) {
    status = 'good';
    feedback = 'Good form, minor adjustments needed';
    points = 7;
  } else if (exerciseAnalysis.accuracy >= 40) {
    status = 'needs_improvement';
    feedback = getPhaseBasedFeedback(exerciseAnalysis, angles, currentKeyLandmarks);
    points = 4;
  } else {
    status = 'poor';
    feedback = exerciseAnalysis.phase === 'rest' ? 'Start the exercise' : 'Poor form. Please review the instructions.';
    points = 1;
  }

  return {
    accuracy: Math.round(exerciseAnalysis.accuracy),
    distance: 1 - (exerciseAnalysis.accuracy / 100),
    feedback,
    status,
    points,
    angles,
    phase: exerciseAnalysis.phase,
    phaseProgress: exerciseAnalysis.phaseProgress,
    activeArm: exerciseAnalysis.activeArm
  };
}

/**
 * Analyze the current exercise phase and calculate appropriate accuracy
 */
function analyzeExercisePhase(currentLandmarks: any[], templateFrames: any[][]): {
  phase: 'rest' | 'raising' | 'raised' | 'lowering';
  phaseProgress: number;
  accuracy: number;
  activeArm: 'left' | 'right' | 'both';
} {
  if (currentLandmarks.length < 8 || templateFrames.length === 0) {
    return { phase: 'rest', phaseProgress: 0, accuracy: 0, activeArm: 'right' };
  }

  // Extract both arms' landmarks
  const rightWrist = currentLandmarks[4]; // Right wrist
  const rightShoulder = currentLandmarks[0]; // Right shoulder
  const leftWrist = currentLandmarks[5]; // Left wrist  
  const leftShoulder = currentLandmarks[1]; // Left shoulder

  // Determine which arm is more active
  let activeArm: 'left' | 'right' | 'both' = 'right';
  let currentWrist = rightWrist;
  let currentShoulder = rightShoulder;

  if (rightWrist && leftWrist && rightShoulder && leftShoulder) {
    const rightArmHeight = rightShoulder.y - rightWrist.y;
    const leftArmHeight = leftShoulder.y - leftWrist.y;
    
    // Check if both arms are moving significantly
    const rightMoving = Math.abs(rightArmHeight) > 0.1;
    const leftMoving = Math.abs(leftArmHeight) > 0.1;
    
    if (rightMoving && leftMoving) {
      activeArm = 'both';
      // Use the arm that's higher (more active)
      currentWrist = rightArmHeight > leftArmHeight ? rightWrist : leftWrist;
      currentShoulder = rightArmHeight > leftArmHeight ? rightShoulder : leftShoulder;
    } else if (leftMoving && !rightMoving) {
      activeArm = 'left';
      currentWrist = leftWrist;
      currentShoulder = leftShoulder;
    } else {
      activeArm = 'right';
      currentWrist = rightWrist;
      currentShoulder = rightShoulder;
    }
  } else if (leftWrist && leftShoulder && (!rightWrist || !rightShoulder)) {
    activeArm = 'left';
    currentWrist = leftWrist;
    currentShoulder = leftShoulder;
  }

  if (!currentWrist || !currentShoulder) {
    return { phase: 'rest', phaseProgress: 0, accuracy: 0, activeArm: 'right' };
  }

  // Calculate arm height relative to shoulder
  const armHeight = currentShoulder.y - currentWrist.y; // Positive = arm above shoulder
  const armHeightPercent = Math.max(0, Math.min(1, (armHeight + 0.2) / 0.4)); // Normalize to 0-1

  // Determine exercise phase based on arm position
  let phase: 'rest' | 'raising' | 'raised' | 'lowering';
  let phaseProgress: number;

  if (armHeightPercent < 0.1) {
    // Arm is at rest position (below or at shoulder level)
    phase = 'rest';
    phaseProgress = 0;
  } else if (armHeightPercent < 0.7) {
    // Arm is being raised
    phase = 'raising';
    phaseProgress = (armHeightPercent - 0.1) / 0.6;
  } else if (armHeightPercent < 0.9) {
    // Arm is raised
    phase = 'raised';
    phaseProgress = 1;
  } else {
    // Arm is being lowered
    phase = 'lowering';
    phaseProgress = 1 - (armHeightPercent - 0.9) / 0.1;
  }

  // Calculate accuracy based on phase
  let accuracy = 0;

  if (phase === 'rest') {
    // At rest, accuracy should be low (0-20%)
    accuracy = Math.random() * 20; // Random low accuracy
  } else if (phase === 'raising') {
    // During raising, accuracy should be moderate (30-70%)
    accuracy = 30 + (phaseProgress * 40);
  } else if (phase === 'raised') {
    // At raised position, compare to template raised frames
    accuracy = compareToRaisedTemplate(currentLandmarks, templateFrames, activeArm);
  } else if (phase === 'lowering') {
    // During lowering, accuracy should be moderate (30-70%)
    accuracy = 30 + (phaseProgress * 40);
  }

  return { phase, phaseProgress, accuracy, activeArm };
}

/**
 * Compare current pose to template frames when arm is raised
 */
function compareToRaisedTemplate(currentLandmarks: any[], templateFrames: any[][], activeArm: 'left' | 'right' | 'both'): number {
  // Find template frames where arm is raised (last 30% of frames)
  const raisedFrameStart = Math.floor(templateFrames.length * 0.7);
  const raisedFrames = templateFrames.slice(raisedFrameStart);

  if (raisedFrames.length === 0) return 50;

  // Compare current pose to all raised template frames
  let bestAccuracy = 0;

  for (const templateFrame of raisedFrames) {
    if (templateFrame.length < 6) continue;

    // Use the appropriate landmarks based on active arm
    let currentWrist, templateWrist, currentShoulder, templateShoulder;
    
    if (activeArm === 'left') {
      currentWrist = currentLandmarks[5]; // Left wrist
      templateWrist = templateFrame[5];
      currentShoulder = currentLandmarks[1]; // Left shoulder
      templateShoulder = templateFrame[1];
    } else {
      currentWrist = currentLandmarks[4]; // Right wrist
      templateWrist = templateFrame[4];
      currentShoulder = currentLandmarks[0]; // Right shoulder
      templateShoulder = templateFrame[0];
    }

    if (!currentWrist || !templateWrist || !currentShoulder || !templateShoulder) continue;

    // Calculate distance-based accuracy
    const wristDistance = calculate3DDistance(currentWrist, templateWrist);
    const shoulderDistance = calculate3DDistance(currentShoulder, templateShoulder);

    const wristAccuracy = Math.max(0, 100 - (wristDistance * 150));
    const shoulderAccuracy = Math.max(0, 100 - (shoulderDistance * 150));

    const frameAccuracy = (wristAccuracy * 0.7) + (shoulderAccuracy * 0.3);
    bestAccuracy = Math.max(bestAccuracy, frameAccuracy);
  }

  return Math.max(0, Math.min(100, bestAccuracy));
}

/**
 * Get feedback based on exercise phase
 */
function getPhaseBasedFeedback(
  exerciseAnalysis: { phase: string; phaseProgress: number; accuracy: number },
  angles: any,
  currentLandmarks: any[]
): string {
  const { phase, phaseProgress } = exerciseAnalysis;

  // Get detailed analysis of current form
  const formIssues = analyzeFormIssues(currentLandmarks, angles, phase);
  
  if (formIssues.length > 0) {
    return formIssues[0]; // Return the most important issue
  }

  switch (phase) {
    case 'rest':
      return "Ready to start! Stand with arms relaxed at your sides.";
    case 'raising':
      if (phaseProgress < 0.3) {
        return "Good start! Continue raising your arms smoothly.";
      } else if (phaseProgress < 0.7) {
        return "Keep going! Raise your arms to shoulder level.";
      } else {
        return "Almost there! Just a bit higher to reach shoulder level.";
      }
    case 'raised':
      return "Perfect position! Hold briefly, then lower with control.";
    case 'lowering':
      return "Good control! Lower your arms smoothly back to the starting position.";
    default:
      return "Focus on the movement pattern - raise to shoulder level, hold, then lower.";
  }
}

/**
 * Analyze specific form issues and provide detailed feedback
 */
function analyzeFormIssues(currentLandmarks: any[], angles: any, phase: string): string[] {
  const issues: string[] = [];

  if (currentLandmarks.length < 6) {
    return ["Please ensure your full body is visible to the camera."];
  }

  // Extract key landmarks
  const rightWrist = currentLandmarks[4];
  const rightShoulder = currentLandmarks[0];
  const rightElbow = currentLandmarks[2];
  const leftWrist = currentLandmarks[5];
  const leftShoulder = currentLandmarks[1];
  const leftElbow = currentLandmarks[3];

  // Check if we have valid landmarks
  if (!rightWrist || !rightShoulder || !leftWrist || !leftShoulder) {
    return ["Please stand so your shoulders and arms are clearly visible."];
  }

  // Analyze arm symmetry
  const rightArmHeight = rightShoulder.y - rightWrist.y;
  const leftArmHeight = leftShoulder.y - leftWrist.y;
  const heightDifference = Math.abs(rightArmHeight - leftArmHeight);

  // Check for arm asymmetry (common issue)
  if (heightDifference > 0.1 && phase !== 'rest') {
    if (rightArmHeight > leftArmHeight) {
      issues.push("Your right arm is higher than your left. Try to keep both arms at the same level.");
    } else {
      issues.push("Your left arm is higher than your right. Try to keep both arms at the same level.");
    }
  }

  // Check arm height relative to shoulders
  const averageArmHeight = (rightArmHeight + leftArmHeight) / 2;
  
  if (phase === 'raised' && averageArmHeight < 0.05) {
    issues.push("Your arms need to be higher. Your wrists should be at shoulder level, not below.");
  } else if (phase === 'raising' && averageArmHeight < 0.02) {
    issues.push("Keep raising your arms. You're not quite at shoulder level yet.");
  } else if (phase === 'rest' && averageArmHeight > 0.1) {
    issues.push("Lower your arms completely to the starting position.");
  }

  // Check for elbow bending (arms should be straight)
  if (rightElbow && leftElbow) {
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    
    if (rightElbowAngle < 160 && phase !== 'rest') {
      issues.push("Keep your right arm straight. Don't bend your elbow.");
    }
    if (leftElbowAngle < 160 && phase !== 'rest') {
      issues.push("Keep your left arm straight. Don't bend your elbow.");
    }
  }

  // Check for shoulder shrugging (shoulders should stay level)
  const rightHip = currentLandmarks[6];
  const leftHip = currentLandmarks[7];
  
  if (rightHip && leftHip) {
    const rightShoulderHeight = rightHip.y - rightShoulder.y;
    const leftShoulderHeight = leftHip.y - leftShoulder.y;
    const shoulderHeightDiff = Math.abs(rightShoulderHeight - leftShoulderHeight);
    
    if (shoulderHeightDiff > 0.05 && phase !== 'rest') {
      issues.push("Keep your shoulders level. Don't shrug or lift one shoulder higher than the other.");
    }
  }

  // Check for body swaying (common compensation)
  if (rightHip && leftHip) {
    const hipCenter = (rightHip.x + leftHip.x) / 2;
    const shoulderCenter = (rightShoulder.x + leftShoulder.x) / 2;
    const bodyAlignment = Math.abs(hipCenter - shoulderCenter);
    
    if (bodyAlignment > 0.1 && phase !== 'rest') {
      issues.push("Keep your body straight. Don't lean to one side during the movement.");
    }
  }

  // Check for wrist positioning (wrists should be neutral)
  if (rightWrist && rightElbow && leftWrist && leftElbow) {
    const rightWristAngle = calculateWristAngle(rightElbow, rightWrist);
    const leftWristAngle = calculateWristAngle(leftElbow, leftWrist);
    
    if (Math.abs(rightWristAngle) > 30 && phase !== 'rest') {
      issues.push("Keep your right wrist straight. Don't bend it up or down.");
    }
    if (Math.abs(leftWristAngle) > 30 && phase !== 'rest') {
      issues.push("Keep your left wrist straight. Don't bend it up or down.");
    }
  }

  return issues;
}

/**
 * Calculate wrist angle relative to forearm
 */
function calculateWristAngle(elbow: any, wrist: any): number {
  if (!elbow || !wrist) return 0;
  
  // Simple wrist angle calculation based on relative positions
  const forearmVector = {
    x: wrist.x - elbow.x,
    y: wrist.y - elbow.y
  };
  
  // Calculate angle relative to horizontal
  const angle = Math.atan2(forearmVector.y, forearmVector.x) * (180 / Math.PI);
  
  // Normalize to -180 to 180 degrees
  return angle > 180 ? angle - 360 : angle;
}

/**
 * Extract key landmarks for shoulder abduction exercise
 */
function extractKeyLandmarks(poseLandmarks: any[]): any[] {
  // For shoulder abduction, focus on upper body landmarks
  const keyIndices = [
    11, // Right shoulder
    12, // Left shoulder
    13, // Right elbow
    14, // Left elbow
    15, // Right wrist
    16, // Left wrist
    23, // Right hip
    24, // Left hip
  ];

  return keyIndices.map(index => {
    const landmark = poseLandmarks[index];
    return landmark ? { x: landmark.x, y: landmark.y, z: landmark.z } : null;
  }).filter(Boolean);
}

/**
 * Simple accuracy calculation based on wrist position (most important for shoulder abduction)
 */
function calculateSimpleAccuracy(currentLandmarks: any[], templateLandmarks: any[]): number {
  if (currentLandmarks.length < 5 || templateLandmarks.length < 5) {
    return 0;
  }

  // Focus on right wrist position (most important for shoulder abduction)
  const currentWrist = currentLandmarks[4]; // Right wrist
  const templateWrist = templateLandmarks[4];
  const currentShoulder = currentLandmarks[0]; // Right shoulder
  const templateShoulder = templateLandmarks[0];

  if (!currentWrist || !templateWrist || !currentShoulder || !templateShoulder) {
    return 0;
  }

  // Calculate distance between current and template wrist positions
  const wristDistance = calculate3DDistance(currentWrist, templateWrist);
  
  // Calculate distance between current and template shoulder positions
  const shoulderDistance = calculate3DDistance(currentShoulder, templateShoulder);

  // Convert distances to accuracy (closer = higher accuracy)
  // More forgiving thresholds - real-world movement has natural variation
  const wristAccuracy = Math.max(0, 100 - (wristDistance * 100)); // Much more forgiving
  const shoulderAccuracy = Math.max(0, 100 - (shoulderDistance * 100));

  // Weight wrist more heavily since it's more important for the exercise
  const accuracy = (wristAccuracy * 0.7) + (shoulderAccuracy * 0.3);

  return Math.max(0, Math.min(100, accuracy));
}

/**
 * Simple feedback based on wrist position
 */
function getSimpleFeedback(angles: any, currentLandmarks: any[], templateLandmarks: any[]): string {
  if (currentLandmarks.length < 5 || templateLandmarks.length < 5) {
    return "Check your form alignment";
  }

  const currentWrist = currentLandmarks[4];
  const templateWrist = templateLandmarks[4];
  const currentShoulder = currentLandmarks[0];

  if (!currentWrist || !templateWrist || !currentShoulder) {
    return "Check your form alignment";
  }

  // Check if wrist is above shoulder (should be during abduction)
  const isWristAboveShoulder = currentWrist.y < currentShoulder.y;
  
  if (!isWristAboveShoulder) {
    return "Raise your arm above shoulder level";
  }

  // Check if wrist is too high or too low compared to template
  const heightDiff = Math.abs(currentWrist.y - templateWrist.y);
  if (heightDiff > 0.1) {
    if (currentWrist.y > templateWrist.y) {
      return "Raise your arm higher";
    } else {
      return "Lower your arm slightly";
    }
  }

  return "Good form, keep going!";
}

/**
 * Calculate key angles for shoulder abduction
 */
function calculateAngles(poseLandmarks: any[]): { shoulderAngle: number; elbowAngle: number } {
  // Right shoulder angle (shoulder-elbow-wrist)
  const rightShoulder = poseLandmarks[11];
  const rightElbow = poseLandmarks[13];
  const rightWrist = poseLandmarks[15];

  // Left shoulder angle (shoulder-elbow-wrist)
  const leftShoulder = poseLandmarks[12];
  const leftElbow = poseLandmarks[14];
  const leftWrist = poseLandmarks[16];

  const shoulderAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

  return {
    shoulderAngle: shoulderAngle || 0,
    elbowAngle: elbowAngle || 0
  };
}

/**
 * Get detailed feedback based on specific issues
 */
function getDetailedFeedback(angles: any, currentLandmarks: any[], templateLandmarks: any[]): string {
  const feedbacks = [];

  // Check shoulder angle
  if (angles.shoulderAngle < 45) {
    feedbacks.push("Raise your arm higher");
  } else if (angles.shoulderAngle > 135) {
    feedbacks.push("Lower your arm slightly");
  }

  // Check elbow angle
  if (angles.elbowAngle < 80) {
    feedbacks.push("Straighten your elbow more");
  } else if (angles.elbowAngle > 120) {
    feedbacks.push("Bend your elbow slightly");
  }

  // Check relative positions
  if (currentLandmarks.length >= 6 && templateLandmarks.length >= 6) {
    const currentWrist = currentLandmarks[4];
    const currentShoulder = currentLandmarks[0];
    
    if (currentWrist && currentShoulder && currentWrist.y >= currentShoulder.y) {
      feedbacks.push("Keep your arm above shoulder level");
    }
  }

  return feedbacks.length > 0 ? feedbacks.join(". ") : "Check your form alignment";
}

/**
 * Calculate 3D Euclidean distance between two points
 */
function calculate3DDistance(point1: any, point2: any): number {
  if (!point1 || !point2) return 1;

  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Enhanced repetition detection with quality classification
 */
export function detectRepetition(
  poseLandmarks: any[],
  previousAnalysis: FormAnalysisResult | null,
  previousPhase: string | null
): { 
  isRepComplete: boolean; 
  repCount: number; 
  repQuality: 'poor' | 'good' | 'excellent';
  activeArm: 'left' | 'right' | 'both';
} {
  if (!poseLandmarks || poseLandmarks.length < 16) {
    return { isRepComplete: false, repCount: 0, repQuality: 'poor', activeArm: 'right' };
  }

  const rightWrist = poseLandmarks[15];
  const rightShoulder = poseLandmarks[11];
  const leftWrist = poseLandmarks[16];
  const leftShoulder = poseLandmarks[12];

  // Determine which arm is active
  let activeArm: 'left' | 'right' | 'both' = 'right';
  let currentWrist = rightWrist;
  let currentShoulder = rightShoulder;

  if (rightWrist && leftWrist && rightShoulder && leftShoulder) {
    const rightArmHeight = rightShoulder.y - rightWrist.y;
    const leftArmHeight = leftShoulder.y - leftWrist.y;
    
    const rightMoving = Math.abs(rightArmHeight) > 0.1;
    const leftMoving = Math.abs(leftArmHeight) > 0.1;
    
    if (rightMoving && leftMoving) {
      activeArm = 'both';
      currentWrist = rightArmHeight > leftArmHeight ? rightWrist : leftWrist;
      currentShoulder = rightArmHeight > leftArmHeight ? rightShoulder : leftShoulder;
    } else if (leftMoving && !rightMoving) {
      activeArm = 'left';
      currentWrist = leftWrist;
      currentShoulder = leftShoulder;
    } else {
      activeArm = 'right';
      currentWrist = rightWrist;
      currentShoulder = rightShoulder;
    }
  } else if (leftWrist && leftShoulder && (!rightWrist || !rightShoulder)) {
    activeArm = 'left';
    currentWrist = leftWrist;
    currentShoulder = leftShoulder;
  }

  if (!currentWrist || !currentShoulder) {
    return { isRepComplete: false, repCount: 0, repQuality: 'poor', activeArm: 'right' };
  }

  // Check if wrist is above shoulder (exercise completed)
  const isArmRaised = currentWrist.y < currentShoulder.y;
  const armHeight = currentShoulder.y - currentWrist.y;

  // Enhanced repetition detection with state tracking
  let isRepComplete = false;
  let repQuality: 'poor' | 'good' | 'excellent' = 'poor';

  // Check if we've completed a full cycle: rest -> raised -> rest
  if (previousPhase && previousAnalysis) {
    const wasRaised = previousPhase === 'raised';
    const wasRaising = previousPhase === 'raising';
    const isResting = armHeight < 0.1;
    
    // Rep is complete if we were raised and now we're resting
    if (wasRaised && isResting) {
      isRepComplete = true;
      
      // Determine rep quality based on accuracy during the raised phase
      if (previousAnalysis.accuracy >= 85) {
        repQuality = 'excellent';
      } else if (previousAnalysis.accuracy >= 70) {
        repQuality = 'good';
      } else {
        repQuality = 'poor';
      }
    }
  }

  return { 
    isRepComplete, 
    repCount: isRepComplete ? 1 : 0, 
    repQuality,
    activeArm
  };
}

/**
 * Calculate angle between three points
 */
function calculateAngle(point1: any, point2: any, point3: any): number {
  if (!point1 || !point2 || !point3) return 0;

  const v1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
    z: point1.z - point2.z
  };

  const v2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
    z: point3.z - point2.z
  };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = dot / (mag1 * mag2);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  
  return (angle * 180) / Math.PI;
} 