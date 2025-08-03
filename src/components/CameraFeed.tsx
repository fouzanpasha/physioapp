import { useRef, useEffect, useState } from 'react';

interface CameraFeedProps {
  onCameraReady?: () => void;
  onCameraError?: (error: string) => void;
}

export default function CameraFeed({ onCameraReady, onCameraError }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user' // Use front camera
          },
          audio: false
        });

        // Set the video stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            onCameraReady?.();
          };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
        setError(errorMessage);
        setIsLoading(false);
        onCameraError?.(errorMessage);
        console.error('Camera access error:', err);
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onCameraReady, onCameraError]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Accessing camera...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-red-900 rounded-lg flex items-center justify-center z-10">
          <div className="text-center text-white p-4">
            <div className="text-2xl mb-2">❌</div>
            <p className="font-semibold mb-2">Camera Error</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-white text-red-900 rounded-lg font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto rounded-lg bg-gray-900"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
} 