import { useState, useRef, useCallback } from 'react';
import { PoseCoordinate } from '../types';

interface RecordingState {
  isRecording: boolean;
  recordedFrames: PoseCoordinate[][];
  startTime: number | null;
  duration: number;
}

export const useExerciseRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    recordedFrames: [],
    startTime: null,
    duration: 0
  });

  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(() => {
    setRecordingState(prev => ({
      ...prev,
      isRecording: true,
      recordedFrames: [],
      startTime: Date.now(),
      duration: 0
    }));
  }, []);

  const stopRecording = useCallback(() => {
    setRecordingState(prev => ({
      ...prev,
      isRecording: false,
      startTime: null
    }));

    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
  }, []);

  const recordFrame = useCallback((poseLandmarks: any[]) => {
    if (!recordingState.isRecording) return;

    // Extract comprehensive landmarks for shoulder abduction
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

    const frameData = keyIndices.map(index => {
      const landmark = poseLandmarks[index];
      return landmark ? { x: landmark.x, y: landmark.y, z: landmark.z } : null;
    }).filter(Boolean);

    // Only record if we have enough landmarks
    if (frameData.length >= 6) {
      setRecordingState(prev => ({
        ...prev,
        recordedFrames: [...prev.recordedFrames, frameData],
        duration: prev.startTime ? Date.now() - prev.startTime : 0
      }));
    }
  }, [recordingState.isRecording]);

  const saveTemplate = useCallback((exerciseName: string) => {
    // Validate that we have enough frames
    if (recordingState.recordedFrames.length < 10) {
      console.warn('Template too short, recording more frames for better accuracy');
    }

    const template = {
      name: exerciseName,
      frames: recordingState.recordedFrames,
      duration: recordingState.duration,
      frameCount: recordingState.recordedFrames.length,
      createdAt: new Date().toISOString()
    };

    // Validate template before saving
    if (template.frameCount === 0) {
      console.error('Cannot save empty template');
      return null;
    }

    // Save to localStorage (in a real app, this would be sent to a server)
    const existingTemplates = JSON.parse(localStorage.getItem('exerciseTemplates') || '{}');
    existingTemplates[exerciseName] = template;
    localStorage.setItem('exerciseTemplates', JSON.stringify(existingTemplates));

    console.log(`Template saved: ${template.frameCount} frames, ${template.duration}ms duration`);
    return template;
  }, [recordingState]);

  const loadTemplate = useCallback((exerciseName: string) => {
    const templates = JSON.parse(localStorage.getItem('exerciseTemplates') || '{}');
    return templates[exerciseName] || null;
  }, []);

  return {
    recordingState,
    startRecording,
    stopRecording,
    recordFrame,
    saveTemplate,
    loadTemplate
  };
}; 