import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_retrieve_user_search_history():
    # Test user credentials
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPass123!"

    headers = {"Content-Type": "application/json"}

    # Register new user
    register_payload = {
        "email": test_email,
        "password": test_password
    }
    register_resp = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload, headers=headers, timeout=TIMEOUT)
    assert register_resp.status_code == 201 or register_resp.status_code == 200, f"Registration failed: {register_resp.text}"

    try:
        # Login user to get token
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        token = login_data.get("token") or login_data.get("accessToken") or login_data.get("access_token")
        assert token, "No token received on login"

        auth_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Add a search entry to history to ensure there is data
        search_entry = {
            "url": "https://example.com/product/123",
            "title": "Example Product Title",
            "requestId": str(uuid.uuid4())
        }
        add_search_resp = requests.post(f"{BASE_URL}/api/search-history", json=search_entry, headers=auth_headers, timeout=TIMEOUT)
        assert add_search_resp.status_code == 201 or add_search_resp.status_code == 200, f"Adding search history failed: {add_search_resp.text}"

        # Retrieve user search history
        history_resp = requests.get(f"{BASE_URL}/api/search-history", headers=auth_headers, timeout=TIMEOUT)
        assert history_resp.status_code == 200, f"Retrieving search history failed: {history_resp.text}"
        history_data = history_resp.json()
        assert isinstance(history_data, list), "Search history response is not a list"

        # Validate that the added search entry is in the history
        found = False
        for entry in history_data:
            if (entry.get("url") == search_entry["url"] and
                entry.get("title") == search_entry["title"] and
                entry.get("requestId") == search_entry["requestId"]):
                found = True
                break
        assert found, "Added search entry not found in search history"

        # Test access secured: try to access without token
        no_auth_resp = requests.get(f"{BASE_URL}/api/search-history", timeout=TIMEOUT)
        assert no_auth_resp.status_code == 401 or no_auth_resp.status_code == 403, "Unauthorized access to search history allowed"

    finally:
        # Logout user to invalidate token/session
        if 'token' in locals():
            requests.post(f"{BASE_URL}/api/auth/logout", headers=auth_headers, timeout=TIMEOUT)