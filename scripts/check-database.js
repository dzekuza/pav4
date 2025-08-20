/**
 * Check Database Tables
 * Run with: node scripts/check-database.js
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

async function checkDatabase() {
  console.log('🔍 Checking Database Tables\n');

  try {
    const prisma = new PrismaClient();

    // Test connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected successfully');

    // Check businesses table
    console.log('\n2. Checking businesses table...');
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        domain: true,
        createdAt: true,
        neonUserId: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`   Found ${businesses.length} businesses:`);
    businesses.forEach(business => {
      console.log(`   - ID: ${business.id}, Name: ${business.name}, Email: ${business.email}, Domain: ${business.domain}, Neon User ID: ${business.neonUserId || 'null'}`);
    });

    // Check if auth.users table exists
    console.log('\n3. Checking for auth.users table...');
    try {
      const authUsers = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
      `;
      
      if (authUsers && authUsers.length > 0) {
        console.log('   ✅ auth.users table exists');
        
        // Check auth.users content
        const users = await prisma.$queryRaw`
          SELECT id, email, created_at 
          FROM auth.users 
          ORDER BY created_at DESC 
          LIMIT 5
        `;
        
        console.log(`   Found ${users.length} users in auth.users:`);
        users.forEach(user => {
          console.log(`   - ID: ${user.id}, Email: ${user.email}, Created: ${user.created_at}`);
        });
      } else {
        console.log('   ❌ auth.users table does not exist');
      }
    } catch (error) {
      console.log('   ❌ Error checking auth.users table:', error.message);
    }

    // Check all tables in the database
    console.log('\n4. Checking all tables in database...');
    const tables = await prisma.$queryRaw`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('public', 'auth') 
      ORDER BY table_schema, table_name
    `;
    
    console.log('   Tables found:');
    tables.forEach(table => {
      console.log(`   - ${table.table_schema}.${table.table_name}`);
    });

    await prisma.$disconnect();
    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

// Run the check
checkDatabase().catch(console.error);
