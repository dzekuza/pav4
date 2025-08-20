/**
 * Update Environment Variables
 * Run with: node scripts/update-env-variables.js
 */

import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');

// New Neon Auth credentials
const newEnvVars = {
  'NEXT_PUBLIC_STACK_PROJECT_ID': 'e6af4e47-d93c-4846-adc8-0e8c2334e5b7',
  'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY': 'pck_sp6jtyzmg8jfvjh23cr8w589z9e3mc4517567qq07prv8',
  'STACK_SECRET_SERVER_KEY': 'ssk_aj2c4zekjw54jj8a0rahb5q8a016bab75h4pf80d8xmz0',
  'VITE_PUBLIC_STACK_PROJECT_ID': 'e6af4e47-d93c-4846-adc8-0e8c2334e5b7',
  'VITE_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY': 'pck_sp6jtyzmg8jfvjh23cr8w589z9e3mc4517567qq07prv8',
  'VITE_STACK_SECRET_SERVER_KEY': 'ssk_aj2c4zekjw54jj8a0rahb5q8a016bab75h4pf80d8xmz0'
};

function updateEnvFile() {
  console.log('🔄 Updating environment variables...\n');

  try {
    // Read existing .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Split into lines
    const lines = envContent.split('\n');
    const updatedLines = [];
    const updatedVars = [];

    // Process existing lines
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        updatedLines.push(line);
        continue;
      }

      const [key] = trimmedLine.split('=');
      if (key && newEnvVars[key]) {
        // Update existing variable
        updatedLines.push(`${key}=${newEnvVars[key]}`);
        updatedVars.push(key);
        console.log(`✅ Updated: ${key}`);
      } else {
        // Keep existing line
        updatedLines.push(line);
      }
    }

    // Add new variables that don't exist
    for (const [key, value] of Object.entries(newEnvVars)) {
      if (!updatedVars.includes(key)) {
        updatedLines.push(`${key}=${value}`);
        console.log(`➕ Added: ${key}`);
      }
    }

    // Write back to file
    fs.writeFileSync(envPath, updatedLines.join('\n'));
    
    console.log('\n✅ Environment variables updated successfully!');
    console.log('\n📋 Updated variables:');
    Object.keys(newEnvVars).forEach(key => {
      console.log(`   ${key}=${newEnvVars[key]}`);
    });

  } catch (error) {
    console.error('❌ Error updating environment variables:', error.message);
  }
}

// Run the update
updateEnvFile();
