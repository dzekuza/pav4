import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_n8n_webhook_scraping():
    # Use a sample product URL for scraping
    sample_url = "https://example.com/product/sample-product"
    request_id = str(uuid.uuid4())
    payload = {
        "url": sample_url,
        "requestId": request_id,
        "userLocation": {
            "country": "US"
        }
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(
            f"{BASE_URL}/api/n8n-scrape",
            json=payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        data = response.json()
        # Validate mainProduct presence and fields
        assert "mainProduct" in data, "Response missing 'mainProduct'"
        main_product = data["mainProduct"]
        for field in ["title", "price", "image", "url"]:
            assert field in main_product, f"'mainProduct' missing field '{field}'"
            assert isinstance(main_product[field], str), f"'mainProduct.{field}' should be a string"
            assert main_product[field], f"'mainProduct.{field}' should not be empty"
        # Validate suggestions presence and structure
        assert "suggestions" in data, "Response missing 'suggestions'"
        suggestions = data["suggestions"]
        assert isinstance(suggestions, list), "'suggestions' should be a list"
        for suggestion in suggestions:
            for field in ["title", "standardPrice", "discountPrice", "site", "link", "image"]:
                assert field in suggestion, f"Suggestion missing field '{field}'"
                assert isinstance(suggestion[field], str), f"Suggestion field '{field}' should be a string"
                assert suggestion[field], f"Suggestion field '{field}' should not be empty"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

verify_n8n_webhook_scraping()