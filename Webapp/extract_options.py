import joblib
import json

# Load the label encoders
label_encoders = joblib.load("model/label_encoders.joblib")

# Dictionary to store options for each categorical field
options = {}

# Extract unique values from each label encoder
for field, encoder in label_encoders.items():
    options[field] = sorted(encoder.classes_.tolist())

# Print the options in a format that can be used in HTML
print("Options for frontend fields:")
print(json.dumps(options, indent=2))

# Save the options to a JSON file
with open("static/js/form_options.json", "w") as f:
    json.dumps(options, f, indent=2)

print("\nOptions have been saved to 'static/js/form_options.json'")
