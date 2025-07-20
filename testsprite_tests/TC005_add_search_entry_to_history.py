import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_add_search_entry_to_history():
    # Register a new user
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    search_history_url = f"{BASE_URL}/api/search-history"
    logout_url = f"{BASE_URL}/api/auth/logout"

    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPass123!"

    headers = {"Content-Type": "application/json"}

    # Register user
    register_payload = {
        "email": test_email,
        "password": test_password
    }
    r = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
    assert r.status_code == 201 or r.status_code == 200, f"Registration failed: {r.text}"

    try:
        # Login user
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        r = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Login failed: {r.text}"
        token = r.json().get("token")
        assert token, "No token received on login"

        auth_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Add search entry to history
        search_entry = {
            "url": "https://example.com/product/12345",
            "title": "Example Product Title",
            "requestId": str(uuid.uuid4())
        }
        r = requests.post(search_history_url, json=search_entry, headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 201 or r.status_code == 200, f"Adding search entry failed: {r.text}"

        # Verify the entry is saved and associated with the user by retrieving search history
        r = requests.get(search_history_url, headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Fetching search history failed: {r.text}"
        history = r.json()
        assert isinstance(history, list), "Search history response is not a list"
        # Check that the added entry is in the history
        found = any(
            entry.get("url") == search_entry["url"] and
            entry.get("title") == search_entry["title"] and
            entry.get("requestId") == search_entry["requestId"]
            for entry in history
        )
        assert found, "Added search entry not found in user search history"

    finally:
        # Logout user
        if 'token' in locals():
            requests.post(logout_url, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)

test_add_search_entry_to_history()