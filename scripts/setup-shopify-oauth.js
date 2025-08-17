#!/usr/bin/env node

/**
 * Setup script for Shopify OAuth environment variables
 * Run with: node scripts/setup-shopify-oauth.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupShopifyOAuth() {
  console.log('🔧 Shopify OAuth Environment Setup\n');
  
  console.log('📋 Prerequisites:');
  console.log('   1. Configure Gadget API integration');
  console.log('   2. Set up Shopify OAuth via Gadget');
  console.log('   3. Get your Gadget API Key\n');

  console.log('⚙️  OAuth Configuration via Gadget:');
  console.log('   - Gadget API URL: https://itrcks.gadget.app');
  console.log('   - Install URL: https://itrcks.gadget.app/api/shopify/install-or-render');
  console.log('   - Callback URL: https://itrcks.gadget.app/api/connections/auth/shopify/callback');
  console.log('   - Required scopes: read_products, read_orders, read_customers, read_inventory, read_analytics, read_marketing_events, read_sales, read_reports\n');

  const gadgetApiUrl = await question('Enter Gadget API URL (default: https://itrcks.gadget.app): ') || 'https://itrcks.gadget.app';
  const shopifyInstallUrl = await question('Enter Shopify Install URL (default: https://itrcks.gadget.app/api/shopify/install-or-render): ') || 'https://itrcks.gadget.app/api/shopify/install-or-render';
  const shopifyCallbackUrl = await question('Enter Shopify Callback URL (default: https://itrcks.gadget.app/api/connections/auth/shopify/callback): ') || 'https://itrcks.gadget.app/api/connections/auth/shopify/callback';
  const gadgetApiKey = await question('Enter your Gadget API Key: ');

  if (!gadgetApiUrl || !shopifyInstallUrl || !shopifyCallbackUrl) {
    console.log('\n❌ Error: Gadget API URL, Install URL, and Callback URL are required');
    rl.close();
    return;
  }

  // Create .env file if it doesn't exist
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Add or update Shopify OAuth variables via Gadget API
  const shopifyVars = [
    '',
    '# Shopify OAuth via Gadget API',
    `GADGET_API_URL="${gadgetApiUrl}"`,
    `SHOPIFY_INSTALL_URL="${shopifyInstallUrl}"`,
    `SHOPIFY_CALLBACK_URL="${shopifyCallbackUrl}"`,
    gadgetApiKey ? `GADGET_API_KEY="${gadgetApiKey}"` : '# GADGET_API_KEY="your-gadget-api-key"',
    ''
  ].join('\n');

  // Remove existing Shopify variables if they exist
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => 
    !line.startsWith('GADGET_API_URL=') && 
    !line.startsWith('SHOPIFY_INSTALL_URL=') && 
    !line.startsWith('SHOPIFY_CALLBACK_URL=') && 
    !line.startsWith('GADGET_API_KEY=') &&
    !line.startsWith('# Shopify OAuth')
  );

  // Add new Shopify variables
  const newEnvContent = filteredLines.join('\n') + shopifyVars;

  try {
    fs.writeFileSync(envPath, newEnvContent);
    console.log('\n✅ Environment variables saved to .env file');
    
    console.log('\n📋 Configuration Summary:');
    console.log(`   Gadget API URL: ${gadgetApiUrl}`);
    console.log(`   Shopify Install URL: ${shopifyInstallUrl}`);
    console.log(`   Shopify Callback URL: ${shopifyCallbackUrl}`);
    console.log(`   Gadget API Key: ${gadgetApiKey ? '***SET***' : 'NOT SET'}`);
    
    console.log('\n🔄 Next Steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Test the OAuth flow at /business/integrate');
    console.log('   3. Try connecting a Shopify store');
    
    console.log('\n🧪 Test Command:');
    console.log('   node scripts/test-shopify-oauth.js');
    
  } catch (error) {
    console.error('\n❌ Error saving environment variables:', error.message);
  }

  rl.close();
}

setupShopifyOAuth().catch(console.error);
