/**
 * Create Test Business Account
 * Run with: node scripts/create-test-business.js
 */

const BASE_URL = 'http://localhost:8083';

async function createTestBusiness() {
  console.log('🔧 Creating Test Business Account\n');

  try {
    // Test 1: Check server status
    console.log('1. Checking server status...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    console.log('   Health check status:', healthResponse.status);
    
    if (!healthResponse.ok) {
      console.log('   ❌ Server not running');
      return;
    }
    console.log('   ✅ Server is running');

    // Test 2: Create business account
    console.log('\n2. Creating test business account...');
    const registerResponse = await fetch(`${BASE_URL}/api/business/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Business',
        domain: 'testbusiness.com',
        website: 'https://testbusiness.com',
        description: 'Test business for OAuth testing',
        email: 'test@testbusiness.com',
        password: 'testpassword123',
        contactEmail: 'test@testbusiness.com',
        category: 'Technology',
        commission: 5.0
      })
    });

    console.log('   Register endpoint status:', registerResponse.status);
    
    if (registerResponse.ok) {
      const data = await registerResponse.json();
      console.log('   ✅ Business account created successfully');
      console.log('   Business ID:', data.business?.id);
      console.log('   Business Name:', data.business?.name);
      console.log('   Domain:', data.business?.domain);
      console.log('   Email:', data.business?.email);
      console.log('   Affiliate ID:', data.business?.affiliateId);
      
      // Test 3: Login with the new account
      console.log('\n3. Testing login with new account...');
      const loginResponse = await fetch(`${BASE_URL}/api/business/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@testbusiness.com',
          password: 'testpassword123'
        })
      });

      console.log('   Login endpoint status:', loginResponse.status);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('   ✅ Login successful');
        console.log('   Token received:', !!loginData.token);
        
        // Test 4: Test OAuth endpoint with authentication
        console.log('\n4. Testing OAuth endpoint with authentication...');
        const oauthResponse = await fetch(`${BASE_URL}/api/shopify/oauth/connect?shop=checkoutipick.myshopify.com`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('   OAuth endpoint status:', oauthResponse.status);
        
        if (oauthResponse.ok) {
          const oauthData = await oauthResponse.json();
          console.log('   ✅ OAuth endpoint working');
          console.log('   Redirect URL:', oauthData.redirectUrl);
          console.log('   Shop:', oauthData.shop);
          console.log('   Business ID:', oauthData.businessId);
        } else {
          console.log('   ❌ OAuth endpoint failed');
          const errorText = await oauthResponse.text();
          console.log('   Error:', errorText);
        }

      } else {
        console.log('   ❌ Login failed');
        const errorText = await loginResponse.text();
        console.log('   Error:', errorText);
      }

    } else {
      console.log('   ❌ Business registration failed');
      const errorText = await registerResponse.text();
      console.log('   Error:', errorText);
    }

    console.log('\n✅ Test Business Creation Complete!');
    console.log('\n💡 Test Account Details:');
    console.log('   Email: test@testbusiness.com');
    console.log('   Password: testpassword123');
    console.log('   Domain: testbusiness.com');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure server is running: npm run dev');
    console.log('   2. Check database connection');
    console.log('   3. Verify environment variables are set');
  }
}

// Run the test
createTestBusiness().catch(console.error);
