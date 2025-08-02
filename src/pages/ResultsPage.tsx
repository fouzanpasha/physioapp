import { GameSession } from '../types';

interface ResultsPageProps {
  session: GameSession;
  onContinue: () => void;
  onViewGarden: () => void;
}

export default function ResultsPage({ session, onContinue, onViewGarden }: ResultsPageProps) {
  const xpGained = Math.floor(session.score / 10);
  
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-lg mx-auto">
        <div className="card text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-6">Session Complete!</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Final Score</span>
              <span className="text-2xl font-bold text-physio-primary">{session.score}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Accuracy</span>
              <span className="text-xl font-bold text-green-600">{session.accuracy}%</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Reps Completed</span>
              <span className="text-xl font-bold">{session.completedReps}/{session.targetReps}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg">
              <span className="font-medium">XP Gained</span>
              <span className="text-xl font-bold text-yellow-600">+{xpGained} XP</span>
            </div>
          </div>
          
          {xpGained > 80 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-600 font-bold">🌟 Level Up!</div>
              <p className="text-sm text-green-700">You've reached Level 2!</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button 
              onClick={onViewGarden}
              className="btn-primary w-full"
            >
              View My Garden
            </button>
            <button 
              onClick={onContinue}
              className="btn-secondary w-full"
            >
              Try Another Exercise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}