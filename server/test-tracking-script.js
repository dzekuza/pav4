import fetch from 'node-fetch';

// Test the tracking script with correct business data
async function testTrackingScript() {
  console.log('🧪 Testing Tracking Script with Correct Business Data');
  console.log('');

  const testData = {
    event_type: "page_view",
    business_id: "2",
    affiliate_id: "aff_godislovel_1755091745057_n7ccoo",
    platform: "web",
    session_id: "test_session_" + Date.now(),
    user_agent: "Mozilla/5.0 (Test Browser)",
    referrer: "https://ipick.io",
    timestamp: new Date().toISOString(),
    url: "http://localhost:8085/test-tracking-correct.html",
    page_title: "iPick Tracker Test - God is Love Business",
    data: {
      product_title: "Religious Book - Faith and Hope",
      product_price: "19.99",
      product_currency: "EUR",
      product_image: "https://example.com/book-001.jpg",
      product_url: "http://localhost:8085/test-tracking-correct.html"
    }
  };

  console.log('📤 Sending test tracking data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');

  try {
    const response = await fetch('http://localhost:8085/api/track-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Tracking script test successful!');
    } else {
      console.log('❌ Tracking script test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing tracking script:', error.message);
  }
}

// Test domain verification check
async function testDomainVerification() {
  console.log('\n🔍 Testing Domain Verification Check');
  console.log('');

  try {
    const response = await fetch('http://localhost:8085/api/domain-verification/check?domain=godislove.lt', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    console.log('📥 Domain Verification Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.verified) {
      console.log('✅ Domain verification successful!');
      console.log('🏢 Business:', result.business.name);
      console.log('🆔 Business ID:', result.business.id);
      console.log('🔗 Affiliate ID:', result.business.affiliateId);
    } else {
      console.log('❌ Domain verification failed or not verified');
    }
    
  } catch (error) {
    console.error('❌ Error testing domain verification:', error.message);
  }
}

// Run tests
async function runTests() {
  await testDomainVerification();
  await testTrackingScript();
}

runTests().catch(console.error);
