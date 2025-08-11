#!/usr/bin/env node
/**
 * Script to set a user as admin
 * Usage: node scripts/set-admin.js info@gvozdovic.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setUserAsAdmin(email) {
  try {
    // Update the user to set isAdmin to true
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    });

    console.log(`✅ Successfully set ${email} as admin`);
    console.log(`User ID: ${updatedUser.id}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Admin status: ${updatedUser.isAdmin}`);
    
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`❌ User with email ${email} not found`);
    } else {
      console.error('❌ Error updating user:', error.message);
    }
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/set-admin.js user@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Please provide a valid email address');
  process.exit(1);
}

console.log(`🔄 Setting ${email} as admin...`);

setUserAsAdmin(email)
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
