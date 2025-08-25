import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function monitorWebhooks() {
  console.log('🔍 Monitoring for webhook events from f9113b-23.myshopify.com...')
  console.log('⏰ Started monitoring at:', new Date().toISOString())
  console.log('📡 Waiting for webhook events...\n')

  let lastCheckTime = new Date()
  let eventCount = 0

  // Monitor for new events every 2 seconds
  const interval = setInterval(async () => {
    try {
      const newEvents = await prisma.shopifyEvent.findMany({
        where: {
          shop_domain: 'f9113b-23.myshopify.com',
          processed_at: {
            gte: lastCheckTime
          }
        },
        orderBy: {
          processed_at: 'desc'
        }
      })

      if (newEvents.length > 0) {
        console.log(`🎉 Found ${newEvents.length} new webhook event(s)!`)
        
        newEvents.forEach((event, index) => {
          console.log(`\n${index + 1}. New Webhook Event:`)
          console.log(`   Event ID: ${event.event_id}`)
          console.log(`   Topic: ${event.topic}`)
          console.log(`   Event Type: ${event.event_type}`)
          console.log(`   Resource ID: ${event.resource_id}`)
          console.log(`   Triggered: ${event.triggered_at}`)
          console.log(`   Processed: ${event.processed_at}`)
          console.log(`   Metadata:`, JSON.stringify(event.metadata, null, 2))
          console.log(`   Payload Preview:`, JSON.stringify(event.payload).substring(0, 200) + '...')
        })

        eventCount += newEvents.length
        console.log(`\n📊 Total events received: ${eventCount}`)
      }

      // Also check for any tracking events from the shop
      const newTrackingEvents = await prisma.trackingEvent.findMany({
        where: {
          OR: [
            { eventData: { path: ['shop_domain'], equals: 'f9113b-23.myshopify.com' } },
            { eventData: { path: ['business_domain'], equals: 'f9113b-23.myshopify.com' } }
          ],
          timestamp: {
            gte: lastCheckTime
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      if (newTrackingEvents.length > 0) {
        console.log(`🎯 Found ${newTrackingEvents.length} new tracking event(s)!`)
        
        newTrackingEvents.forEach((event, index) => {
          console.log(`\n${index + 1}. New Tracking Event:`)
          console.log(`   Event Type: ${event.eventType}`)
          console.log(`   Platform: ${event.platform}`)
          console.log(`   Business ID: ${event.businessId}`)
          console.log(`   Timestamp: ${event.timestamp}`)
          console.log(`   Event Data:`, JSON.stringify(event.eventData, null, 2))
        })
      }

      lastCheckTime = new Date()

    } catch (error) {
      console.error('❌ Error monitoring webhooks:', error)
    }
  }, 2000)

  // Stop monitoring after 5 minutes
  setTimeout(() => {
    clearInterval(interval)
    console.log('\n⏹️  Monitoring stopped after 5 minutes')
    console.log(`📊 Total events received: ${eventCount}`)
    process.exit(0)
  }, 5 * 60 * 1000)

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval)
    console.log('\n⏹️  Monitoring stopped by user')
    console.log(`📊 Total events received: ${eventCount}`)
    process.exit(0)
  })
}

monitorWebhooks().catch(error => {
  console.error('❌ Error starting webhook monitor:', error)
  process.exit(1)
})
