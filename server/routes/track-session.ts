import { RequestHandler } from "express";
import { prisma } from "../services/database";

interface TrackingEvent {
  event_type: string;
  business_id: string;
  affiliate_id: string;
  platform: string;
  session_id: string;
  user_agent?: string;
  referrer?: string;
  timestamp: string;
  url?: string;
  page_title?: string;
  data?: any;
}

interface SessionData {
  sessionId: string;
  businessId: string;
  events: TrackingEvent[];
  checkoutToken?: string;
  orderId?: string;
  conversionValue?: number;
}

// Store session data in memory (in production, use Redis or database)
const sessionStore = new Map<string, SessionData>();

// Track session events and link with checkout data
export const trackSessionEvent: RequestHandler = async (req, res) => {
  try {
    const event: TrackingEvent = req.body;

    // Validate required fields
    if (!event.event_type || !event.business_id || !event.session_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: event_type, business_id, session_id"
      });
    }

    // Find or create session data
    const sessionKey = `${event.business_id}:${event.session_id}`;
    let sessionData = sessionStore.get(sessionKey);
    
    if (!sessionData) {
      sessionData = {
        sessionId: event.session_id,
        businessId: event.business_id,
        events: []
      };
      sessionStore.set(sessionKey, sessionData);
    }

    // Add event to session
    sessionData.events.push(event);

    // Store event in database
    const trackingEvent = await prisma.trackingEvent.create({
      data: {
        eventType: event.event_type,
        businessId: parseInt(event.business_id),
        affiliateId: event.affiliate_id,
        platform: event.platform,
        sessionId: event.session_id,
        userAgent: event.user_agent,
        referrer: event.referrer,
        timestamp: new Date(event.timestamp),
        url: event.url,
        eventData: event.data || {},
        ipAddress: req.ip
      }
    });

    // Check if this is a checkout-related event
    if (event.event_type === 'checkout_start' || event.event_type === 'checkout_complete') {
      sessionData.checkoutToken = event.data?.checkout_token;
      
      if (event.event_type === 'checkout_complete') {
        sessionData.conversionValue = parseFloat(event.data?.totalPrice || '0');
        
        // Try to link with order data
        await linkSessionWithOrder(sessionData);
      }
    }

    // Check if this is an order event
    if (event.event_type === 'order_created') {
      sessionData.orderId = event.data?.order_id;
      sessionData.conversionValue = parseFloat(event.data?.totalPrice || '0');
      
      // Link session with order
      await linkSessionWithOrder(sessionData);
    }

    res.json({
      success: true,
      message: "Event tracked successfully",
      event_id: trackingEvent.id,
      session_key: sessionKey
    });

  } catch (error) {
    console.error("Error tracking session event:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track session event"
    });
  }
};

// Link session with order data
async function linkSessionWithOrder(sessionData: SessionData) {
  try {
    // Find the business
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { domain: sessionData.businessId },
          { affiliateId: sessionData.businessId }
        ]
      }
    });

    if (!business) {
      console.warn(`Business not found for session: ${sessionData.businessId}`);
      return;
    }

    // Create or update business conversion record
    if (sessionData.conversionValue && sessionData.conversionValue > 0) {
      // Check if conversion already exists for this session
      const existingConversion = await prisma.businessConversion.findFirst({
        where: {
          businessId: business.id,
          sessionId: sessionData.sessionId
        }
      });

      if (existingConversion) {
        // Update existing conversion
        await prisma.businessConversion.update({
          where: { id: existingConversion.id },
          data: {
            productPrice: sessionData.conversionValue.toString(),
            timestamp: new Date()
          }
        });
      } else {
        // Create new conversion
        await prisma.businessConversion.create({
          data: {
            businessId: business.id,
            productUrl: sessionData.events[0]?.url || '',
            productTitle: sessionData.events[0]?.page_title || '',
            productPrice: sessionData.conversionValue.toString(),
            sessionId: sessionData.sessionId,
            timestamp: new Date()
          }
        });
      }

      // Update business stats
      await prisma.business.update({
        where: { id: business.id },
        data: {
          totalPurchases: { increment: 1 },
          totalRevenue: { increment: sessionData.conversionValue }
        }
      });
    }

    console.log(`Linked session ${sessionData.sessionId} with order for business ${business.id}`);
  } catch (error) {
    console.error("Error linking session with order:", error);
  }
}

// Get session analytics
export const getSessionAnalytics: RequestHandler = async (req, res) => {
  try {
    const { businessId, sessionId } = req.query;

    if (!businessId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: businessId, sessionId"
      });
    }

    const sessionKey = `${businessId}:${sessionId}`;
    const sessionData = sessionStore.get(sessionKey);

    if (!sessionData) {
      return res.json({
        success: true,
        data: {
          sessionId,
          businessId,
          events: [],
          hasConversion: false,
          conversionValue: 0
        }
      });
    }

    // Get events from database for this session
    const events = await prisma.trackingEvent.findMany({
      where: {
        businessId: parseInt(businessId as string),
        sessionId: sessionId as string
      },
      orderBy: { timestamp: 'asc' }
    });

    const hasConversion = sessionData.conversionValue && sessionData.conversionValue > 0;

    res.json({
      success: true,
      data: {
        sessionId,
        businessId,
        events: events.map(event => ({
          id: event.id,
          eventType: event.eventType,
          timestamp: event.timestamp,
          url: event.url,
          eventData: event.eventData
        })),
        hasConversion,
        conversionValue: sessionData.conversionValue || 0,
        checkoutToken: sessionData.checkoutToken,
        orderId: sessionData.orderId
      }
    });

  } catch (error) {
    console.error("Error getting session analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get session analytics"
    });
  }
};

// Get business session summary
export const getBusinessSessionSummary: RequestHandler = async (req, res) => {
  try {
    const { businessId } = req.query;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: businessId"
      });
    }

    // Get all sessions for this business
    const sessions = await prisma.trackingEvent.findMany({
      where: {
        businessId: parseInt(businessId as string)
      },
      select: {
        sessionId: true,
        eventType: true,
        timestamp: true,
        eventData: true
      },
      orderBy: { timestamp: 'desc' }
    });

    // Group by session
    const sessionGroups = new Map<string, any[]>();
    sessions.forEach(event => {
      if (event.sessionId) {
        if (!sessionGroups.has(event.sessionId)) {
          sessionGroups.set(event.sessionId, []);
        }
        sessionGroups.get(event.sessionId)!.push(event);
      }
    });

    // Calculate metrics
    const totalSessions = sessionGroups.size;
    const sessionsWithConversion = Array.from(sessionGroups.values()).filter(sessionEvents => 
      sessionEvents.some(event => 
        event.eventType === 'checkout_complete' || 
        event.eventType === 'order_created'
      )
    ).length;

    const conversionRate = totalSessions > 0 ? (sessionsWithConversion / totalSessions) * 100 : 0;

    // Calculate event counts
    const eventCounts = sessions.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        businessId,
        totalSessions,
        sessionsWithConversion,
        conversionRate: Math.round(conversionRate * 100) / 100,
        eventCounts,
        recentSessions: Array.from(sessionGroups.entries()).slice(0, 10).map(([sessionId, events]) => ({
          sessionId,
          eventCount: events.length,
          lastEvent: events[0]?.timestamp,
          hasConversion: events.some(event => 
            event.eventType === 'checkout_complete' || 
            event.eventType === 'order_created'
          )
        }))
      }
    });

  } catch (error) {
    console.error("Error getting business session summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get business session summary"
    });
  }
};
