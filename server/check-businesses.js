import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    console.log('🔍 Checking business data...\n');
    
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        affiliateId: true,
        email: true,
        totalVisits: true,
        totalPurchases: true
      }
    });
    
    console.log('📊 Businesses in database:');
    console.log(JSON.stringify(businesses, null, 2));
    
    // Check domain verifications
    const verifications = await prisma.domainVerification.findMany({
      include: {
        business: {
          select: {
            id: true,
            name: true,
            affiliateId: true
          }
        }
      }
    });
    
    console.log('\n🔗 Domain verifications:');
    console.log(JSON.stringify(verifications, null, 2));
    
    // Check tracking events
    const trackingEvents = await prisma.trackingEvent.findMany({
      take: 5,
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        id: true,
        eventType: true,
        businessId: true,
        affiliateId: true,
        timestamp: true
      }
    });
    
    console.log('\n📈 Recent tracking events:');
    console.log(JSON.stringify(trackingEvents, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses();
