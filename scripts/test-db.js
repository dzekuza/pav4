import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test business table
    const businesses = await prisma.business.findMany({ take: 5 });
    console.log('✅ Business table accessible, found', businesses.length, 'businesses');
    
    // Test tracking events table
    const trackingEvents = await prisma.trackingEvent.findMany({ take: 5 });
    console.log('✅ TrackingEvent table accessible, found', trackingEvents.length, 'events');
    
    // Test creating a tracking event
    const testEvent = await prisma.trackingEvent.create({
      data: {
        eventType: 'test',
        businessId: 1,
        affiliateId: 'test-affiliate-123',
        platform: 'test',
        sessionId: 'test-session',
        userAgent: 'test-agent',
        referrer: 'test-referrer',
        timestamp: new Date(),
        url: 'test-url',
        eventData: { test: true },
        ipAddress: '127.0.0.1'
      }
    });
    console.log('✅ Successfully created tracking event:', testEvent.id);
    
    // Clean up test event
    await prisma.trackingEvent.delete({
      where: { id: testEvent.id }
    });
    console.log('✅ Successfully deleted test tracking event');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 