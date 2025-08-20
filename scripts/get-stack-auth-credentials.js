/**
 * Get Stack Auth Credentials
 * Run with: node scripts/get-stack-auth-credentials.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getStackAuthCredentials() {
  console.log('🔧 Getting Stack Auth Credentials\n');

  console.log('📋 Current Project Information:');
  console.log('   Project ID: e6af4e47-d93c-4846-adc8-0e8c2334e5b7');
  console.log('   JWKS URL: https://api.stack-auth.com/api/v1/projects/e6af4e47-d93c-4846-adc8-0e8c2334e5b7/.well-known/jwks.json');
  console.log('   Neon Project: old-thunder-13230066');
  console.log('   Database: postgresql://neondb_owner:npg_lLWeCGKpqh24@ep-shy-credit-aesfpula.c-2.us-east-2.aws.neon.tech/neondb');
  console.log('');

  console.log('🎯 Steps to Get Stack Auth Credentials:');
  console.log('');
  console.log('1. Go to Stack Auth Dashboard:');
  console.log('   https://app.stack-auth.com');
  console.log('');
  console.log('2. Sign in with your account');
  console.log('');
  console.log('3. Find your project: e6af4e47-d93c-4846-adc8-0e8c2334e5b7');
  console.log('');
  console.log('4. Go to the "API Keys" or "Configuration" section');
  console.log('');
  console.log('5. Copy the following keys:');
  console.log('   - Publishable Client Key');
  console.log('   - Secret Server Key');
  console.log('');
  console.log('6. Update your .env file with the actual keys:');
  console.log('');
  console.log('   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_actual_publishable_key');
  console.log('   STACK_SECRET_SERVER_KEY=your_actual_secret_key');
  console.log('');

  console.log('🔗 Direct Links:');
  console.log('   - Stack Auth Dashboard: https://app.stack-auth.com');
  console.log('   - Neon Console: https://console.neon.tech');
  console.log('   - Project Auth Settings: https://console.neon.tech/projects/old-thunder-13230066/auth');
  console.log('');

  console.log('💡 Alternative: Check Neon Console Auth Section');
  console.log('   1. Go to: https://console.neon.tech/projects/old-thunder-13230066/auth');
  console.log('   2. Look for "Neon Auth" or "Stack Auth" section');
  console.log('   3. Copy the API keys from there');
  console.log('');

  // Check current .env file
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('your_neon_auth_publishable_key')) {
      console.log('⚠️  Current .env Status:');
      console.log('   ❌ Publishable Client Key: Not set (using placeholder)');
      console.log('   ❌ Secret Server Key: Not set (using placeholder)');
      console.log('');
      console.log('   Please update these values with your actual keys!');
    } else {
      console.log('✅ .env file appears to have actual keys set');
    }
  }

  console.log('🚀 After getting the keys:');
  console.log('   1. Update your .env file');
  console.log('   2. Restart your development server: npm run dev');
  console.log('   3. Test the authentication flow');
  console.log('   4. Test the Shopify OAuth popup flow');
}

// Run the script
getStackAuthCredentials().catch(console.error);
