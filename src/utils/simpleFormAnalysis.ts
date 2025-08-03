export interface SimpleFormResult {
  armPosition: 'down' | 'raising' | 'up' | 'lowering';
  armHeight: number; // 0-100 percentage
  isInGoodPosition: boolean;
  feedback: string;
  points: number;
}

export function analyzeSimpleForm(poseLandmarks: any[]): SimpleFormResult {
  if (!poseLandmarks || poseLandmarks.length < 33) {
    return {
      armPosition: 'down',
      armHeight: 0,
      isInGoodPosition: false,
      feedback: 'No pose data available',
      points: 0
    };
  }

  // Get shoulder and wrist positions
  const leftShoulder = poseLandmarks[11]; // Left shoulder
  const rightShoulder = poseLandmarks[12]; // Right shoulder
  const leftWrist = poseLandmarks[15]; // Left wrist
  const rightWrist = poseLandmarks[16]; // Right wrist

  if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
    return {
      armPosition: 'down',
      armHeight: 0,
      isInGoodPosition: false,
      feedback: 'Cannot detect arm positions',
      points: 0
    };
  }

  // Calculate shoulder level (average of both shoulders)
  const shoulderLevel = (leftShoulder.y + rightShoulder.y) / 2;
  
  // Calculate wrist positions relative to shoulders
  const leftWristHeight = shoulderLevel - leftWrist.y;
  const rightWristHeight = shoulderLevel - rightWrist.y;
  
  // Use the higher wrist (more active arm)
  const maxWristHeight = Math.max(leftWristHeight, rightWristHeight);
  const minWristHeight = Math.min(leftWristHeight, rightWristHeight);
  
  // Convert to percentage (0-100)
  const armHeightPercent = Math.max(0, Math.min(100, (maxWristHeight / 0.3) * 100));
  
  // Determine arm position
  let armPosition: 'down' | 'raising' | 'up' | 'lowering';
  let isInGoodPosition: boolean;
  let feedback: string;
  let points: number;

  if (armHeightPercent < 20) {
    armPosition = 'down';
    isInGoodPosition = true;
    feedback = 'Good starting position';
    points = 5;
  } else if (armHeightPercent < 60) {
    armPosition = 'raising';
    isInGoodPosition = true;
    feedback = 'Raising arms - good form';
    points = 8;
  } else if (armHeightPercent < 85) {
    armPosition = 'up';
    isInGoodPosition = true;
    feedback = 'Arms at shoulder level - perfect!';
    points = 10;
  } else {
    armPosition = 'up';
    isInGoodPosition = false;
    feedback = 'Arms too high - lower to shoulder level';
    points = 3;
  }

  // Check if both arms are roughly at the same height (good form)
  const heightDifference = Math.abs(leftWristHeight - rightWristHeight);
  if (heightDifference > 0.1 && armHeightPercent > 30) {
    feedback += '. Try to keep both arms at the same height';
    points = Math.max(1, points - 2);
  }

  console.log('Simple Form Analysis:', {
    armPosition,
    armHeightPercent: Math.round(armHeightPercent),
    leftWristHeight: Math.round(leftWristHeight * 100),
    rightWristHeight: Math.round(rightWristHeight * 100),
    heightDifference: Math.round(heightDifference * 100),
    feedback,
    points
  });

  return {
    armPosition,
    armHeight: armHeightPercent,
    isInGoodPosition,
    feedback,
    points
  };
} 