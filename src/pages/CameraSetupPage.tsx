import { useState } from 'react';
import CameraFeed from '../components/CameraFeed';

interface CameraSetupPageProps {
  onCameraEnabled: () => void;
}

export default function CameraSetupPage({ onCameraEnabled }: CameraSetupPageProps) {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleCameraReady = () => {
    setCameraReady(true);
    setCameraError(null);
  };

  const handleCameraError = (error: string) => {
    setCameraError(error);
    setCameraReady(false);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Camera Setup</h2>
          <p className="text-gray-600">
            We need access to your camera to track your movements and provide real-time feedback.
          </p>
        </div>

        {/* Privacy Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800">
            <strong>Privacy Note:</strong> All processing happens on your device. 
            No video data is sent to our servers.
          </p>
        </div>

        {/* Camera Feed */}
        <div className="mb-8">
          <CameraFeed 
            onCameraReady={handleCameraReady}
            onCameraError={handleCameraError}
          />
        </div>

        {/* Status and Continue Button */}
        <div className="text-center">
          {cameraError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
              <p className="text-red-800">
                <strong>Camera Error:</strong> {cameraError}
              </p>
              <p className="text-sm text-red-600 mt-2">
                Please check your camera permissions and try again.
              </p>
            </div>
          )}

          {cameraReady && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
              <p className="text-green-800">
                <strong>✅ Camera Ready!</strong> Your camera is working properly.
              </p>
            </div>
          )}

          <button 
            onClick={onCameraEnabled}
            disabled={!cameraReady}
            className={`btn-primary ${!cameraReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cameraReady ? 'Continue to Exercise Selection' : 'Camera Not Ready'}
          </button>
        </div>
      </div>
    </div>
  );
}