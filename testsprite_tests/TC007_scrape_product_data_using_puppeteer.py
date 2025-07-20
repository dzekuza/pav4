import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_scrape_product_data_using_puppeteer():
    # First, register a new user to get authentication token
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    scrape_url = f"{BASE_URL}/api/scrape"
    logout_url = f"{BASE_URL}/api/auth/logout"

    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPass123!"

    headers = {"Content-Type": "application/json"}

    # Register user
    try:
        resp = requests.post(register_url, json={"email": test_email, "password": test_password}, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201 or resp.status_code == 200, f"Registration failed: {resp.status_code} {resp.text}"
    except requests.RequestException as e:
        assert False, f"Registration request failed: {e}"

    # Login user
    try:
        resp = requests.post(login_url, json={"email": test_email, "password": test_password}, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
        token = resp.json().get("token") or resp.json().get("accessToken")
        assert token and isinstance(token, str), "Login response missing token"
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    auth_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Prepare a valid product URL to scrape
    product_url = "https://www.example.com/product/sample-product-12345"
    request_id = str(uuid.uuid4())

    # Test successful scrape
    try:
        resp = requests.post(scrape_url, json={"url": product_url, "requestId": request_id}, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Scrape request failed: {resp.status_code} {resp.text}"
        data = resp.json()
        # Validate response structure: must contain at least title, price, image
        assert isinstance(data, dict), "Response is not a JSON object"
        assert "title" in data and isinstance(data["title"], str) and data["title"], "Missing or invalid title"
        assert "price" in data and (isinstance(data["price"], (int, float, str)) and data["price"]), "Missing or invalid price"
        assert "image" in data and isinstance(data["image"], str) and data["image"], "Missing or invalid image"
    except requests.RequestException as e:
        assert False, f"Scrape request failed: {e}"

    # Test error handling: invalid URL format
    invalid_url = "not-a-valid-url"
    invalid_request_id = str(uuid.uuid4())
    try:
        resp = requests.post(scrape_url, json={"url": invalid_url, "requestId": invalid_request_id}, headers=auth_headers, timeout=TIMEOUT)
        # Expecting a 4xx error, e.g. 400 Bad Request
        assert resp.status_code >= 400 and resp.status_code < 500, f"Expected client error for invalid URL, got {resp.status_code}"
        error_data = resp.json()
        assert "error" in error_data or "message" in error_data, "Error response missing error/message field"
    except requests.RequestException as e:
        assert False, f"Scrape request with invalid URL failed: {e}"

    # Test error handling: missing URL field
    missing_url_request_id = str(uuid.uuid4())
    try:
        resp = requests.post(scrape_url, json={"requestId": missing_url_request_id}, headers=auth_headers, timeout=TIMEOUT)
        # Expecting a 4xx error, e.g. 400 Bad Request
        assert resp.status_code >= 400 and resp.status_code < 500, f"Expected client error for missing URL, got {resp.status_code}"
        error_data = resp.json()
        assert "error" in error_data or "message" in error_data, "Error response missing error/message field"
    except requests.RequestException as e:
        assert False, f"Scrape request with missing URL failed: {e}"

    # Logout user
    try:
        resp = requests.post(logout_url, headers=auth_headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Logout failed: {resp.status_code} {resp.text}"
    except requests.RequestException as e:
        assert False, f"Logout request failed: {e}"

test_scrape_product_data_using_puppeteer()