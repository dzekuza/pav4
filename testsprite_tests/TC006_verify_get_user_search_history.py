import requests
import uuid
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_get_user_search_history():
    # Register a new user
    register_url = f"{BASE_URL}/api/auth/register"
    email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass123!"
    register_payload = {"email": email, "password": password}
    headers = {"Content-Type": "application/json"}

    try:
        reg_resp = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
        reg_data = reg_resp.json()
        assert reg_data.get("success") is True
        token = reg_data.get("token") or reg_data.get("accessToken")
        assert token, "No token received on registration"

        auth_headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Add a search entry to history
        search_history_post_url = f"{BASE_URL}/api/search-history"
        test_url = "https://example.com/product/12345"
        test_title = "Example Product Title"
        test_request_id = str(uuid.uuid4())
        search_payload = {
            "url": test_url,
            "title": test_title,
            "requestId": test_request_id
        }
        post_resp = requests.post(search_history_post_url, json=search_payload, headers=auth_headers, timeout=TIMEOUT)
        assert post_resp.status_code == 201, f"Failed to add search to history: {post_resp.text}"

        # Small delay to ensure timestamp difference if needed
        time.sleep(1)

        # Retrieve user search history
        search_history_get_url = f"{BASE_URL}/api/search-history"
        get_resp = requests.get(search_history_get_url, headers=auth_headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Failed to get search history: {get_resp.text}"
        get_data = get_resp.json()
        history = get_data.get("history")
        assert isinstance(history, list), "History is not a list"

        # Find the added search entry in history
        matched_entries = [entry for entry in history if entry.get("url") == test_url and entry.get("title") == test_title and entry.get("requestId") == test_request_id]
        assert matched_entries, "Added search entry not found in history"

        # Validate timestamp format and presence
        for entry in matched_entries:
            timestamp = entry.get("timestamp")
            assert timestamp and isinstance(timestamp, str), "Timestamp missing or not a string"
            # Optional: further validate timestamp format (ISO 8601)
            # Example: 2025-07-19T12:34:56Z or with timezone offset
            # Basic check for 'T' and ':' presence
            assert "T" in timestamp and ":" in timestamp, f"Timestamp format invalid: {timestamp}"

    finally:
        # Logout user to clean session (optional)
        if 'token' in locals():
            logout_url = f"{BASE_URL}/api/auth/logout"
            try:
                requests.post(logout_url, headers=auth_headers, timeout=TIMEOUT)
            except Exception:
                pass

verify_get_user_search_history()