const axios = require('axios');

async function verifyAuth() {
  const testCredentials = {
    email: 'your-business-email@example.com', // Replace with your actual email
    password: 'your-password' // Replace with your actual password
  };

  console.log('🔍 Verifying authentication...\n');

  try {
    // Test production authentication
    console.log('📡 Testing production authentication...');
    const response = await axios.post('https://pavlo4.netlify.app/api/business/auth/login', testCredentials, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    if (response.data.success) {
      console.log('✅ Authentication successful!');
      console.log('📊 Response:', {
        status: response.status,
        business: response.data.business,
        message: response.data.message
      });
      
      // Check if cookies are set
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        console.log('🍪 Cookies set:', cookies.length, 'cookies');
      } else {
        console.log('⚠️  No cookies found in response');
      }
    } else {
      console.log('❌ Authentication failed:', response.data.error);
    }

  } catch (error) {
    console.log('❌ Error during authentication:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Network error:', error.message);
    }
  }
}

// Instructions
console.log('🚀 Authentication Verification Script');
console.log('====================================');
console.log('Before running this script:');
console.log('1. Replace the test credentials with your actual business credentials');
console.log('2. Make sure you have deployed the environment variables to Netlify');
console.log('3. Run: node verify-auth.js\n');

// Uncomment the line below to run the verification
// verifyAuth(); 