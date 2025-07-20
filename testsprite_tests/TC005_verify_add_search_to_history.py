import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_add_search_to_history():
    # Register a new user
    register_url = f"{BASE_URL}/api/auth/register"
    email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPassword123!"
    register_payload = {
        "email": email,
        "password": password
    }
    try:
        register_resp = requests.post(register_url, json=register_payload, timeout=TIMEOUT)
        assert register_resp.status_code == 201, f"Registration failed: {register_resp.text}"
        register_data = register_resp.json()
        assert register_data.get("success") is True
        access_token = register_data.get("accessToken") or register_data.get("token")
        assert access_token, "No access token received on registration"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Prepare search history entry
        search_history_url = f"{BASE_URL}/api/search-history"
        search_entry = {
            "url": "https://example.com/product/12345",
            "title": "Example Product Title",
            "requestId": str(uuid.uuid4())
        }

        # Add search to history
        add_resp = requests.post(search_history_url, json=search_entry, headers=headers, timeout=TIMEOUT)
        assert add_resp.status_code == 201, f"Failed to add search to history: {add_resp.text}"

        # Optionally, verify the search was added by retrieving history
        get_resp = requests.get(search_history_url, headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Failed to get search history: {get_resp.text}"
        history_data = get_resp.json()
        history = history_data.get("history", [])
        # Check that the added entry is in the history (match by requestId)
        found = any(item.get("requestId") == search_entry["requestId"] and
                    item.get("url") == search_entry["url"] and
                    item.get("title") == search_entry["title"] for item in history)
        assert found, "Added search entry not found in history"

    finally:
        # Logout the user to clean up session if needed
        if 'access_token' in locals():
            logout_url = f"{BASE_URL}/api/auth/logout"
            try:
                requests.post(logout_url, headers={"Authorization": f"Bearer {access_token}"}, timeout=TIMEOUT)
            except Exception:
                pass

test_verify_add_search_to_history()