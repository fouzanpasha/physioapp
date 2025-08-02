from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load the trained model
model = joblib.load('model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    if 'landmarks' not in data:
        return jsonify({"error": "No landmarks provided"}), 400

    landmarks = data['landmarks']
    if len(landmarks) != 99:  # 33 keypoints * 3 coordinates
        return jsonify({"error": "Invalid number of landmarks"}), 400

    # Reshape for prediction
    landmarks = np.array(landmarks).reshape(1, -1)
    prediction = model.predict(landmarks)[0]

    return jsonify({"prediction": prediction})

if __name__ == '__main__':
    app.run(debug=True)
