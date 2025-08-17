// Test Shopify store data
const SHOPIFY_ACCESS_TOKEN = "shpua_2b819ec253e95573ad4e8d3e0a2af183";
const SHOP_DOMAIN = "checkoutipick.myshopify.com";

async function testShopifyData() {
  try {
    console.log("Testing Shopify store data...");
    console.log("Shop domain:", SHOP_DOMAIN);

    // Test different Shopify endpoints
    const endpoints = [
      { name: 'Products', url: '/admin/api/2024-01/products.json' },
      { name: 'Orders', url: '/admin/api/2024-01/orders.json' },
      { name: 'Customers', url: '/admin/api/2024-01/customers.json' },
      { name: 'Collections', url: '/admin/api/2024-01/collections.json' },
      { name: 'Inventory Items', url: '/admin/api/2024-01/inventory_items.json' }
    ];

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
            console.log(`  Sample:`, items[0]);
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
    console.error("Error testing Shopify data:", error);
  }
}

testShopifyData();
