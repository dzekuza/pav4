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
  const startTime = Date.now();
  
  try {
    // Log comprehensive incoming request details
    logger.info({
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      fullUrl: `${request.protocol}://${request.headers.host}${request.url}`,
      ip: request.ip,
      remoteAddress: request.socket?.remoteAddress,
      remotePort: request.socket?.remotePort,
      headers: {
        'user-agent': request.headers['user-agent'],
        'origin': request.headers.origin,
        'host': request.headers.host,
        'referer': request.headers.referer,
        'x-forwarded-for': request.headers['x-forwarded-for'],
        'x-real-ip': request.headers['x-real-ip'],
        'content-type': request.headers['content-type'],
        'content-length': request.headers['content-length'],
        'accept': request.headers.accept,
        'accept-encoding': request.headers['accept-encoding'],
        'accept-language': request.headers['accept-language'],
        'connection': request.headers.connection,
        'upgrade-insecure-requests': request.headers['upgrade-insecure-requests'],
        'sec-fetch-dest': request.headers['sec-fetch-dest'],
        'sec-fetch-mode': request.headers['sec-fetch-mode'],
        'sec-fetch-site': request.headers['sec-fetch-site']
      },
      query: request.query,
      params: request.params,
      bodyType: typeof request.body,
      bodyLength: request.body ? JSON.stringify(request.body).length : 0
    }, "COLLECTOR: Incoming POST request - full context");

    // Parse request body with detailed logging
    let body: any;
    const contentType = request.headers['content-type'] || '';
    
    logger.info({ 
      contentType,
      rawBody: request.body,
      bodyType: typeof request.body 
    }, "COLLECTOR: Processing POST request body");

    try {
      if (contentType.includes('application/json')) {
        body = request.body;
        logger.info("COLLECTOR: Processing as JSON request");
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Handle form data if needed
        body = request.body;
        logger.info("COLLECTOR: Processing as form-encoded request");
      } else {
        // Default to treating as JSON
        body = request.body;
        logger.info({ contentType }, "COLLECTOR: Processing with default JSON handling");
      }
    } catch (parseError) {
      logger.error({ 
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
        contentType,
        rawBody: request.body 
      }, "COLLECTOR: Failed to parse request body");
      await reply.status(400).send({ 
        error: "Invalid request body format",
        contentType,
        success: false 
      });
      return;
    }
    
    // Log comprehensive request data
    logger.info({
      requestMetadata: {
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        contentType,
        bodySize: body ? JSON.stringify(body).length : 0
      },
      parsedBody: body,
      bodyKeys: body && typeof body === 'object' ? Object.keys(body) : null,
      bodyValues: body && typeof body === 'object' ? Object.fromEntries(
        Object.entries(body).map(([k, v]) => [k, typeof v === 'string' ? v.substring(0, 100) : v])
      ) : null
    }, "COLLECTOR: Parsed request body and metadata");

    // Enhanced validation with detailed logging
    const validationErrors = [];
    
    if (!body || typeof body !== 'object') {
      validationErrors.push("Body must be a valid object");
    } else {
      if (!body.eventType) {
        validationErrors.push("eventType is required");
      }
      if (!body.sessionId) {
        validationErrors.push("sessionId is required");
      }
      if (!body.path) {
        validationErrors.push("path is required");
      }
    }
    
    if (validationErrors.length > 0) {
      logger.error({ 
        body, 
        validationErrors,
        receivedFields: body && typeof body === 'object' ? Object.keys(body) : []
      }, "COLLECTOR: Validation failed - missing required fields");
      
      await reply.status(400).send({ 
        error: "Validation failed", 
        validationErrors,
        receivedFields: body && typeof body === 'object' ? Object.keys(body) : [],
        success: false 
      });
      return;
    }

    logger.info({
      eventType: body.eventType,
      sessionId: body.sessionId,
      path: body.path,
      clickId: body.clickId || null,
      hasProductId: !!body.productId,
      hasValue: !!body.value
    }, "COLLECTOR: Validation passed - processing event");

    // Enhanced shop domain extraction with multiple fallback methods
    // Prioritize origin header for Shopify storefront requests
    const hostHeader = request.headers.host;
    const originHeader = request.headers.origin;
    const refererHeader = request.headers.referer;
    
    logger.info({
      hostHeader,
      originHeader,
      refererHeader,
      headerTypes: {
        host: typeof hostHeader,
        origin: typeof originHeader,
        referer: typeof refererHeader
      }
    }, "COLLECTOR: Extracting shop domain from headers");
    
    let shopDomain: string | undefined = undefined;
    let domainSource = '';
    
    // Try multiple methods to extract domain - prioritize origin for Shopify requests
    if (typeof originHeader === 'string' && originHeader.length > 0) {
      try {
        const originUrl = new URL(originHeader);
        shopDomain = originUrl.hostname.toLowerCase();
        domainSource = 'origin';
      } catch (error) {
        logger.warn({ originHeader, error: error instanceof Error ? error.message : String(error) }, "COLLECTOR: Failed to parse origin header");
      }
    } else if (typeof refererHeader === 'string' && refererHeader.length > 0) {
      try {
        const refererUrl = new URL(refererHeader);
        shopDomain = refererUrl.hostname.toLowerCase();
        domainSource = 'referer';
      } catch (error) {
        logger.warn({ refererHeader, error: error instanceof Error ? error.message : String(error) }, "COLLECTOR: Failed to parse referer header");
      }
    } else if (typeof hostHeader === 'string' && hostHeader.length > 0) {
      shopDomain = hostHeader.toLowerCase();
      domainSource = 'host';
    }

    if (!shopDomain) {
      logger.error({
        hostHeader,
        originHeader,
        refererHeader,
        allHeaders: Object.fromEntries(
          Object.entries(request.headers).filter(([key]) => 
            ['host', 'origin', 'referer', 'x-forwarded-host', 'x-original-host'].includes(key.toLowerCase())
          )
        )
      }, "COLLECTOR: No shop domain found in any request headers");
      
      await reply.status(400).send({ 
        error: "Shop domain required - no valid domain found in request headers",
        checkedHeaders: ['host', 'origin', 'referer'],
        success: false 
      });
      return;
    }

    logger.info({ 
      shopDomain, 
      domainSource,
      originalValue: domainSource === 'host' ? hostHeader : domainSource === 'origin' ? originHeader : refererHeader
    }, "COLLECTOR: Successfully extracted shop domain");

    // Enhanced shop lookup with multiple domain matching strategies
    let shop: {
      id: string;
      name: string | null;
      domain: string | null;
      myshopifyDomain: string | null;
      state: any;
    } | null;
    const shopLookupStart = Date.now();
    
    try {
      logger.info({ 
        shopDomain,
        lookupStrategy: "multi-domain-search"
      }, "COLLECTOR: Starting shop lookup");
      
      // Try multiple domain matching strategies
      const domainVariations = [
        shopDomain,
        shopDomain.replace(/^www\./, ''), // Remove www prefix
        shopDomain.split(':')[0], // Remove port
        `${shopDomain.split('.')[0]}.myshopify.com` // Convert to myshopify.com format if needed
      ].filter(Boolean);
      
      logger.info({ 
        shopDomain,
        domainVariations 
      }, "COLLECTOR: Trying multiple domain variations");
      
      shop = await api.shopifyShop.maybeFindFirst({
        filter: {
          OR: [
            { myshopifyDomain: { in: domainVariations } },
            { domain: { in: domainVariations } }
          ]
        },
        select: {
          id: true,
          name: true,
          domain: true,
          myshopifyDomain: true,
          state: true
        }
      });
      
      const shopLookupTime = Date.now() - shopLookupStart;
      
      if (shop) {
        logger.info({ 
          shopId: shop.id, 
          shopName: shop.name,
          shopDomain: shop.domain,
          myshopifyDomain: shop.myshopifyDomain,
          shopState: shop.state,
          lookupTimeMs: shopLookupTime,
          matchedDomain: domainVariations.find(d => d === shop.domain || d === shop.myshopifyDomain)
        }, "COLLECTOR: Successfully found shop");
      } else {
        logger.warn({
          searchedDomains: domainVariations,
          lookupTimeMs: shopLookupTime
        }, "COLLECTOR: No shop found for any domain variation");
      }
    } catch (error) {
      const shopLookupTime = Date.now() - shopLookupStart;
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        shopDomain, 
        lookupTimeMs: shopLookupTime
      }, "COLLECTOR: Database error during shop lookup");
      
      await reply.status(500).send({ 
        error: "Database error during shop lookup",
        success: false 
      });
      return;
    }

    if (!shop) {
      logger.error({ 
        shopDomain,
        domainSource,
        requestHeaders: {
          host: request.headers.host,
          origin: request.headers.origin,
          referer: request.headers.referer
        },
        troubleshooting: {
          possibleCauses: [
            "Shop not installed in this environment",
            "Domain mismatch between Shopify config and request",
            "Pixel not properly configured",
            "Shop uninstalled or suspended"
          ]
        }
      }, "COLLECTOR: Shop not found - detailed troubleshooting info");
      
      await reply.status(404).send({ 
        error: "Shop not found for domain",
        domain: shopDomain,
        domainSource,
        success: false 
      });
      return;
    }

    const shopId = shop.id;
    
    logger.info({
      shopId,
      eventType: body.eventType,
      sessionId: body.sessionId,
      processingTimeMs: Date.now() - startTime
    }, "COLLECTOR: Shop validated, proceeding with event creation");

    // Enhanced event type validation
    const validEventTypes = [
      'page_view', 
      'product_view', 
      'add_to_cart', 
      'begin_checkout', 
      'checkout_abandoned', 
      'checkout_completed'
    ];
    
    const eventType = body.eventType?.toLowerCase?.() || body.eventType;
    
    if (!validEventTypes.includes(eventType)) {
      logger.error({ 
        receivedEventType: body.eventType,
        normalizedEventType: eventType, 
        validEventTypes,
        eventTypeType: typeof body.eventType
      }, "COLLECTOR: Invalid event type received");
      
      await reply.status(400).send({ 
        error: "Invalid event type",
        received: body.eventType,
        validTypes: validEventTypes,
        success: false 
      });
      return;
    }

    logger.info({ 
      eventType: eventType,
      originalEventType: body.eventType 
    }, "COLLECTOR: Valid event type confirmed");

    // Enhanced click record lookup with detailed logging
    let clickRecord = null;
    const clickLookupStart = Date.now();
    
    if (body.clickId) {
      try {
        logger.info({ 
          clickId: body.clickId, 
          shopId 
        }, "COLLECTOR: Looking up click record for attribution");
        
        clickRecord = await api.click.maybeFindFirst({
          filter: {
            clickId: { equals: body.clickId },
            shopId: { equals: shopId }
          },
          select: {
            id: true,
            clickId: true,
            destinationUrl: true,
            createdAt: true
          }
        });
        
        const clickLookupTime = Date.now() - clickLookupStart;
        
        if (clickRecord) {
          logger.info({ 
            clickId: body.clickId, 
            clickRecordId: clickRecord.id,
            destinationUrl: clickRecord.destinationUrl,
            clickAge: Date.now() - new Date(clickRecord.createdAt).getTime(),
            lookupTimeMs: clickLookupTime
          }, "COLLECTOR: Found click record for attribution");
        } else {
          logger.warn({ 
            clickId: body.clickId,
            shopId,
            lookupTimeMs: clickLookupTime
          }, "COLLECTOR: Click record not found - event will be created without attribution");
        }
      } catch (error) {
        const clickLookupTime = Date.now() - clickLookupStart;
        logger.warn({ 
          clickId: body.clickId, 
          error: error instanceof Error ? error.message : String(error),
          shopId,
          lookupTimeMs: clickLookupTime
        }, "COLLECTOR: Error during click record lookup - proceeding without attribution");
      }
    } else {
      logger.info("COLLECTOR: No clickId provided - creating event without click attribution");
    }

    // Enhanced IP address extraction with detailed logging
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIp = request.headers['x-real-ip'];
    const userAgentHeader = request.headers['user-agent'];
    const cfConnectingIp = request.headers['cf-connecting-ip'] || request.headers['CF-Connecting-IP'];
    
    const ipCandidates = [
      cfConnectingIp, // Cloudflare
      Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor?.split(',')[0]?.trim(),
      Array.isArray(xRealIp) ? xRealIp[0] : xRealIp,
      request.ip
    ].filter(Boolean);
    
    const ipAddress = ipCandidates[0] || 'unknown';
    
    logger.info({
      ipCandidates,
      selectedIp: ipAddress,
      ipHeaders: {
        xForwardedFor,
        xRealIp,
        cfConnectingIp,
        requestIp: request.ip
      }
    }, "COLLECTOR: IP address resolution");

    // Prepare event data with comprehensive logging
    const occurredAt = body.ts ? new Date(body.ts) : new Date();
    const userAgent = body.userAgent || (Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader) || 'unknown';
    
    const eventData: any = {
      eventType: eventType as any,
      sessionId: body.sessionId,
      path: body.path,
      shop: { _link: shopId },
      occurredAt: occurredAt,
      userAgent: userAgent,
      ipAddress: ipAddress,
      rawData: {
        ...body,
        _metadata: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          domainSource,
          ipResolution: ipCandidates
        }
      },
      click: clickRecord ? { _link: clickRecord.id } : undefined,
      productId: body.productId || undefined,
      variantId: body.variantId || undefined,
      quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
      value: body.value !== undefined ? Number(body.value) : undefined,
      currency: body.currency || undefined,
      orderId: body.orderId || undefined,
      cartToken: body.cartToken || undefined,
      checkoutId: body.checkoutId || undefined,
    };

    // Remove undefined values to clean up the data
    Object.keys(eventData).forEach(key => {
      if (eventData[key] === undefined) {
        delete eventData[key];
      }
    });

    logger.info({ 
      eventDataSummary: {
        eventType: eventData.eventType,
        sessionId: eventData.sessionId,
        path: eventData.path,
        shopId: shopId,
        occurredAt: eventData.occurredAt,
        hasClickAttribution: !!clickRecord,
        hasProductId: !!eventData.productId,
        hasValue: !!eventData.value,
        fieldCount: Object.keys(eventData).length
      }
    }, "COLLECTOR: Prepared event data for creation");

    // Create the event with error handling
    const eventCreateStart = Date.now();
    let event;
    
    try {
      event = await api.event.create(eventData);
      const eventCreateTime = Date.now() - eventCreateStart;
      
      logger.info({ 
        eventId: event.id, 
        eventType: eventType,
        sessionId: body.sessionId,
        clickId: body.clickId,
        clickAttributed: !!clickRecord,
        shopId,
        shopName: shop.name,
        createTimeMs: eventCreateTime,
        totalProcessingTimeMs: Date.now() - startTime
      }, "COLLECTOR: Successfully created event");

      // Send success response
      await reply.status(201).send({
        success: true,
        eventId: event.id,
        eventType: eventType,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime
      });
      
    } catch (error) {
      const eventCreateTime = Date.now() - eventCreateStart;
      
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        eventData: eventData,
        shopId,
        eventCreateTimeMs: eventCreateTime,
        totalProcessingTimeMs: Date.now() - startTime,
        requestBody: request.body,
        requestHeaders: {
          'user-agent': request.headers['user-agent'],
          'origin': request.headers.origin,
          'host': request.headers.host,
          'referer': request.headers.referer
        }
      }, "COLLECTOR: Error creating event - full context for debugging");
      
      await reply.status(500).send({ 
        error: "Failed to create event",
        success: false,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: request.body,
      requestHeaders: {
        'user-agent': request.headers['user-agent'],
        'origin': request.headers.origin,
        'host': request.headers.host,
        'referer': request.headers.referer
      },
      totalProcessingTimeMs: Date.now() - startTime
    }, "COLLECTOR: Unexpected error processing pixel event - full context for debugging");
    
    await reply.status(500).send({ 
      error: "Internal server error",
      success: false,
      timestamp: new Date().toISOString()
    });
  }
};

// Set route options including CORS and body schema validation
route.options = {
  cors: {
    origin: true, // Allow all origins
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
    maxAge: 86400 // 24 hours
  },
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