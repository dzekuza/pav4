import { RequestHandler } from "express";
import { prisma } from "../services/database";

export const trackEvent: RequestHandler = async (req, res) => {
  try {
    // Log request details for debugging
    console.log("Track event request received:");
    console.log("Headers:", req.headers);
    console.log("Origin:", req.headers.origin);
    console.log("Method:", req.method);
    console.log("Body:", req.body);

    const {
      event_type,
      business_id,
      affiliate_id,
      platform,
      session_id,
      user_agent,
      referrer,
      timestamp,
      url,
      data,
      page_title,
    } = req.body;

    console.log("Track event request:", {
      event_type,
      business_id,
      affiliate_id,
      platform,
      url,
    });

    // Validate required fields
    if (!event_type || !business_id || !affiliate_id) {
      console.log("Missing required fields:", {
        event_type,
        business_id,
        affiliate_id,
      });
      return res.status(400).json({
        success: false,
        error: "Missing required fields: event_type, business_id, affiliate_id",
      });
    }

    // Check for duplicate events (same session, event type, and similar data within 5 seconds)
    if (session_id) {
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      const existingEvent = await prisma.trackingEvent.findFirst({
        where: {
          sessionId: session_id,
          eventType: event_type,
          timestamp: {
            gte: fiveSecondsAgo,
          },
          businessId: parseInt(business_id),
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (existingEvent) {
        console.log("Duplicate event detected, skipping:", {
          event_type,
          session_id,
          existing_event_id: existingEvent.id,
        });
        return res.status(200).json({
          success: true,
          message: "Duplicate event skipped",
          event_id: existingEvent.id,
        });
      }
    }

    // Check if business exists
    console.log("Checking business with ID:", business_id);
    const business = await prisma.business.findUnique({
      where: { id: parseInt(business_id) },
    });

    if (!business) {
      console.log("Business not found:", business_id);
      return res.status(400).json({
        success: false,
        error: "Business not found",
      });
    }

    console.log("Business found:", business.name);

    // Create tracking event in database
    console.log("Creating tracking event...");
    const trackingEvent = await prisma.trackingEvent.create({
      data: {
        eventType: event_type,
        businessId: parseInt(business_id),
        affiliateId: affiliate_id,
        platform: platform || "shopify",
        sessionId: session_id,
        userAgent: user_agent,
        referrer: referrer,
        timestamp: new Date(timestamp),
        url: url,
        eventData: data || {},
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
      },
    });

    console.log("Tracking event created:", trackingEvent.id);

    // Update business statistics based on event type
    if (event_type === "page_view" || event_type === "product_view") {
      console.log("Updating business visits...");
      await prisma.business.update({
        where: { id: parseInt(business_id) },
        data: {
          totalVisits: {
            increment: 1,
          },
        },
      });
    }

    if (event_type === "add_to_cart") {
      console.log("Updating business clicks...");
      await prisma.business.update({
        where: { id: parseInt(business_id) },
        data: {
          totalVisits: {
            increment: 1,
          },
        },
      });
    }

    if (event_type === "conversion" || event_type === "purchase" || event_type === "purchase_complete") {
      console.log("Updating business purchases...");
      const totalAmount = parseFloat(data?.total_amount || data?.amount || "0");
      await prisma.business.update({
        where: { id: parseInt(business_id) },
        data: {
          totalPurchases: {
            increment: 1,
          },
          totalRevenue: {
            increment: totalAmount,
          },
        },
      });
    }

    console.log("Track event completed successfully");
    res.json({
      success: true,
      message: "Event tracked successfully",
      event_id: trackingEvent.id,
    });
  } catch (error) {
    console.error("Error tracking event:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track event",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get tracking events for a business
export const getTrackingEvents: RequestHandler = async (req, res) => {
  try {
    const { business_id, limit = 100, offset = 0 } = req.query;

    if (!business_id) {
      return res.status(400).json({
        success: false,
        error: "business_id is required",
      });
    }

    const events = await prisma.trackingEvent.findMany({
      where: {
        businessId: parseInt(business_id as string),
      },
      orderBy: {
        timestamp: "desc",
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      success: true,
      events: events,
    });
  } catch (error) {
    console.error("Error getting tracking events:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get tracking events",
    });
  }
};
