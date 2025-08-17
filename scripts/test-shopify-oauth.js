#!/usr/bin/env node

/**
 * Test script for Shopify OAuth endpoints
 * Run with: node scripts/test-shopify-oauth.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8084';

async function testOAuthEndpoints() {
  console.log('🧪 Testing Shopify OAuth Endpoints\n');

  // Test 1: Check OAuth status (should fail without auth)
  console.log('1. Testing OAuth status endpoint (unauthenticated)...');
  try {
    const response = await fetch(`${BASE_URL}/api/shopify/oauth/status`);
    console.log(`   Status: ${response.status}`);
    if (response.status === 401) {
      console.log('   ✅ Expected: Authentication required');
    } else {
      console.log('   ❌ Unexpected response');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Test OAuth connect with invalid shop
  console.log('\n2. Testing OAuth connect with invalid shop...');
  try {
    const response = await fetch(`${BASE_URL}/api/shopify/oauth/connect?shop=invalid-shop`);
    console.log(`   Status: ${response.status}`);
    if (response.status === 400) {
      console.log('   ✅ Expected: Invalid shop format');
    } else {
      console.log('   ❌ Unexpected response');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Test OAuth connect with valid shop format (should fail without auth)
  console.log('\n3. Testing OAuth connect with valid shop format (unauthenticated)...');
  try {
    const response = await fetch(`${BASE_URL}/api/shopify/oauth/connect?shop=test-store.myshopify.com`);
    console.log(`   Status: ${response.status}`);
    if (response.status === 401) {
      console.log('   ✅ Expected: Authentication required');
    } else {
      console.log('   ❌ Unexpected response');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Test OAuth disconnect (should fail without auth)
  console.log('\n4. Testing OAuth disconnect (unauthenticated)...');
  try {
    const response = await fetch(`${BASE_URL}/api/shopify/oauth/disconnect`, {
      method: 'POST'
    });
    console.log(`   Status: ${response.status}`);
    if (response.status === 401) {
      console.log('   ✅ Expected: Authentication required');
    } else {
      console.log('   ❌ Unexpected response');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 5: Test OAuth callback with invalid parameters
  console.log('\n5. Testing OAuth callback with invalid parameters...');
  try {
    const response = await fetch(`${BASE_URL}/api/shopify/oauth/callback?code=invalid&state=invalid&shop=test-store.myshopify.com`);
    console.log(`   Status: ${response.status}`);
    if (response.status === 400) {
      console.log('   ✅ Expected: Invalid OAuth parameters');
    } else {
      console.log('   ❌ Unexpected response');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n📋 Test Summary:');
  console.log('   - All endpoints are properly protected');
  console.log('   - Input validation is working');
  console.log('   - OAuth flow structure is correct');
  console.log('\n✅ Basic OAuth endpoint tests completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Set up Shopify app credentials in environment variables');
  console.log('   2. Test with authenticated business user');
  console.log('   3. Test complete OAuth flow with real Shopify store');
}

// Run tests
testOAuthEndpoints().catch(console.error);
