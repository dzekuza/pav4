/**
 * Add Database URL to .env
 * Run with: node scripts/add-database-url.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addDatabaseUrl() {
  console.log('🔧 Adding Database URL to .env\n');

  try {
    const envPath = path.join(__dirname, '..', '.env');

    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file not found');
      return;
    }

    // Read current .env content
    const currentEnv = fs.readFileSync(envPath, 'utf8');
    
    // Check if DATABASE_URL already exists
    if (currentEnv.includes('DATABASE_URL=')) {
      console.log('✅ DATABASE_URL already exists in .env');
      return;
    }

    console.log('📝 Adding DATABASE_URL to .env...');
    
    // Add database URL
    const databaseUrl = `
# Database Connection
DATABASE_URL=postgresql://neondb_owner:npg_lLWeCGKpqh24@ep-shy-credit-aesfpula.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
`;

    // Append to .env file
    fs.appendFileSync(envPath, databaseUrl);
    console.log('✅ DATABASE_URL added to .env');

    console.log('\n📋 Database Information:');
    console.log('   Project: old-thunder-13230066');
    console.log('   Host: ep-shy-credit-aesfpula.c-2.us-east-2.aws.neon.tech');
    console.log('   Database: neondb');
    console.log('   User: neondb_owner');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Restart your development server: npm run dev');
    console.log('   2. Test the authentication flow');
    console.log('   3. Test the Shopify OAuth popup flow');

  } catch (error) {
    console.error('❌ Failed to add database URL:', error.message);
  }
}

// Run the script
addDatabaseUrl().catch(console.error);
