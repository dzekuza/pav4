import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_user_login_functionality():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    logout_url = f"{BASE_URL}/api/auth/logout"

    # Generate unique email for registration
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass123!"

    headers = {"Content-Type": "application/json"}

    # Register a new user to ensure user exists for login test
    register_payload = {
        "email": unique_email,
        "password": password
    }

    user_id = None
    token = None

    try:
        reg_resp = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"Registration failed with status {reg_resp.status_code}"
        reg_json = reg_resp.json()
        assert reg_json.get("success") is True, "Registration response success flag is not True"
        assert "token" in reg_json and isinstance(reg_json["token"], str) and reg_json["token"], "No token in registration response"
        assert "user" in reg_json and isinstance(reg_json["user"], dict), "No user object in registration response"
        user = reg_json["user"]
        assert "id" in user and isinstance(user["id"], int), "User id missing or invalid in registration response"
        assert user.get("email") == unique_email, "User email mismatch in registration response"
        user_id = user["id"]

        # Now test login with the registered user credentials
        login_payload = {
            "email": unique_email,
            "password": password
        }
        login_resp = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        assert login_json.get("success") is True, "Login response success flag is not True"
        assert "token" in login_json and isinstance(login_json["token"], str) and login_json["token"], "No token in login response"
        assert "accessToken" in login_json and isinstance(login_json["accessToken"], str) and login_json["accessToken"], "No accessToken in login response"
        assert "user" in login_json and isinstance(login_json["user"], dict), "No user object in login response"
        login_user = login_json["user"]
        assert "id" in login_user and login_user["id"] == user_id, "User id mismatch in login response"
        assert login_user.get("email") == unique_email, "User email mismatch in login response"
        assert "isAdmin" in login_user and isinstance(login_user["isAdmin"], bool), "isAdmin missing or invalid in login response"

        token = login_json["token"]

    finally:
        # Cleanup: logout the user if token is available
        if token:
            logout_headers = {"Authorization": f"Bearer {token}"}
            try:
                logout_resp = requests.post(logout_url, headers=logout_headers, timeout=TIMEOUT)
                assert logout_resp.status_code == 200, f"Logout failed with status {logout_resp.status_code}"
                logout_json = logout_resp.json()
                assert logout_json.get("success") is True, "Logout response success flag is not True"
            except Exception:
                pass

verify_user_login_functionality()