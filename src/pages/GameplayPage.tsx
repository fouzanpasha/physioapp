import { ExerciseTemplate, GameSession } from '../types';

interface GameplayPageProps {
  exercise: ExerciseTemplate;
  onGameComplete: (session: GameSession) => void;
}

export default function GameplayPage({ exercise, onGameComplete }: GameplayPageProps) {
  // Mock session for now
  const handleComplete = () => {
    const mockSession: GameSession = {
      exerciseId: exercise.id,
      startTime: Date.now() - 30000,
      endTime: Date.now(),
      score: 850,
      accuracy: 85,
      completedReps: 10,
      targetReps: 10
    };
    onGameComplete(mockSession);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{exercise.name}</h2>
          <div className="flex space-x-6 text-lg">
            <div>Score: <span className="font-bold text-physio-primary">850</span></div>
            <div>Reps: <span className="font-bold">8/10</span></div>
            <div>Time: <span className="font-bold">0:25</span></div>
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
                    <span>80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-physio-primary h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Form Feedback */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-3">Form Feedback</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Good posture</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm">Lift arms higher</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Good speed</span>
                </div>
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
              Complete Session (Demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}