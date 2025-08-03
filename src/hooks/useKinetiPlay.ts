import { useState, useEffect, RefObject } from 'react';

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

  // useEffect is where we put all the side-effect logic, like setting up the camera and AI
  useEffect(() => {
    // A flag to ensure we don't run the cleanup on an uninitialized hook
    let isInitialized = true;
    let cameraStream: MediaStream | null = null;
    let pose: any = null;
    let scriptElement: HTMLScriptElement | null = null;

    const initializePose = async () => {
      try {
        setIsLoading(true);
        setError(null);

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
          if (isInitialized) {
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
    };

    const setupCamera = async (poseInstance: any) => {
      try {
        console.log('Requesting camera permissions...');
        
        // Add a timeout to prevent hanging
        const cameraPromise = navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false,
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Camera request timed out after 10 seconds')), 10000);
        });
        
        cameraStream = await Promise.race([cameraPromise, timeoutPromise]) as MediaStream;
        console.log('✅ Camera access granted, stream:', cameraStream);

        // Wait for video ref to be available with retries
        let retries = 0;
        const maxRetries = 10;
        
        while (!videoRef.current && retries < maxRetries && isInitialized) {
          console.log(`Waiting for video ref... (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (videoRef.current && isInitialized) {
          console.log('Setting video srcObject...');
          videoRef.current.srcObject = cameraStream;
          // When the video is ready, start the main loop
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting pose detection loop...');
            startLoop(poseInstance);
          };
          console.log('Video onloadedmetadata handler set');
        } else {
          console.error('Video ref not available after retries or component unmounted');
          setError("Video element not available - please refresh the page and try again");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setError("Camera permission denied. Please allow camera access and refresh the page.");
          } else if (error.name === 'NotFoundError') {
            setError("No camera found. Please connect a camera and try again.");
          } else if (error.name === 'NotReadableError') {
            setError("Camera is in use by another application. Please close other apps using the camera.");
          } else if (error.message.includes('timed out')) {
            setError("Camera request timed out. Please check if your camera is working and try again.");
          } else {
            setError(`Camera error: ${error.message}`);
          }
        } else {
          setError("Failed to access webcam. Please check camera permissions.");
        }
        setIsLoading(false);
      }
    };

    const startLoop = (poseInstance: any) => {
      const processFrame = async () => {
        if (videoRef.current && isInitialized) {
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

    // Add a small delay before starting the initialization to ensure DOM elements are ready
    setTimeout(() => {
      initializePose();
    }, 100); // 100ms delay

    // 3. --- Cleanup Function ---
    // This function is returned from useEffect and runs when the component unmounts
    return () => {
      console.log('Cleaning up MediaPipe...');
      isInitialized = false;
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
    };
  }, [videoRef, canvasRef]); 

  // The hook returns the latest results for any component to use
  return { results, error, isLoading };
}; 