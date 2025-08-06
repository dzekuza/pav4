import axios from 'axios';

async function testNetlifyDatabase() {
    console.log('🔍 Testing Netlify Database Connection...\n');

    try {
        // Test the /me endpoint to see if authentication works
        console.log('1️⃣ Testing /me endpoint...');
        const meResponse = await axios.get('https://pavlo4.netlify.app/api/business/auth/me', {
            withCredentials: true
        });

        console.log('✅ /me response:', meResponse.data);

        // Test the /stats endpoint to see the error
        console.log('\n2️⃣ Testing /stats endpoint...');
        const statsResponse = await axios.get('https://pavlo4.netlify.app/api/business/auth/stats', {
            withCredentials: true
        });

        console.log('✅ /stats response:', statsResponse.data);

    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
        
        if (error.response?.data?.error) {
            console.log('Error details:', error.response.data.error);
        }
    }
}

// Instructions
console.log('🚀 Netlify Database Test');
console.log('========================');
console.log('This will test the Netlify endpoints to see what\'s happening.\n');

// Uncomment to run the test
// testNetlifyDatabase(); 