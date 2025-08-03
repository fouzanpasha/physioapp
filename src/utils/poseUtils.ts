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

/**
 * Calculate angle between three points (for joints like elbow, knee, etc.)
 */
export function calculateAngle(point1: any, point2: any, point3: any): number {
  // Calculate vectors
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y
  };
  
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y
  };
  
  // Calculate dot product
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  // Calculate angle in radians, then convert to degrees
  const angleRadians = Math.acos(dotProduct / (magnitude1 * magnitude2));
  const angleDegrees = angleRadians * (180 / Math.PI);
  
  return angleDegrees;
}