import { ExerciseTemplate } from '../types';

interface ExerciseSelectionPageProps {
  onExerciseSelected: (exercise: ExerciseTemplate) => void;
}

// Mock exercises - replace with actual data later
const mockExercises: ExerciseTemplate[] = [
  {
    id: 'shoulder-abduction',
    name: 'Shoulder Abduction',
    description: 'Raise your arms out to the sides',
    targetArea: 'Shoulders',
    coordinates: [],
    duration: 30
  },
  {
    id: 'arm-circles',
    name: 'Arm Circles',
    description: 'Make circular motions with your arms',
    targetArea: 'Shoulders',
    coordinates: [],
    duration: 30
  },
  {
    id: 'knee-bends',
    name: 'Knee Bends',
    description: 'Gentle knee flexion exercises',
    targetArea: 'Legs',
    coordinates: [],
    duration: 30
  }
];

export default function ExerciseSelectionPage({ onExerciseSelected }: ExerciseSelectionPageProps) {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Choose Your Exercise</h2>
          <p className="text-gray-600">Select an exercise to start your therapy session</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockExercises.map((exercise) => (
            <div key={exercise.id} className="card hover:shadow-lg transition-shadow cursor-pointer"
                 onClick={() => onExerciseSelected(exercise)}>
              <div className="text-4xl mb-4">
                {exercise.targetArea === 'Shoulders' ? '💪' : '🦵'}
              </div>
              <h3 className="text-xl font-semibold mb-2">{exercise.name}</h3>
              <p className="text-gray-600 mb-4">{exercise.description}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{exercise.targetArea}</span>
                <span>{exercise.duration}s</span>
              </div>
              {exercise.id === 'shoulder-abduction' && (
                <div className="mt-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-block">
                  Demo Ready
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}