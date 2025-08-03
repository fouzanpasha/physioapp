import { useRef, useEffect, useState } from 'react';
import { useExerciseRecording } from '../hooks/useExerciseRecording';

interface ExerciseRecorderProps {
  exerciseName: string;
  onTemplateSaved: (template: any) => void;
  onCancel: () => void;
  onPoseData?: (poseLandmarks: any[]) => void;
}

export const ExerciseRecorder = ({ exerciseName, onTemplateSaved, onCancel, onPoseData }: ExerciseRecorderProps) => {
  const [recordingStep, setRecordingStep] = useState<'instructions' | 'recording' | 'saving'>('instructions');
  const [countdown, setCountdown] = useState(3);

  const { recordingState, startRecording, stopRecording, recordFrame, saveTemplate } = useExerciseRecording();

  // Record frames when pose data is passed from parent
  useEffect(() => {
    if (recordingState.isRecording && onPoseData) {
      // We'll handle pose data recording in the parent component
    }
  }, [recordingState.isRecording, onPoseData]);

  const handleStartRecording = () => {
    setRecordingStep('recording');
    
    // Countdown before starting
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    stopRecording();
    setRecordingStep('saving');
    
    // Save the template
    const template = saveTemplate(exerciseName);
    onTemplateSaved(template);
  };

  const getStatusColor = () => {
    switch (recordingState.status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'needs_improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Record {exerciseName} Template</h2>
        
        {/* Instructions Step */}
        {recordingStep === 'instructions' && (
          <div className="text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold mb-4">Recording Instructions</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <ol className="space-y-2">
                <li>1. Stand in front of the camera with good lighting</li>
                <li>2. Make sure your full upper body is visible</li>
                <li>3. Perform the exercise slowly and with perfect form</li>
                <li>4. Complete 3-5 repetitions during the recording</li>
                <li>5. This will be used as the "perfect form" template</li>
              </ol>
            </div>
            <div className="flex justify-center space-x-4">
              <button onClick={onCancel} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleStartRecording} className="btn-primary">
                Start Recording
              </button>
            </div>
          </div>
        )}

        {/* Recording Step */}
        {recordingStep === 'recording' && (
          <div>
            <div className="mb-4">
              {countdown > 0 ? (
                <div className="text-center">
                  <div className="text-6xl font-bold text-red-500 mb-2">{countdown}</div>
                  <p>Get ready to start recording...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500 mb-2">🔴 RECORDING</div>
                  <p>Perform the exercise with perfect form</p>
                  <div className="text-sm text-gray-600 mt-2">
                    Frames recorded: {recordingState.recordedFrames.length}
                  </div>
                </div>
              )}
            </div>

            {/* Video Feed - Use existing KinetiPlayCanvas */}
            <div className="relative w-full max-w-4xl mx-auto mb-6">
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📹</div>
                  <p className="text-gray-600">Camera feed will appear here</p>
                  <p className="text-sm text-gray-500">Recording pose data...</p>
                </div>
              </div>
              
              {countdown > 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-8xl font-bold">{countdown}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <button 
                onClick={handleStopRecording}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                Stop Recording
              </button>
            </div>
          </div>
        )}

        {/* Saving Step */}
        {recordingStep === 'saving' && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-4">Template Saved!</h3>
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                Successfully recorded {recordingState.recordedFrames.length} frames
              </p>
              <p className="text-sm text-green-600 mt-2">
                Duration: {Math.round(recordingState.duration / 1000)} seconds
              </p>
            </div>
            <button onClick={onCancel} className="btn-primary">
              Continue to Exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 