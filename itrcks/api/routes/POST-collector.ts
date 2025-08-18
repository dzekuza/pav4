import { RouteHandler } from "gadget-server";

interface CollectorRequestBody {
  eventType: string;
  clickId?: string;
  sessionId: string;
  path: string;
  userAgent?: string;
  ts?: number;
  productId?: string;
  variantId?: string;
  quantity?: number;
  value?: number;
  currency?: string;
  orderId?: string;
  cartToken?: string;
  checkoutId?: string;
}

const route: RouteHandler<{ Body: CollectorRequestBody }> = async ({ 
  request, 
  reply, 
  api, 
  logger, 
  connections 
}) => {
  try {
    // Log incoming request details
    logger.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      origin: request.headers.origin,
      host: request.headers.host,
      referer: request.headers.referer
    }, "Incoming request to collector endpoint");

    // Add CORS headers
    await reply.header('Access-Control-Allow-Origin', '*');
    await reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    await reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      logger.info("Handling CORS preflight OPTIONS request");
      await reply.status(200).send();
      return;
    }

    const body = request.body;
    
    // Log detailed request information
    logger.info({
      requestHeaders: {
        'user-agent': request.headers['user-agent'],
        'origin': request.headers.origin,
        'host': request.headers.host,
        'referer': request.headers.referer,
        'x-forwarded-for': request.headers['x-forwarded-for'],
        'x-real-ip': request.headers['x-real-ip'],
        'content-type': request.headers['content-type']
      },
      requestBody: body,
      bodyType: typeof body,
      bodyKeys: body ? Object.keys(body) : null
    }, "Detailed pixel event request data");

    // Validate required fields
    if (!body.eventType) {
      logger.error({ body }, "Missing required field: eventType");
      await reply.status(400).send({ error: "Event type is required" });
      return;
    }

    if (!body.sessionId) {
      logger.error({ body }, "Missing required field: sessionId");
      await reply.status(400).send({ error: "Session ID is required" });
      return;
    }

    if (!body.path) {
      logger.error({ body }, "Missing required field: path");
      await reply.status(400).send({ error: "Path is required" });
      return;
    }

    // Extract shop domain from request headers
    const hostHeader = request.headers.host;
    const originHeader = request.headers.origin;
    
    let shopDomain: string | undefined = undefined;
    
    if (typeof hostHeader === 'string') {
      shopDomain = hostHeader;
    } else if (typeof originHeader === 'string') {
      try {
        const originUrl = new URL(originHeader);
        shopDomain = originUrl.hostname;
      } catch (error) {
        logger.warn({ originHeader }, "Failed to parse origin header");
      }
    }

    if (!shopDomain) {
      logger.error({
        hostHeader,
        originHeader,
        allHeaders: request.headers
      }, "No shop domain found in request headers");
      await reply.status(400).send({ error: "Shop domain required" });
      return;
    }

    logger.info({ shopDomain }, "Extracted shop domain from request");

    // Look up the shop by domain
    let shop;
    try {
      logger.info({ shopDomain }, "Looking up shop by domain");
      
      // Try to find by myshopifyDomain first (for .myshopify.com stores)
      shop = await api.shopifyShop.maybeFindFirst({
        filter: {
          OR: [
            { myshopifyDomain: { equals: shopDomain } },
            { domain: { equals: shopDomain } }
          ]
        }
      });
      
      if (shop) {
        logger.info({ 
          shopId: shop.id, 
          shopName: shop.name,
          shopDomain: shop.domain,
          myshopifyDomain: shop.myshopifyDomain 
        }, "Successfully found shop");
      }
    } catch (error) {
      logger.error({ error, shopDomain, errorMessage: error?.message }, "Error looking up shop in database");
      await reply.status(500).send({ error: "Error looking up shop" });
      return;
    }

    if (!shop) {
      logger.error({ 
        shopDomain,
        requestHeaders: request.headers
      }, "Shop not found for domain - this could indicate the pixel is not properly configured or the shop is not installed");
      await reply.status(404).send({ error: "Shop not found" });
      return;
    }

    const shopId = shop.id;

    // Validate event type
    const validEventTypes = [
      'page_view', 
      'product_view', 
      'add_to_cart', 
      'begin_checkout', 
      'checkout_abandoned', 
      'checkout_completed'
    ];
    
    if (!validEventTypes.includes(body.eventType)) {
      logger.error({ 
        eventType: body.eventType, 
        validEventTypes 
      }, "Invalid event type received");
      await reply.status(400).send({ error: "Invalid event type" });
      return;
    }

    logger.info({ eventType: body.eventType }, "Valid event type received");

    // Find or create click record if clickId is provided
    let clickRecord = null;
    if (body.clickId) {
      try {
        logger.info({ clickId: body.clickId, shopId }, "Looking up click record");
        clickRecord = await api.click.findFirst({
          filter: {
            clickId: { equals: body.clickId },
            shopId: { equals: shopId }
          }
        });
        
        if (clickRecord) {
          logger.info({ 
            clickId: body.clickId, 
            clickRecordId: clickRecord.id 
          }, "Found click record for attribution");
        } else {
          logger.warn({ clickId: body.clickId }, "Click record not found, event will be created without click attribution");
        }
      } catch (error) {
        logger.warn({ 
          clickId: body.clickId, 
          error: error?.message,
          shopId 
        }, "Error looking up click record, will create event without click attribution");
      }
    }

    // Extract IP address from request
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIp = request.headers['x-real-ip'];
    const userAgentHeader = request.headers['user-agent'];
    
    const ipAddress = (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor)?.split(',')[0]?.trim() || 
                     (Array.isArray(xRealIp) ? xRealIp[0] : xRealIp) || 
                     request.ip;

    // Create the event record with all properties
    const eventData: any = {
      eventType: body.eventType as any,
      sessionId: body.sessionId,
      path: body.path,
      shop: { _link: shopId },
      occurredAt: body.ts ? new Date(body.ts) : new Date(),
      userAgent: body.userAgent || (Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader),
      ipAddress: ipAddress,
      rawData: body,
      click: clickRecord ? { _link: clickRecord.id } : undefined,
      productId: body.productId || undefined,
      variantId: body.variantId || undefined,
      quantity: body.quantity !== undefined ? body.quantity : undefined,
      value: body.value !== undefined ? body.value : undefined,
      currency: body.currency || undefined,
      orderId: body.orderId || undefined,
      cartToken: body.cartToken || undefined,
      checkoutId: body.checkoutId || undefined,
    };

    // Create the event
    logger.info({ 
      eventData: {
        ...eventData,
        rawData: undefined // Don't log rawData again to avoid duplication
      }
    }, "Creating event with data");
    
    const event = await api.event.create(eventData);

    logger.info({ 
      eventId: event.id, 
      eventType: body.eventType, 
      sessionId: body.sessionId,
      clickId: body.clickId,
      clickAttributed: !!clickRecord,
      shopId,
      shopDomain,
      productId: body.productId,
      value: body.value,
      currency: body.currency
    }, "Event created successfully");

    await reply.status(200).send({ 
      success: true, 
      eventId: event.id 
    });

  } catch (error) {
    logger.error({ 
      error: error?.message,
      stack: error?.stack,
      requestBody: request.body,
      requestHeaders: {
        'user-agent': request.headers['user-agent'],
        'origin': request.headers.origin,
        'host': request.headers.host,
        'referer': request.headers.referer
      }
    }, "Error processing pixel event - full context for debugging");
    
    await reply.status(500).send({ 
      error: "Internal server error",
      success: false 
    });
  }
};

// Set route options including CORS and body schema validation
route.options = {
  schema: {
    body: {
      type: "object",
      properties: {
        eventType: { type: "string" },
        clickId: { type: "string" },
        sessionId: { type: "string" },
        path: { type: "string" },
        userAgent: { type: "string" },
        ts: { type: "number" },
        productId: { type: "string" },
        variantId: { type: "string" },
        quantity: { type: "number" },
        value: { type: "number" },
        currency: { type: "string" },
        orderId: { type: "string" },
        cartToken: { type: "string" },
        checkoutId: { type: "string" }
      },
      required: ["eventType", "sessionId", "path"]
    }
  }
};

export default route;