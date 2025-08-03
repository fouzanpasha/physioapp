import { useRef, useEffect } from 'react';
import { useKinetiPlay } from '../hooks/useKinetiPlay';

// TypeScript declaration for global MediaPipe
declare global {
  interface Window {
    Pose: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

// Helper function for angle calculation
import { calculateAngle } from '../utils/poseUtils';

export const KinetiPlayCanvas = () => {
  // Create refs to pass to our hook
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use our custom hook to get the AI results!
  const { results: poseResults, error, isLoading } = useKinetiPlay(videoRef, canvasRef);

  // This second useEffect is for DRAWING. It runs every time `poseResults` changes.
  useEffect(() => {
    if (canvasRef.current && poseResults) {
      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      // Clear the canvas
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw the video frame
      canvasCtx.drawImage(poseResults.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw the pose landmarks (the dots)
      if (poseResults.poseLandmarks) {
        // Load drawing utilities if not already loaded
        if (window.drawLandmarks && window.drawConnectors && window.POSE_CONNECTIONS) {
          window.drawLandmarks(canvasCtx, poseResults.poseLandmarks, { color: '#00FF00', lineWidth: 2 });
          // Draw the pose connections (the lines)
          window.drawConnectors(canvasCtx, poseResults.poseLandmarks, window.POSE_CONNECTIONS, { color: '#FFFFFF', lineWidth: 2 });
        } else {
          // Fallback: draw simple dots
          poseResults.poseLandmarks.forEach((landmark: any) => {
            canvasCtx.beginPath();
            canvasCtx.arc(
              landmark.x * canvasRef.current!.width,
              landmark.y * canvasRef.current!.height,
              3,
              0,
              2 * Math.PI
            );
            canvasCtx.fillStyle = '#00FF00';
            canvasCtx.fill();
          });
        }

        // --- Example: Calculate and draw the elbow angle ---
        const landmarks = poseResults.poseLandmarks;
        const shoulder = landmarks[11];
        const elbow = landmarks[13];
        const wrist = landmarks[15];

        if (shoulder && elbow && wrist) {
            const angle = calculateAngle(shoulder, elbow, wrist);
            // Draw the angle on the canvas
            canvasCtx.font = "40px Arial";
            canvasCtx.fillStyle = "cyan";
            canvasCtx.fillText(`Angle: ${Math.round(angle)}°`, elbow.x * canvasRef.current.width, elbow.y * canvasRef.current.height);
        }
      }

      canvasCtx.restore();
    }
  }, [poseResults]); // This effect depends on poseResults

  return (
    <div className="relative w-full max-w-4xl">
      {/* The video element is hidden but provides the source stream */}
      <video ref={videoRef} className="hidden" autoPlay></video>
      {/* The canvas is what the user sees */}
      <canvas ref={canvasRef} width={1280} height={720} className="w-full h-auto rounded-lg"></canvas>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing MediaPipe...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-red-600 font-semibold">MediaPipe Error</p>
            <p className="text-sm text-red-500 mt-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 