const axios = require('axios');

// Test the referral system
async function testReferralSystem() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Referral System...\n');
  
  try {
    // Test 1: Test redirect API with a business domain
    console.log('1. Testing redirect API with business domain...');
    const redirectResponse = await axios.get(`${baseUrl}/api/redirect?to=https://example-business.com/product`, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    });
    
    console.log('✅ Redirect response status:', redirectResponse.status);
    console.log('📍 Redirect location:', redirectResponse.headers.location);
    console.log('');
    
    // Test 2: Test referral route
    console.log('2. Testing referral route...');
    const referralResponse = await axios.get(`${baseUrl}/ref/test-affiliate-id`, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    });
    
    console.log('✅ Referral response status:', referralResponse.status);
    console.log('📍 Referral location:', referralResponse.headers.location);
    console.log('');
    
    // Test 3: Test tracking route
    console.log('3. Testing tracking route...');
    const trackingResponse = await axios.get(`${baseUrl}/track/test-affiliate-id/example-business.com`, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    });
    
    console.log('✅ Tracking response status:', trackingResponse.status);
    console.log('📍 Tracking location:', trackingResponse.headers.location);
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testReferralSystem();
