#!/bin/bash

echo "🧪 Testing iPick tracking endpoint with curl..."

curl -X POST https://ipick.io/api/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_view",
    "business_id": "4",
    "affiliate_id": "aff_beautydayl_1756154229316_i8kgfy",
    "platform": "shopify",
    "session_id": "curl_test_'$(date +%s)'",
    "user_agent": "curl/7.68.0",
    "referrer": "https://google.com",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "url": "https://beautyday.lt/products/test-product",
    "data": {
      "pageType": "product",
      "productTitle": "Test Product via curl",
      "productPrice": "29.99",
      "currency": "EUR"
    }
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n"

echo ""
echo "✅ Curl test completed!"
