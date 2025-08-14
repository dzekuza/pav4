import axios from 'axios';

// Configuration for forwarding webhooks to your main application
const MAIN_APP_WEBHOOK_URL = process.env.MAIN_APP_WEBHOOK_URL || 'https://pavlo4.netlify.app/.netlify/functions/track-event';
const MAIN_APP_API_KEY = process.env.MAIN_APP_API_KEY || '16272754ed68cbdcb55e8f579703d92e';

/**
 * Forward webhook data to the main application
 * @param {string} topic - The webhook topic (e.g., 'orders/create')
 * @param {Object} payload - The webhook payload
 * @param {string} shopDomain - The shop domain
 * @param {string} eventId - The event ID
 * @param {string} triggeredAt - When the event was triggered
 */
export async function forwardWebhookToMainApp(topic, payload, shopDomain, eventId, triggeredAt) {
  try {
    const webhookData = {
      event_type: topic,
      business_id: 1, // You'll need to map shop domain to business ID
      affiliate_id: 'shopify-webhook',
      platform: 'shopify',
      session_id: eventId,
      user_agent: 'Shopify Webhook',
      referrer: shopDomain,
      timestamp: new Date().getTime(),
      url: `https://${shopDomain}/admin`,
      data: {
        shop_domain: shopDomain,
        event_id: eventId,
        triggered_at: triggeredAt,
        payload: payload,
        source: 'shopify-tracking-app',
        // Business-relevant data extraction (no customer data)
        order_id: payload.id,
        order_number: payload.order_number,
        total_price: payload.total_price,
        currency: payload.currency,
        line_items_count: payload.line_items?.length || 0,
        financial_status: payload.financial_status,
        fulfillment_status: payload.fulfillment_status,
        subtotal_price: payload.subtotal_price,
        total_tax: payload.total_tax,
        total_discounts: payload.total_discounts,
        // Product data for business insights
        products: payload.line_items?.map(item => ({
          product_id: item.product_id,
          title: item.title,
          quantity: item.quantity,
          price: item.price
        })) || []
      },
      page_title: `Shopify ${topic}`
    };

    console.log(`Forwarding webhook: ${topic} for shop: ${shopDomain}`);

    const response = await axios.post(MAIN_APP_WEBHOOK_URL, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAIN_APP_API_KEY}`,
        'X-Webhook-Source': 'shopify-tracking-app',
        'X-Webhook-Topic': topic,
        'X-Shop-Domain': shopDomain,
        'X-Event-ID': eventId
      },
      timeout: 10000 // 10 second timeout
    });

    console.log(`Successfully forwarded webhook: ${topic} - Status: ${response.status}`);
    return { success: true, status: response.status };
  } catch (error) {
    console.error(`Failed to forward webhook: ${topic}`, error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status 
    };
  }
}

/**
 * Process and enrich webhook data before forwarding
 * @param {string} topic - The webhook topic
 * @param {Object} payload - The webhook payload
 * @param {string} shopDomain - The shop domain
 */
export function processWebhookData(topic, payload, shopDomain) {
  // Add additional context and processing based on topic
  const enrichedPayload = {
    ...payload,
    _metadata: {
      processed_at: new Date().toISOString(),
      shop_domain: shopDomain,
      topic: topic,
      version: '1.0'
    }
  };

  // Add topic-specific processing for order events (business focus)
  switch (topic) {
    case 'orders/create':
    case 'orders/paid':
    case 'orders/fulfilled':
      enrichedPayload._business_metrics = {
        event_type: 'order',
        order_id: payload.id,
        order_number: payload.order_number,
        total_revenue: parseFloat(payload.total_price || 0),
        currency: payload.currency,
        line_items_count: payload.line_items?.length || 0,
        financial_status: payload.financial_status,
        fulfillment_status: payload.fulfillment_status,
        subtotal: parseFloat(payload.subtotal_price || 0),
        tax_amount: parseFloat(payload.total_tax || 0),
        discount_amount: parseFloat(payload.total_discounts || 0),
        is_revenue_event: topic === 'orders/paid' || topic === 'orders/create',
        // Extract line items for product insights
        products: payload.line_items?.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          title: item.title,
          quantity: item.quantity,
          price: parseFloat(item.price || 0)
        })) || []
      };
      break;
  }

  return enrichedPayload;
}

/**
 * Validate webhook data before processing
 * @param {Object} payload - The webhook payload
 * @param {string} topic - The webhook topic
 */
export function validateWebhookData(payload, topic) {
  if (!payload) {
    throw new Error('Webhook payload is required');
  }

  // Topic-specific validation
  switch (topic) {
    case 'orders/create':
    case 'orders/updated':
    case 'orders/paid':
    case 'orders/fulfilled':
    case 'orders/cancelled':
      if (!payload.id) {
        throw new Error('Order ID is required');
      }
      break;

    case 'products/create':
    case 'products/update':
    case 'products/delete':
      if (!payload.id) {
        throw new Error('Product ID is required');
      }
      break;

    case 'customers/create':
    case 'customers/update':
    case 'customers/delete':
      if (!payload.id) {
        throw new Error('Customer ID is required');
      }
      break;
  }

  return true;
}
