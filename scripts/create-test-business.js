import { PrismaClient } from '@prisma/client';

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

    // Create test business
    const business = await prisma.business.create({
      data: {
        id: 1,
        name: 'Test Business',
        domain: 'test-business.com',
        website: 'https://test-business.com',
        description: 'Test business for tracking functionality',
        email: 'test@test-business.com',
        password: 'testpassword123',
        affiliateId: 'test-affiliate-123',
        isActive: true,
        isVerified: true,
        commission: 5.0,
        adminCommissionRate: 5.0
      }
    });

    console.log('Test business created successfully:', business);
  } catch (error) {
    console.error('Error creating test business:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBusiness(); 