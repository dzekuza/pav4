import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_add_search_to_history():
    # Register a new user for authentication
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    search_history_url = f"{BASE_URL}/api/search-history"
    logout_url = f"{BASE_URL}/api/auth/logout"

    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPass123!"

    headers = {"Content-Type": "application/json"}

    # Register user
    try:
        reg_resp = requests.post(
            register_url,
            json={"email": test_email, "password": test_password},
            headers=headers,
            timeout=TIMEOUT,
        )
        assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
    except Exception as e:
        raise AssertionError(f"User registration request failed: {e}")

    # Login user to get token
    try:
        login_resp = requests.post(
            login_url,
            json={"email": test_email, "password": test_password},
            headers=headers,
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("success") is True, "Login success flag false"
        token = login_data.get("token") or login_data.get("accessToken")
        assert token, "No token received on login"
    except Exception as e:
        raise AssertionError(f"User login request failed: {e}")

    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # Prepare search entry data
    search_entry = {
        "url": "https://example.com/product/123",
        "title": "Example Product Title",
        "requestId": str(uuid.uuid4())
    }

    # Add search to history
    try:
        add_resp = requests.post(
            search_history_url,
            json=search_entry,
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        assert add_resp.status_code == 201, f"Add search to history failed: {add_resp.text}"
    except Exception as e:
        raise AssertionError(f"Add search to history request failed: {e}")

    # Logout user to clean up session
    try:
        logout_resp = requests.post(logout_url, headers=auth_headers, timeout=TIMEOUT)
        assert logout_resp.status_code == 200, f"Logout failed: {logout_resp.text}"
        logout_data = logout_resp.json()
        assert logout_data.get("success") is True, "Logout success flag false"
    except Exception as e:
        raise AssertionError(f"Logout request failed: {e}")

test_verify_add_search_to_history()