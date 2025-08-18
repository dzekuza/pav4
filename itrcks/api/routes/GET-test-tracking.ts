import { RouteHandler } from "gadget-server";

const route: RouteHandler = async ({ request, reply, api, logger, connections, config }) => {
  try {
    logger.info("Testing tracking system...");

    // Get all installed shops
    const shops = await api.shopifyShop.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        myshopifyDomain: true,
        state: true,
        grantedScopes: true,
      },
      first: 250
    });

    // Count existing records across all models
    const eventCount = await api.event.findMany({ 
      select: { id: true },
      first: 1 
    });
    const clickCount = await api.click.findMany({ 
      select: { id: true },
      first: 1  
    });
    const orderCount = await api.order.findMany({ 
      select: { id: true },
      first: 1 
    });
    const sessionCount = await api.session.findMany({ 
      select: { id: true },
      first: 1 
    });

    // Get sample records for inspection
    const sampleEvents = await api.event.findMany({
      select: {
        id: true,
        eventType: true,
        path: true,
        sessionId: true,
        occurredAt: true,
        shopId: true,
        clickId: true
      },
      first: 5,
      sort: { createdAt: "Descending" }
    });

    const sampleClicks = await api.click.findMany({
      select: {
        id: true,
        clickId: true,
        destinationUrl: true,
        ipAddress: true,
        shopId: true,
        createdAt: true
      },
      first: 5,
      sort: { createdAt: "Descending" }
    });

    const sampleOrders = await api.order.findMany({
      select: {
        id: true,
        orderId: true,
        totalPrice: true,
        currency: true,
        clickId: true,
        sessionId: true,
        shopId: true
      },
      first: 5,
      sort: { createdAt: "Descending" }
    });

    // Test the collector endpoint with a sample payload
    let collectorTestResult = null;
    try {
      const testShopId = shops.length > 0 ? shops[0].id : "test-shop-id";
      const testPayload = {
        events: [
          {
            type: "page_view",
            path: "/test-page",
            sessionId: "test-session-123",
            timestamp: new Date().toISOString(),
            userAgent: "Test User Agent",
            ipAddress: "127.0.0.1"
          }
        ],
        shopId: testShopId,
        clickId: "test-click-123"
      };

      const collectorUrl = `${config.currentAppUrl || 'https://localhost:3000'}/collector`;
      
      const response = await fetch(collectorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      collectorTestResult = {
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        responseText: response.ok ? "Success" : await response.text().catch(() => "Could not read response")
      };
    } catch (error) {
      collectorTestResult = {
        error: error.message || "Unknown error testing collector",
        success: false
      };
    }

    // Compile debug information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        currentAppUrl: config.currentAppUrl,
        hasShopifyConnection: !!connections.shopify
      },
      shopifyConnection: connections.shopify ? {
        currentShopId: connections.shopify.currentShopId || null
      } : null,
      database: {
        totalShops: shops.length,
        eventCount: eventCount.length > 0 ? "Has events" : "No events found", 
        clickCount: clickCount.length > 0 ? "Has clicks" : "No clicks found",
        orderCount: orderCount.length > 0 ? "Has orders" : "No orders found",
        sessionCount: sessionCount.length > 0 ? "Has sessions" : "No sessions found"
      }
    };

    const response = {
      success: true,
      message: "Tracking system debug information",
      debug: debugInfo,
      shops: shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        domain: shop.domain,
        myshopifyDomain: shop.myshopifyDomain,
        state: shop.state,
        hasGrantedScopes: shop.grantedScopes ? Object.keys(shop.grantedScopes).length > 0 : false
      })),
      sampleData: {
        recentEvents: sampleEvents,
        recentClicks: sampleClicks, 
        recentOrders: sampleOrders
      },
      collectorTest: collectorTestResult,
      manualTestingInstructions: {
        steps: [
          "1. Install the app on a test Shopify store",
          "2. Visit the store's frontend to generate page view events", 
          "3. Add products to cart to generate add_to_cart events",
          "4. Complete a purchase to generate checkout events",
          "5. Check this route again to see if events are being tracked",
          "6. Use browser dev tools to inspect network requests to /collector"
        ],
        collectorEndpoint: `${config.currentAppUrl || 'https://localhost:3000'}/collector`,
        samplePayload: {
          events: [
            {
              type: "page_view",
              path: "/products/example",
              sessionId: "session-uuid",
              timestamp: new Date().toISOString(),
              userAgent: "User agent string",
              ipAddress: "Visitor IP"
            }
          ],
          shopId: "shop-id-from-shopify",
          clickId: "tracking-click-id"
        }
      }
    };

    await reply.send(response);

  } catch (error) {
    logger.error("Error in test-tracking route:", error);
    
    await reply.code(500).send({
      success: false,
      error: error.message || "Internal server error",
      message: "Failed to run tracking system test"
    });
  }
};

export default route;