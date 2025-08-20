#!/usr/bin/env node

/**
 * Test script to verify Gadget API connection using the existing server infrastructure
 * for shop: checkoutipick.myshopify.com (ID: 91283456333)
 */

const SHOP_DOMAIN = "checkoutipick.myshopify.com";
const SHOP_ID = "91283456333";

// Test the existing server API endpoints
async function testServerAPI() {
  console.log('🚀 Testing Gadget API through server endpoints...');
  console.log(`🏪 Target Shop: ${SHOP_DOMAIN}`);
  console.log(`🆔 Shop ID: ${SHOP_ID}`);
  
  const baseUrl = 'http://localhost:8084'; // Default server port
  
  try {
    // Test 1: Get events
    console.log('\n📊 Testing events endpoint...');
    const eventsResponse = await fetch(`${baseUrl}/api/gadget/events?shopDomain=${SHOP_DOMAIN}&first=10`);
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log('✅ Events endpoint working');
      console.log(`📈 Events found: ${eventsData.events?.edges?.length || 0}`);
      
      if (eventsData.events?.edges?.length > 0) {
        console.log('\n📋 Sample events:');
        eventsData.events.edges.slice(0, 3).forEach((edge, index) => {
          const event = edge.node;
          console.log(`\n${index + 1}. ${event.eventType?.toUpperCase() || 'UNKNOWN'}`);
          console.log(`   Time: ${event.occurredAt ? new Date(event.occurredAt).toLocaleString() : 'N/A'}`);
          console.log(`   Path: ${event.path || 'N/A'}`);
          console.log(`   Session: ${event.sessionId ? event.sessionId.substring(0, 8) + '...' : 'N/A'}`);
          if (event.value) {
            console.log(`   Value: $${event.value.toFixed(2)} ${event.currency || 'USD'}`);
          }
        });
      }
    } else {
      console.log('❌ Events endpoint failed:', eventsResponse.status, eventsResponse.statusText);
    }
    
    // Test 2: Get orders
    console.log('\n🛒 Testing orders endpoint...');
    const ordersResponse = await fetch(`${baseUrl}/api/gadget/orders?shopDomain=${SHOP_DOMAIN}&first=5`);
    
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      console.log('✅ Orders endpoint working');
      console.log(`📦 Orders found: ${ordersData.shopifyOrders?.edges?.length || 0}`);
      
      if (ordersData.shopifyOrders?.edges?.length > 0) {
        console.log('\n📋 Sample orders:');
        ordersData.shopifyOrders.edges.slice(0, 3).forEach((edge, index) => {
          const order = edge.node;
          console.log(`\n${index + 1}. Order #${order.orderNumber || order.orderId}`);
          console.log(`   Total: $${order.totalPrice || 0}`);
          console.log(`   Currency: ${order.currency || 'USD'}`);
          console.log(`   Created: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Orders endpoint failed:', ordersResponse.status, ordersResponse.statusText);
    }
    
    // Test 3: Get aggregates
    console.log('\n📈 Testing aggregates endpoint...');
    const aggregatesResponse = await fetch(`${baseUrl}/api/gadget/aggregates?shopDomain=${SHOP_DOMAIN}&first=10`);
    
    if (aggregatesResponse.ok) {
      const aggregatesData = await aggregatesResponse.json();
      console.log('✅ Aggregates endpoint working');
      console.log(`📊 Aggregates found: ${aggregatesData.aggregates?.edges?.length || 0}`);
      
      if (aggregatesData.aggregates?.edges?.length > 0) {
        console.log('\n📋 Sample aggregates:');
        aggregatesData.aggregates.edges.slice(0, 3).forEach((edge, index) => {
          const aggregate = edge.node;
          console.log(`\n${index + 1}. Date: ${aggregate.date || 'N/A'}`);
          console.log(`   Events: ${aggregate.totalEvents || 0}`);
          console.log(`   Value: $${aggregate.totalValue || 0}`);
          console.log(`   Orders: ${aggregate.totalOrders || 0}`);
        });
      }
    } else {
      console.log('❌ Aggregates endpoint failed:', aggregatesResponse.status, aggregatesResponse.statusText);
    }
    
    // Test 4: Get clicks
    console.log('\n🖱️ Testing clicks endpoint...');
    const clicksResponse = await fetch(`${baseUrl}/api/gadget/clicks?shopDomain=${SHOP_DOMAIN}&first=10`);
    
    if (clicksResponse.ok) {
      const clicksData = await clicksResponse.json();
      console.log('✅ Clicks endpoint working');
      console.log(`🖱️ Clicks found: ${clicksData.clicks?.edges?.length || 0}`);
      
      if (clicksData.clicks?.edges?.length > 0) {
        console.log('\n📋 Sample clicks:');
        clicksData.clicks.edges.slice(0, 3).forEach((edge, index) => {
          const click = edge.node;
          console.log(`\n${index + 1}. Click ID: ${click.clickId || 'N/A'}`);
          console.log(`   Destination: ${click.destinationUrl || 'N/A'}`);
          console.log(`   Created: ${click.createdAt ? new Date(click.createdAt).toLocaleString() : 'N/A'}`);
        });
      }
    } else {
      console.log('❌ Clicks endpoint failed:', clicksResponse.status, clicksResponse.statusText);
    }
    
    console.log('\n🎉 Server API tests completed!');
    
  } catch (error) {
    console.error('\n❌ Server API test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 8084');
    console.log('   Run: npm run dev:server');
  }
}

// Test with different shop domain formats
async function testDifferentFormats() {
  console.log('\n🔍 Testing different shop domain formats...');
  
  const formats = [
    SHOP_DOMAIN,
    SHOP_DOMAIN.replace('.myshopify.com', ''),
    `https://${SHOP_DOMAIN}`,
    `http://${SHOP_DOMAIN}`
  ];
  
  for (const format of formats) {
    console.log(`\n📝 Testing format: ${format}`);
    try {
      const response = await fetch(`http://localhost:8084/api/gadget/events?shopDomain=${encodeURIComponent(format)}&first=1`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Found ${data.events?.edges?.length || 0} events`);
        break;
      } else {
        console.log(`❌ Failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Gadget API Server Tests...');
  
  try {
    await testServerAPI();
    await testDifferentFormats();
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);
