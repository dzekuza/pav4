#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');

try {
  // Read the current .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if DATABASE_URL already exists
  if (!envContent.includes('DATABASE_URL=')) {
    // Find NETLIFY_DATABASE_URL and add DATABASE_URL with the same value
    const netlifyDbUrlMatch = envContent.match(/NETLIFY_DATABASE_URL="([^"]+)"/);
    
    if (netlifyDbUrlMatch) {
      const dbUrl = netlifyDbUrlMatch[1];
      const newEnvContent = envContent + `\nDATABASE_URL="${dbUrl}"\n`;
      
      // Write the updated content back to .env
      fs.writeFileSync(envPath, newEnvContent);
      console.log('✅ Added DATABASE_URL to .env file');
    } else {
      console.log('❌ Could not find NETLIFY_DATABASE_URL in .env file');
    }
  } else {
    console.log('✅ DATABASE_URL already exists in .env file');
  }
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
}
