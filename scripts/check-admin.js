#!/usr/bin/env node
/**
 * Script to check admin status of a user
 * Usage: node scripts/check-admin.js info@gvozdovic.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserAdminStatus(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      return false;
    }

    console.log(`📋 User Information:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Admin Status: ${user.isAdmin ? '✅ Admin' : '❌ Not Admin'}`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);
    console.log(`   Updated: ${user.updatedAt.toISOString()}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/check-admin.js user@example.com');
  process.exit(1);
}

console.log(`🔍 Checking admin status for ${email}...`);

checkUserAdminStatus(email)
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
