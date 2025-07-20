import requests
import uuid

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = "/api/auth/register"
DELETE_USER_ENDPOINT = "/api/admin/users"  # No delete user endpoint specified in PRD, so no direct delete; will skip cleanup.

def verify_user_registration_functionality():
    # Generate unique email to avoid conflicts
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPassword123!"

    url = BASE_URL + REGISTER_ENDPOINT
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": unique_email,
        "password": password
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
        data = response.json()
        assert isinstance(data, dict), "Response is not a JSON object"
        assert data.get("success") is True, "Success flag is not True"
        # Token or accessToken must be present and non-empty string
        token = data.get("token") or data.get("accessToken")
        assert token and isinstance(token, str) and len(token) > 0, "JWT token missing or invalid"
        user = data.get("user")
        assert user and isinstance(user, dict), "User object missing or invalid"
        assert isinstance(user.get("id"), int), "User id missing or not integer"
        assert user.get("email") == unique_email, "User email does not match registration email"
        assert isinstance(user.get("isAdmin"), bool), "User isAdmin flag missing or not boolean"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

verify_user_registration_functionality()