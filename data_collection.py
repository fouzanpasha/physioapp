import cv2
import mediapipe as mp
import numpy as np
import os
import json

mp_pose = mp.solutions.pose

def extract_pose_landmarks(video_path, exercise_type, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    cap = cv2.VideoCapture(video_path)
    with mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Convert the BGR image to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image)

            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                landmark_vector = np.array([[lm.x, lm.y, lm.z] for lm in landmarks]).flatten()
                # Save the landmark vector
                output_file = os.path.join(output_dir, f"{exercise_type}.json")
                with open(output_file, 'a') as f:
                    json.dump(landmark_vector.tolist(), f)
                    f.write('\n')

    cap.release()
    cv2.destroyAllWindows()

# Example usage
# extract_pose_landmarks('path_to_video.mp4', 'bridge', 'output_directory')
