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

    // Extract key landmarks for shoulder abduction (shoulders, elbows, wrists)
    const keyLandmarks = poseLandmarks.slice(11, 17); // Right shoulder to right wrist
    const frameData = keyLandmarks.map(landmark => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z
    }));

    setRecordingState(prev => ({
      ...prev,
      recordedFrames: [...prev.recordedFrames, frameData],
      duration: prev.startTime ? Date.now() - prev.startTime : 0
    }));
  }, [recordingState.isRecording]);

  const saveTemplate = useCallback((exerciseName: string) => {
    const template = {
      name: exerciseName,
      frames: recordingState.recordedFrames,
      duration: recordingState.duration,
      frameCount: recordingState.recordedFrames.length,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage (in a real app, this would be sent to a server)
    const existingTemplates = JSON.parse(localStorage.getItem('exerciseTemplates') || '{}');
    existingTemplates[exerciseName] = template;
    localStorage.setItem('exerciseTemplates', JSON.stringify(existingTemplates));

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