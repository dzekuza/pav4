import requests
import uuid
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_get_user_search_history():
    # Register a new user
    register_url = f"{BASE_URL}/api/auth/register"
    email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass123!"
    register_payload = {"email": email, "password": password}
    try:
        register_resp = requests.post(register_url, json=register_payload, timeout=TIMEOUT)
        assert register_resp.status_code == 201, f"Registration failed: {register_resp.text}"
        register_data = register_resp.json()
        assert register_data.get("success") is True
        token = register_data.get("token") or register_data.get("accessToken")
        assert token, "No token received on registration"
        headers = {"Authorization": f"Bearer {token}"}

        # Scrape a product to get a requestId and product title
        scrape_url = f"{BASE_URL}/api/scrape"
        test_product_url = "https://example.com/product/test-product"
        scrape_payload = {"url": test_product_url}
        scrape_resp = requests.post(scrape_url, json=scrape_payload, headers=headers, timeout=TIMEOUT)
        assert scrape_resp.status_code == 200, f"Scrape failed: {scrape_resp.text}"
        scrape_data = scrape_resp.json()
        product = scrape_data.get("product")
        request_id = scrape_data.get("requestId")
        assert product and isinstance(product, dict), "Product data missing or invalid"
        assert request_id and isinstance(request_id, str), "requestId missing or invalid"
        product_title = product.get("title")
        assert product_title and isinstance(product_title, str), "Product title missing or invalid"

        # Add search to history
        add_history_url = f"{BASE_URL}/api/search-history"
        add_history_payload = {
            "url": test_product_url,
            "title": product_title,
            "requestId": request_id
        }
        add_resp = requests.post(add_history_url, json=add_history_payload, headers=headers, timeout=TIMEOUT)
        assert add_resp.status_code == 201, f"Add search to history failed: {add_resp.text}"

        # Wait briefly to ensure timestamp difference if needed
        time.sleep(1)

        # Get user search history
        get_history_url = f"{BASE_URL}/api/search-history"
        get_resp = requests.get(get_history_url, headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Get search history failed: {get_resp.text}"
        history_data = get_resp.json()
        history = history_data.get("history")
        assert isinstance(history, list), "History is not a list"

        # Find the added search entry in history
        matched_entries = [
            entry for entry in history
            if entry.get("url") == test_product_url and
               entry.get("title") == product_title and
               entry.get("requestId") == request_id
        ]
        assert matched_entries, "Added search entry not found in history"

        # Validate timestamp format (ISO 8601 string)
        for entry in matched_entries:
            timestamp = entry.get("timestamp")
            assert isinstance(timestamp, str) and len(timestamp) > 0, "Timestamp missing or invalid"

    finally:
        # Logout user to clean session (optional)
        try:
            logout_url = f"{BASE_URL}/api/auth/logout"
            requests.post(logout_url, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
        except Exception:
            pass

verify_get_user_search_history()