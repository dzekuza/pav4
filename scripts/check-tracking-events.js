import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTrackingEvents() {
  try {
    console.log('🔍 Checking recent tracking events for beautyday business...')
    
    // Get recent events for business ID 4 (beautyday)
    const events = await prisma.trackingEvent.findMany({
      where: {
        businessId: 4
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10,
      select: {
        id: true,
        eventType: true,
        affiliateId: true,
        sessionId: true,
        url: true,
        timestamp: true,
        eventData: true
      }
    })
    
    console.log(`📊 Found ${events.length} recent tracking events:`)
    console.log('')
    
    events.forEach((event, index) => {
      console.log(`${index + 1}. Event ID: ${event.id}`)
      console.log(`   Type: ${event.eventType}`)
      console.log(`   Session: ${event.sessionId}`)
      console.log(`   URL: ${event.url}`)
      console.log(`   Time: ${event.timestamp.toLocaleString()}`)
      console.log(`   Data: ${JSON.stringify(event.eventData)}`)
      console.log('')
    })
    
    // Get business stats
    const business = await prisma.business.findUnique({
      where: { id: 4 },
      select: {
        name: true,
        totalVisits: true,
        totalPurchases: true,
        totalRevenue: true
      }
    })
    
    if (business) {
      console.log('📈 Business Statistics:')
      console.log(`   Name: ${business.name}`)
      console.log(`   Total Visits: ${business.totalVisits}`)
      console.log(`   Total Purchases: ${business.totalPurchases}`)
      console.log(`   Total Revenue: €${business.totalRevenue}`)
    }
    
  } catch (error) {
    console.error('❌ Error checking tracking events:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTrackingEvents()
