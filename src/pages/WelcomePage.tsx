interface WelcomePageProps {
  onStart: () => void;
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-physio-primary mb-4">
          PhysioRoyale
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Transform your physical therapy into an engaging game experience
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