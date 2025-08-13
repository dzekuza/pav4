const axios = require('axios');

// Configuration
const MAIN_APP_WEBHOOK_URL = process.env.MAIN_APP_WEBHOOK_URL || 'https://pavlo4.netlify.app/.netlify/functions/track-event';
const MAIN_APP_API_KEY = process.env.MAIN_APP_API_KEY || '16272754ed68cbdcb55e8f579703d92e';

/**
 * Cloud Function to handle Shopify webhook messages from Pub/Sub
 * @param {Object} message - The Pub/Sub message
 * @param {Object} context - The Cloud Function context
 */
exports.shopifyWebhookHandler = async (message, context) => {
  try {
    console.log('Received webhook message:', message.messageId);
    
    // Decode the message data
    let data = {};
    try {
      if (message.data) {
        const decodedData = Buffer.from(message.data, 'base64').toString();
        console.log('Raw decoded data:', decodedData);
        data = JSON.parse(decodedData);
      }
    } catch (parseError) {
      console.error('Error parsing message data:', parseError.message);
      console.error('Raw message data:', message.data);
      return;
    }
    
    console.log('Decoded message data:', data);
    
    // Extract webhook information
    const {
      topic,
      shop_domain,
      event_id,
      triggered_at,
      payload
    } = data;
    
    if (!topic || !shop_domain) {
      console.error('Missing required webhook data:', { topic, shop_domain });
      return;
    }
    
    // Format data for main application with business-relevant information
    const webhookData = {
      event_type: topic,
      business_id: 1, // You'll need to map shop domain to business ID
      affiliate_id: 'shopify-webhook',
      platform: 'shopify',
      session_id: event_id,
      user_agent: 'Shopify Webhook',
      referrer: shop_domain,
      timestamp: new Date().getTime(),
      url: `https://${shop_domain}/admin`,
      data: {
        shop_domain: shop_domain,
        event_id: event_id,
        triggered_at: triggered_at,
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
    
    console.log('Forwarding webhook data:', webhookData);
    
    // Forward to main application
    const response = await axios.post(MAIN_APP_WEBHOOK_URL, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAIN_APP_API_KEY}`,
        'X-Webhook-Source': 'shopify-tracking-app',
        'X-Webhook-Topic': topic,
        'X-Shop-Domain': shop_domain,
        'X-Event-ID': event_id
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('Successfully forwarded webhook:', {
      topic,
      shop_domain,
      status: response.status
    });
    
  } catch (error) {
    console.error('Error processing webhook message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Don't throw the error to prevent message redelivery
    // The message will be retried automatically by Pub/Sub
  }
};
