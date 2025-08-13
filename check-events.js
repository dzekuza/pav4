import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEvents() {
  try {
    console.log('🔍 Checking tracking events in database...\n');
    
    // Check total events
    const totalEvents = await prisma.trackingEvent.count();
    console.log(`📊 Total tracking events: ${totalEvents}`);
    
    // Check events by type
    const eventsByType = await prisma.trackingEvent.groupBy({
      by: ['eventType'],
      _count: {
        eventType: true
      }
    });
    
    console.log('\n📈 Events by type:');
    eventsByType.forEach(event => {
      console.log(`  ${event.eventType}: ${event._count.eventType}`);
    });
    
    // Check recent events
    const recentEvents = await prisma.trackingEvent.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        id: true,
        eventType: true,
        businessId: true,
        url: true,
        timestamp: true
      }
    });
    
    console.log('\n🕒 Recent events (last 10):');
    recentEvents.forEach(event => {
      console.log(`  ${event.timestamp.toISOString()} - ${event.eventType} (${event.businessId})`);
    });
    
    // Check businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        _count: {
          select: {
            trackingEvents: true
          }
        }
      }
    });
    
    console.log('\n🏢 Businesses and their event counts:');
    businesses.forEach(business => {
      console.log(`  ${business.name} (${business.domain}): ${business._count.trackingEvents} events`);
    });
    
  } catch (error) {
    console.error('❌ Error checking events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents();
