import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_admin_get_all_users_access_control():
    # Helper function to register a user
    def register_user(email, password):
        url = f"{BASE_URL}/api/auth/register"
        payload = {"email": email, "password": password}
        resp = requests.post(url, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    # Helper function to login a user
    def login_user(email, password):
        url = f"{BASE_URL}/api/auth/login"
        payload = {"email": email, "password": password}
        resp = requests.post(url, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    # Helper function to delete user if API supported (not in PRD, so skip)
    # Instead, just rely on unique emails for test isolation

    # Create admin user
    admin_email = f"admin_{uuid.uuid4().hex}@example.com"
    admin_password = "AdminPass123!"
    admin_token = None

    # Create non-admin user
    user_email = f"user_{uuid.uuid4().hex}@example.com"
    user_password = "UserPass123!"
    user_token = None

    try:
        # Register admin user
        admin_reg = register_user(admin_email, admin_password)
        assert admin_reg.get("success") is True
        # If the registered user is not admin by default, we need to login and check
        # But PRD does not specify admin creation, assume first user is admin or admin flag is false
        # So login admin user to get token and isAdmin flag
        admin_login = login_user(admin_email, admin_password)
        assert admin_login.get("success") is True
        admin_token = admin_login.get("accessToken") or admin_login.get("token")
        assert admin_token is not None
        assert isinstance(admin_login.get("user"), dict)
        # We need admin user, so check isAdmin flag
        if not admin_login["user"].get("isAdmin", False):
            # If not admin, we cannot test admin access properly, so skip test with assertion error
            raise AssertionError("Registered admin user does not have admin privileges.")

        # Register non-admin user
        user_reg = register_user(user_email, user_password)
        assert user_reg.get("success") is True
        user_login = login_user(user_email, user_password)
        assert user_login.get("success") is True
        user_token = user_login.get("accessToken") or user_login.get("token")
        assert user_token is not None
        assert isinstance(user_login.get("user"), dict)
        assert user_login["user"].get("isAdmin", False) is False

        # Test admin access to /api/admin/users
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        admin_resp = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_headers, timeout=TIMEOUT)
        assert admin_resp.status_code == 200
        admin_data = admin_resp.json()
        assert "users" in admin_data
        assert isinstance(admin_data["users"], list)
        # Validate each user object has required fields
        for user in admin_data["users"]:
            assert isinstance(user.get("id"), int)
            assert isinstance(user.get("email"), str)
            assert isinstance(user.get("isAdmin"), bool)
            assert isinstance(user.get("createdAt"), str)
            # searchCount can be zero or more
            assert isinstance(user.get("searchCount"), int)

        # Test non-admin access to /api/admin/users - should be forbidden or unauthorized
        user_headers = {"Authorization": f"Bearer {user_token}"}
        user_resp = requests.get(f"{BASE_URL}/api/admin/users", headers=user_headers, timeout=TIMEOUT)
        # Expect 403 Forbidden or 401 Unauthorized
        assert user_resp.status_code in (401, 403)

        # Test unauthenticated access to /api/admin/users - should be unauthorized
        no_auth_resp = requests.get(f"{BASE_URL}/api/admin/users", timeout=TIMEOUT)
        assert no_auth_resp.status_code in (401, 403)

    except requests.RequestException as e:
        raise AssertionError(f"HTTP request failed: {e}")

verify_admin_get_all_users_access_control()