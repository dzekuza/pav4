/**
 * Test Script for iPick.io Shopify Integration
 * Run this script to test the tracking functionality
 */

// Test configuration
const testConfig = {
  apiUrl: 'https://checkoutdata--development.gadget.app/api',
  affiliateId: 'ipick_test',
  utmSource: 'ipick',
  utmMedium: 'price_comparison',
  utmCampaign: 'product_referral'
};

// Test data
const testProduct = {
  id: 'test_123',
  name: 'Test Wireless Headphones',
  price: '29.99',
  store: 'Test Shopify Store'
};

const testUrl = 'https://test-shopify-store.myshopify.com/product/test-product-123';

// Test functions
async function testTrackingScript() {
  console.log('🧪 Testing iPick.io Shopify Integration...\n');

  // Test 1: Check if tracking script is available
  console.log('1. Testing tracking script availability...');
  if (typeof IpickTracking !== 'undefined') {
    console.log('✅ Tracking script loaded successfully');
  } else {
    console.log('❌ Tracking script not found. Make sure to include tracking-script-ipick.js');
    return;
  }

  // Test 2: Initialize tracking
  console.log('\n2. Testing tracking initialization...');
  try {
    const tracking = new IpickTracking(testConfig);
    console.log('✅ Tracking initialized successfully');
  } catch (error) {
    console.log('❌ Failed to initialize tracking:', error.message);
    return;
  }

  // Test 3: Test UTM parameter generation
  console.log('\n3. Testing UTM parameter generation...');
  try {
    const tracking = new IpickTracking(testConfig);
    const trackingUrl = tracking.createTrackingUrl(testUrl, {
      product_id: testProduct.id,
      product_name: testProduct.name
    });
    
    console.log('✅ UTM parameters generated successfully');
    console.log('   Original URL:', testUrl);
    console.log('   Tracking URL:', trackingUrl);
    
    // Verify UTM parameters are present
    const url = new URL(trackingUrl);
    const hasUtmSource = url.searchParams.has('utm_source');
    const hasUtmMedium = url.searchParams.has('utm_medium');
    const hasUtmCampaign = url.searchParams.has('utm_campaign');
    const hasRef = url.searchParams.has('ref');
    
    if (hasUtmSource && hasUtmMedium && hasUtmCampaign && hasRef) {
      console.log('✅ All required UTM parameters present');
    } else {
      console.log('❌ Missing required UTM parameters');
    }
  } catch (error) {
    console.log('❌ Failed to generate UTM parameters:', error.message);
  }

  // Test 4: Test referral tracking API call
  console.log('\n4. Testing referral tracking API call...');
  try {
    const tracking = new IpickTracking(testConfig);
    const success = await tracking.trackReferralClick(testUrl, testProduct);
    
    if (success) {
      console.log('✅ Referral tracking API call successful');
    } else {
      console.log('❌ Referral tracking API call failed');
    }
  } catch (error) {
    console.log('❌ Referral tracking API call error:', error.message);
  }

  // Test 5: Test custom event tracking
  console.log('\n5. Testing custom event tracking...');
  try {
    const tracking = new IpickTracking(testConfig);
    const success = await tracking.trackCustomEvent('test_event', {
      test_data: 'test_value',
      timestamp: new Date().toISOString()
    });
    
    if (success) {
      console.log('✅ Custom event tracking successful');
    } else {
      console.log('❌ Custom event tracking failed');
    }
  } catch (error) {
    console.log('❌ Custom event tracking error:', error.message);
  }

  // Test 6: Test domain extraction
  console.log('\n6. Testing domain extraction...');
  try {
    const tracking = new IpickTracking(testConfig);
    const domain = tracking.extractDomain(testUrl);
    
    if (domain === 'test-shopify-store.myshopify.com') {
      console.log('✅ Domain extraction working correctly');
    } else {
      console.log('❌ Domain extraction failed. Expected: test-shopify-store.myshopify.com, Got:', domain);
    }
  } catch (error) {
    console.log('❌ Domain extraction error:', error.message);
  }

  console.log('\n🎯 Integration Test Summary:');
  console.log('   - All tests completed');
  console.log('   - Check the results above for any issues');
  console.log('   - If all tests pass, your integration is ready!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Integrate the tracking script into your ipick.io application');
  console.log('   2. Add data attributes to your product links');
  console.log('   3. Test with real Shopify stores');
  console.log('   4. Monitor your Gadget app dashboard for tracking data');
}

// Test webhook endpoints
async function testWebhookEndpoints() {
  console.log('\n🔗 Testing Webhook Endpoints...\n');

  const webhookEndpoints = [
    'https://checkoutdata--development.gadget.app/api/webhooks/shopify/checkouts/create',
    'https://checkoutdata--development.gadget.app/api/webhooks/shopify/checkouts/update',
    'https://checkoutdata--development.gadget.app/api/webhooks/shopify/orders/create'
  ];

  for (const endpoint of webhookEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        })
      });

      if (response.status === 405) {
        console.log(`✅ ${endpoint} - Endpoint exists (Method not allowed is expected for test)`);
      } else if (response.ok) {
        console.log(`✅ ${endpoint} - Endpoint working`);
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🔗 Testing API Endpoints...\n');

  const apiEndpoints = [
    'https://checkoutdata--development.gadget.app/api/trackReferral',
    'https://checkoutdata--development.gadget.app/api/track-event'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        })
      });

      if (response.status === 400 || response.status === 422) {
        console.log(`✅ ${endpoint} - Endpoint exists (Validation error expected for test data)`);
      } else if (response.ok) {
        console.log(`✅ ${endpoint} - Endpoint working`);
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting iPick.io Shopify Integration Tests\n');
  
  await testTrackingScript();
  await testWebhookEndpoints();
  await testAPIEndpoints();
  
  console.log('\n✨ All tests completed!');
  console.log('\n📚 For detailed integration instructions, see: IPICK_INTEGRATION_GUIDE.md');
  console.log('📖 For example implementation, see: ipick-integration-example.html');
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.testIpickIntegration = runAllTests;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testTrackingScript,
    testWebhookEndpoints,
    testAPIEndpoints,
    runAllTests
  };
}

// Auto-run if this script is executed directly
if (typeof window !== 'undefined' && document.readyState === 'complete') {
  // Wait a bit for any tracking scripts to load
  setTimeout(runAllTests, 1000);
}
