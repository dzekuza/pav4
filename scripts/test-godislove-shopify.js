// Test godislove.lt Shopify store data
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "YOUR_SHOPIFY_ACCESS_TOKEN_HERE";
const SHOP_DOMAIN = "godislove.lt";

async function testGodisloveShopify() {
  try {
    console.log("🧪 Testing godislove.lt Shopify store...");
    console.log("Shop domain:", SHOP_DOMAIN);
    console.log("Token:", SHOPIFY_ACCESS_TOKEN.substring(0, 10) + "...");

    // Test Shopify Admin API
    const shopifyResponse = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-01/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      }
    });

    console.log("Shopify API Response status:", shopifyResponse.status);
    
    if (shopifyResponse.ok) {
      const shopifyData = await shopifyResponse.json();
      console.log("✅ Shopify API Success!");
      console.log("Shop info:", {
        name: shopifyData.shop.name,
        domain: shopifyData.shop.myshopify_domain,
        plan: shopifyData.shop.plan?.display_name,
        currency: shopifyData.shop.currency,
        created_at: shopifyData.shop.created_at
      });
    } else {
      const errorText = await shopifyResponse.text();
      console.log("❌ Shopify API Error:", errorText);
    }

    // Test different Shopify endpoints
    const endpoints = [
      { name: 'Products', url: '/admin/api/2024-01/products.json' },
      { name: 'Orders', url: '/admin/api/2024-01/orders.json' },
      { name: 'Customers', url: '/admin/api/2024-01/customers.json' },
      { name: 'Collections', url: '/admin/api/2024-01/collections.json' }
    ];

    console.log("\n📊 Testing Shopify Data Endpoints:");
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`https://${SHOP_DOMAIN}${endpoint.url}`, {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          const items = data[endpoint.name.toLowerCase()] || data[endpoint.name.toLowerCase().replace(' ', '_')] || [];
          console.log(`✅ ${endpoint.name}: ${items.length} items`);
          
          if (items.length > 0) {
            console.log(`  Sample:`, {
              id: items[0].id,
              title: items[0].title || items[0].name || items[0].order_number,
              created_at: items[0].created_at
            });
          }
        } else {
          console.log(`❌ ${endpoint.name}: ${response.status} - ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      }
    }

    // Test GraphQL for more detailed info
    console.log("\n=== Testing GraphQL for detailed info ===");
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
              plan { displayName }
              currencyCode
              timezoneAbbreviation
              createdAt
            }
            products(first: 5) {
              edges {
                node {
                  id
                  title
                  handle
                  status
                  createdAt
                }
              }
            }
            orders(first: 5) {
              edges {
                node {
                  id
                  name
                  totalPriceSet { shopMoney { amount currency } }
                  createdAt
                }
              }
            }
          }
        `
      })
    });

    if (graphqlResponse.ok) {
      const graphqlData = await graphqlResponse.json();
      console.log("✅ GraphQL Success!");
      console.log("Shop details:", graphqlData.data?.shop);
      console.log("Products count:", graphqlData.data?.products?.edges?.length || 0);
      console.log("Orders count:", graphqlData.data?.orders?.edges?.length || 0);
    } else {
      console.log("❌ GraphQL Error:", await graphqlResponse.text());
    }

  } catch (error) {
    console.error("❌ Error testing godislove.lt Shopify:", error);
  }
}

testGodisloveShopify();
