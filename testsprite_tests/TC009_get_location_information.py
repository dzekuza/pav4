import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_location_information():
    url = f"{BASE_URL}/api/location"
    try:
        response = requests.get(url, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to get location information failed: {e}"

    data = response.json()
    # Validate that the response contains expected geolocation fields
    assert isinstance(data, dict), "Response is not a JSON object"
    # Common geolocation fields might include country, region, city, lat, lon etc.
    # Since PRD does not specify exact fields, check for at least one key
    assert len(data) > 0, "Location information is empty"
    # Optionally check for country field if present
    if "country" in data:
        assert isinstance(data["country"], str) and data["country"], "Country field is invalid"
    # Additional checks can be added if more schema details are known

test_get_location_information()