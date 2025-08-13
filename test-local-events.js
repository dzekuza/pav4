import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLocalEvents() {
  try {
    console.log('🔍 Testing local checkout events...\n');
    
    // Get all checkout-related events
    const checkoutEvents = await prisma.trackingEvent.findMany({
      where: {
        eventType: {
          in: ['checkout_start', 'checkout_complete', 'add_to_cart']
        }
      },
      select: {
        id: true,
        eventType: true,
        businessId: true,
        timestamp: true,
        eventData: true,
        url: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    console.log('📊 Checkout events found:', checkoutEvents.length);
    
    if (checkoutEvents.length > 0) {
      console.log('\n📈 Recent checkout events:');
      checkoutEvents.forEach(event => {
        console.log(`  ${event.timestamp.toISOString()} - ${event.eventType} (Business: ${event.businessId})`);
        if (event.url) {
          console.log(`    URL: ${event.url}`);
        }
        if (event.eventData) {
          try {
            const data = typeof event.eventData === 'string' ? JSON.parse(event.eventData) : event.eventData;
            console.log(`    Data: ${JSON.stringify(data, null, 2)}`);
          } catch (e) {
            console.log(`    Data: ${event.eventData}`);
          }
        }
      });
    } else {
      console.log('❌ No checkout events found in database');
    }

    // Get business info
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        domain: true
      }
    });

    console.log('\n🏢 Available businesses:');
    businesses.forEach(business => {
      console.log(`  ${business.id}: ${business.name} (${business.domain})`);
    });

  } catch (error) {
    console.error('❌ Error testing local events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLocalEvents();
