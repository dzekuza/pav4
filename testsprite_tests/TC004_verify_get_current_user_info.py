import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_get_current_user_info():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    me_url = f"{BASE_URL}/api/auth/me"
    logout_url = f"{BASE_URL}/api/auth/logout"

    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPass123!"

    headers = {"Content-Type": "application/json"}

    # Register a new user
    register_payload = {
        "email": test_email,
        "password": test_password
    }

    try:
        reg_resp = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"Registration failed with status {reg_resp.status_code}"
        reg_data = reg_resp.json()
        assert reg_data.get("success") is True, "Registration success flag not True"
        token = reg_data.get("token") or reg_data.get("accessToken")
        assert token, "No token received on registration"
        user = reg_data.get("user")
        assert user, "No user data received on registration"
        assert isinstance(user.get("id"), int), "User id is not int"
        assert user.get("email") == test_email, "User email mismatch on registration"
        assert isinstance(user.get("isAdmin"), bool), "User isAdmin flag missing or not bool"

        # Login with the same user to get fresh token (optional but safer)
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        login_resp = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert login_data.get("success") is True, "Login success flag not True"
        token = login_data.get("token") or login_data.get("accessToken")
        assert token, "No token received on login"
        user = login_data.get("user")
        assert user, "No user data received on login"
        assert isinstance(user.get("id"), int), "User id is not int"
        assert user.get("email") == test_email, "User email mismatch on login"
        assert isinstance(user.get("isAdmin"), bool), "User isAdmin flag missing or not bool"

        auth_headers = {
            "Authorization": f"Bearer {token}"
        }

        # Get current user info
        me_resp = requests.get(me_url, headers=auth_headers, timeout=TIMEOUT)
        assert me_resp.status_code == 200, f"Get current user info failed with status {me_resp.status_code}"
        me_data = me_resp.json()
        user_info = me_data.get("user")
        assert user_info, "No user info in response"
        assert isinstance(user_info.get("id"), int), "User id is not int in current user info"
        assert user_info.get("email") == test_email, "User email mismatch in current user info"
        assert isinstance(user_info.get("isAdmin"), bool), "User isAdmin flag missing or not bool in current user info"

    finally:
        # Logout the user to clean up session if possible
        try:
            if 'token' in locals():
                logout_headers = {
                    "Authorization": f"Bearer {token}"
                }
                requests.post(logout_url, headers=logout_headers, timeout=TIMEOUT)
        except Exception:
            pass

verify_get_current_user_info()