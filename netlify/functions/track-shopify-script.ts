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
  console.log("Track Shopify Script function called with method:", event.httpMethod);
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

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
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
    const body = event.body ? JSON.parse(event.body) : {};
    console.log("Track Shopify Script request received:", {
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

    // Create tracking event in database
    console.log("Creating tracking event...");
    const trackingEvent = await prisma.trackingEvent.create({
      data: {
        eventType: event_type,
        businessId: parseInt(business_id),
        affiliateId: affiliate_id,
        platform: platform || "shopify-script",
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

    // If this is a purchase event, create additional records
    if (event_type === "purchase_complete" && data) {
      console.log("Processing purchase event...");
      
      // Extract order information
      const orderId = data.order_id;
      const totalPrice = parseFloat(data.total_price || "0");
      const currency = data.currency || "USD";
      const email = data.email;
      const customerId = data.customer_id;
      const products = data.products || [];
      const utmSource = data.utm_source;
      const utmMedium = data.utm_medium;
      const utmCampaign = data.utm_campaign;
      const businessDomain = data.business_domain;
      const shopDomain = data.shop_domain;

      // Create business conversion record
      if (orderId) {
        console.log("Creating business conversion record...");
        await prisma.businessConversion.create({
          data: {
            businessId: parseInt(business_id),
            productUrl: url || "",
            productTitle: products.length > 0 ? products[0].product_name : "Order",
            productPrice: totalPrice.toString(),
            retailer: shopDomain || "shopify",
            sessionId: session_id,
            referrer: referrer,
            utmSource: utmSource,
            utmMedium: utmMedium,
            utmCampaign: utmCampaign,
            ipAddress: event.headers["client-ip"] || event.headers["x-forwarded-for"] || "unknown",
            userAgent: user_agent,
            timestamp: eventTimestamp,
          },
        });
      }

      // Create sale record
      console.log("Creating sale record...");
      const sale = await prisma.sale.create({
        data: {
          orderId: orderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          businessId: parseInt(business_id),
          productUrl: url || "",
          productTitle: products.length > 0 ? products[0].product_name : "Order",
          productPrice: totalPrice,
          currency: currency,
          retailer: shopDomain || "shopify",
          sessionId: session_id,
          referrer: referrer,
          utmSource: utmSource,
          utmMedium: utmMedium,
          utmCampaign: utmCampaign,
          ipAddress: event.headers["client-ip"] || event.headers["x-forwarded-for"] || "unknown",
          userAgent: user_agent,
          status: "CONFIRMED", // Mark as confirmed since it's from thank you page
        },
      });

      console.log("Sale record created:", sale.id);

      // Update business statistics
      console.log("Updating business statistics...");
      await prisma.business.update({
        where: { id: parseInt(business_id) },
        data: {
          totalPurchases: {
            increment: 1,
          },
          totalRevenue: {
            increment: totalPrice,
          },
        },
      });

      // Create session attribution record if UTM parameters are present
      if (utmSource || utmMedium || utmCampaign || businessDomain) {
        console.log("Creating session attribution record...");
        try {
          await prisma.sessionAttribution.create({
            data: {
              businessId: parseInt(business_id),
              sessionId: session_id,
              orderId: orderId,
              utmSource: utmSource,
              utmMedium: utmMedium,
              utmCampaign: utmCampaign,
              businessDomain: businessDomain,
              shopDomain: shopDomain,
              totalAmount: totalPrice,
              currency: currency,
              customerEmail: email,
              customerId: customerId,
              timestamp: eventTimestamp,
            },
          });
        } catch (error) {
          console.log("Session attribution table might not exist, skipping...");
        }
      }
    }

    console.log("Track Shopify Script completed successfully");

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
    console.error("Error in track-shopify-script function:", error);

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
