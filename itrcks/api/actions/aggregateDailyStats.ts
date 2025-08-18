import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const today = new Date();
  // Calculate yesterday's date in UTC
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  
  // Get start and end of yesterday in UTC
  const startOfYesterday = new Date(yesterday);
  startOfYesterday.setUTCHours(0, 0, 0, 0);
  
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setUTCHours(23, 59, 59, 999);
  
  const dateString = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  logger.info(`Starting daily stats aggregation for date: ${dateString}`);
  
  try {
    // Get all shops to process data for each shop
    const shops = await api.shopifyShop.findMany({
      select: { id: true, name: true }
    });
    
    logger.info(`Processing ${shops.length} shops`);
    
    for (const shop of shops) {
      try {
        // Check if aggregate record already exists for this shop and date
        const existingAggregate = await api.aggregate.findFirst({
          filter: {
            shopId: { equals: shop.id },
            date: { equals: startOfYesterday }
          }
        });
        
        if (existingAggregate) {
          logger.info(`Aggregate data already exists for shop ${shop.id} on ${dateString}, skipping`);
          continue;
        }
        
        // Get events for this shop for yesterday
        const events = await api.event.findMany({
          filter: {
            shopId: { equals: shop.id },
            occurredAt: {
              greaterThanOrEqual: startOfYesterday,
              lessThanOrEqual: endOfYesterday
            }
          },
          select: {
            id: true,
            eventType: true,
            sessionId: true,
            value: true,
            productId: true
          }
        });
        
        // Count unique sessions
        const uniqueSessionIds = new Set(events.map(event => event.sessionId));
        const sessionsCount = uniqueSessionIds.size;
        
        // Count product views (page_view and product_view events)
        const productViewEvents = events.filter(event => 
          event.eventType === 'product_view' || event.eventType === 'page_view'
        );
        const productViewsCount = productViewEvents.length;
        
        // Get orders for this shop for yesterday to calculate GMV and AOV
        const orders = await api.order.findMany({
          filter: {
            shopId: { equals: shop.id },
            createdAt: {
              greaterThanOrEqual: startOfYesterday,
              lessThanOrEqual: endOfYesterday
            }
          },
          select: {
            id: true,
            totalPrice: true,
            currency: true
          }
        });
        
        // Calculate GMV (sum of all order values)
        const gmv = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        
        // Calculate AOV (average order value)
        const aov = orders.length > 0 ? gmv / orders.length : 0;
        
        // Create aggregate record
        await api.aggregate.create({
          shop: { _link: shop.id },
          date: startOfYesterday,
          sessions: sessionsCount,
          productViews: productViewsCount
        });
        
        const shopName = shop.name ? shop.name : 'Unknown';
        logger.info(`Created aggregate for shop ${shop.id} (${shopName}): ${sessionsCount} sessions, ${productViewsCount} product views, ${orders.length} orders, GMV: ${gmv}, AOV: ${aov.toFixed(2)}`);
        
      } catch (shopError) {
        const errorMessage = shopError instanceof Error ? shopError.message : 'Unknown error';
        logger.error(`Error processing shop ${shop.id}: ${errorMessage}`);
        // Continue processing other shops even if one fails
        continue;
      }
    }
    
    logger.info(`Daily stats aggregation completed for date: ${dateString}`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in daily stats aggregation: ${errorMessage}`);
    throw error;
  }
};

export const options: ActionOptions = {
  triggers: {
    scheduler: [
      {
        cron: "0 2 * * *" // Every day at 2:00 AM UTC
      }
    ]
  }
};
