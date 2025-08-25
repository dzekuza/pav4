import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/events/tracking - Get tracking events
router.get('/tracking', async (req, res) => {
  try {
    const { businessId, startDate, endDate } = req.query;
    
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }

    const where: any = {
      businessId: businessId as string
    };

    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const events = await prisma.trackingEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    res.json({ events });
  } catch (error) {
    console.error('Error fetching tracking events:', error);
    res.status(500).json({ error: 'Failed to fetch tracking events' });
  }
});

// GET /api/events/shopify - Get Shopify webhook events
router.get('/shopify', async (req, res) => {
  try {
    const { shopDomain, startDate, endDate } = req.query;
    
    if (!shopDomain) {
      return res.status(400).json({ error: 'shopDomain is required' });
    }

    const where: any = {
      shop_domain: shopDomain as string
    };

    if (startDate && endDate) {
      where.processed_at = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const events = await prisma.shopifyEvent.findMany({
      where,
      orderBy: { processed_at: 'desc' },
      take: 100
    });

    res.json({ events });
  } catch (error) {
    console.error('Error fetching Shopify events:', error);
    res.status(500).json({ error: 'Failed to fetch Shopify events' });
  }
});

// GET /api/events/all - Get all events combined
router.get('/all', async (req, res) => {
  try {
    const { businessId, shopDomain, startDate, endDate } = req.query;
    
    if (!businessId && !shopDomain) {
      return res.status(400).json({ error: 'Either businessId or shopDomain is required' });
    }

    const [trackingEvents, shopifyEvents] = await Promise.all([
      businessId ? prisma.trackingEvent.findMany({
        where: {
          businessId: businessId as string,
          ...(startDate && endDate ? {
            timestamp: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          } : {})
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      }) : [],
      
      shopDomain ? prisma.shopifyEvent.findMany({
        where: {
          shop_domain: shopDomain as string,
          ...(startDate && endDate ? {
            processed_at: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          } : {})
        },
        orderBy: { processed_at: 'desc' },
        take: 50
      }) : []
    ]);

    // Combine and sort events
    const allEvents = [
      ...trackingEvents.map(event => ({
        id: event.id,
        type: 'tracking',
        eventType: event.eventType,
        timestamp: event.timestamp,
        data: event.eventData,
        businessId: event.businessId,
        affiliateId: event.affiliateId,
        platform: event.platform
      })),
      ...shopifyEvents.map(event => ({
        id: event.id,
        type: 'shopify',
        eventType: event.topic,
        timestamp: event.processed_at,
        data: event.metadata,
        shopDomain: event.shop_domain,
        resourceId: event.resource_id
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ events: allEvents });
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;
