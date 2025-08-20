#!/usr/bin/env node

/**
 * Direct test script to verify Gadget API connection
 * for shop: checkoutipick.myshopify.com (ID: 91283456333)
 */

const GADGET_API_URL = 'https://itrcks--development.gadget.app/api/graphql';
const GADGET_API_KEY = process.env.GADGET_API_KEY;

if (!GADGET_API_KEY) {
  console.error('❌ GADGET_API_KEY environment variable is required');
  console.log('Please set it in your .env file or export it:');
  console.log('export GADGET_API_KEY="your-api-key-here"');
  process.exit(1);
}

const SHOP_ID = "91283456333"; // checkoutipick.myshopify.com

async function makeGadgetRequest(query, variables = {}) {
  try {
    const response = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GADGET_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  } catch (error) {
    console.error('❌ API request failed:', error.message);
    throw error;
  }
}

async function testShopInfo() {
  console.log('\n🔍 Testing shop information...');
  
  const query = `
    query GetShop($shopId: GadgetID!) {
      shop(id: $shopId) {
        id
        name
        myshopifyDomain
        isActive
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const data = await makeGadgetRequest(query, { shopId: SHOP_ID });
    console.log('✅ Shop info retrieved successfully:');
    console.log(JSON.stringify(data.shop, null, 2));
    return data.shop;
  } catch (error) {
    console.error('❌ Failed to get shop info:', error.message);
    return null;
  }
}

async function testEventsFetch() {
  console.log('\n📊 Testing events fetch...');
  
  const query = `
    query GetEvents($shopId: GadgetID!, $first: Int) {
      events(first: $first, filter: { shop: { id: { equals: $shopId } } }) {
        edges {
          node {
            id
            eventType
            occurredAt
            sessionId
            path
            productId
            variantId
            quantity
            value
            currency
            orderId
            cartToken
            checkoutId
            ipAddress
            userAgent
            shop {
              id
              name
              myshopifyDomain
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;

  try {
    const data = await makeGadgetRequest(query, { 
      shopId: SHOP_ID, 
      first: 10 
    });
    
    console.log('✅ Events retrieved successfully:');
    console.log(`📈 Total events found: ${data.events.edges.length}`);
    
    if (data.events.edges.length > 0) {
      console.log('\n📋 Sample events:');
      data.events.edges.slice(0, 3).forEach((edge, index) => {
        const event = edge.node;
        console.log(`\n${index + 1}. ${event.eventType.toUpperCase()}`);
        console.log(`   Time: ${new Date(event.occurredAt).toLocaleString()}`);
        console.log(`   Path: ${event.path}`);
        console.log(`   Session: ${event.sessionId.substring(0, 8)}...`);
        if (event.value) {
          console.log(`   Value: $${event.value.toFixed(2)} ${event.currency || 'USD'}`);
        }
      });
    } else {
      console.log('⚠️  No events found for this shop');
    }
    
    return data.events;
  } catch (error) {
    console.error('❌ Failed to get events:', error.message);
    return null;
  }
}

async function testShopsList() {
  console.log('\n🏪 Testing shops list...');
  
  const query = `
    query GetShops {
      shops(first: 10) {
        edges {
          node {
            id
            name
            myshopifyDomain
            isActive
            createdAt
          }
        }
      }
    }
  `;

  try {
    const data = await makeGadgetRequest(query);
    console.log('✅ Shops list retrieved successfully:');
    console.log(`📋 Total shops: ${data.shops.edges.length}`);
    
    data.shops.edges.forEach((edge, index) => {
      const shop = edge.node;
      console.log(`\n${index + 1}. ${shop.name || shop.myshopifyDomain}`);
      console.log(`   ID: ${shop.id}`);
      console.log(`   Domain: ${shop.myshopifyDomain}`);
      console.log(`   Active: ${shop.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${new Date(shop.createdAt).toLocaleDateString()}`);
    });
    
    return data.shops;
  } catch (error) {
    console.error('❌ Failed to get shops list:', error.message);
    return null;
  }
}

async function testEventStats() {
  console.log('\n📈 Testing event statistics...');
  
  const query = `
    query GetEventStats($shopId: GadgetID!) {
      events(filter: { shop: { id: { equals: $shopId } } }, first: 250) {
        edges {
          node {
            id
            eventType
            occurredAt
            value
            currency
          }
        }
      }
    }
  `;

  try {
    const data = await makeGadgetRequest(query, { shopId: SHOP_ID });
    const events = data.events.edges.map(edge => edge.node);
    
    // Calculate stats
    const totalEvents = events.length;
    const eventTypeBreakdown = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});
    
    const totalValue = events.reduce((sum, event) => {
      return sum + (event.value || 0);
    }, 0);
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentEvents = events.filter(event => {
      return new Date(event.occurredAt) > oneDayAgo;
    }).length;
    
    console.log('✅ Event statistics calculated:');
    console.log(`📊 Total Events: ${totalEvents}`);
    console.log(`💰 Total Value: $${totalValue.toFixed(2)}`);
    console.log(`🕐 Recent Events (24h): ${recentEvents}`);
    console.log('\n📋 Event Type Breakdown:');
    Object.entries(eventTypeBreakdown).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    return {
      totalEvents,
      eventTypeBreakdown,
      totalValue,
      recentEvents
    };
  } catch (error) {
    console.error('❌ Failed to get event stats:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Direct Gadget API Tests...');
  console.log(`🔗 API URL: ${GADGET_API_URL}`);
  console.log(`🏪 Target Shop ID: ${SHOP_ID}`);
  console.log(`🔑 API Key: ${GADGET_API_KEY.substring(0, 10)}...`);
  
  try {
    // Test shops list first
    const shops = await testShopsList();
    
    // Test shop information
    const shopInfo = await testShopInfo();
    
    // Test events fetch
    const events = await testEventsFetch();
    
    // Test event statistics
    const stats = await testEventStats();
    
    console.log('\n🎉 All tests completed!');
    
    if (shopInfo && events && stats) {
      console.log('\n✅ Summary:');
      console.log(`   Shop: ${shopInfo.name || shopInfo.myshopifyDomain}`);
      console.log(`   Events: ${events.edges.length} found`);
      console.log(`   Total Value: $${stats.totalValue.toFixed(2)}`);
      console.log(`   Recent Activity: ${stats.recentEvents} events in 24h`);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);
