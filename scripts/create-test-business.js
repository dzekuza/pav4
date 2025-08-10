import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestBusiness() {
  try {
    // Check if test business already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { id: 1 }
    });

    if (existingBusiness) {
      console.log('Test business already exists:', existingBusiness);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('testpassword123', 12);

    // Create test business
    const business = await prisma.business.create({
      data: {
        id: 1,
        name: 'Test Business',
        domain: 'test-business.com',
        website: 'https://test-business.com',
        description: 'Test business for tracking functionality',
        email: 'test@test-business.com',
        password: hashedPassword,
        affiliateId: 'test-affiliate-123',
        isActive: true,
        isVerified: true,
        commission: 5.0,
        adminCommissionRate: 5.0
      }
    });

    console.log('Test business created successfully:', business);
    console.log('Login credentials:');
    console.log('Email: test@test-business.com');
    console.log('Password: testpassword123');
  } catch (error) {
    console.error('Error creating test business:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBusiness(); 