import { ExerciseTemplate, GameSession } from '../types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { KinetiPlayCanvas } from '../components/KinetiPlayCanvas';
import { analyzeForm, FormAnalysisResult, ExerciseTemplate as FormTemplate, detectRepetition } from '../utils/formAnalysis';
import { RepetitionStateMachine, StateMachineResult } from '../utils/stateMachineAnalysis';
import { VoiceFeedbackSystem } from '../utils/voiceFeedback';
import { analyzeSimpleForm, SimpleFormResult } from '../utils/simpleFormAnalysis';
import { useExerciseRecording } from '../hooks/useExerciseRecording';

// TypeScript declaration for global MediaPipe
declare global {
  interface Window {
    Pose: any;
  }
}

interface GameplayPageProps {
  exercise: ExerciseTemplate;
  onGameComplete: (session: GameSession) => void;
}

export default function GameplayPage({ exercise, onGameComplete }: GameplayPageProps) {
  const [score, setScore] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [startMediaPipe, setStartMediaPipe] = useState(false);
  const [currentFormAnalysis, setCurrentFormAnalysis] = useState<FormAnalysisResult | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [recordingStep, setRecordingStep] = useState<'instructions' | 'recording' | 'saving'>('instructions');
  const [countdown, setCountdown] = useState(3);
  const [debugMode, setDebugMode] = useState(false);
  const [useStateMachine, setUseStateMachine] = useState(true); // Toggle between state machine and old system
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);
  const [useSimpleFormAnalysis, setUseSimpleFormAnalysis] = useState(true); // Toggle between simple and complex form analysis
  
  // State machine for rep tracking
  const [stateMachine, setStateMachine] = useState<RepetitionStateMachine | null>(null);
  const [stateMachineResult, setStateMachineResult] = useState<StateMachineResult | null>(null);
  
  // Voice feedback system
  const [voiceFeedback, setVoiceFeedback] = useState<VoiceFeedbackSystem | null>(null);
  const [repQuality, setRepQuality] = useState<'poor' | 'good' | 'excellent'>('poor');
  const [activeArm, setActiveArm] = useState<'left' | 'right' | 'both'>('right');
  const [lastRepTime, setLastRepTime] = useState<number>(0);
  const [simpleFormResult, setSimpleFormResult] = useState<SimpleFormResult | null>(null);
  
  const frameIndexRef = useRef(0);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Recording hook
  const { recordingState, startRecording, stopRecording, recordFrame, saveTemplate } = useExerciseRecording();

  // Load template and initialize state machine on component mount
  useEffect(() => {
    const templates = JSON.parse(localStorage.getItem('exerciseTemplates') || '{}');
    const exerciseTemplate = templates[exercise.name];
    if (exerciseTemplate) {
      setTemplate(exerciseTemplate);
      
      // Initialize state machine with template
      const newStateMachine = new RepetitionStateMachine(exerciseTemplate);
      setStateMachine(newStateMachine);
      console.log('State Machine initialized for exercise:', exercise.name);
      
      // Initialize voice feedback
      const newVoiceFeedback = new VoiceFeedbackSystem({
        enabled: voiceFeedbackEnabled,
        volume: 0.8,
        rate: 0.9,
        pitch: 1.0,
        voiceType: 'neutral'
      });
      setVoiceFeedback(newVoiceFeedback);
      
      // Provide exercise instructions after a short delay
      setTimeout(() => {
        newVoiceFeedback.provideExerciseInstructions(exercise.name);
      }, 1000);
    }
  }, [exercise.name, voiceFeedbackEnabled]);

  // Update score based on current form analysis
  const updateScore = useCallback((analysis: FormAnalysisResult) => {
    setScore(prevScore => prevScore + analysis.points);
  }, []);

  // Analyze form when pose data is available
  const analyzeCurrentForm = useCallback((poseLandmarks: any[]) => {
    if (!poseLandmarks) {
      console.log('❌ No pose landmarks received');
      return;
    }
    
    console.log('✅ Pose landmarks received:', {
      count: poseLandmarks.length,
      hasData: poseLandmarks.some(landmark => landmark && (landmark.x !== undefined || landmark.y !== undefined)),
      sampleLandmarks: poseLandmarks.slice(0, 3).map(l => ({ x: l?.x, y: l?.y, z: l?.z }))
    });

    // Record frame if in recording mode
    if (recordingState.isRecording) {
      recordFrame(poseLandmarks);
    }

    // Run simple form analysis for real-time feedback
    const simpleFormResult = analyzeSimpleForm(poseLandmarks);
    setSimpleFormResult(simpleFormResult);
    console.log('🎯 Simple Form Result:', simpleFormResult);

    if (useStateMachine && stateMachine) {
      // Use state machine for rep detection and form analysis
      try {
        const result = stateMachine.processPose(poseLandmarks);
        setStateMachineResult(result);
        
        // Update rep count from state machine
        setCurrentRep(result.repCount);
        
        // Update other state variables
        setRepQuality(result.repQuality);
        setActiveArm(result.activeArm);
        
        // Add points from state machine
        if (result.points > 0) {
          setScore(prev => prev + result.points);
        }
        
        // Check if rep was just completed
        if (result.debugInfo.stateChange && result.debugInfo.stateChange.includes('REP COMPLETE')) {
          setLastRepTime(Date.now());
          console.log(`🎉 Rep ${result.repCount} completed! Quality: ${result.repQuality}`);
          
          if (result.repCount >= 10) {
            console.log('🎉 Exercise session complete! 10 reps reached!');
          }
        }
        
        // Also run legacy form analysis for compatibility
        if (template && template.frames && template.frames.length > 0) {
          const currentTime = Date.now() - sessionStartTime;
          const templateDuration = template.duration;
          const frameIndex = Math.floor((currentTime / templateDuration) * template.frames.length);
          const boundedFrameIndex = Math.min(frameIndex, template.frames.length - 1);
          
          console.log('🔍 Form Analysis Debug:', {
            currentTime: Math.floor(currentTime / 1000) + 's',
            templateDuration: templateDuration + 's',
            frameIndex: frameIndex,
            boundedFrameIndex: boundedFrameIndex,
            totalFrames: template.frames.length,
            poseLandmarksCount: poseLandmarks?.length || 0
          });
          
          const analysis = analyzeForm(poseLandmarks, template, boundedFrameIndex);
          console.log('📊 Analysis Result:', {
            accuracy: analysis.accuracy,
            status: analysis.status,
            feedback: analysis.feedback,
            points: analysis.points
          });
          
          setCurrentFormAnalysis(analysis);
          
          frameIndexRef.current = boundedFrameIndex;
        }
        
        // Provide voice feedback only on rep completion and state changes
        if (voiceFeedback && (
          result.debugInfo.stateChange || // State changes
          result.repCount > currentRep // Rep completion
        )) {
          console.log('🎤 Calling voice feedback - State change:', result.debugInfo.stateChange, 'Rep count:', result.repCount);
          voiceFeedback.provideFeedback(result, currentFormAnalysis, result.repCount, score);
        }
      } catch (error) {
        console.error('Error in state machine analysis:', error);
      }
    } else {
      // Use legacy system
      if (template && template.frames && template.frames.length > 0) {
        try {
          const currentTime = Date.now() - sessionStartTime;
          const templateDuration = template.duration;
          const frameIndex = Math.floor((currentTime / templateDuration) * template.frames.length);
          const boundedFrameIndex = Math.min(frameIndex, template.frames.length - 1);
          
          console.log('🔍 Legacy Form Analysis Debug:', {
            currentTime: Math.floor((Date.now() - sessionStartTime) / 1000) + 's',
            templateDuration: template.duration + 's',
            frameIndex: frameIndex,
            boundedFrameIndex: boundedFrameIndex,
            totalFrames: template.frames.length,
            poseLandmarksCount: poseLandmarks?.length || 0
          });
          
          const analysis = analyzeForm(poseLandmarks, template, boundedFrameIndex);
          console.log('📊 Legacy Analysis Result:', {
            accuracy: analysis.accuracy,
            status: analysis.status,
            feedback: analysis.feedback,
            points: analysis.points
          });
          
          setCurrentFormAnalysis(analysis);
          updateScore(analysis);
          
          // Update active arm
          if (analysis.activeArm) {
            setActiveArm(analysis.activeArm);
          }
          
          // Check for repetition completion using legacy system
          const repDetection = detectRepetition(poseLandmarks, analysis, null);
          
          if (repDetection.isRepComplete && currentRep < 10) {
            const newRepCount = Math.min(currentRep + 1, 10);
            setCurrentRep(newRepCount);
            setRepQuality(repDetection.repQuality);
            setLastRepTime(Date.now());
            
            let bonusPoints = 0;
            switch (repDetection.repQuality) {
              case 'excellent': bonusPoints = 15; break;
              case 'good': bonusPoints = 10; break;
              case 'poor': bonusPoints = 5; break;
            }
            setScore(prev => prev + bonusPoints);
            
            console.log(`Rep ${newRepCount} completed! Quality: ${repDetection.repQuality}, Bonus: +${bonusPoints} points`);
            if (newRepCount === 10) {
              console.log('🎉 Exercise session complete! 10 reps reached!');
            }
          }
          
          frameIndexRef.current = boundedFrameIndex;
          
          // Provide voice feedback for legacy system only on rep completion
          if (voiceFeedback && repDetection.isRepComplete) {
            voiceFeedback.provideFeedback(null, analysis, currentRep, score);
          }
        } catch (error) {
          console.error('Error in legacy form analysis:', error);
        }
      }
    }
  }, [useStateMachine, stateMachine, template, updateScore, recordingState.isRecording, recordFrame, sessionStartTime, currentRep, voiceFeedback]);

  // Start form analysis when MediaPipe is ready
  useEffect(() => {
    if (startMediaPipe && template) {
      // Start analyzing form every 500ms
      analysisIntervalRef.current = setInterval(() => {
        // This will be called by the KinetiPlayCanvas component
        // when pose data is available
      }, 500);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [startMediaPipe, template]);

  // Calculate accuracy based on current form analysis
  const calculateAccuracy = () => {
    return currentFormAnalysis?.accuracy || 0;
  };

  // Calculate elapsed time
  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    const session: GameSession = {
      exerciseId: exercise.id,
      startTime: sessionStartTime,
      endTime: Date.now(),
      score: score,
      accuracy: calculateAccuracy(),
      completedReps: currentRep,
      targetReps: 10
    };
    
    // Provide session completion voice feedback
    if (voiceFeedback) {
      const sessionDuration = Date.now() - sessionStartTime;
      voiceFeedback.provideSessionFeedback({
        totalReps: currentRep,
        averageAccuracy: calculateAccuracy(),
        totalScore: score,
        sessionDuration: sessionDuration
      });
    }
    
    onGameComplete(session);
  };

  const startMediaPipeDetection = () => {
    setStartMediaPipe(true);
    // Reset any previous errors
    setCurrentFormAnalysis(null);
    // The KinetiPlayCanvas will handle its own initialization
  };

  const startRecordingMode = () => {
    setIsRecordingMode(true);
    setRecordingStep('instructions');
  };

  const handleTemplateSaved = (savedTemplate: any) => {
    setTemplate(savedTemplate);
    setIsRecordingMode(false);
    setRecordingStep('instructions');
    setStartMediaPipe(true);
  };

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
    const template = saveTemplate(exercise.name);
    handleTemplateSaved(template);
  };

  const clearTemplate = () => {
    setTemplate(null);
    // Clear from localStorage
    const templates = JSON.parse(localStorage.getItem('exerciseTemplates') || '{}');
    delete templates[exercise.name];
    localStorage.setItem('exerciseTemplates', JSON.stringify(templates));
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{exercise.name}</h2>
          <div className="flex space-x-6 text-lg">
            <div>Score: <span className="font-bold text-physio-primary">{score}</span></div>
            <div>Reps: <span className="font-bold">{currentRep}/10</span></div>
            <div>Time: <span className="font-bold">{getElapsedTime()}</span></div>
            <div className="text-sm">
              <div>State: <span className={`font-bold ${
                stateMachineResult?.repState === 'waiting_for_start' ? 'text-blue-600' :
                stateMachineResult?.repState === 'movement_in_progress' ? 'text-orange-600' :
                stateMachineResult?.repState === 'movement_at_end' ? 'text-green-600' : 'text-gray-600'
              }`}>{stateMachineResult?.repState?.replace(/_/g, ' ') || 'unknown'}</span></div>
              <div>Active Arm: <span className="font-bold capitalize">{activeArm}</span></div>
              <div>Last Rep: <span className={`font-bold ${
                repQuality === 'excellent' ? 'text-green-600' : 
                repQuality === 'good' ? 'text-blue-600' : 'text-red-600'
              }`}>{repQuality}</span></div>
            </div>
            <button 
              onClick={() => setDebugMode(!debugMode)}
              className="text-sm bg-gray-500 text-white px-2 py-1 rounded"
            >
              {debugMode ? 'Hide Debug' : 'Debug'}
            </button>
            <button 
              onClick={() => setUseStateMachine(!useStateMachine)}
              className={`text-sm px-2 py-1 rounded ${
                useStateMachine 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-green-500 text-white'
              }`}
            >
              {useStateMachine ? 'State Machine' : 'Legacy System'}
            </button>
            <button 
              onClick={() => {
                setVoiceFeedbackEnabled(!voiceFeedbackEnabled);
                if (voiceFeedback) {
                  voiceFeedback.toggle();
                }
              }}
              className={`text-sm px-2 py-1 rounded ${
                voiceFeedbackEnabled 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-500 text-white'
              }`}
            >
              {voiceFeedbackEnabled ? 'Voice On' : 'Voice Off'}
            </button>
            <button 
              onClick={() => setUseSimpleFormAnalysis(!useSimpleFormAnalysis)}
              className={`text-sm px-2 py-1 rounded ${
                useSimpleFormAnalysis 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-500 text-white'
              }`}
            >
              {useSimpleFormAnalysis ? 'Simple Form' : 'Complex Form'}
            </button>
          </div>
        </div>
        
        {/* Main Game Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Feed with Pose Detection */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="mb-4">
                {isRecordingMode ? (
                  <div className="relative">
                    {/* Show camera feed during recording */}
                    {recordingStep === 'recording' && countdown === 0 && (
                      <div className="w-full h-96">
                        <KinetiPlayCanvas onPoseData={analyzeCurrentForm} />
                      </div>
                    )}
                    
                    {/* Overlay UI for recording states */}
                    {recordingStep === 'instructions' && (
                      <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center z-20">
                        <div className="text-center">
                          <div className="text-6xl mb-4">📹</div>
                          <h3 className="text-xl font-semibold mb-4">Recording Instructions</h3>
                          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                            <ol className="space-y-2 text-sm">
                              <li>1. Stand in front of the camera with good lighting</li>
                              <li>2. Make sure your full upper body is visible</li>
                              <li>3. Perform the exercise slowly and with perfect form</li>
                              <li>4. Complete 3-5 repetitions during the recording</li>
                              <li>5. This will be used as the "perfect form" template</li>
                            </ol>
                          </div>
                          <div className="flex justify-center space-x-4">
                            <button onClick={() => setIsRecordingMode(false)} className="btn-secondary">
                              Cancel
                            </button>
                            <button onClick={handleStartRecording} className="btn-primary">
                              Start Recording
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {recordingStep === 'recording' && (
                      <>
                        {countdown > 0 ? (
                          <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center z-20">
                            <div className="text-center">
                              <div className="text-6xl font-bold text-red-500 mb-2">{countdown}</div>
                              <p>Get ready to start recording...</p>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg z-20">
                            <div className="text-2xl font-bold text-red-500 mb-2">🔴 RECORDING</div>
                            <p className="text-sm">Perform the exercise with perfect form</p>
                            <div className="text-sm text-gray-300 mt-2">
                              Frames recorded: {recordingState.recordedFrames.length}
                            </div>
                            <button 
                              onClick={handleStopRecording}
                              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
                            >
                              Stop Recording
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    
                    {recordingStep === 'saving' && (
                      <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center z-20">
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
                          <button onClick={() => setIsRecordingMode(false)} className="btn-primary">
                            Continue to Exercise
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : !startMediaPipe ? (
                  <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📹</div>
                      <p className="text-gray-600">Ready to Start</p>
                      <p className="text-sm text-gray-500 mb-4">Choose an option below</p>
                      <div className="space-y-2">
                        <button 
                          onClick={startRecordingMode}
                          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold mr-2"
                        >
                          {template ? 'Re-record Template' : 'Record Template'}
                        </button>
                        <button 
                          onClick={startMediaPipeDetection}
                          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold"
                        >
                          Start Exercise
                        </button>
                        {template && (
                          <div className="text-xs text-gray-500 mt-2">
                            Template loaded: {template.frameCount} frames
                            <button 
                              onClick={clearTemplate}
                              className="ml-2 text-red-500 hover:text-red-700 underline"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Always render KinetiPlayCanvas - it will handle its own initialization */}
                    <KinetiPlayCanvas 
                      onPoseData={analyzeCurrentForm} 
                      shouldInitialize={startMediaPipe}
                    />
                    
                    {/* Manual retry button if needed */}
                    <div className="mt-4 text-center">
                      <button 
                        onClick={() => {
                          setStartMediaPipe(false);
                          setTimeout(() => setStartMediaPipe(true), 100);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Restart MediaPipe
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Game UI */}
          <div className="space-y-4">
            {/* Progress */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Exercise Progress</span>
                    <span>{Math.round((currentRep / 10) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-physio-primary h-2 rounded-full transition-all duration-300" 
                      style={{width: `${Math.min((currentRep / 10) * 100, 100)}%`}}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Accuracy</span>
                    <span>{calculateAccuracy()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${calculateAccuracy()}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Form Feedback */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">Form Analysis</h3>
              {currentFormAnalysis ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accuracy</span>
                    <span className={`font-bold ${
                      currentFormAnalysis.accuracy >= 90 ? 'text-green-600' :
                      currentFormAnalysis.accuracy >= 75 ? 'text-blue-600' :
                      currentFormAnalysis.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {currentFormAnalysis.accuracy}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      currentFormAnalysis.status === 'excellent' ? 'bg-green-100 text-green-800' :
                      currentFormAnalysis.status === 'good' ? 'bg-blue-100 text-blue-800' :
                      currentFormAnalysis.status === 'needs_improvement' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {currentFormAnalysis.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Arm</span>
                    <span className="text-xs font-bold capitalize text-blue-600">
                      {currentFormAnalysis.activeArm || 'unknown'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentFormAnalysis.feedback}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Points</span>
                    <span className="text-xs font-bold text-physio-primary">
                      +{currentFormAnalysis.points}
                    </span>
                  </div>
                  
                  {/* Debug Information */}
                  {debugMode && currentFormAnalysis && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                      <div className="font-semibold mb-2">Debug Info:</div>
                      <div>Shoulder Angle: {Math.round(currentFormAnalysis.angles?.shoulderAngle || 0)}°</div>
                      <div>Elbow Angle: {Math.round(currentFormAnalysis.angles?.elbowAngle || 0)}°</div>
                      <div>Distance: {currentFormAnalysis.distance.toFixed(3)}</div>
                      <div>Frame Index: {frameIndexRef.current}</div>
                      <div>Template Frames: {template?.frameCount || 0}</div>
                      <div>Template Duration: {template?.duration || 0}ms</div>
                      <div>Current Time: {Date.now() - sessionStartTime}ms</div>
                      <div className="mt-2 font-semibold">Exercise Phase:</div>
                      <div className="text-xs">
                        <div>Phase: {currentFormAnalysis.phase || 'unknown'}</div>
                        <div>Progress: {currentFormAnalysis.phaseProgress || '0%'}</div>
                        <div>Active Arm: {currentFormAnalysis.activeArm || 'unknown'}</div>
                      </div>
                      <div className="mt-2 font-semibold">Rep Tracking:</div>
                      <div className="text-xs">
                        <div>Current Rep: {currentRep}</div>
                        <div>Last Rep Quality: {repQuality}</div>
                        <div>Last Rep Time: {lastRepTime > 0 ? new Date(lastRepTime).toLocaleTimeString() : 'none'}</div>
                      </div>
                      <div className="mt-2 font-semibold">Template Sample:</div>
                      {template?.frames && template.frames[0] && (
                        <div className="text-xs">
                          <div>Wrist: ({template.frames[0][4]?.x.toFixed(2)}, {template.frames[0][4]?.y.toFixed(2)})</div>
                          <div>Shoulder: ({template.frames[0][0]?.x.toFixed(2)}, {template.frames[0][0]?.y.toFixed(2)})</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  {template ? 'Perform the exercise to see form analysis' : 'No template available. Record one first.'}
                </div>
              )}
            </div>
            
            {/* State Machine Analysis */}
            {stateMachineResult && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-3">State Machine Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current State</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      stateMachineResult.repState === 'waiting_for_start' ? 'bg-blue-100 text-blue-800' :
                      stateMachineResult.repState === 'movement_in_progress' ? 'bg-orange-100 text-orange-800' :
                      stateMachineResult.repState === 'movement_at_end' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {stateMachineResult.repState.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rep Count</span>
                    <span className="font-bold text-lg">{stateMachineResult.repCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accuracy</span>
                    <span className={`font-bold ${
                      stateMachineResult.accuracy >= 90 ? 'text-green-600' :
                      stateMachineResult.accuracy >= 75 ? 'text-blue-600' :
                      stateMachineResult.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {stateMachineResult.accuracy}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rep Quality</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      stateMachineResult.repQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                      stateMachineResult.repQuality === 'good' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {stateMachineResult.repQuality}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {stateMachineResult.feedback}
                  </div>
                  
                  {/* State Machine Debug Info */}
                  {debugMode && (
                    <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
                      <div className="font-semibold mb-2">State Machine Debug:</div>
                      <div>Distance to Start: {stateMachineResult.debugInfo.distanceToStart}</div>
                      <div>Distance to End: {stateMachineResult.debugInfo.distanceToEnd}</div>
                      <div>Proximity Threshold: {stateMachineResult.debugInfo.proximityThreshold}</div>
                      {stateMachineResult.debugInfo.stateChange && (
                        <div className="mt-2 font-semibold text-green-600">
                          State Change: {stateMachineResult.debugInfo.stateChange}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Rep Quality Indicator */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">Rep Quality</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Rep</span>
                  <span className="font-bold text-lg">{currentRep}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Rep Quality</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    repQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                    repQuality === 'good' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {repQuality}
                  </span>
                </div>
                {lastRepTime > 0 && (
                  <div className="text-xs text-gray-500">
                    Last rep: {new Date(lastRepTime).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>

            {/* Simple Form Analysis Display */}
            {useSimpleFormAnalysis && simpleFormResult && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-3">Simple Form Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Arm Position</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      simpleFormResult.armPosition === 'up' ? 'bg-green-100 text-green-800' :
                      simpleFormResult.armPosition === 'raising' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {simpleFormResult.armPosition.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Arm Height</span>
                    <span className="font-bold">{Math.round(simpleFormResult.armHeight)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Form Status</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      simpleFormResult.isInGoodPosition ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {simpleFormResult.isInGoodPosition ? 'GOOD' : 'NEEDS WORK'}
                    </span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                    {simpleFormResult.feedback}
                  </div>
                </div>
              </div>
            )}
            
            {/* Sky Painter Game */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">Sky Painter</h3>
              <div className="aspect-square bg-gradient-to-b from-blue-200 to-blue-400 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-3xl mb-2">🎨</div>
                  <p className="text-sm">Paint the sky with your movements!</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleComplete}
              className="btn-primary w-full"
            >
              Complete Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}