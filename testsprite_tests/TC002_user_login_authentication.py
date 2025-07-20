import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_user_login_authentication():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    headers = {"Content-Type": "application/json"}

    # Generate unique email for registration to avoid conflicts
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPass123!"

    # Register the user first
    register_payload = {
        "email": test_email,
        "password": test_password
    }

    try:
        reg_resp = requests.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 201 or reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"

        # Test login with valid credentials
        login_payload_valid = {
            "email": test_email,
            "password": test_password
        }
        login_resp_valid = requests.post(login_url, json=login_payload_valid, headers=headers, timeout=TIMEOUT)
        assert login_resp_valid.status_code == 200, f"Valid login failed: {login_resp_valid.text}"
        login_data = login_resp_valid.json()
        assert "token" in login_data, "No token found in valid login response"

        # Test login with invalid password
        login_payload_invalid_password = {
            "email": test_email,
            "password": "WrongPassword!"
        }
        login_resp_invalid_password = requests.post(login_url, json=login_payload_invalid_password, headers=headers, timeout=TIMEOUT)
        assert login_resp_invalid_password.status_code == 401 or login_resp_invalid_password.status_code == 400, \
            f"Invalid password login did not fail as expected: {login_resp_invalid_password.text}"

        # Test login with invalid email
        login_payload_invalid_email = {
            "email": "nonexistent_" + test_email,
            "password": test_password
        }
        login_resp_invalid_email = requests.post(login_url, json=login_payload_invalid_email, headers=headers, timeout=TIMEOUT)
        assert login_resp_invalid_email.status_code == 401 or login_resp_invalid_email.status_code == 400, \
            f"Invalid email login did not fail as expected: {login_resp_invalid_email.text}"

    finally:
        pass

test_user_login_authentication()
