/**
 * Verify Environment Variables
 * Run with: node scripts/verify-env-variables.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyEnvVariables() {
  console.log('🔍 Verifying Environment Variables\n');

  try {
    const envPath = path.join(__dirname, '..', '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file not found');
      return;
    }

    console.log('✅ .env file found');
    
    // Load environment variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    console.log('\n📋 Environment Variables Status:');
    console.log('');
    
    const requiredVars = [
      'NEXT_PUBLIC_STACK_PROJECT_ID',
      'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
      'STACK_SECRET_SERVER_KEY',
      'STACK_JWKS_URL',
      'DATABASE_URL'
    ];
    
    const foundVars = {};
    
    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          foundVars[key] = value;
        }
      }
    }
    
    for (const requiredVar of requiredVars) {
      const value = foundVars[requiredVar];
      if (value) {
        if (value.includes('your_') || value.includes('placeholder')) {
          console.log(`   ❌ ${requiredVar}: Set but using placeholder value`);
        } else {
          console.log(`   ✅ ${requiredVar}: Set`);
          // Show first few characters for verification
          const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
          console.log(`       Value: ${displayValue}`);
        }
      } else {
        console.log(`   ❌ ${requiredVar}: Not set`);
      }
    }
    
    console.log('\n🔍 Stack Auth Specific Variables:');
    console.log('');
    
    const stackAuthVars = [
      'NEXT_PUBLIC_STACK_PROJECT_ID',
      'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
      'STACK_SECRET_SERVER_KEY',
      'STACK_JWKS_URL'
    ];
    
    for (const varName of stackAuthVars) {
      const value = foundVars[varName];
      if (value && !value.includes('your_') && !value.includes('placeholder')) {
        console.log(`   ✅ ${varName}: ${value.substring(0, 30)}...`);
      } else {
        console.log(`   ❌ ${varName}: Missing or placeholder`);
      }
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('');
    
    if (foundVars['NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY']?.includes('your_')) {
      console.log('❌ Issue: Publishable Client Key is using placeholder value');
      console.log('   Solution: Get the actual key from Stack Auth dashboard');
      console.log('   URL: https://app.stack-auth.com');
    }
    
    if (foundVars['STACK_SECRET_SERVER_KEY']?.includes('your_')) {
      console.log('❌ Issue: Secret Server Key is using placeholder value');
      console.log('   Solution: Get the actual key from Stack Auth dashboard');
      console.log('   URL: https://app.stack-auth.com');
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Get actual keys from Stack Auth dashboard');
    console.log('   2. Update .env file with real values');
    console.log('   3. Restart development server: npm run dev');
    console.log('   4. Test authentication flow');

  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
  }
}

// Run the verification
verifyEnvVariables().catch(console.error);
