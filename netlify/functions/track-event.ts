import type { Handler, HandlerResponse } from "@netlify/functions";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: ["error", "warn"],
  });
  console.log("Prisma client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Prisma client:", error);
  throw error;
}

export const handler: Handler = async (event, context) => {
  console.log("Track event function called with method:", event.httpMethod);
  console.log("Environment variables check:", {
    NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? "Set" : "Not set",
    NODE_ENV: process.env.NODE_ENV,
  });

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Accept, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  // Only allow POST and GET requests
  if (event.httpMethod !== "POST" && event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  }

  try {
    let body: any = {};

    if (event.httpMethod === "POST") {
      // Parse the request body for POST requests
      body = event.body ? JSON.parse(event.body) : {};
    } else if (event.httpMethod === "GET") {
      // Parse query parameters for GET requests (image beacon fallback)
      const params = event.queryStringParameters || {};
      body = {
        event_type: params.event_type,
        business_id: params.business_id,
        affiliate_id: params.affiliate_id,
        platform: params.platform || "shopify",
        session_id: params.session_id,
        user_agent: event.headers["user-agent"] || "unknown",
        referrer: event.headers.referer || "",
        timestamp: parseInt(params.timestamp || Date.now().toString()),
        url: params.url || "",
        data: params.data ? JSON.parse(params.data) : {},
        page_title: params.page_title || "",
      };
    }

    console.log("Track event request received:", {
      method: event.httpMethod,
      body: body,
      headers: event.headers,
    });

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
    } = body;

    // Validate required fields
    if (!event_type || !business_id || !affiliate_id) {
      console.log("Missing required fields:", {
        event_type,
        business_id,
        affiliate_id,
      });
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error:
            "Missing required fields: event_type, business_id, affiliate_id",
        }),
      };
    }

    // Check if business exists
    console.log("Checking business with ID:", business_id);
    const business = await prisma.business.findUnique({
      where: { id: parseInt(business_id) },
    });

    if (!business) {
      console.log("Business not found:", business_id);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Business not found",
        }),
      };
    }

    console.log("Business found:", business.name);

    // Create tracking event in database
    console.log("Creating tracking event...");

    // Handle timestamp conversion
    let eventTimestamp: Date;
    if (typeof timestamp === "number") {
      eventTimestamp = new Date(timestamp);
    } else if (typeof timestamp === "string") {
      const parsed = parseInt(timestamp);
      if (!isNaN(parsed)) {
        eventTimestamp = new Date(parsed);
      } else {
        eventTimestamp = new Date(timestamp);
      }
    } else {
      eventTimestamp = new Date();
    }

    // Validate the timestamp
    if (isNaN(eventTimestamp.getTime())) {
      eventTimestamp = new Date();
    }

    const trackingEvent = await prisma.trackingEvent.create({
      data: {
        eventType: event_type,
        businessId: parseInt(business_id),
        affiliateId: affiliate_id,
        platform: platform || "shopify",
        sessionId: session_id,
        userAgent: user_agent,
        referrer: referrer,
        timestamp: eventTimestamp,
        url: url,
        eventData: data || {},
        ipAddress:
          event.headers["client-ip"] ||
          event.headers["x-forwarded-for"] ||
          "unknown",
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

    if (
      event_type === "conversion" ||
      event_type === "purchase" ||
      event_type === "purchase_complete" ||
      event_type === "checkout_complete"
    ) {
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

    // For GET requests (image beacon), return a 1x1 transparent pixel
    if (event.httpMethod === "GET") {
      const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      );
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: pixel.toString("base64"),
        isBase64Encoded: true,
      } as HandlerResponse;
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Event tracked successfully",
        event_id: trackingEvent.id,
      }),
    };
  } catch (error) {
    console.error("Error in track-event function:", error);

    // For GET requests, still return a pixel even on error
    if (event.httpMethod === "GET") {
      const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      );
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: pixel.toString("base64"),
        isBase64Encoded: true,
      } as HandlerResponse;
    }

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
