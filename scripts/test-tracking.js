import axios from 'axios';

// Test configuration
const config = {
  apiUrl: 'https://pavlo4.netlify.app/api',
  businessId: '1',
  affiliateId: 'test-affiliate-123',
  platform: 'shopify'
};

// Test data
const testEvents = [
  {
    event_type: 'page_view',
    data: {
      page_title: 'Test Product Page',
      page_url: 'https://example.com/products/test-product',
      page_type: 'product'
    }
  },
  {
    event_type: 'product_view',
    data: {
      product_id: 'test-product-123',
      product_name: 'Test Product',
      price: '99.99',
      currency: 'USD'
    }
  },
  {
    event_type: 'add_to_cart',
    data: {
      product_id: 'test-product-123',
      product_name: 'Test Product',
      price: '99.99',
      currency: 'USD'
    }
  },
  {
    event_type: 'purchase_click',
    data: {
      product_id: 'test-product-123',
      product_name: 'Test Product',
      price: '99.99',
      currency: 'USD'
    }
  },
  {
    event_type: 'conversion',
    data: {
      order_id: 'test-order-456',
      total_amount: '99.99',
      currency: 'USD',
      products: [
        {
          product_id: 'test-product-123',
          title: 'Test Product',
          price: '99.99',
          quantity: 1
        }
      ]
    }
  }
];

// Generate tracking data
function generateTrackingData(eventType, data) {
  return {
    event_type: eventType,
    business_id: config.businessId,
    affiliate_id: config.affiliateId,
    platform: config.platform,
    session_id: 'test-session-' + Date.now(),
    user_agent: 'Test-Script/1.0',
    referrer: 'https://example.com',
    timestamp: Date.now(),
    url: 'https://example.com/test',
    data: data
  };
}

// Send tracking event
async function sendTrackingEvent(eventType, data) {
  try {
    const trackingData = generateTrackingData(eventType, data);
    
    console.log(`Sending ${eventType} event...`);
    console.log('Data:', JSON.stringify(trackingData, null, 2));
    
    const response = await axios.post(`${config.apiUrl}/track-event`, trackingData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${eventType} event sent successfully`);
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to send ${eventType} event:`, error.response?.data || error.message);
    return null;
  }
}

// Test all events
async function testAllEvents() {
  console.log('🧪 Starting tracking tests...\n');
  
  for (const event of testEvents) {
    await sendTrackingEvent(event.event_type, event.data);
    console.log(''); // Empty line for readability
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }
  
  console.log('✅ All tests completed!');
}

// Test specific event
async function testSpecificEvent(eventType) {
  const event = testEvents.find(e => e.event_type === eventType);
  if (!event) {
    console.error(`❌ Event type "${eventType}" not found`);
    return;
  }
  
  await sendTrackingEvent(event.event_type, event.data);
}

// Test API health
async function testApiHealth() {
  try {
    console.log('🏥 Testing API health...');
    const response = await axios.get(`${config.apiUrl}/health`);
    console.log('✅ API is healthy:', response.data);
  } catch (error) {
    console.error('❌ API health check failed:', error.response?.data || error.message);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'health':
      await testApiHealth();
      break;
    case 'event':
      const eventType = args[1];
      if (!eventType) {
        console.error('❌ Please specify an event type: node test-tracking.js event <event_type>');
        process.exit(1);
      }
      await testSpecificEvent(eventType);
      break;
    case 'all':
    default:
      await testAllEvents();
      break;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  sendTrackingEvent,
  testAllEvents,
  testApiHealth,
  generateTrackingData
}; 