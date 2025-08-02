interface CameraSetupPageProps {
  onCameraEnabled: () => void;
}

export default function CameraSetupPage({ onCameraEnabled }: CameraSetupPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-lg text-center">
        <div className="text-6xl mb-4">📹</div>
        <h2 className="text-2xl font-bold mb-4">Camera Setup</h2>
        <p className="text-gray-600 mb-6">
          We need access to your camera to track your movements and provide real-time feedback.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Privacy Note:</strong> All processing happens on your device. 
            No video data is sent to our servers.
          </p>
        </div>
        <button 
          onClick={onCameraEnabled}
          className="btn-primary w-full"
        >
          Enable Camera
        </button>
      </div>
    </div>
  );
}