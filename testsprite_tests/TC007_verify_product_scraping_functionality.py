import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def verify_product_scraping_functionality():
    scrape_url = "https://example.com/product/sample-product"
    user_location = {"country": "US"}

    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "url": scrape_url,
        "userLocation": user_location
    }

    try:
        response = requests.post(f"{BASE_URL}/api/scrape", json=payload, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to /api/scrape failed: {e}"

    data = response.json()

    # Validate presence of requestId
    assert "requestId" in data and isinstance(data["requestId"], str) and data["requestId"].strip() != "", "Missing or invalid requestId"

    # Validate product object
    assert "product" in data and isinstance(data["product"], dict), "Missing or invalid product data"
    product = data["product"]
    assert isinstance(product.get("title"), str) and product["title"].strip() != "", "Product title missing or empty"
    assert isinstance(product.get("price"), (int, float)), "Product price missing or not a number"
    assert isinstance(product.get("currency"), str) and product["currency"].strip() != "", "Product currency missing or empty"
    assert isinstance(product.get("url"), str) and product["url"].strip() != "", "Product url missing or empty"
    assert isinstance(product.get("image"), str), "Product image missing or not a string"
    assert isinstance(product.get("store"), str), "Product store missing or not a string"

    # Validate comparisons array
    assert "comparisons" in data and isinstance(data["comparisons"], list), "Missing or invalid comparisons data"
    for comp in data["comparisons"]:
        assert isinstance(comp, dict), "Comparison item is not an object"
        assert isinstance(comp.get("title"), str) and comp["title"].strip() != "", "Comparison title missing or empty"
        assert isinstance(comp.get("store"), str), "Comparison store missing or not a string"
        assert isinstance(comp.get("price"), (int, float)), "Comparison price missing or not a number"
        assert isinstance(comp.get("currency"), str) and comp["currency"].strip() != "", "Comparison currency missing or empty"
        assert isinstance(comp.get("url"), str) and comp["url"].strip() != "", "Comparison url missing or empty"
        assert isinstance(comp.get("image"), str), "Comparison image missing or not a string"
        assert isinstance(comp.get("condition"), str), "Comparison condition missing or not a string"
        assert isinstance(comp.get("assessment"), dict), "Comparison assessment missing or not an object"

verify_product_scraping_functionality()