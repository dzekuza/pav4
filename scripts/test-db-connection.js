import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...\n');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test business table
    const business = await prisma.business.findUnique({
      where: { id: 1 }
    });
    console.log('✅ Business table accessible:', business ? 'Business found' : 'No business found');

    // Test domain verification table
    const domainVerifications = await prisma.domainVerification.findMany({
      take: 5
    });
    console.log('✅ Domain verification table accessible:', domainVerifications.length, 'records found');

    // Test creating a domain verification record
    const testVerification = await prisma.domainVerification.create({
      data: {
        businessId: 1,
        domain: 'test-domain.com',
        verificationToken: `test_token_${Date.now()}`,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
    console.log('✅ Domain verification record created:', testVerification.id);

    // Clean up test record
    await prisma.domainVerification.delete({
      where: { id: testVerification.id }
    });
    console.log('✅ Test record cleaned up');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
