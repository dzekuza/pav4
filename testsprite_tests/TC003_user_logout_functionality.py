import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_user_logout_functionality():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    logout_url = f"{BASE_URL}/api/auth/logout"
    me_url = f"{BASE_URL}/api/auth/me"

    # Generate unique email for registration
    unique_email = f"testuser_{uuid.uuid4().hex}@example.com"
    password = "TestPassword123!"

    headers = {"Content-Type": "application/json"}

    # Register user
    register_payload = {
        "email": unique_email,
        "password": password
    }
    try:
        reg_resp = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 201 or reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"

        # Login user
        login_payload = {
            "email": unique_email,
            "password": password
        }
        login_resp = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        token = login_data.get("token") or login_data.get("accessToken")
        assert token, f"No token received on login. Response: {login_data}"

        auth_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Verify user is authenticated by calling /api/auth/me
        me_resp = requests.get(me_url, headers=auth_headers, timeout=TIMEOUT)
        assert me_resp.status_code == 200, f"Authenticated user info retrieval failed: {me_resp.text}"

        # Logout user
        logout_resp = requests.post(logout_url, headers=auth_headers, timeout=TIMEOUT)
        assert logout_resp.status_code == 200 or logout_resp.status_code == 204, f"Logout failed: {logout_resp.text}"

        # After logout, token should be invalidated - verify by calling /api/auth/me again
        me_after_logout_resp = requests.get(me_url, headers=auth_headers, timeout=TIMEOUT)
        # Expect unauthorized (401 or 403) after logout
        assert me_after_logout_resp.status_code in (401, 403), f"Token still valid after logout: {me_after_logout_resp.text}"

    finally:
        # Cleanup: No explicit delete user endpoint provided in PRD, so no deletion step here.
        pass

test_user_logout_functionality()
