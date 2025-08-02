// Core pose estimation types
export interface PoseCoordinate {
  x: number;
  y: number;
  z: number;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  targetArea: string;
  coordinates: PoseCoordinate[];
  duration: number; // in seconds
}

// Game types
export interface GameSession {
  exerciseId: string;
  startTime: number;
  endTime?: number;
  score: number;
  accuracy: number;
  completedReps: number;
  targetReps: number;
}

export interface UserProgress {
  xp: number;
  level: number;
  lastSessionTimestamp: number | null;
  totalSessions: number;
  exerciseProgress: Record<string, number>; // exerciseId -> best score
}

// UI State types
export type AppScreen = 'welcome' | 'camera-setup' | 'exercise-selection' | 'instructions' | 'gameplay' | 'results' | 'garden';

export interface AppState {
  currentScreen: AppScreen;
  cameraEnabled: boolean;
  selectedExercise: ExerciseTemplate | null;
  currentSession: GameSession | null;
  userProgress: UserProgress;
}

// MediaPipe types
export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseDetectionResult {
  poseLandmarks: PoseLandmark[];
  timestamp: number;
}