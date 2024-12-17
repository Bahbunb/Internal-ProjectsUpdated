import json
import requests
import time


def get_coordinates(location):
    """Get coordinates from OneMap API"""
    url = f"https://www.onemap.gov.sg/api/common/elastic/search?searchVal={location}&returnGeom=Y&getAddrDetails=Y&pageNum=1"

    try:
        response = requests.get(url)
        data = response.json()

        if data["found"] > 0:
            result = data["results"][0]
            return {
                "latitude": float(result["LATITUDE"]),
                "longitude": float(result["LONGITUDE"]),
            }
    except Exception as e:
        print(f"Error getting coordinates for {location}: {str(e)}")

    return None


def update_coordinates():
    # Initialize coordinates dictionary
    coordinates = {"mrt_stations": {}, "malls": {}}

    # Read form options
    with open("static/js/form_options.json", "r") as f:
        form_options = json.load(f)

    # Process MRT stations
    if "nearest_mrt_station" in form_options:
        print("Processing MRT stations...")
        for station in form_options["nearest_mrt_station"]:
            print(f"Getting coordinates for MRT station: {station}")
            coords = get_coordinates(f"{station} MRT Station")
            if coords:
                coordinates["mrt_stations"][station] = coords
            else:
                print(f"Warning: Could not get coordinates for MRT station: {station}")
            time.sleep(1)  # Rate limiting

    # Process malls
    if "nearest_mall" in form_options:
        print("Processing malls...")
        for mall in form_options["nearest_mall"]:
            print(f"Getting coordinates for mall: {mall}")
            coords = get_coordinates(mall)
            if coords:
                coordinates["malls"][mall] = coords
            else:
                print(f"Warning: Could not get coordinates for mall: {mall}")
            time.sleep(1)  # Rate limiting

    # Sort the dictionaries by key
    coordinates["mrt_stations"] = dict(sorted(coordinates["mrt_stations"].items()))
    coordinates["malls"] = dict(sorted(coordinates["malls"].items()))

    # Save updated coordinates
    with open("static/js/coordinates.json", "w") as f:
        json.dump(coordinates, f, indent=2)

    print("Coordinates file has been updated!")


if __name__ == "__main__":
    update_coordinates()
