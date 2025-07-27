import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseStructure() {
  try {
    console.log('Testing database structure...');
    
    // Test 1: Check if we can query businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        email: true
      }
    });
    console.log('Businesses found:', businesses.length);
    console.log('Sample business:', businesses[0]);
    
    // Test 2: Try to query with affiliateId
    try {
      const businessWithAffiliate = await prisma.business.findFirst({
        select: {
          id: true,
          name: true,
          affiliateId: true
        }
      });
      console.log('Business with affiliateId:', businessWithAffiliate);
    } catch (error) {
      console.log('Error querying affiliateId:', error.message);
    }
    
    // Test 3: Check database schema
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'businesses' 
      ORDER BY ordinal_position;
    `;
    console.log('Database columns:', result);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseStructure(); 