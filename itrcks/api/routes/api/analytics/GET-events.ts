import { RouteHandler } from "gadget-server";

interface QueryParams {
  shop: string;
  from?: string;
  to?: string;
  event_type?: string;
  limit?: string;
  include_raw?: string;
}

interface ResponseData {
  summary: Record<string, number>;
  events: any[];
  attribution: {
    totalClicks: number;
    attributedEvents: number;
    attributionRate: number;
  };
  pagination: {
    total: number;
    limit: number;
    hasNextPage: boolean;
  };
}

const route: RouteHandler<{ Querystring: QueryParams }> = async ({ request, reply, api, logger, connections }) => {
  try {
    // Authenticate using API key
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await reply.code(401).send({ error: 'Missing or invalid Authorization header' });
      return;
    }

    const apiKey = authHeader.replace('Bearer ', '');
    if (!apiKey) {
      await reply.code(401).send({ error: 'API key is required' });
      return;
    }

    // Basic API key validation - in production you might want to store API keys in database
    // For now, we'll accept any non-empty API key for the analytics endpoint
    // You can enhance this by checking against a list of valid API keys
    if (apiKey.length < 10) {
      await reply.code(401).send({ error: 'Invalid API key format' });
      return;
    }

    // Extract and validate query parameters
    const { shop, from, to, event_type, limit, include_raw } = request.query;

    if (!shop) {
      await reply.code(400).send({ error: 'shop parameter is required' });
      return;
    }

    // Parse limit with default and max validation
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 250) {
      await reply.code(400).send({ error: 'limit must be between 1 and 250' });
      return;
    }

    // Parse boolean include_raw parameter
    const includeRaw = include_raw === 'true';

    // Find shop by domain
    const shopRecord = await api.shopifyShop.findFirst({
      filter: {
        OR: [
          { domain: { equals: shop } },
          { myshopifyDomain: { equals: shop } }
        ]
      },
      select: { id: true, domain: true, myshopifyDomain: true }
    });

    if (!shopRecord) {
      await reply.code(404).send({ error: 'Shop not found' });
      return;
    }

    // Build event filters
    const eventFilters: any = {
      shopId: { equals: shopRecord.id }
    };

    // Add date range filters
    if (from) {
      try {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
          await reply.code(400).send({ error: 'Invalid from date format. Use ISO 8601 format.' });
          return;
        }
        eventFilters.occurredAt = { ...(eventFilters.occurredAt || {}), greaterThanOrEqual: fromDate };
      } catch (error) {
        await reply.code(400).send({ error: 'Invalid from date format. Use ISO 8601 format.' });
        return;
      }
    }

    if (to) {
      try {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
          await reply.code(400).send({ error: 'Invalid to date format. Use ISO 8601 format.' });
          return;
        }
        eventFilters.occurredAt = { ...(eventFilters.occurredAt || {}), lessThanOrEqual: toDate };
      } catch (error) {
        await reply.code(400).send({ error: 'Invalid to date format. Use ISO 8601 format.' });
        return;
      }
    }

    // Add event type filter
    if (event_type) {
      eventFilters.eventType = { equals: event_type };
    }

    // Query events with proper selection based on include_raw
    const eventSelection = {
      id: true,
      eventType: true,
      occurredAt: true,
      path: true,
      sessionId: true,
      productId: true,
      variantId: true,
      quantity: true,
      value: true,
      currency: true,
      orderId: true,
      checkoutId: true,
      cartToken: true,
      ipAddress: true,
      userAgent: true,
      clickId: true,
      click: {
        id: true,
        clickId: true,
        destinationUrl: true,
        createdAt: true
      },
      ...(includeRaw && { rawData: true })
    };

    const events = await api.event.findMany({
      filter: eventFilters,
      sort: { occurredAt: "Descending" },
      first: parsedLimit,
      select: eventSelection
    });

    // Get a sample to estimate total count (since we can't get exact count efficiently)
    const totalSample = await api.event.findMany({
      filter: eventFilters,
      first: 250,
      select: { id: true }
    });

    // Calculate summary statistics
    const summary: Record<string, number> = {};
    let attributedEvents = 0;

    for (const event of events) {
      const eventType = event.eventType || 'unknown';
      summary[eventType] = (summary[eventType] || 0) + 1;
      
      if (event.clickId) {
        attributedEvents++;
      }
    }

    // Get a sample of clicks for attribution statistics
    const clickSample = await api.click.findMany({
      filter: { shopId: { equals: shopRecord.id } },
      first: 250,
      select: { id: true }
    });

    const attributionRate = events.length > 0 ? (attributedEvents / events.length) * 100 : 0;

    // Build response
    const response: ResponseData = {
      summary,
      events: events.map(event => ({
        id: event.id,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        path: event.path,
        sessionId: event.sessionId,
        productId: event.productId || null,
        variantId: event.variantId || null,
        quantity: event.quantity || null,
        value: event.value || null,
        currency: event.currency || null,
        orderId: event.orderId || null,
        checkoutId: event.checkoutId || null,
        cartToken: event.cartToken || null,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        click: event.click ? {
          id: event.click.id,
          clickId: event.click.clickId,
          destinationUrl: event.click.destinationUrl,
          createdAt: event.click.createdAt
        } : null,
        ...(includeRaw && event.rawData && { rawData: event.rawData })
      })),
      attribution: {
        totalClicks: clickSample.length,
        attributedEvents,
        attributionRate: parseFloat(attributionRate.toFixed(2))
      },
      pagination: {
        total: totalSample.length,
        limit: parsedLimit,
        hasNextPage: events.hasNextPage
      }
    };

    await reply.send(response);

  } catch (error) {
    logger.error({ error }, 'Error fetching analytics events');
    await reply.code(500).send({ error: 'Internal server error' });
  }
};

// Set route options for request validation
route.options = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        shop: { type: 'string' },
        from: { type: 'string' },
        to: { type: 'string' },
        event_type: { type: 'string' },
        limit: { type: 'string', pattern: '^[0-9]+$' },
        include_raw: { type: 'string', enum: ['true', 'false'] }
      },
      required: ['shop']
    }
  }
};

export default route;