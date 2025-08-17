// Test all Gadget API endpoints
const GADGET_GRAPHQL_ENDPOINT = "https://itrcks--development.gadget.app/api/graphql";
const GADGET_API_KEY = "gsk-wXJiwmtZkpHt9tHrfFHEYerLkK3B44Wn";

const queries = {
  events: `
    query GetEvents($first: Int, $filter: [EventFilter!]) {
      events(first: $first, filter: $filter) {
        edges {
          node {
            id
            sessionId
            eventType
            path
            productId
            occurredAt
            shop { id domain }
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  orders: `
    query GetOrders($first: Int, $filter: [OrderFilter!]) {
      orders(first: $first, filter: $filter) {
        edges {
          node {
            id
            orderId
            totalPrice
            currency
            createdAt
            shop { id domain }
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  aggregates: `
    query GetAggregates($first: Int, $filter: [AggregateFilter!]) {
      aggregates(first: $first, filter: $filter) {
        edges {
          node {
            id
            date
            sessions
            productViews
            shop { id domain }
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  clicks: `
    query GetClicks($first: Int, $filter: [ClickFilter!]) {
      clicks(first: $first, filter: $filter) {
        edges {
          node {
            id
            clickId
            destinationUrl
            createdAt
            shop { id domain }
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  shops: `
    query GetShops($first: Int) {
      shops(first: $first) {
        edges {
          node {
            id
            domain
            createdAt
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `
};

async function testEndpoint(name, query, variables = {}) {
  try {
    console.log(`\n=== Testing ${name.toUpperCase()} ===`);
    
    const response = await fetch(GADGET_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GADGET_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { first: 10, ...variables }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error(`❌ ${name} errors:`, data.errors);
    } else if (data.data) {
      const edges = data.data[name]?.edges || [];
      console.log(`✅ ${name}: Found ${edges.length} records`);
      
      if (edges.length > 0) {
        edges.slice(0, 3).forEach((edge, index) => {
          console.log(`  ${index + 1}.`, edge.node);
        });
        if (edges.length > 3) {
          console.log(`  ... and ${edges.length - 3} more`);
        }
      }
    }

  } catch (error) {
    console.error(`❌ ${name} error:`, error.message);
  }
}

async function testAllEndpoints() {
  console.log("Testing all Gadget API endpoints...");
  console.log("Endpoint:", GADGET_GRAPHQL_ENDPOINT);
  console.log("API Key:", GADGET_API_KEY.substring(0, 10) + "...");

  // Test all endpoints
  await testEndpoint('events', queries.events);
  await testEndpoint('orders', queries.orders);
  await testEndpoint('aggregates', queries.aggregates);
  await testEndpoint('clicks', queries.clicks);
  await testEndpoint('shops', queries.shops);

  console.log("\n=== Testing with checkoutipick.myshopify.com filter ===");
  
  // Test with domain filter
  const domainFilter = [{
    shop: {
      domain: { equals: "checkoutipick.myshopify.com" }
    }
  }];

  await testEndpoint('events', queries.events, { filter: domainFilter });
  await testEndpoint('orders', queries.orders, { filter: domainFilter });
  await testEndpoint('aggregates', queries.aggregates, { filter: domainFilter });
  await testEndpoint('clicks', queries.clicks, { filter: domainFilter });
}

testAllEndpoints();
