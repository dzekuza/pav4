#!/usr/bin/env node
/**
 * Script to check business account information
 * Usage: node scripts/check-business.js godislove.lt
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusiness(domainOrEmail) {
  try {
    // Try to find by domain first
    let business = await prisma.business.findUnique({
      where: { domain: domainOrEmail },
      select: {
        id: true,
        name: true,
        domain: true,
        email: true,
        isActive: true,
        isVerified: true,
        affiliateId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!business) {
      // Try to find by email
      business = await prisma.business.findUnique({
        where: { email: domainOrEmail },
        select: {
          id: true,
          name: true,
          domain: true,
          email: true,
          isActive: true,
          isVerified: true,
          affiliateId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    if (!business) {
      console.error(`❌ Business with domain or email "${domainOrEmail}" not found`);
      return false;
    }

    console.log(`📋 Business Information:`);
    console.log(`   ID: ${business.id}`);
    console.log(`   Name: ${business.name}`);
    console.log(`   Domain: ${business.domain}`);
    console.log(`   Email: ${business.email}`);
    console.log(`   Active: ${business.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`   Verified: ${business.isVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Affiliate ID: ${business.affiliateId}`);
    console.log(`   Created: ${business.createdAt.toISOString()}`);
    console.log(`   Updated: ${business.updatedAt.toISOString()}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error checking business:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get domain or email from command line arguments
const domainOrEmail = process.argv[2];

if (!domainOrEmail) {
  console.error('❌ Please provide a domain or email');
  console.error('Usage: node scripts/check-business.js domain.com');
  process.exit(1);
}

console.log(`🔍 Checking business for "${domainOrEmail}"...`);

checkBusiness(domainOrEmail)
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });


