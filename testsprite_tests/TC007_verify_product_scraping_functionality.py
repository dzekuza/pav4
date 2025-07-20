import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_product_scraping_functionality():
    # Register a new user
    register_url = f"{BASE_URL}/api/auth/register"
    email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass123!"
    register_payload = {"email": email, "password": password}
    try:
        reg_resp = requests.post(register_url, json=register_payload, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
        reg_data = reg_resp.json()
        assert reg_data.get("success") is True
        token = reg_data.get("token") or reg_data.get("accessToken")
        assert token, "No token received on registration"
        headers = {"Authorization": f"Bearer {token}"}

        # Use a sample product URL for scraping
        scrape_url = f"{BASE_URL}/api/scrape"
        sample_product_url = "https://example.com/product/sample-product-123"
        scrape_payload = {
            "url": sample_product_url,
            "userLocation": {"country": "US"}
        }

        scrape_resp = requests.post(scrape_url, json=scrape_payload, timeout=TIMEOUT)
        assert scrape_resp.status_code == 200, f"Scrape request failed: {scrape_resp.text}"
        scrape_data = scrape_resp.json()

        # Validate product data presence and types
        product = scrape_data.get("product")
        assert product is not None, "No product data in response"
        assert isinstance(product.get("title"), str) and product.get("title"), "Invalid or missing product title"
        assert isinstance(product.get("price"), (int, float)), "Invalid or missing product price"
        assert isinstance(product.get("currency"), str) and product.get("currency"), "Invalid or missing product currency"
        assert isinstance(product.get("url"), str) and product.get("url"), "Invalid or missing product url"
        assert isinstance(product.get("image"), str), "Invalid or missing product image"
        assert isinstance(product.get("store"), str), "Invalid or missing product store"

        # Validate comparisons array
        comparisons = scrape_data.get("comparisons")
        assert isinstance(comparisons, list), "Comparisons is not a list"
        for comp in comparisons:
            assert isinstance(comp.get("title"), str) and comp.get("title"), "Invalid comparison title"
            assert isinstance(comp.get("store"), str), "Invalid comparison store"
            assert isinstance(comp.get("price"), (int, float)), "Invalid comparison price"
            assert isinstance(comp.get("currency"), str), "Invalid comparison currency"
            assert isinstance(comp.get("url"), str), "Invalid comparison url"
            assert isinstance(comp.get("image"), str), "Invalid comparison image"
            assert isinstance(comp.get("condition"), str), "Invalid comparison condition"
            assert isinstance(comp.get("assessment"), dict), "Invalid comparison assessment"

        # Validate requestId presence and type
        request_id = scrape_data.get("requestId")
        assert isinstance(request_id, str) and request_id, "Invalid or missing requestId"

    finally:
        # Logout user to clean session
        try:
            logout_url = f"{BASE_URL}/api/auth/logout"
            requests.post(logout_url, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
        except Exception:
            pass

verify_product_scraping_functionality()