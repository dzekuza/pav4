import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBusinessLogin() {
  try {
    console.log('🔍 Testing business login for checkout events...\n');
    
    // Get the business that has checkout events
    const business = await prisma.business.findUnique({
      where: { id: 10 },
      select: {
        id: true,
        name: true,
        domain: true,
        email: true
      }
    });

    if (business) {
      console.log('✅ Found business with checkout events:');
      console.log(`  ID: ${business.id}`);
      console.log(`  Name: ${business.name}`);
      console.log(`  Domain: ${business.domain}`);
      console.log(`  Email: ${business.email}`);
      
      // Count events for this business
      const eventCounts = await prisma.trackingEvent.groupBy({
        by: ['eventType'],
        where: { businessId: 10 },
        _count: {
          eventType: true
        }
      });

      console.log('\n📊 Event counts for this business:');
      eventCounts.forEach(event => {
        console.log(`  ${event.eventType}: ${event._count.eventType}`);
      });

      console.log('\n🔑 To see checkout events locally:');
      console.log('1. Go to http://localhost:8083');
      console.log('2. Login as business with email:', business.email);
      console.log('3. Navigate to the activity page');
      console.log('4. You should see checkout events and new filter buttons');
      
    } else {
      console.log('❌ Business ID 10 not found');
    }

  } catch (error) {
    console.error('❌ Error testing business login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBusinessLogin();
