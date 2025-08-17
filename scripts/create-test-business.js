#!/usr/bin/env node

/**
 * Create a test business account for testing the login functionality
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestBusiness() {
  try {
    console.log('🔧 Creating test business account...');

    // Check if test business already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { email: 'test@ipick.io' }
    });

    if (existingBusiness) {
      console.log('✅ Test business account already exists');
      console.log('Email: test@ipick.io');
      console.log('Password: testpassword123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    // Create test business
    const business = await prisma.business.create({
      data: {
        name: 'Test Business',
        domain: 'test-ipick.io',
        website: 'https://test-ipick.io',
        description: 'Test business for development',
        email: 'test@ipick.io',
        password: hashedPassword,
        affiliateId: 'test-affiliate-' + Date.now(),
        isActive: true,
        isVerified: true,
        commission: 10.0,
        adminCommissionRate: 5.0
      }
    });

    console.log('✅ Test business account created successfully!');
    console.log('Email: test@ipick.io');
    console.log('Password: testpassword123');
    console.log('Business ID:', business.id);

  } catch (error) {
    console.error('❌ Error creating test business:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestBusiness().catch(console.error);
}

export { createTestBusiness };
