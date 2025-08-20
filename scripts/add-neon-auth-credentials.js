/**
 * Add Neon Auth Credentials to .env
 * Run with: node scripts/add-neon-auth-credentials.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addNeonAuthCredentials() {
  console.log('🔧 Adding Neon Auth Credentials to .env\n');

  try {
    const envPath = path.join(__dirname, '..', '.env');

    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file not found');
      console.log('💡 Please create a .env file first');
      return;
    }

    // Read current .env content
    const currentEnv = fs.readFileSync(envPath, 'utf8');
    
    // Check if Neon Auth variables already exist
    if (currentEnv.includes('NEXT_PUBLIC_STACK_PROJECT_ID')) {
      console.log('✅ Neon Auth variables already exist in .env');
      console.log('💡 Please update the following variables manually:');
    } else {
      console.log('📝 Adding Neon Auth variables to .env...');
      
      // Add Neon Auth variables
      const neonAuthVars = `
# Neon Auth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=e6af4e47-d93c-4846-adc8-0e8c2334e5b7
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_neon_auth_publishable_key
STACK_SECRET_SERVER_KEY=your_neon_auth_secret_key

# Neon Auth JWKS URL
STACK_JWKS_URL=https://api.stack-auth.com/api/v1/projects/e6af4e47-d93c-4846-adc8-0e8c2334e5b7/.well-known/jwks.json
`;

      // Append to .env file
      fs.appendFileSync(envPath, neonAuthVars);
      console.log('✅ Neon Auth variables added to .env');
    }

    console.log('\n📋 Required Environment Variables:');
    console.log('');
    console.log('# Neon Auth Configuration (UPDATE THESE)');
    console.log('NEXT_PUBLIC_STACK_PROJECT_ID=e6af4e47-d93c-4846-adc8-0e8c2334e5b7');
    console.log('NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_neon_auth_publishable_key');
    console.log('STACK_SECRET_SERVER_KEY=your_neon_auth_secret_key');
    console.log('STACK_JWKS_URL=https://api.stack-auth.com/api/v1/projects/e6af4e47-d93c-4846-adc8-0e8c2334e5b7/.well-known/jwks.json');
    console.log('');

    console.log('🎯 Next Steps:');
    console.log('1. Go to your Neon project console');
    console.log('2. Navigate to the Auth section');
    console.log('3. Copy the Publishable Client Key and Secret Server Key');
    console.log('4. Update the .env file with the actual keys');
    console.log('5. Restart your development server');

    console.log('\n🔗 Neon Console: https://console.neon.tech');

  } catch (error) {
    console.error('❌ Failed to add credentials:', error.message);
  }
}

// Run the script
addNeonAuthCredentials().catch(console.error);
