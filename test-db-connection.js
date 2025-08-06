import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const businessCount = await prisma.business.count();
    console.log(`✅ Found ${businessCount} businesses`);
    
    // Test User table specifically
    console.log('🔍 Testing User table...');
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        isAdmin: true
      }
    });
    console.log(`✅ Found ${users.length} users`);
    
    // Test Business table
    console.log('🔍 Testing Business table...');
    const businesses = await prisma.business.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    console.log(`✅ Found ${businesses.length} businesses`);
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 