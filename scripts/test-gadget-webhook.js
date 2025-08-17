#!/usr/bin/env node

/**
 * Test script for Gadget webhook integration
 * This script tests the webhook signature verification and endpoint functionality
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

const WEBHOOK_SECRET = process.env.IPICK_WEBHOOK_SECRET || 'npg_lLWeCGKpqh2413ygrbrsbr';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/gadget';

// Test webhook payload
const testPayload = {
  type: 'shopify_connection_created',
  payload: {
    shop: 'test-store.myshopify.com',
    businessId: 1,
    timestamp: new Date().toISOString()
  }
};

// Generate webhook signature
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');
}

// Test webhook endpoint
async function testWebhook() {
  try {
    console.log('🧪 Testing Gadget webhook integration...\n');

    // Test 1: Valid signature
    console.log('1. Testing with valid signature...');
    const validSignature = generateSignature(testPayload, WEBHOOK_SECRET);
    
    const validResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gadget-signature': validSignature
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`   Status: ${validResponse.status}`);
    const validResult = await validResponse.json();
    console.log(`   Response:`, validResult);

    // Test 2: Invalid signature
    console.log('\n2. Testing with invalid signature...');
    const invalidSignature = 'invalid_signature';
    
    const invalidResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gadget-signature': invalidSignature
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`   Status: ${invalidResponse.status}`);
    const invalidResult = await invalidResponse.json();
    console.log(`   Response:`, invalidResult);

    // Test 3: Missing signature
    console.log('\n3. Testing with missing signature...');
    
    const missingResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`   Status: ${missingResponse.status}`);
    const missingResult = await missingResponse.json();
    console.log(`   Response:`, missingResult);

    // Test 4: Different webhook types
    console.log('\n4. Testing different webhook types...');
    
    const webhookTypes = [
      'shopify_connection_updated',
      'shopify_connection_deleted',
      'order_created',
      'order_updated'
    ];

    for (const type of webhookTypes) {
      const testData = {
        type,
        payload: {
          shop: 'test-store.myshopify.com',
          businessId: 1,
          timestamp: new Date().toISOString()
        }
      };

      const signature = generateSignature(testData, WEBHOOK_SECRET);
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gadget-signature': signature
        },
        body: JSON.stringify(testData)
      });

      console.log(`   ${type}: ${response.status}`);
    }

    console.log('\n✅ Webhook tests completed!');

  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    process.exit(1);
  }
}

// Test OAuth configuration
async function testOAuthConfig() {
  try {
    console.log('\n🔧 Testing OAuth configuration...\n');

    const oauthUrl = 'http://localhost:3000/api/shopify/oauth/webhook-config';
    
    const response = await fetch(oauthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This would need proper authentication in a real test
        'Authorization': 'Bearer test-token'
      }
    });

    console.log(`OAuth Config Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('OAuth Config Response:', result);
    } else {
      console.log('OAuth Config Error:', await response.text());
    }

  } catch (error) {
    console.error('❌ OAuth config test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Gadget integration tests...\n');
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Webhook Secret: ${WEBHOOK_SECRET ? 'configured' : 'missing'}\n`);

  await testWebhook();
  await testOAuthConfig();

  console.log('\n🎉 All tests completed!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testWebhook, testOAuthConfig };
