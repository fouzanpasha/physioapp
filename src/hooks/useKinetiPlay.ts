import { useState, useEffect, RefObject, useCallback } from 'react';

// TypeScript declaration for global MediaPipe
declare global {
  interface Window {
    Pose: any;
  }
}

// This is the "API" of our hook. It takes refs to video/canvas elements.
// It returns the latest results from MediaPipe.
export const useKinetiPlay = (
  videoRef: RefObject<HTMLVideoElement>,
  canvasRef: RefObject<HTMLCanvasElement>
) => {
  // We use useState to store the latest results from the AI
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // A flag to ensure we don't run the cleanup on an uninitialized hook
  let isInitializedFlag = true;
  let cameraStream: MediaStream | null = null;
  let pose: any = null;
  let scriptElement: HTMLScriptElement | null = null;

  const initializePose = useCallback(async () => {
    if (isInitialized) {
      console.log('MediaPipe already initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('useKinetiPlay hook started');
      console.log('Video ref at start:', videoRef.current);
      console.log('Canvas ref at start:', canvasRef.current);

      console.log('Initializing MediaPipe Pose...');

      // Load MediaPipe from CDN if not already loaded
      if (!window.Pose) {
        console.log('Loading MediaPipe from CDN...');
        scriptElement = document.createElement('script');
        scriptElement.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
        scriptElement.async = true;
        
        await new Promise((resolve, reject) => {
          scriptElement!.onload = () => {
            console.log('CDN script loaded, waiting for Pose to be available...');
            // Add a small delay to ensure Pose is available
            setTimeout(() => {
              if (window.Pose) {
                console.log('Pose is now available');
                resolve(true);
              } else {
                reject(new Error('Pose not available after script load'));
              }
            }, 1000);
          };
          scriptElement!.onerror = () => reject(new Error('Failed to load MediaPipe from CDN'));
          document.head.appendChild(scriptElement!);
        });
      } else {
        console.log('MediaPipe already loaded');
      }

      // 1. --- Initialize the AI Model ---
      pose = new window.Pose({
        locateFile: (file: string) => {
          console.log('Loading MediaPipe file:', file);
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
        },
      });

      console.log('Setting MediaPipe options...');
      pose.setOptions({
        modelComplexity: 1, // Use 1 for a good balance of performance/accuracy
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // Set the callback function that will receive the AI results
      pose.onResults((newResults: any) => {
        if (isInitializedFlag) {
          console.log('MediaPipe results received:', newResults.poseLandmarks ? 'Landmarks detected' : 'No landmarks');
          setResults(newResults);
          setIsLoading(false);
        }
      });

      console.log('Setting up camera...');
      // 2. --- Setup the Camera and Main Loop ---
      await setupCamera(pose);

    } catch (err) {
      console.error("Error initializing MediaPipe:", err);
      setError(err instanceof Error ? err.message : 'Failed to initialize MediaPipe');
      setIsLoading(false);
    }
  }, [isInitialized, videoRef, canvasRef]);

  const setupCamera = async (poseInstance: any) => {
    try {
      console.log('Camera stream already set up by component, starting pose detection loop...');
      
      // Video ref should be available and have a stream since component handles it
      if (videoRef.current && isInitializedFlag) {
        // Start the main loop immediately since video is already ready
        startLoop(poseInstance);
        setIsInitialized(true);
      } else {
        console.error('Video ref not available - this should not happen');
        setError("Video element not available - please refresh the page and try again");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error starting pose detection:", error);
      setError("Failed to start pose detection");
      setIsLoading(false);
    }
  };

  const startLoop = (poseInstance: any) => {
    const processFrame = async () => {
      if (videoRef.current && isInitializedFlag) {
        try {
          await poseInstance.send({ image: videoRef.current });
          // requestAnimationFrame is the best way to create a performant loop
          requestAnimationFrame(processFrame);
        } catch (err) {
          console.error("Error processing frame:", err);
          setError("Error processing video frame");
        }
      }
    };
    processFrame();
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('Cleaning up MediaPipe...');
    isInitializedFlag = false;
    setIsInitialized(false);
    // Stop the AI processing
    if (pose) {
      pose.close();
    }
    // Stop the camera tracks to turn off the webcam light
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    // Remove the script element if we added it
    if (scriptElement && document.head.contains(scriptElement)) {
      document.head.removeChild(scriptElement);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // The hook returns the latest results and initialization function
  return { 
    results, 
    error, 
    isLoading, 
    isInitialized,
    initializePose,
    cleanup
  };
}; 