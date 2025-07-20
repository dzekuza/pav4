import requests
import uuid

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = "/api/auth/register"
TIMEOUT = 30

def test_register_new_user():
    # Valid user registration data
    valid_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    valid_password = "StrongPassw0rd!"

    headers = {
        "Content-Type": "application/json"
    }

    # Test successful registration
    payload = {
        "email": valid_email,
        "password": valid_password
    }
    try:
        response = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json=payload,
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 201 or response.status_code == 200, f"Expected 200 or 201, got {response.status_code}"
    json_resp = response.json()
    assert "email" in json_resp or "id" in json_resp or "user" in json_resp, "Response does not contain expected user info"

    # Test registration with invalid email
    invalid_email_payload = {
        "email": "invalid-email-format",
        "password": valid_password
    }
    try:
        response_invalid_email = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json=invalid_email_payload,
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Relax assertion: invalid email might be accepted or rejected depending on backend validation
    assert response_invalid_email.status_code != 201 and response_invalid_email.status_code != 200, "Invalid email should not succeed with 200 or 201"

    # Test registration with missing password
    missing_password_payload = {
        "email": f"nopassword_{uuid.uuid4().hex[:8]}@example.com"
    }
    try:
        response_missing_password = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json=missing_password_payload,
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response_missing_password.status_code >= 400, "Missing password should cause client error"

    # Test registration with empty payload
    try:
        response_empty = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json={},
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response_empty.status_code >= 400, "Empty payload should cause client error"

test_register_new_user()
