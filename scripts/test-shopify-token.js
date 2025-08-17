// Test if this is a Shopify API token
const SHOPIFY_ACCESS_TOKEN = "shpua_2b819ec253e95573ad4e8d3e0a2af183";
const SHOP_DOMAIN = "checkoutipick.myshopify.com";

async function testShopifyToken() {
  try {
    console.log("Testing Shopify Admin API...");
    console.log("Shop domain:", SHOP_DOMAIN);
    console.log("Token:", SHOPIFY_ACCESS_TOKEN.substring(0, 10) + "...");

    // Test Shopify Admin API
    const shopifyResponse = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-01/orders.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      }
    });

    console.log("Shopify API Response status:", shopifyResponse.status);
    
    if (shopifyResponse.ok) {
      const shopifyData = await shopifyResponse.json();
      console.log("Shopify API Success! Found", shopifyData.orders?.length || 0, "orders");
      if (shopifyData.orders && shopifyData.orders.length > 0) {
        shopifyData.orders.slice(0, 3).forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            order_number: order.order_number,
            total_price: order.total_price,
            currency: order.currency,
            created_at: order.created_at
          });
        });
      }
    } else {
      const errorText = await shopifyResponse.text();
      console.log("Shopify API Error:", errorText);
    }

    // Test Shopify GraphQL API
    const graphqlResponse = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            shop {
              id
              name
              myshopifyDomain
              plan {
                displayName
              }
            }
          }
        `
      })
    });

    console.log("\nShopify GraphQL Response status:", graphqlResponse.status);
    
    if (graphqlResponse.ok) {
      const graphqlData = await graphqlResponse.json();
      console.log("Shopify GraphQL Success!");
      console.log("Shop info:", graphqlData.data?.shop);
    } else {
      const errorText = await graphqlResponse.text();
      console.log("Shopify GraphQL Error:", errorText);
    }

  } catch (error) {
    console.error("Error testing Shopify API:", error);
  }
}

testShopifyToken();
