import { ExerciseTemplate } from '../types';

interface InstructionsPageProps {
  exercise: ExerciseTemplate;
  onStartGame: () => void;
}

export default function InstructionsPage({ exercise, onStartGame }: InstructionsPageProps) {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <h2 className="text-3xl font-bold mb-6">{exercise.name}</h2>
          
          <div className="mb-8">
            <div className="text-8xl mb-4">💪</div>
            <p className="text-lg text-gray-600 mb-4">{exercise.description}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">How to perform:</h3>
            <ol className="text-left space-y-2">
              <li className="flex items-start">
                <span className="bg-physio-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">1</span>
                Stand with your feet shoulder-width apart
              </li>
              <li className="flex items-start">
                <span className="bg-physio-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">2</span>
                Slowly raise both arms out to your sides
              </li>
              <li className="flex items-start">
                <span className="bg-physio-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">3</span>
                Lift until your arms are parallel to the floor
              </li>
              <li className="flex items-start">
                <span className="bg-physio-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">4</span>
                Slowly lower your arms back down
              </li>
            </ol>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button className="btn-secondary">
              Watch Demo
            </button>
            <button 
              onClick={onStartGame}
              className="btn-primary"
            >
              Start Exercise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}