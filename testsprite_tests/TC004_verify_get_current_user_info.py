import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_get_current_user_info():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    me_url = f"{BASE_URL}/api/auth/me"
    logout_url = f"{BASE_URL}/api/auth/logout"

    # Generate unique email for registration
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPassword123!"

    headers = {"Content-Type": "application/json"}

    # Register user
    register_payload = {
        "email": unique_email,
        "password": password
    }
    try:
        reg_resp = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
        reg_data = reg_resp.json()
        assert reg_data.get("success") is True
        assert "accessToken" in reg_data
        assert "user" in reg_data
        user_registered = reg_data["user"]
        assert isinstance(user_registered.get("id"), int)
        assert user_registered.get("email") == unique_email
        assert isinstance(user_registered.get("isAdmin"), bool)

        # Login user
        login_payload = {
            "email": unique_email,
            "password": password
        }
        login_resp = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("success") is True
        token = login_data.get("accessToken")
        assert token is not None and isinstance(token, str)
        user_logged_in = login_data.get("user")
        assert user_logged_in.get("email") == unique_email
        assert isinstance(user_logged_in.get("id"), int)
        assert isinstance(user_logged_in.get("isAdmin"), bool)

        auth_headers = {
            "Authorization": f"Bearer {token}"
        }

        # Get current user info
        me_resp = requests.get(me_url, headers=auth_headers, timeout=TIMEOUT)
        assert me_resp.status_code == 200, f"Get current user info failed: {me_resp.text}"
        me_data = me_resp.json()
        assert "user" in me_data
        user_info = me_data["user"]
        assert isinstance(user_info.get("id"), int)
        assert user_info.get("email") == unique_email
        assert isinstance(user_info.get("isAdmin"), bool)

    finally:
        # Logout user if token exists
        if 'token' in locals():
            try:
                requests.post(logout_url, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
            except Exception:
                pass

test_verify_get_current_user_info()