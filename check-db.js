import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking Netlify Database Content...\n');

    // Check Business table
    console.log('📊 BUSINESS TABLE:');
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        domain: true,
        totalVisits: true,
        totalPurchases: true,
        totalRevenue: true,
        affiliateId: true,
        trackingVerified: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${businesses.length} businesses:`);
    businesses.forEach(business => {
      console.log(`  - ID: ${business.id}`);
      console.log(`    Name: ${business.name}`);
      console.log(`    Email: ${business.email}`);
      console.log(`    Domain: ${business.domain}`);
      console.log(`    Visits: ${business.totalVisits}`);
      console.log(`    Purchases: ${business.totalPurchases}`);
      console.log(`    Revenue: $${business.totalRevenue}`);
      console.log(`    Affiliate ID: ${business.affiliateId}`);
      console.log(`    Tracking Verified: ${business.trackingVerified}`);
      console.log(`    Active: ${business.isActive}`);
      console.log(`    Created: ${business.createdAt}`);
      console.log('');
    });

    // Check User table
    console.log('👥 USER TABLE:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Admin: ${user.isAdmin}`);
      console.log(`    Created: ${user.createdAt}`);
      console.log('');
    });

    // Check Sale table
    console.log('💰 SALE TABLE:');
    const sales = await prisma.sale.findMany({
      select: {
        id: true,
        businessId: true,
        productPrice: true,
        commissionAmount: true,
        status: true,
        createdAt: true,
        orderId: true,
        productTitle: true,
        retailer: true
      },
      take: 10
    });
    
    console.log(`Found ${sales.length} sales (showing first 10):`);
    sales.forEach(sale => {
      console.log(`  - ID: ${sale.id}`);
      console.log(`    Order ID: ${sale.orderId}`);
      console.log(`    Business ID: ${sale.businessId}`);
      console.log(`    Product: ${sale.productTitle || 'N/A'}`);
      console.log(`    Price: $${sale.productPrice}`);
      console.log(`    Commission: $${sale.commissionAmount || 0}`);
      console.log(`    Retailer: ${sale.retailer}`);
      console.log(`    Status: ${sale.status}`);
      console.log(`    Created: ${sale.createdAt}`);
      console.log('');
    });

    // Check TrackingEvent table
    console.log('📈 TRACKING EVENTS:');
    const trackingEvents = await prisma.trackingEvent.findMany({
      select: {
        id: true,
        businessId: true,
        eventType: true,
        eventData: true,
        timestamp: true,
        affiliateId: true,
        platform: true
      },
      take: 5
    });
    
    console.log(`Found ${trackingEvents.length} tracking events (showing first 5):`);
    trackingEvents.forEach(event => {
      console.log(`  - ID: ${event.id}`);
      console.log(`    Business ID: ${event.businessId}`);
      console.log(`    Type: ${event.eventType}`);
      console.log(`    Affiliate ID: ${event.affiliateId}`);
      console.log(`    Platform: ${event.platform}`);
      console.log(`    Data: ${JSON.stringify(event.eventData)}`);
      console.log(`    Timestamp: ${event.timestamp}`);
      console.log('');
    });

    // Check Commission table
    console.log('💸 COMMISSION TABLE:');
    const commissions = await prisma.commission.findMany({
      select: {
        id: true,
        saleId: true,
        userId: true,
        amount: true,
        rate: true,
        status: true,
        createdAt: true
      },
      take: 5
    });
    
    console.log(`Found ${commissions.length} commissions (showing first 5):`);
    commissions.forEach(commission => {
      console.log(`  - ID: ${commission.id}`);
      console.log(`    Sale ID: ${commission.saleId}`);
      console.log(`    User ID: ${commission.userId}`);
      console.log(`    Amount: $${commission.amount}`);
      console.log(`    Rate: ${commission.rate}%`);
      console.log(`    Status: ${commission.status}`);
      console.log(`    Created: ${commission.createdAt}`);
      console.log('');
    });

    // Check BusinessClick table
    console.log('🖱️ BUSINESS CLICKS:');
    const businessClicks = await prisma.businessClick.findMany({
      select: {
        id: true,
        businessId: true,
        productUrl: true,
        productTitle: true,
        timestamp: true
      },
      take: 5
    });
    
    console.log(`Found ${businessClicks.length} business clicks (showing first 5):`);
    businessClicks.forEach(click => {
      console.log(`  - ID: ${click.id}`);
      console.log(`    Business ID: ${click.businessId}`);
      console.log(`    Product: ${click.productTitle || 'N/A'}`);
      console.log(`    URL: ${click.productUrl}`);
      console.log(`    Timestamp: ${click.timestamp}`);
      console.log('');
    });

    // Check BusinessConversion table
    console.log('🔄 BUSINESS CONVERSIONS:');
    const businessConversions = await prisma.businessConversion.findMany({
      select: {
        id: true,
        businessId: true,
        productUrl: true,
        productTitle: true,
        productPrice: true,
        timestamp: true
      },
      take: 5
    });
    
    console.log(`Found ${businessConversions.length} business conversions (showing first 5):`);
    businessConversions.forEach(conversion => {
      console.log(`  - ID: ${conversion.id}`);
      console.log(`    Business ID: ${conversion.businessId}`);
      console.log(`    Product: ${conversion.productTitle || 'N/A'}`);
      console.log(`    Price: ${conversion.productPrice || 'N/A'}`);
      console.log(`    URL: ${conversion.productUrl}`);
      console.log(`    Timestamp: ${conversion.timestamp}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 