import { UserProgress } from '../types';

const STORAGE_KEY = 'physioapp_user_progress';

/**
 * Load user progress from localStorage
 */
export function loadUserProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user progress:', error);
  }
  
  // Return default progress
  return {
    xp: 0,
    level: 1,
    lastSessionTimestamp: null,
    totalSessions: 0,
    exerciseProgress: {}
  };
}

/**
 * Save user progress to localStorage
 */
export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving user progress:', error);
  }
}

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  // Every 1000 XP = 1 level
  return Math.floor(xp / 1000) + 1;
}

/**
 * Calculate XP needed for next level
 */
export function xpToNextLevel(currentXp: number): { current: number; needed: number; total: number } {
  const currentLevel = calculateLevel(currentXp);
  const currentLevelXp = (currentLevel - 1) * 1000;
  const nextLevelXp = currentLevel * 1000;
  
  return {
    current: currentXp - currentLevelXp,
    needed: nextLevelXp - currentXp,
    total: 1000
  };
}