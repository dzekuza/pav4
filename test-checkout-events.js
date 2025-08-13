const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:8083';
const TEST_BUSINESS_ID = 1; // Update this with a real business ID

async function testCheckoutEvents() {
  console.log('🧪 Testing Checkout Events Functionality...\n');

  try {
    // 1. Test tracking a checkout_start event
    console.log('1. Testing checkout_start event tracking...');
    const checkoutStartResponse = await axios.post(`${BASE_URL}/api/track-event`, {
      event_type: 'checkout_start',
      business_id: TEST_BUSINESS_ID,
      affiliate_id: 'test-affiliate',
      platform: 'shopify',
      session_id: 'test-session-' + Date.now(),
      url: 'https://example.com/checkout',
      data: {
        product_name: 'Test Product',
        total: 99.99
      }
    });

    console.log('✅ checkout_start event tracked successfully');
    console.log('   Event ID:', checkoutStartResponse.data.event_id);

    // 2. Test tracking a checkout_complete event
    console.log('\n2. Testing checkout_complete event tracking...');
    const checkoutCompleteResponse = await axios.post(`${BASE_URL}/api/track-event`, {
      event_type: 'checkout_complete',
      business_id: TEST_BUSINESS_ID,
      affiliate_id: 'test-affiliate',
      platform: 'shopify',
      session_id: 'test-session-' + Date.now(),
      url: 'https://example.com/checkout/complete',
      data: {
        product_name: 'Test Product',
        total: 99.99,
        order_id: 'ORDER-' + Date.now()
      }
    });

    console.log('✅ checkout_complete event tracked successfully');
    console.log('   Event ID:', checkoutCompleteResponse.data.event_id);

    // 3. Test fetching tracking events
    console.log('\n3. Testing tracking events retrieval...');
    const eventsResponse = await axios.get(`${BASE_URL}/api/track-event?business_id=${TEST_BUSINESS_ID}&limit=10`);
    
    if (eventsResponse.data.success) {
      const events = eventsResponse.data.events;
      const checkoutEvents = events.filter(event => 
        event.eventType === 'checkout_start' || event.eventType === 'checkout_complete'
      );
      
      console.log('✅ Tracking events retrieved successfully');
      console.log(`   Total events: ${events.length}`);
      console.log(`   Checkout events: ${checkoutEvents.length}`);
      
      if (checkoutEvents.length > 0) {
        console.log('   Recent checkout events:');
        checkoutEvents.slice(0, 3).forEach(event => {
          console.log(`   - ${event.eventType}: ${event.eventData?.product_name || 'Unknown Product'}`);
        });
      }
    } else {
      console.log('❌ Failed to retrieve tracking events');
    }

    // 4. Test business activity events endpoint
    console.log('\n4. Testing business activity events endpoint...');
    const activityEventsResponse = await axios.get(`${BASE_URL}/api/business/activity/events`, {
      withCredentials: true
    });

    if (activityEventsResponse.status === 200) {
      const activityEvents = activityEventsResponse.data.events || activityEventsResponse.data;
      const checkoutActivityEvents = activityEvents.filter(event => 
        event.eventType === 'checkout_start' || event.eventType === 'checkout_complete'
      );
      
      console.log('✅ Business activity events retrieved successfully');
      console.log(`   Total activity events: ${activityEvents.length}`);
      console.log(`   Checkout activity events: ${checkoutActivityEvents.length}`);
    } else {
      console.log('❌ Failed to retrieve business activity events');
      console.log('   Status:', activityEventsResponse.status);
      console.log('   Response:', activityEventsResponse.data);
    }

    console.log('\n🎉 Checkout events test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - checkout_start events are being tracked');
    console.log('   - checkout_complete events are being tracked');
    console.log('   - Events can be retrieved via API');
    console.log('   - Business activity dashboard should display checkout events');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the test
testCheckoutEvents();
