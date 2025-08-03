interface WelcomePageProps {
  onStart: () => void;
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <img 
          src="/PhysioGrow.png" 
          alt="PhysioGrow Logo" 
          className="mx-auto mb-6 w-64 h-64 object-contain"
        />
        <h1 className="text-6xl font-bold text-physio-primary mb-4">
          PhysioGrow
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Physical therapy that speaks. Correct form and grow your habit
        </p>
        <button 
          onClick={onStart}
          className="btn-primary text-lg px-8 py-4"
        >
          Start Your Journey
        </button>
        <div className="mt-8 text-sm text-gray-500">
          <p>✨ AI-powered motion tracking</p>
          <p>🎮 Gamified exercises</p>
          <p>📈 Progress tracking</p>
        </div>
      </div>
    </div>
  );
}