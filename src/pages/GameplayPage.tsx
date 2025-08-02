import { ExerciseTemplate, GameSession } from '../types';
import { useState, useEffect, useCallback } from 'react';

interface FormFeedback {
  id: string;
  message: string;
  status: 'green' | 'yellow' | 'red';
  points: number;
}

interface GameplayPageProps {
  exercise: ExerciseTemplate;
  onGameComplete: (session: GameSession) => void;
}

export default function GameplayPage({ exercise, onGameComplete }: GameplayPageProps) {
  const [score, setScore] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [formFeedback, setFormFeedback] = useState<FormFeedback[]>([
    { id: 'posture', message: 'Good posture', status: 'green', points: 3 },
    { id: 'arms', message: 'Lift arms higher', status: 'yellow', points: 1 },
    { id: 'speed', message: 'Good speed', status: 'green', points: 3 }
  ]);

  // Calculate total possible points per evaluation
  const totalPossiblePoints = formFeedback.reduce((sum, feedback) => sum + 3, 0);

  // Update score based on current form feedback
  const updateScore = useCallback(() => {
    const currentPoints = formFeedback.reduce((sum, feedback) => {
      switch (feedback.status) {
        case 'green':
          return sum + 3;
        case 'yellow':
          return sum + 1;
        case 'red':
        default:
          return sum + 0;
      }
    }, 0);
    
    setScore(prevScore => prevScore + currentPoints);
  }, [formFeedback]);

  // Simulate form feedback changes every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFormFeedback(prev => prev.map(feedback => {
        // Simulate random status changes for demo purposes
        const random = Math.random();
        let newStatus: 'green' | 'yellow' | 'red';
        
        if (random > 0.7) {
          newStatus = 'green';
        } else if (random > 0.4) {
          newStatus = 'yellow';
        } else {
          newStatus = 'red';
        }
        
        return {
          ...feedback,
          status: newStatus,
          points: newStatus === 'green' ? 3 : newStatus === 'yellow' ? 1 : 0
        };
      }));
      
      // Update score based on new feedback
      updateScore();
      
      // Increment rep counter every 10 seconds (simulating exercise completion)
      setCurrentRep(prev => {
        const newRep = prev + 1;
        if (newRep >= 10) {
          // Complete session when target reps reached
          handleComplete();
        }
        return newRep;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [updateScore]);

  // Calculate accuracy based on average form quality
  const calculateAccuracy = () => {
    const totalPoints = formFeedback.reduce((sum, feedback) => sum + feedback.points, 0);
    const maxPossiblePoints = formFeedback.length * 3;
    return Math.round((totalPoints / maxPossiblePoints) * 100);
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
    onGameComplete(session);
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
          </div>
        </div>
        
        {/* Main Game Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-center">
                  <div className="text-6xl mb-4">📹</div>
                  <p>Camera feed will appear here</p>
                  <p className="text-sm opacity-70">MediaPipe pose estimation overlay</p>
                </div>
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
                      style={{width: `${(currentRep / 10) * 100}%`}}
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
              <h3 className="text-lg font-semibold mb-3">Form Feedback</h3>
              <div className="space-y-2">
                {formFeedback.map((feedback) => (
                  <div key={feedback.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className={`w-3 h-3 rounded-full mr-2 transition-colors duration-300 ${
                          feedback.status === 'green' ? 'bg-green-500' : 
                          feedback.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      ></div>
                      <span className="text-sm">{feedback.message}</span>
                    </div>
                    <span className="text-xs font-bold text-physio-primary">
                      +{feedback.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
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