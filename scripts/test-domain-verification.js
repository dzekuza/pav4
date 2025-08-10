import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8083'; // Adjust if your server runs on a different port

async function testDomainVerification() {
  try {
    console.log('Testing domain verification endpoint...\n');

    // Step 1: Test business login
    console.log('1. Testing business login...');
    const loginResponse = await fetch(`${BASE_URL}/api/business/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test-business.com',
        password: 'testpassword123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login failed:', loginData.error);
      return;
    }

    // Get cookies from login response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies received:', cookies);

    // Step 2: Test domain verification token generation
    console.log('\n2. Testing domain verification token generation...');
    const tokenResponse = await fetch(`${BASE_URL}/api/domain-verification/generate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        businessId: 1,
        domain: 'test-business.com'
      })
    });

    console.log('Token generation status:', tokenResponse.status);
    console.log('Token generation headers:', Object.fromEntries(tokenResponse.headers.entries()));

    const tokenData = await tokenResponse.text();
    console.log('Token generation response:', tokenData);

    try {
      const parsedTokenData = JSON.parse(tokenData);
      console.log('Parsed token data:', parsedTokenData);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDomainVerification();
