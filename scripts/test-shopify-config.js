#!/usr/bin/env node

/**
 * Test script for Shopify OAuth configuration
 * Run with: node scripts/test-shopify-config.js
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

function testShopifyConfig() {
  console.log('🧪 Testing Shopify OAuth Configuration\n');

  // Check environment variables for Gadget API integration
  const gadgetApiUrl = process.env.GADGET_API_URL || 'https://itrcks.gadget.app';
  const shopifyInstallUrl = process.env.SHOPIFY_INSTALL_URL || 'https://itrcks.gadget.app/api/shopify/install-or-render';
  const shopifyCallbackUrl = process.env.SHOPIFY_CALLBACK_URL || 'https://itrcks.gadget.app/api/connections/auth/shopify/callback';
  const gadgetApiKey = process.env.GADGET_API_KEY;

  console.log('📋 Environment Variables:');
  console.log(`   GADGET_API_URL: ${gadgetApiUrl ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   SHOPIFY_INSTALL_URL: ${shopifyInstallUrl ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   SHOPIFY_CALLBACK_URL: ${shopifyCallbackUrl ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   GADGET_API_KEY: ${gadgetApiKey ? '✅ SET' : '❌ NOT SET'}`);

  console.log('\n🔧 Configuration Values:');
  console.log(`   Gadget API URL: ${gadgetApiUrl}`);
  console.log(`   Shopify Install URL: ${shopifyInstallUrl}`);
  console.log(`   Shopify Callback URL: ${shopifyCallbackUrl}`);
  console.log(`   Gadget API Key: ${gadgetApiKey ? '***SET***' : 'NOT SET'}`);

  console.log('\n✅ Configuration Validation:');
  const isValid = !!(gadgetApiUrl && shopifyInstallUrl && shopifyCallbackUrl);
  console.log(`   Valid: ${isValid ? '✅ YES' : '❌ NO'}`);

  if (!isValid) {
    console.log('\n❌ Configuration Issues:');
    if (!gadgetApiUrl) {
      console.log('   - GADGET_API_URL is not set');
    }
    if (!shopifyInstallUrl) {
      console.log('   - SHOPIFY_INSTALL_URL is not set');
    }
    if (!shopifyCallbackUrl) {
      console.log('   - SHOPIFY_CALLBACK_URL is not set');
    }

    console.log('\n🔧 To fix this:');
    console.log('   1. Configure Gadget API integration');
    console.log('   2. Set up the required environment variables');
    console.log('   3. Add the variables to your .env file');
    
    console.log('\n📝 Quick Setup:');
    console.log('   For testing, you can add these to your .env file:');
    console.log('   GADGET_API_URL="https://itrcks.gadget.app"');
    console.log('   SHOPIFY_INSTALL_URL="https://itrcks.gadget.app/api/shopify/install-or-render"');
    console.log('   SHOPIFY_CALLBACK_URL="https://itrcks.gadget.app/api/connections/auth/shopify/callback"');
    console.log('   GADGET_API_KEY="your-gadget-api-key"');
  } else {
    console.log('\n✅ Configuration is valid!');
    console.log('   You can now test the OAuth flow.');
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. Set up environment variables if not valid');
  console.log('   2. Restart your development server');
  console.log('   3. Test OAuth at /business/integrate');
  console.log('   4. Try connecting a Shopify store');
}

testShopifyConfig();
