import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixDatabase() {
  try {
    console.log('Checking businesses...');
    
    // Check current businesses
    const businesses = await prisma.business.findMany();
    console.log('Current businesses:', businesses.map(b => ({ id: b.id, name: b.name, affiliateId: b.affiliateId })));
    
    // Update businesses without affiliateId
    const updateResult = await prisma.business.updateMany({
      where: {
        affiliateId: null
      },
      data: {
        affiliateId: {
          set: prisma.business.fields.id
        }
      }
    });
    
    console.log('Updated businesses:', updateResult);
    
    // Check again
    const updatedBusinesses = await prisma.business.findMany();
    console.log('Updated businesses:', updatedBusinesses.map(b => ({ id: b.id, name: b.name, affiliateId: b.affiliateId })));
    
    // Test track-sale with a real affiliateId
    if (updatedBusinesses.length > 0) {
      const testBusiness = updatedBusinesses[0];
      console.log('Testing track-sale with business:', testBusiness.name, 'affiliateId:', testBusiness.affiliateId);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixDatabase(); 