import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_user_login_functionality():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    headers = {"Content-Type": "application/json"}

    # Generate unique email for registration
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPassword123!"

    user_data = {
        "email": unique_email,
        "password": password
    }

    # Register user first to ensure user exists
    try:
        reg_resp = requests.post(register_url, json=user_data, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"Registration failed with status {reg_resp.status_code}"
        reg_json = reg_resp.json()
        assert reg_json.get("success") is True, "Registration response success flag is not True"
        assert "user" in reg_json, "Registration response missing user info"
        assert reg_json["user"]["email"] == unique_email, "Registered user email mismatch"
    except Exception as e:
        raise AssertionError(f"User registration failed: {e}")

    # Now test login with the registered user credentials
    try:
        login_resp = requests.post(login_url, json=user_data, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        assert login_json.get("success") is True, "Login response success flag is not True"
        # Validate presence of JWT tokens
        assert "token" in login_json and isinstance(login_json["token"], str) and login_json["token"], "Missing or invalid token in login response"
        assert "accessToken" in login_json and isinstance(login_json["accessToken"], str) and login_json["accessToken"], "Missing or invalid accessToken in login response"
        # Validate user info
        user_info = login_json.get("user")
        assert user_info is not None, "Login response missing user info"
        assert user_info.get("email") == unique_email, "Logged in user email mismatch"
        assert isinstance(user_info.get("id"), int), "User id is missing or not an integer"
        assert isinstance(user_info.get("isAdmin"), bool), "User isAdmin flag missing or not boolean"
    except Exception as e:
        raise AssertionError(f"User login failed: {e}")

verify_user_login_functionality()