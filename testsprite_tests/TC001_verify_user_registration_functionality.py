import requests
import uuid

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = f"{BASE_URL}/api/auth/register"
DELETE_USER_ENDPOINT = f"{BASE_URL}/api/admin/users"  # No delete user endpoint specified in PRD, so no direct delete

def verify_user_registration_functionality():
    # Generate unique email to avoid conflicts
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassw0rd!"

    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": unique_email,
        "password": password
    }

    try:
        response = requests.post(REGISTER_ENDPOINT, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request to register user failed: {e}"

    assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response structure and content
    assert isinstance(data, dict), "Response JSON is not an object"
    assert data.get("success") is True, "Registration success flag is not True"
    token = data.get("token") or data.get("accessToken")
    assert token and isinstance(token, str) and len(token) > 0, "JWT token missing or invalid"
    user = data.get("user")
    assert isinstance(user, dict), "User object missing or invalid"
    assert isinstance(user.get("id"), int), "User id missing or not integer"
    assert user.get("email") == unique_email, "User email in response does not match registration email"
    assert isinstance(user.get("isAdmin"), bool), "User isAdmin flag missing or not boolean"

    # No delete user endpoint provided in PRD, so cannot clean up created user

verify_user_registration_functionality()