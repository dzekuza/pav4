import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, connections }) => {
  try {
    // Ensure record has required properties
    if (!record.id || typeof record.id !== 'string') {
      logger.error({ recordId: record.id }, "Order record missing valid ID");
      return;
    }

    if (!record.shopId || typeof record.shopId !== 'string') {
      logger.error({ orderId: record.id, shopId: record.shopId }, "Order record missing valid shop ID");
      return;
    }

    // Extract ipick click ID from metafield or note attributes
    let ipickClickId: string | null = null;
    
    // First check the metafield
    if (record.ipickClickId && typeof record.ipickClickId === 'string' && record.ipickClickId.trim()) {
      ipickClickId = record.ipickClickId.trim();
      logger.info({ ipickClickId }, "Found ipick click ID in metafield");
    }
    
    // If not found in metafield, check note attributes
    if (!ipickClickId && record.noteAttributes && Array.isArray(record.noteAttributes)) {
      const ipickAttribute = record.noteAttributes.find((attr: unknown) => {
        // Type guard to check if attr is an object with the expected structure
        if (!attr || typeof attr !== 'object' || attr === null) {
          return false;
        }
        
        const attrObj = attr as Record<string, unknown>;
        return (
          'name' in attrObj && 
          'value' in attrObj &&
          attrObj.name === 'ipick_click_id' && 
          attrObj.value && 
          typeof attrObj.value === 'string' &&
          String(attrObj.value).trim()
        );
      });
      
      if (ipickAttribute) {
        const attrObj = ipickAttribute as Record<string, unknown>;
        ipickClickId = String(attrObj.value).trim();
        logger.info({ ipickClickId }, "Found ipick click ID in note attributes");
      }
    }
    
    // If no click ID found, log and exit early
    if (!ipickClickId) {
      logger.info({ orderId: record.id }, "No ipick click attribution found for order");
      return;
    }
    
    // Find the corresponding click record
    const clickRecord = await api.click.maybeFindFirst({
      filter: { clickId: { equals: ipickClickId } }
    });
    
    if (!clickRecord) {
      logger.warn({ ipickClickId, orderId: record.id }, "Click record not found for ipick click ID");
      return;
    }
    
    logger.info({ 
      ipickClickId, 
      clickRecordId: clickRecord.id,
      orderId: record.id 
    }, "Found matching click record");
    
    // Calculate total price with proper null checking and type validation
    let totalPrice = 0;
    const totalPriceString = record.totalPrice || record.currentTotalPrice;
    if (totalPriceString && typeof totalPriceString === 'string') {
      const parsedPrice = parseFloat(totalPriceString);
      if (!isNaN(parsedPrice) && isFinite(parsedPrice)) {
        totalPrice = parsedPrice;
      }
    }
    
    // Determine currency with proper fallback
    const currency = (record.currency && typeof record.currency === 'string') 
      ? record.currency 
      : (record.presentmentCurrency && typeof record.presentmentCurrency === 'string')
        ? record.presentmentCurrency 
        : 'USD';
    
    // Create order record in our tracking system
    const orderData = {
      orderId: record.id,
      totalPrice,
      currency,
      shop: { _link: record.shopId },
      click: { _link: clickRecord.id }
    };
    
    const orderRecord = await api.order.create(orderData);
    logger.info({ 
      orderRecordId: orderRecord.id,
      ipickClickId,
      orderId: record.id,
      totalPrice
    }, "Created order tracking record");
    
    // Determine event occurrence time with proper fallback
    const occurredAt = (record.processedAt && record.processedAt instanceof Date)
      ? record.processedAt
      : (record.createdAt && record.createdAt instanceof Date)
        ? record.createdAt
        : new Date();
    
    // Generate session ID with proper fallback
    const sessionId = (record.token && typeof record.token === 'string' && record.token.trim())
      ? record.token.trim()
      : (record.cartToken && typeof record.cartToken === 'string' && record.cartToken.trim())
        ? record.cartToken.trim()
        : `order_${record.id}`;
    
    // Create checkout_completed event for analytics
    const eventData = {
      eventType: "checkout_completed" as const,
      occurredAt,
      sessionId,
      path: `/orders/${record.id}`,
      orderId: record.id,
      value: totalPrice,
      currency,
      rawData: {
        shopifyOrderId: record.id,
        ipickClickId,
        financialStatus: (record.financialStatus && typeof record.financialStatus === 'string') 
          ? record.financialStatus 
          : null,
        fulfillmentStatus: (record.fulfillmentStatus && typeof record.fulfillmentStatus === 'string') 
          ? record.fulfillmentStatus 
          : null
      },
      shop: { _link: record.shopId },
      click: { _link: clickRecord.id }
    };
    
    const eventRecord = await api.event.create(eventData);
    logger.info({ 
      eventRecordId: eventRecord.id,
      ipickClickId,
      orderId: record.id,
      eventType: "checkout_completed"
    }, "Created checkout completed event");
    
    logger.info({ 
      ipickClickId,
      orderId: record.id,
      clickRecordId: clickRecord.id,
      orderRecordId: orderRecord.id,
      eventRecordId: eventRecord.id
    }, "Successfully completed ipick attribution for order");
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error({ 
      error: err.message,
      orderId: record.id || 'unknown',
      stack: err.stack
    }, "Error processing ipick attribution for order");
  }
};

export const options: ActionOptions = { actionType: "create" };
