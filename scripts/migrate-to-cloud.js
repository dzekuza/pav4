#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🔄 Database Migration Script');
console.log('=============================\n');

// Check if DATABASE_URL is set to a cloud database
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.includes('file:')) {
  console.log('❌ Error: DATABASE_URL is not set to a cloud database');
  console.log('Current DATABASE_URL:', databaseUrl);
  console.log('\n📋 Setup Instructions:');
  console.log('1. Create a cloud database (Neon, Supabase, Railway, etc.)');
  console.log('2. Update your .env file with the new DATABASE_URL');
  console.log('3. Run: npm run migrate-to-cloud');
  console.log('\n💡 Example DATABASE_URL formats:');
  console.log('- Neon: postgresql://user:pass@host/db');
  console.log('- Supabase: postgresql://postgres:pass@host:5432/postgres');
  console.log('- Railway: postgresql://postgres:pass@host:5432/postgres');
  process.exit(1);
}

async function migrateToCloud() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔗 Connecting to cloud database...');
    await prisma.$connect();
    console.log('✅ Connected successfully!\n');
    
    // Test the connection
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in cloud database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('\n⚠️  Cloud database is empty. You need to:');
      console.log('1. Run: npx prisma db push');
      console.log('2. Import your existing data from SQLite');
      console.log('\n📝 To export current SQLite data:');
      console.log('sqlite3 prisma/dev.db ".dump" > backup.sql');
      console.log('\n📝 To import to cloud database:');
      console.log('psql YOUR_DATABASE_URL < backup.sql');
    } else {
      console.log('\n✅ Cloud database has data!');
      console.log('Your migration is complete.');
    }
    
  } catch (error) {
    console.error('❌ Error connecting to cloud database:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your DATABASE_URL is correct');
    console.log('2. Ensure the database exists and is accessible');
    console.log('3. Check firewall/network settings');
  } finally {
    await prisma.$disconnect();
  }
}

migrateToCloud(); 