import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const { businessDomain, startDate, endDate } = params;

  // Find the shopifyShop record by matching businessDomain to domain or myshopifyDomain
  const shop = await api.shopifyShop.findFirst({
    filter: {
      OR: [
        { domain: { equals: businessDomain } },
        { myshopifyDomain: { equals: businessDomain } }
      ]
    },
    select: {
      id: true,
      domain: true,
      myshopifyDomain: true,
      name: true
    }
  });

  if (!shop) {
    throw new Error(`Shop not found for business domain: ${businessDomain}`);
  }

  // Build date filter if dates are provided
  const dateFilter: any = {};
  if (startDate) {
    dateFilter.greaterThanOrEqual = startDate;
  }
  if (endDate) {
    dateFilter.lessThanOrEqual = endDate;
  }

  const filter: any = {
    shopId: { equals: shop.id }
  };

  if (Object.keys(dateFilter).length > 0) {
    filter.createdAt = dateFilter;
  }

  // Get all shopifyCheckout records for this shop within the date range
  const checkouts = await api.shopifyCheckout.findMany({
    filter,
    select: {
      id: true,
      createdAt: true,
      completedAt: true,
      email: true,
      totalPrice: true,
      currency: true,
      customerLocale: true,
      phone: true,
      name: true,
      token: true
    },
    first: 250
  });

  // Get all shopifyOrder records for this shop within the date range
  const orders = await api.shopifyOrder.findMany({
    filter,
    select: {
      id: true,
      createdAt: true,
      email: true,
      totalPrice: true,
      currency: true,
      customerLocale: true,
      phone: true,
      name: true,
      financialStatus: true,
      fulfillmentStatus: true,
      processedAt: true
    },
    first: 250
  });

  const events: any[] = [];

  // Process checkout events
  for (const checkout of checkouts) {
    // Checkout start event
    events.push({
      event_type: 'checkout_start',
      timestamp: checkout.createdAt,
      business_domain: businessDomain,
      data: {
        checkout_id: checkout.id,
        email: checkout.email,
        totalPrice: checkout.totalPrice,
        currency: checkout.currency,
        customerLocale: checkout.customerLocale,
        phone: checkout.phone,
        name: checkout.name,
        token: checkout.token
      }
    });

    // Checkout complete event (if completed)
    if (checkout.completedAt) {
      events.push({
        event_type: 'checkout_complete',
        timestamp: checkout.completedAt,
        business_domain: businessDomain,
        data: {
          checkout_id: checkout.id,
          email: checkout.email,
          totalPrice: checkout.totalPrice,
          currency: checkout.currency,
          customerLocale: checkout.customerLocale,
          phone: checkout.phone,
          name: checkout.name,
          token: checkout.token
        }
      });
    }
  }

  // Process order events
  for (const order of orders) {
    events.push({
      event_type: 'order_created',
      timestamp: order.createdAt,
      business_domain: businessDomain,
      data: {
        order_id: order.id,
        email: order.email,
        totalPrice: order.totalPrice,
        currency: order.currency,
        customerLocale: order.customerLocale,
        phone: order.phone,
        name: order.name,
        financialStatus: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        processedAt: order.processedAt
      }
    });
  }

  // Sort events by timestamp
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return events;
};

export const params = {
  businessDomain: { type: "string" },
  startDate: { type: "string" },
  endDate: { type: "string" }
};

export const options: ActionOptions = {
  returnType: true
};
