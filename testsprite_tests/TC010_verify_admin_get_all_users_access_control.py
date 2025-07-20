import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def register_user(email: str, password: str):
    url = f"{BASE_URL}/api/auth/register"
    payload = {"email": email, "password": password}
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    assert data.get("success") is True
    assert "accessToken" in data
    assert "user" in data
    return data["accessToken"], data["user"]

def login_user(email: str, password: str):
    url = f"{BASE_URL}/api/auth/login"
    payload = {"email": email, "password": password}
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    assert data.get("success") is True
    assert "accessToken" in data
    assert "user" in data
    return data["accessToken"], data["user"]

def delete_user(token: str):
    # No explicit delete user endpoint in PRD, so no deletion possible.
    # This function is a placeholder if deletion is implemented later.
    pass

def test_verify_admin_get_all_users_access_control():
    # Create admin user
    admin_email = f"admin_{uuid.uuid4().hex}@example.com"
    admin_password = "AdminPass123!"
    admin_token, admin_user = register_user(admin_email, admin_password)
    # We need to ensure this user is admin. Since no endpoint to set admin, assume first user is admin or login as existing admin.
    # If the registered user is not admin, try to login as a known admin user.
    # For test, try login as admin user with known credentials fallback:
    if not admin_user.get("isAdmin", False):
        # Try login as known admin user (replace with actual admin credentials if known)
        # For this test, we assume admin user exists with email admin@example.com and password AdminPass123!
        try:
            admin_token, admin_user = login_user("admin@example.com", "AdminPass123!")
            assert admin_user.get("isAdmin", False) is True
        except Exception:
            # If no known admin, skip admin tests as no admin user available
            raise AssertionError("No admin user available for testing admin access control.")

    # Create normal user
    user_email = f"user_{uuid.uuid4().hex}@example.com"
    user_password = "UserPass123!"
    user_token, user_user = register_user(user_email, user_password)
    assert user_user.get("isAdmin", False) is False

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_user = {"Authorization": f"Bearer {user_token}"}

    # Admin user should access /api/admin/users successfully
    admin_users_url = f"{BASE_URL}/api/admin/users"
    resp_admin = requests.get(admin_users_url, headers=headers_admin, timeout=TIMEOUT)
    assert resp_admin.status_code == 200
    data_admin = resp_admin.json()
    assert "users" in data_admin
    assert isinstance(data_admin["users"], list)
    for user in data_admin["users"]:
        assert isinstance(user.get("id"), int)
        assert isinstance(user.get("email"), str)
        assert isinstance(user.get("isAdmin"), bool)
        assert isinstance(user.get("createdAt"), str)
        assert isinstance(user.get("searchCount"), int)

    # Normal user should be forbidden or unauthorized to access /api/admin/users
    resp_user = requests.get(admin_users_url, headers=headers_user, timeout=TIMEOUT)
    assert resp_user.status_code in (401, 403)

    # Unauthenticated request should be unauthorized
    resp_unauth = requests.get(admin_users_url, timeout=TIMEOUT)
    assert resp_unauth.status_code == 401

test_verify_admin_get_all_users_access_control()