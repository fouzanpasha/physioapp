import { PoseCoordinate } from '../types';

export interface FormAnalysisResult {
  accuracy: number;
  distance: number;
  feedback: string;
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  points: number;
}

export interface ExerciseTemplate {
  name: string;
  frames: PoseCoordinate[][];
  duration: number;
  frameCount: number;
  createdAt: string;
}

/**
 * Compare current pose to template and calculate accuracy
 */
export function analyzeForm(
  currentPose: any[],
  template: ExerciseTemplate,
  currentFrameIndex: number
): FormAnalysisResult {
  // Validate inputs
  if (!currentPose || !Array.isArray(currentPose) || currentPose.length === 0) {
    return {
      accuracy: 0,
      distance: 1,
      feedback: "No pose data available",
      status: 'poor',
      points: 0
    };
  }

  if (!template || !template.frames || template.frames.length === 0) {
    return {
      accuracy: 0,
      distance: 1,
      feedback: "No template data available",
      status: 'poor',
      points: 0
    };
  }

  // Get the corresponding template frame (with bounds checking)
  const templateFrameIndex = Math.min(currentFrameIndex, template.frames.length - 1);
  const templateFrame = template.frames[templateFrameIndex];

  // Extract key landmarks for comparison (shoulders, elbows, wrists)
  const currentKeyLandmarks = currentPose.slice(11, 17); // Right shoulder to right wrist
  const templateKeyLandmarks = templateFrame;

  // Validate that we have the expected landmarks
  if (!currentKeyLandmarks || currentKeyLandmarks.length < 6) {
    return {
      accuracy: 0,
      distance: 1,
      feedback: "Not enough pose landmarks detected",
      status: 'poor',
      points: 0
    };
  }

  // Calculate average distance between corresponding landmarks
  let totalDistance = 0;
  let validLandmarks = 0;

  for (let i = 0; i < Math.min(currentKeyLandmarks.length, templateKeyLandmarks.length); i++) {
    const current = currentKeyLandmarks[i];
    const template = templateKeyLandmarks[i];

    if (current && template) {
      const distance = calculate3DDistance(current, template);
      totalDistance += distance;
      validLandmarks++;
    }
  }

  const averageDistance = validLandmarks > 0 ? totalDistance / validLandmarks : 1;

  // Convert distance to accuracy percentage (0-100)
  const accuracy = Math.max(0, 100 - (averageDistance * 100));

  // Determine status and feedback
  let status: FormAnalysisResult['status'];
  let feedback: string;
  let points: number;

  if (accuracy >= 90) {
    status = 'excellent';
    feedback = 'Perfect form! Keep it up!';
    points = 10;
  } else if (accuracy >= 75) {
    status = 'good';
    feedback = 'Good form, minor adjustments needed';
    points = 7;
  } else if (accuracy >= 50) {
    status = 'needs_improvement';
    feedback = 'Form needs improvement. Check your alignment.';
    points = 4;
  } else {
    status = 'poor';
    feedback = 'Poor form. Please review the instructions.';
    points = 1;
  }

  return {
    accuracy: Math.round(accuracy),
    distance: averageDistance,
    feedback,
    status,
    points
  };
}

/**
 * Calculate 3D distance between two points
 */
function calculate3DDistance(point1: any, point2: any): number {
  // Validate inputs
  if (!point1 || !point2 || 
      typeof point1.x !== 'number' || typeof point1.y !== 'number' || typeof point1.z !== 'number' ||
      typeof point2.x !== 'number' || typeof point2.y !== 'number' || typeof point2.z !== 'number') {
    return 1; // Return maximum distance for invalid points
  }

  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Detect exercise repetition (up/down cycle for shoulder abduction)
 */
export function detectRepetition(
  poseLandmarks: any[],
  previousAnalysis: FormAnalysisResult | null
): { isRepComplete: boolean; repCount: number } {
  // For shoulder abduction, we track arm position changes
  const rightShoulder = poseLandmarks[11];
  const rightElbow = poseLandmarks[13];
  const rightWrist = poseLandmarks[15];

  if (!rightShoulder || !rightElbow || !rightWrist) {
    return { isRepComplete: false, repCount: 0 };
  }

  // Calculate arm angle
  const armAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  
  // Simple rep detection: arm goes up (>90 degrees) then down (<45 degrees)
  const isArmUp = armAngle > 90;
  const isArmDown = armAngle < 45;

  // This is a simplified rep detection - in a real app you'd want more sophisticated logic
  return {
    isRepComplete: isArmDown && previousAnalysis?.status === 'excellent',
    repCount: 0 // You'd track this over time
  };
}

/**
 * Calculate angle between three points
 */
function calculateAngle(point1: any, point2: any, point3: any): number {
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y
  };
  
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y
  };
  
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  const angleRadians = Math.acos(dotProduct / (magnitude1 * magnitude2));
  return angleRadians * (180 / Math.PI);
} 