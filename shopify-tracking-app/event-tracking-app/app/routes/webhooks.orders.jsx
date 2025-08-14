import { authenticate } from "../shopify.server";
import { forwardWebhookToMainApp, processWebhookData, validateWebhookData } from "../services/webhook-forwarder.server";

export const action = async ({ request }) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  try {
    // Validate the webhook data
    validateWebhookData(payload, topic);

    // Process and enrich the webhook data with business metrics
    const processedPayload = processWebhookData(topic, payload, shop);

    // Extract webhook metadata from headers
    const eventId = request.headers.get('x-shopify-webhook-id');
    const triggeredAt = request.headers.get('x-shopify-triggered-at');

    // Add business-specific processing for order events
    if (topic === 'orders/paid' || topic === 'orders/create') {
      console.log(`💰 Business Event: ${topic} - Order #${payload.order_number} - Amount: ${payload.total_price} ${payload.currency}`);
      
      // Extract key business metrics
      const businessMetrics = {
        order_id: payload.id,
        order_number: payload.order_number,
        total_revenue: parseFloat(payload.total_price || 0),
        currency: payload.currency,
        customer_email: payload.email,
        customer_id: payload.customer_id,
        line_items_count: payload.line_items?.length || 0,
        financial_status: payload.financial_status,
        fulfillment_status: payload.fulfillment_status,
        subtotal: parseFloat(payload.subtotal_price || 0),
        tax_amount: parseFloat(payload.total_tax || 0),
        discount_amount: parseFloat(payload.total_discounts || 0)
      };
      
      console.log('Business Metrics:', businessMetrics);
    }

    // Forward to main application
    const result = await forwardWebhookToMainApp(
      topic,
      processedPayload,
      shop,
      eventId,
      triggeredAt
    );

    if (result.success) {
      console.log(`✅ Order webhook processed successfully: ${topic} for shop: ${shop}`);
      return new Response(null, { status: 200 });
    } else {
      console.error(`❌ Order webhook forwarding failed: ${topic} for shop: ${shop}`, result.error);
      // Still return 200 to Shopify to prevent retries, but log the error
      return new Response(null, { status: 200 });
    }
  } catch (error) {
    console.error(`❌ Error processing order webhook: ${topic} for shop: ${shop}`, error);
    // Return 200 to prevent Shopify from retrying, but log the error
    return new Response(null, { status: 200 });
  }
};
