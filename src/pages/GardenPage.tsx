import { UserProgress } from '../types';

interface GardenPageProps {
  userProgress: UserProgress;
  onBack: () => void;
}

export default function GardenPage({ userProgress, onBack }: GardenPageProps) {
  const flowers = Array.from({ length: userProgress.level }, (_, i) => i);
  
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Recovery Garden</h2>
            <p className="text-gray-600">Each flower represents your progress and dedication</p>
          </div>
          <button 
            onClick={onBack}
            className="btn-secondary"
          >
            Back to Exercises
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Progress Stats */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Progress Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Current Level</span>
                <span className="font-bold text-2xl text-physio-primary">{userProgress.level}</span>
              </div>
              <div className="flex justify-between">
                <span>Total XP</span>
                <span className="font-bold">{userProgress.xp}</span>
              </div>
              <div className="flex justify-between">
                <span>Sessions Completed</span>
                <span className="font-bold">{userProgress.totalSessions}</span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to Next Level</span>
                  <span>650/1000 XP</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-physio-primary to-physio-secondary h-3 rounded-full" style={{width: '65%'}}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Virtual Garden */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Your Garden</h3>
            <div className="aspect-square bg-gradient-to-b from-green-100 to-green-200 rounded-lg p-6 flex flex-wrap items-end justify-center">
              {flowers.map((_, index) => (
                <div key={index} className="text-4xl mx-1 animate-pulse">
                  {index === 0 ? '🌱' : index < 3 ? '🌸' : '🌺'}
                </div>
              ))}
              {userProgress.level === 1 && (
                <div className="text-center text-gray-500 text-sm mt-4">
                  Complete more exercises to grow your garden!
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Achievement Badges */}
        <div className="card mt-8">
          <h3 className="text-xl font-semibold mb-4">Recent Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-sm font-medium">First Session</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">💪</div>
              <div className="text-sm font-medium">Perfect Form</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg opacity-50">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-sm font-medium">5 Day Streak</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg opacity-50">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-sm font-medium">Level 5</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}