import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_get_user_location_and_local_dealers():
    url = f"{BASE_URL}/api/location"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to /api/location failed: {e}"

    data = response.json()

    # Validate top-level keys
    assert "location" in data, "Response missing 'location' key"
    assert "localDealers" in data, "Response missing 'localDealers' key"

    location = data["location"]
    local_dealers = data["localDealers"]

    # Validate location fields
    expected_location_fields = ["country", "countryCode", "region", "currency", "timeZone"]
    for field in expected_location_fields:
        assert field in location, f"Location missing field '{field}'"
        assert isinstance(location[field], str), f"Location field '{field}' should be a string"

    # 'city' may be missing, so check if present and type
    if "city" in location:
        assert isinstance(location["city"], str), "Location field 'city' should be a string"

    # Validate localDealers is a list
    assert isinstance(local_dealers, list), "'localDealers' should be a list"

    # Validate each dealer's fields and types
    expected_dealer_fields = {
        "name": str,
        "url": str,
        "country": str,
        "region": str,
        "searchUrlPattern": str,
        "currency": str,
        "priority": int
    }
    for dealer in local_dealers:
        assert isinstance(dealer, dict), "Each dealer should be a dictionary"
        for field, field_type in expected_dealer_fields.items():
            assert field in dealer, f"Dealer missing field '{field}'"
            assert isinstance(dealer[field], field_type), f"Dealer field '{field}' should be of type {field_type.__name__}"

test_verify_get_user_location_and_local_dealers()