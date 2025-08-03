import { useRef, useEffect, useState } from 'react';

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

interface KinetiPlayCanvasProps {
  onPoseData?: (poseLandmarks: any[]) => void;
  shouldInitialize?: boolean;
}

export const KinetiPlayCanvas = ({ onPoseData, shouldInitialize = true }: KinetiPlayCanvasProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poseResults, setPoseResults] = useState<any>(null);

  useEffect(() => {
    let pose: any = null;
    let isInitialized = false;

    const initializeMediaPipe = async () => {
      if (!shouldInitialize || isInitialized) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load MediaPipe from CDN
        if (!window.Pose) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = () => {
              setTimeout(() => {
                if (window.Pose) resolve(true);
                else reject(new Error('Pose not available'));
              }, 1000);
            };
            script.onerror = () => reject(new Error('Failed to load MediaPipe'));
            document.head.appendChild(script);
          });
        }

        // Initialize pose detection
        pose = new window.Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
          },
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        // Set up camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            // Set up pose detection callback
            pose.onResults((results: any) => {
              setPoseResults(results);
              setIsLoading(false);
              
              if (onPoseData && results.poseLandmarks) {
                onPoseData(results.poseLandmarks);
              }
            });

            // Start pose detection loop
            const processFrame = async () => {
              if (videoRef.current && isInitialized) {
                try {
                  await pose.send({ image: videoRef.current });
                  requestAnimationFrame(processFrame);
                } catch (err) {
                  console.error("Error processing frame:", err);
                }
              }
            };

            isInitialized = true;
            processFrame();
          };
        }

      } catch (err) {
        console.error("Error initializing MediaPipe:", err);
        setError(err instanceof Error ? err.message : 'Failed to initialize MediaPipe');
        setIsLoading(false);
      }
    };

    initializeMediaPipe();

    // Cleanup
    return () => {
      isInitialized = false;
      if (pose) {
        pose.close();
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [shouldInitialize, onPoseData]);

  // Draw pose results
  useEffect(() => {
    if (canvasRef.current && poseResults) {
      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      // Clear the canvas
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw the video frame
      canvasCtx.drawImage(poseResults.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw the pose landmarks
      if (poseResults.poseLandmarks) {
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

        // Draw angle
        const landmarks = poseResults.poseLandmarks;
        const shoulder = landmarks[11];
        const elbow = landmarks[13];
        const wrist = landmarks[15];

        if (shoulder && elbow && wrist) {
          const angle = calculateAngle(shoulder, elbow, wrist);
          canvasCtx.font = "24px Arial";
          canvasCtx.fillStyle = "cyan";
          canvasCtx.fillText(`Shoulder: ${Math.round(angle)}°`, 10, 30);
          
          // Draw angle arc
          canvasCtx.beginPath();
          canvasCtx.arc(
            elbow.x * canvasRef.current.width,
            elbow.y * canvasRef.current.height,
            20,
            0,
            2 * Math.PI
          );
          canvasCtx.strokeStyle = "cyan";
          canvasCtx.lineWidth = 2;
          canvasCtx.stroke();
        }

        // Draw left arm angle too
        const leftShoulder = landmarks[12];
        const leftElbow = landmarks[14];
        const leftWrist = landmarks[16];

        if (leftShoulder && leftElbow && leftWrist) {
          const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
          canvasCtx.font = "24px Arial";
          canvasCtx.fillStyle = "yellow";
          canvasCtx.fillText(`Elbow: ${Math.round(leftAngle)}°`, 10, 60);
        }

        // Draw wrist position indicator (most important for accuracy)
        if (wrist) {
          canvasCtx.beginPath();
          canvasCtx.arc(
            wrist.x * canvasRef.current.width,
            wrist.y * canvasRef.current.height,
            8,
            0,
            2 * Math.PI
          );
          canvasCtx.fillStyle = "red";
          canvasCtx.fill();
          canvasCtx.font = "16px Arial";
          canvasCtx.fillStyle = "red";
          canvasCtx.fillText(`Wrist: (${wrist.x.toFixed(2)}, ${wrist.y.toFixed(2)})`, 10, 90);
        }

        // Draw exercise phase indicator
        const armHeight = shoulder ? shoulder.y - wrist.y : 0;
        const armHeightPercent = Math.max(0, Math.min(1, (armHeight + 0.2) / 0.4));
        
        let phase = 'rest';
        if (armHeightPercent >= 0.1 && armHeightPercent < 0.7) phase = 'raising';
        else if (armHeightPercent >= 0.7 && armHeightPercent < 0.9) phase = 'raised';
        else if (armHeightPercent >= 0.9) phase = 'lowering';

        canvasCtx.font = "20px Arial";
        canvasCtx.fillStyle = phase === 'raised' ? "green" : phase === 'raising' ? "orange" : "gray";
        canvasCtx.fillText(`Phase: ${phase.toUpperCase()}`, 10, 120);
        canvasCtx.fillText(`Height: ${Math.round(armHeightPercent * 100)}%`, 10, 145);
      }

      canvasCtx.restore();
    }
  }, [poseResults]);

  return (
    <div className="relative w-full max-w-4xl">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        muted
        style={{ 
          position: 'absolute', 
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%', 
          opacity: 0, 
          pointerEvents: 'none',
          zIndex: -1
        }}
      />
      
      <canvas ref={canvasRef} width={1280} height={720} className="w-full h-auto rounded-lg" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing MediaPipe...</p>
          </div>
        </div>
      )}
      
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