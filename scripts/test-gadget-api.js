// Test script for Gadget API
const GADGET_GRAPHQL_ENDPOINT = "https://itrcks--development.gadget.app/api/graphql";
const GADGET_API_KEY = "gsk-wXJiwmtZkpHt9tHrfFHEYerLkK3B44Wn";

const testQuery = `
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
`;

async function testGadgetAPI() {
  try {
    console.log("Testing Gadget API...");
    console.log("Endpoint:", GADGET_GRAPHQL_ENDPOINT);
    console.log("API Key:", GADGET_API_KEY.substring(0, 10) + "...");

    const response = await fetch(GADGET_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GADGET_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        variables: {
          first: 10,
          filter: [] // No filter to see all events
        }
      })
    });

    const data = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
    } else if (data.data) {
      console.log("Success! Found", data.data.events.edges.length, "events");
      data.data.events.edges.forEach((edge, index) => {
        console.log(`Event ${index + 1}:`, {
          id: edge.node.id,
          eventType: edge.node.eventType,
          occurredAt: edge.node.occurredAt,
          shop: edge.node.shop?.domain
        });
      });
    }

  } catch (error) {
    console.error("Error testing Gadget API:", error);
  }
}

testGadgetAPI();
