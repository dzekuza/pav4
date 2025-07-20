import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_admin_get_all_users():
    # Test data for admin user registration and login
    admin_email = f"admin_{uuid.uuid4().hex[:8]}@example.com"
    admin_password = "AdminPass123!"

    headers = {"Content-Type": "application/json"}

    # Register a new admin user
    register_payload = {
        "email": admin_email,
        "password": admin_password
    }

    # Login payload
    login_payload = {
        "email": admin_email,
        "password": admin_password
    }

    # Step 1: Register user
    try:
        reg_resp = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=register_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert reg_resp.status_code in (200, 201, 409), f"Unexpected registration status code: {reg_resp.status_code}"

        # Step 2: Login user to get token
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status code {login_resp.status_code}"
        login_data = login_resp.json()
        assert "token" in login_data, "Login response missing token"

        token = login_data["token"]
        auth_headers = {
            "Authorization": f"Bearer {token}"
        }

        # Step 3: Attempt to get all users without auth - expect 401 or 403
        no_auth_resp = requests.get(
            f"{BASE_URL}/api/admin/users",
            timeout=TIMEOUT
        )
        assert no_auth_resp.status_code in (401, 403), f"Expected unauthorized status without token, got {no_auth_resp.status_code}"

        # Step 4: Get all users with auth
        users_resp = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert users_resp.status_code == 200, f"Failed to get users with status {users_resp.status_code}"
        users_data = users_resp.json()
        assert isinstance(users_data, list), "Users response is not a list"

        # Validate user data completeness (check keys in first user if exists)
        if users_data:
            user = users_data[0]
            assert "email" in user, "User object missing 'email'"
            assert "id" in user or "_id" in user, "User object missing 'id'"

    finally:
        # Cleanup: logout user if token exists
        if 'token' in locals():
            try:
                requests.post(
                    f"{BASE_URL}/api/auth/logout",
                    headers=auth_headers,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_admin_get_all_users()
