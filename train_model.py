import numpy as np
import json
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

def load_data(output_dir):
    X = []
    y = []
    for label in ['good', 'mediocre', 'bad']:
        file_path = os.path.join(output_dir, f"{label}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                for line in f:
                    landmark_vector = json.loads(line)
                    X.append(landmark_vector)
                    y.append(label)
    return np.array(X), np.array(y)

def train_model(output_dir):
    X, y = load_data(output_dir)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier()
    model.fit(X_train, y_train)

    # Save the model
    joblib.dump(model, 'model.pkl')

    # Print accuracy
    accuracy = model.score(X_test, y_test)
    print(f'Model accuracy: {accuracy:.2f}')

# Example usage
# train_model('output_directory')
