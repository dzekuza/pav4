import { authenticate } from "../shopify.server";
import { forwardWebhookToMainApp, processWebhookData, validateWebhookData } from "../services/webhook-forwarder.server";

export const action = async ({ request }) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  try {
    // Validate the webhook data
    validateWebhookData(payload, topic);

    // Process and enrich the webhook data
    const processedPayload = processWebhookData(topic, payload, shop);

    // Extract webhook metadata from headers
    const eventId = request.headers.get('x-shopify-webhook-id');
    const triggeredAt = request.headers.get('x-shopify-triggered-at');

    // Forward to main application
    const result = await forwardWebhookToMainApp(
      topic,
      processedPayload,
      shop,
      eventId,
      triggeredAt
    );

    if (result.success) {
      console.log(`Checkout webhook processed successfully: ${topic} for shop: ${shop}`);
      return new Response(null, { status: 200 });
    } else {
      console.error(`Checkout webhook forwarding failed: ${topic} for shop: ${shop}`, result.error);
      // Still return 200 to Shopify to prevent retries, but log the error
      return new Response(null, { status: 200 });
    }
  } catch (error) {
    console.error(`Error processing checkout webhook: ${topic} for shop: ${shop}`, error);
    // Return 200 to prevent Shopify from retrying, but log the error
    return new Response(null, { status: 200 });
  }
};
