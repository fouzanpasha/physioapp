import { PoseCoordinate } from '../types';

/**
 * Calculate 3D Euclidean distance between two pose coordinates
 */
export function calculate3DDistance(coord1: PoseCoordinate, coord2: PoseCoordinate): number {
  const dx = coord1.x - coord2.x;
  const dy = coord1.y - coord2.y;
  const dz = coord1.z - coord2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Normalize pose coordinates to a standard scale
 */
export function normalizePoseCoordinates(coordinates: PoseCoordinate[]): PoseCoordinate[] {
  if (coordinates.length === 0) return coordinates;
  
  // Find bounds
  const xValues = coordinates.map(c => c.x);
  const yValues = coordinates.map(c => c.y);
  const zValues = coordinates.map(c => c.z);
  
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);
  
  // Normalize to 0-1 range
  return coordinates.map(coord => ({
    x: (coord.x - minX) / (maxX - minX) || 0,
    y: (coord.y - minY) / (maxY - minY) || 0,
    z: (coord.z - minZ) / (maxZ - minZ) || 0,
  }));
}

/**
 * Calculate accuracy score based on distance threshold
 */
export function calculateAccuracyScore(distance: number, threshold: number = 0.1): number {
  if (distance <= threshold) return 100;
  if (distance >= threshold * 3) return 0;
  
  // Linear interpolation between threshold and 3*threshold
  return Math.max(0, 100 - ((distance - threshold) / (threshold * 2)) * 100);
}

/**
 * Get feedback color based on distance
 */
export function getFeedbackColor(distance: number, threshold: number = 0.1): string {
  if (distance <= threshold) return '#10B981'; // Green
  if (distance <= threshold * 2) return '#F59E0B'; // Yellow
  return '#EF4444'; // Red
}