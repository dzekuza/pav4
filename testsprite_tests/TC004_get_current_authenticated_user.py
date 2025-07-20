import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_current_authenticated_user():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    me_url = f"{BASE_URL}/api/auth/me"
    logout_url = f"{BASE_URL}/api/auth/logout"

    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPass123!"

    headers = {"Content-Type": "application/json"}

    # Register user
    register_payload = {
        "email": test_email,
        "password": test_password
    }
    try:
        reg_resp = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 201 or reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"

        # Login user
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        login_resp = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert "accessToken" in login_data or "token" in login_data, "No accessToken or token found in login response"
        token = login_data.get("accessToken") or login_data.get("token")
        auth_headers = {
            "Authorization": f"Bearer {token}"
        }

        # Get current authenticated user with valid token
        me_resp = requests.get(me_url, headers=auth_headers, timeout=TIMEOUT)
        assert me_resp.status_code == 200, f"Get current user failed: {me_resp.text}"
        me_data = me_resp.json()
        assert "email" in me_data, "User email not in response"
        assert me_data["email"].lower() == test_email.lower(), "Returned user email does not match"

        # Get current authenticated user with invalid token
        invalid_headers = {
            "Authorization": "Bearer invalidtoken123"
        }
        invalid_resp = requests.get(me_url, headers=invalid_headers, timeout=TIMEOUT)
        assert invalid_resp.status_code == 401 or invalid_resp.status_code == 403, "Unauthorized access not properly handled"

        # Get current authenticated user with no token
        no_auth_resp = requests.get(me_url, timeout=TIMEOUT)
        assert no_auth_resp.status_code == 401 or no_auth_resp.status_code == 403, "Unauthorized access without token not properly handled"

    finally:
        # Logout user to invalidate token/session
        try:
            if 'auth_headers' in locals():
                requests.post(logout_url, headers=auth_headers, timeout=TIMEOUT)
        except Exception:
            pass

test_get_current_authenticated_user()
