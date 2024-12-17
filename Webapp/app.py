from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np
import json
import os


app = Flask(__name__)

# Load model and preprocessing components
model = joblib.load("model/best_model.joblib")
label_encoders = joblib.load("model/label_encoders.joblib")
scaler = joblib.load("model/scaler.joblib")
feature_names = joblib.load("model/feature_names.joblib")
categorical_cols = joblib.load("model/categorical_cols.joblib")

# Extract and save form options
options = {}
for field, encoder in label_encoders.items():
    options[field] = sorted(encoder.classes_.tolist())

# Ensure the directory exists
os.makedirs("static/js", exist_ok=True)

# Save options to JSON file
with open("static/js/form_options.json", "w") as f:
    json.dump(options, f, indent=2)

# Load the data once when the application starts
df = pd.read_csv("data/merged_df.csv")


def preprocess_for_prediction(data):
    """Preprocess new data for prediction using the saved model."""
    df = pd.DataFrame([data])

    # Apply label encoding
    for col in categorical_cols:
        if col in df.columns:
            df[col] = label_encoders[col].transform(df[col])

    # Convert lease_commence_date
    if "lease_commence_date" in df.columns:
        df["lease_commence_date"] = (
            pd.to_datetime(df["lease_commence_date"]).astype(np.int64) // 10**9
        )

    # Ensure columns are in correct order
    df = df[feature_names]

    # Apply scaling
    processed_data = scaler.transform(df)

    return processed_data


@app.route("/")
def home():
    return render_template("form.html", active_page="calculate")


@app.route("/browse")
def browse():
    return render_template("browse.html", active_page="browse")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        # Create a dictionary with all required features
        input_data = {
            "town": data["town"],
            "flat_type": data["flat_type"],
            "storey_range": data["storey_range"],
            "floor_area_sqm": float(data["floor_area_sqm"]),
            "flat_model": data["flat_model"],
            "lease_commence_date": data["lease_commence_date"],
            "latitude": float(data["latitude"]),
            "longitude": float(data["longitude"]),
            "street_name": data["street_name"],
            "nearest_mrt_station": data["nearest_mrt_station"],
            "nearest_mrt_distance_km": float(data["nearest_mrt_distance_km"]),
            "nearest_mall": data["nearest_mall"],
            "nearest_mall_distance_km": float(data["nearest_mall_distance_km"]),
            "min_dist_to_cbd": float(data["min_dist_to_cbd"]),
            "remaining_year": int(data["remaining_year"]),
        }

        # Preprocess the data
        processed_data = preprocess_for_prediction(input_data)

        # Make prediction
        prediction = model.predict(processed_data)[0]

        return jsonify({"prediction": f"${prediction:,.2f}", "success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False})


@app.route("/get_random_properties")
def get_random_properties():
    # Select 50 random properties
    sample = df.sample(n=50)

    # Convert to dictionary format
    properties = sample.to_dict("records")

    return jsonify(properties)


if __name__ == "__main__":
    app.run(debug=True)
