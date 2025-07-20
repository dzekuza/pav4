import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_user_logout_functionality():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    logout_url = f"{BASE_URL}/api/auth/logout"

    # Generate unique email for registration
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPassword123!"

    headers = {"Content-Type": "application/json"}

    # Register a new user
    register_payload = {
        "email": unique_email,
        "password": password
    }
    try:
        reg_resp = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"Registration failed with status {reg_resp.status_code}"
        reg_data = reg_resp.json()
        assert reg_data.get("success") is True, "Registration success flag not True"
        assert "accessToken" in reg_data, "accessToken missing in registration response"
    except Exception as e:
        raise AssertionError(f"User registration failed: {e}")

    # Login with the registered user
    login_payload = {
        "email": unique_email,
        "password": password
    }
    try:
        login_resp = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert login_data.get("success") is True, "Login success flag not True"
        access_token = login_data.get("accessToken")
        assert access_token, "accessToken missing in login response"
    except Exception as e:
        raise AssertionError(f"User login failed: {e}")

    # Logout the user using the access token
    logout_headers = {
        "Authorization": f"Bearer {access_token}"
    }
    try:
        logout_resp = requests.post(logout_url, headers=logout_headers, timeout=TIMEOUT)
        assert logout_resp.status_code == 200, f"Logout failed with status {logout_resp.status_code}"
        logout_data = logout_resp.json()
        assert logout_data.get("success") is True, "Logout success flag not True"
    except Exception as e:
        raise AssertionError(f"User logout failed: {e}")

verify_user_logout_functionality()