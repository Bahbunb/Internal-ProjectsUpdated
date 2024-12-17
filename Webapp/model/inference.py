import joblib
import pandas as pd
import numpy as np

model_dir = "Internal-ProjectsUpdated/model/"

# Define categorical columns
categorical_cols = joblib.load("Internal-ProjectsUpdated/model/categorical_cols.joblib")


def preprocess_for_prediction(data):
    """
    Preprocess new data for prediction using the saved model.

    Args:
        data (pd.DataFrame): New data to preprocess
    Returns:
        processed_data: Preprocessed data ready for model prediction
    """
    # Load preprocessing components
    label_encoders = joblib.load(f"{model_dir}label_encoders.joblib")
    scaler = joblib.load(f"{model_dir}scaler.joblib")
    feature_names = joblib.load(f"{model_dir}feature_names.joblib")

    # Apply label encoding
    for col in categorical_cols:
        if col in data.columns:
            data[col] = label_encoders[col].transform(data[col])

    # Convert lease_commence_date
    if "lease_commence_date" in data.columns:
        data["lease_commence_date"] = (
            pd.to_datetime(data["lease_commence_date"]).astype(np.int64) // 10**9
        )

    # Ensure columns are in correct order
    data = data[feature_names]

    # Apply scaling
    processed_data = scaler.transform(data)

    return processed_data


# Example usage for inference

# Load the model and make predictions
model = joblib.load(f"{model_dir}best_model.joblib")

new_data = pd.DataFrame(
    {
        "month": ["2017-01-01"],
        "town": ["ang mo kio"],
        "flat_type": ["2 ROOM"],
        "block_no": ["406"],
        "storey_range": ["11"],
        "floor_area_sqm": [44.0],
        "flat_model": ["Improved"],
        "lease_commence_date": ["1979-01-01"],
        "remaining_lease": ["61 years 04 months"],
        "address": ["406 ANG MO KIO AVE 10"],
        "latitude": [1.36200453938712],
        "longitude": [103.853879910407],
        "street_name": ["ANG MO KIO AVENUE 10"],
        "postal_code": ["560406"],
        "nearest_mrt_station": ["Ang Mo Kio"],
        "nearest_mrt_distance_km": [1.0114327131178416],
        "nearest_mall": ["AMK Hub"],
        "nearest_mall_distance_km": [1.0062107220553191],
        "min_dist_to_cbd": [8.237451185563192],
        "remaining_year": [61],
    }
)
processed_data = preprocess_for_prediction(new_data)
predictions = model.predict(processed_data)

print(predictions)
