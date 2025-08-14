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

    // Add business-specific processing for customer events
    if (topic === 'customers/create' || topic === 'customers/update') {
      console.log(`👤 Customer Event: ${topic} - Customer: ${payload.email} - Orders: ${payload.orders_count} - Total Spent: ${payload.total_spent}`);
      
      // Extract key customer metrics
      const customerMetrics = {
        customer_id: payload.id,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        orders_count: payload.orders_count || 0,
        total_spent: parseFloat(payload.total_spent || 0),
        currency: payload.currency,
        tags: payload.tags,
        accepts_marketing: payload.accepts_marketing,
        verified_email: payload.verified_email,
        created_at: payload.created_at,
        updated_at: payload.updated_at
      };
      
      console.log('Customer Metrics:', customerMetrics);
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
      console.log(`✅ Customer webhook processed successfully: ${topic} for shop: ${shop}`);
      return new Response(null, { status: 200 });
    } else {
      console.error(`❌ Customer webhook forwarding failed: ${topic} for shop: ${shop}`, result.error);
      // Still return 200 to Shopify to prevent retries, but log the error
      return new Response(null, { status: 200 });
    }
  } catch (error) {
    console.error(`❌ Error processing customer webhook: ${topic} for shop: ${shop}`, error);
    // Return 200 to prevent Shopify from retrying, but log the error
    return new Response(null, { status: 200 });
  }
};
