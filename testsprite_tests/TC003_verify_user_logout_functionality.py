import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_user_logout_functionality():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
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
        assert "accessToken" in reg_data, "accessToken missing in registration response"

        # Login with the registered user
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        login_resp = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert login_data.get("success") is True, "Login success flag not True"
        access_token = login_data.get("accessToken")
        assert access_token, "accessToken missing in login response"

        auth_headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # Logout the user
        logout_resp = requests.post(logout_url, headers=auth_headers, timeout=TIMEOUT)
        assert logout_resp.status_code == 200, f"Logout failed with status {logout_resp.status_code}"
        logout_data = logout_resp.json()
        assert logout_data.get("success") is True, "Logout success flag not True"

    finally:
        # Cleanup: No explicit delete user endpoint provided in PRD, so no deletion step.

        pass

verify_user_logout_functionality()