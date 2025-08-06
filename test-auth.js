const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing authentication...');
    
    // Test localhost
    console.log('\n=== Testing localhost ===');
    const localResponse = await axios.post('http://localhost:8083/api/business/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('Localhost response:', localResponse.status, localResponse.data);
    
    // Test production
    console.log('\n=== Testing production ===');
    const prodResponse = await axios.post('https://pavlo4.netlify.app/api/business/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('Production response:', prodResponse.status, prodResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAuth(); 