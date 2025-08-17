// Minimal test to check available fields
const GADGET_GRAPHQL_ENDPOINT = "https://itrcks--development.gadget.app/api/graphql";
const GADGET_API_KEY = "gsk-wXJiwmtZkpHt9tHrfFHEYerLkK3B44Wn";

const minimalQueries = {
  events: `
    query GetEvents($first: Int) {
      events(first: $first) {
        edges {
          node {
            id
            eventType
            occurredAt
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  orders: `
    query GetOrders($first: Int) {
      orders(first: $first) {
        edges {
          node {
            id
            orderId
            totalPrice
            currency
            createdAt
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  aggregates: `
    query GetAggregates($first: Int) {
      aggregates(first: $first) {
        edges {
          node {
            id
            date
            sessions
            productViews
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  clicks: `
    query GetClicks($first: Int) {
      clicks(first: $first) {
        edges {
          node {
            id
            clickId
            destinationUrl
            createdAt
          }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `
};

async function testMinimal(name, query) {
  try {
    console.log(`\n=== Testing ${name.toUpperCase()} (minimal) ===`);
    
    const response = await fetch(GADGET_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GADGET_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { first: 5 }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error(`❌ ${name} errors:`, data.errors);
    } else if (data.data) {
      const edges = data.data[name]?.edges || [];
      console.log(`✅ ${name}: Found ${edges.length} records`);
      
      if (edges.length > 0) {
        console.log(`  Sample record:`, edges[0].node);
      }
    }

  } catch (error) {
    console.error(`❌ ${name} error:`, error.message);
  }
}

async function testAllMinimal() {
  console.log("Testing minimal Gadget API queries...");
  
  await testMinimal('events', minimalQueries.events);
  await testMinimal('orders', minimalQueries.orders);
  await testMinimal('aggregates', minimalQueries.aggregates);
  await testMinimal('clicks', minimalQueries.clicks);
}

testAllMinimal();
