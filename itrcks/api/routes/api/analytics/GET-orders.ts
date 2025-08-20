import { RouteHandler } from "gadget-server";

interface QueryParams {
  shop: string;
  from?: string;
  to?: string;
  limit?: string;
}

interface OrderWithAttribution {
  orderId: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  click?: {
    clickId: string;
    destinationUrl: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
  };
}

interface AnalyticsResponse {
  summary: {
    totalOrders: number;
    attributedOrders: number;
    conversionRate: number;
    totalGMV: number;
    attributedGMV: number;
  };
  orders: OrderWithAttribution[];
  attribution_stats: {
    by_source: Record<string, number>;
    conversion_funnel: {
      clicks: number;
      orders: number;
      conversion_rate: number;
    };
  };
  pagination: {
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const route: RouteHandler<{ Querystring: QueryParams }> = async ({ 
  request, 
  reply, 
  api, 
  logger, 
  connections 
}) => {
  try {
    // Authenticate API key
    const apiKey = request.headers.authorization?.replace('Bearer ', '') || 
                   request.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return reply.code(401).send({ 
        error: 'Authentication required', 
        message: 'API key must be provided via Authorization header or x-api-key header' 
      });
    }

    // Check if API key matches expected pattern
    if (apiKey !== 'GADGET_API_KEY') {
      return reply.code(401).send({ 
        error: 'Invalid API key', 
        message: 'Invalid API key provided' 
      });
    }

    // Parse and validate query parameters
    const { shop, from, to, limit: limitStr } = request.query;
    
    if (!shop) {
      return reply.code(400).send({
        error: 'Missing required parameter',
        message: 'shop parameter is required'
      });
    }

    const limit = Math.min(parseInt(limitStr || '100', 10), 1000);
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (from) {
      fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return reply.code(400).send({
          error: 'Invalid date format',
          message: 'from parameter must be a valid ISO date string'
        });
      }
    }

    if (to) {
      toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return reply.code(400).send({
          error: 'Invalid date format',
          message: 'to parameter must be a valid ISO date string'
        });
      }
    }

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
      return reply.code(404).send({
        error: 'Shop not found',
        message: `No shop found with domain: ${shop}`
      });
    }

    // Build date filter
    const dateFilter: { greaterThanOrEqual?: string; lessThanOrEqual?: string } = {};
    if (fromDate) {
      dateFilter.greaterThanOrEqual = fromDate.toISOString();
    }
    if (toDate) {
      dateFilter.lessThanOrEqual = toDate.toISOString();
    }

    const orderFilter: {
      shopId: { equals: string };
      createdAt?: { greaterThanOrEqual?: string; lessThanOrEqual?: string };
    } = {
      shopId: { equals: shopRecord.id }
    };

    if (fromDate || toDate) {
      orderFilter.createdAt = dateFilter;
    }

    // Query orders with click attribution
    const orders = await api.order.findMany({
      filter: orderFilter,
      first: limit,
      select: {
        id: true,
        orderId: true,
        totalPrice: true,
        currency: true,
        createdAt: true,
        click: {
          id: true,
          clickId: true,
          destinationUrl: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true
        }
      },
      sort: { createdAt: "Descending" }
    });

    // Get total count of orders for pagination
    const totalOrders = await api.order.findMany({
      filter: orderFilter,
      select: { id: true }
    });

    // Query all clicks for conversion metrics (within date range if specified)
    const clickFilter: {
      shopId: { equals: string };
      createdAt?: { greaterThanOrEqual?: string; lessThanOrEqual?: string };
    } = {
      shopId: { equals: shopRecord.id }
    };

    if (fromDate || toDate) {
      clickFilter.createdAt = dateFilter;
    }

    const allClicks = await api.click.findMany({
      filter: clickFilter,
      select: {
        id: true,
        clickId: true,
        destinationUrl: true
      }
    });

    // Calculate metrics
    const totalOrderCount = totalOrders.length;
    const attributedOrders = orders.filter(order => order.click != null).length;
    const totalGMV = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const attributedGMV = orders
      .filter(order => order.click != null)
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    
    const conversionRate = allClicks.length > 0 ? (attributedOrders / allClicks.length) * 100 : 0;

    // Calculate attribution stats by source (destination URL)
    const bySource: Record<string, number> = {};
    orders.forEach(order => {
      if (order.click?.destinationUrl) {
        try {
          const url = new URL(order.click.destinationUrl);
          const domain = url.hostname;
          bySource[domain] = (bySource[domain] || 0) + 1;
        } catch {
          bySource['unknown'] = (bySource['unknown'] || 0) + 1;
        }
      }
    });

    // Helper function to safely convert dates to ISO strings
    const toISOString = (date: string | Date | null | undefined): string => {
      if (!date) return new Date().toISOString();
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toISOString();
      return new Date().toISOString();
    };

    // Format orders for response
    const formattedOrders: OrderWithAttribution[] = orders.map(order => {
      const baseOrder = {
        orderId: order.orderId,
        totalPrice: order.totalPrice,
        currency: order.currency,
        createdAt: toISOString(order.createdAt)
      };

      if (order.click) {
        return {
          ...baseOrder,
          click: {
            clickId: order.click.clickId,
            destinationUrl: order.click.destinationUrl,
            ipAddress: order.click.ipAddress,
            userAgent: order.click.userAgent,
            createdAt: toISOString(order.click.createdAt)
          }
        };
      }

      return baseOrder;
    });

    const response: AnalyticsResponse = {
      summary: {
        totalOrders: totalOrderCount,
        attributedOrders,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalGMV,
        attributedGMV
      },
      orders: formattedOrders,
      attribution_stats: {
        by_source: bySource,
        conversion_funnel: {
          clicks: allClicks.length,
          orders: attributedOrders,
          conversion_rate: Math.round(conversionRate * 100) / 100
        }
      },
      pagination: {
        limit,
        total: totalOrderCount,
        hasMore: totalOrderCount > limit
      }
    };

    logger.info(`Analytics request completed for shop: ${shop} - Total orders: ${totalOrderCount}, Attributed: ${attributedOrders}, Conversion rate: ${conversionRate}%`);

    return reply.send(response);

  } catch (error) {
    logger.error(`Error in analytics orders endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'An error occurred while processing the analytics request'
    });
  }
};

route.options = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        shop: { type: "string" },
        from: { type: "string", format: "date-time" },
        to: { type: "string", format: "date-time" },
        limit: { type: "string", pattern: "^[0-9]+$" }
      },
      required: ["shop"]
    }
  }
};

export default route;