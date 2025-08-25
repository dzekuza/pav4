import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/database";
import express from 'express';
import crypto from 'crypto';
import { businessService } from '../services/database.js';

const router = express.Router();

// Shopify HMAC verification for direct webhooks
function verifyShopifyHmac(rawBody: Buffer, providedHmac: string | string[] | undefined): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET_KEY;
  if (!secret) {
    console.error('SHOPIFY_WEBHOOK_SECRET not configured');
    return false;
  }

  if (!providedHmac || Array.isArray(providedHmac)) {
    return false;
  }

  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(providedHmac));
  } catch {
    return false;
  }
}

// Validation schema for Shopify webhook data
const ShopifyWebhookSchema = z.object({
  topic: z.string(),
  shop_domain: z.string(),
  event_id: z.string(),
  triggered_at: z.string(),
  payload: z.record(z.any()),
  timestamp: z.string(),
  source: z.literal("shopify-tracking-app"),
});

// Validation schema for order events
const OrderEventSchema = z.object({
  id: z.number(),
  order_number: z.string().optional(),
  total_price: z.string().optional(),
  currency: z.string().optional(),
  financial_status: z.string().optional(),
  fulfillment_status: z.string().optional(),
  customer: z
    .object({
      id: z.number().optional(),
      email: z.string().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
    })
    .optional(),
  line_items: z.array(z.any()).optional(),
  _metadata: z
    .object({
      processed_at: z.string(),
      shop_domain: z.string(),
      topic: z.string(),
      version: z.string(),
    })
    .optional(),
  _order_metrics: z
    .object({
      total_price: z.string().optional(),
      currency: z.string().optional(),
      line_items_count: z.number().optional(),
      customer_id: z.number().optional(),
      financial_status: z.string().optional(),
      fulfillment_status: z.string().optional(),
    })
    .optional(),
});

// Validation schema for product events
const ProductEventSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  handle: z.string().optional(),
  product_type: z.string().optional(),
  vendor: z.string().optional(),
  tags: z.string().optional(),
  status: z.string().optional(),
  variants: z.array(z.any()).optional(),
  _metadata: z
    .object({
      processed_at: z.string(),
      shop_domain: z.string(),
      topic: z.string(),
      version: z.string(),
    })
    .optional(),
  _product_metrics: z
    .object({
      product_type: z.string().optional(),
      vendor: z.string().optional(),
      tags: z.string().optional(),
      variants_count: z.number().optional(),
      status: z.string().optional(),
    })
    .optional(),
});

// Validation schema for customer events
const CustomerEventSchema = z.object({
  id: z.number(),
  email: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  orders_count: z.number().optional(),
  total_spent: z.string().optional(),
  tags: z.string().optional(),
  _metadata: z
    .object({
      processed_at: z.string(),
      shop_domain: z.string(),
      topic: z.string(),
      version: z.string(),
    })
    .optional(),
  _customer_metrics: z
    .object({
      email: z.string().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      orders_count: z.number().optional(),
      total_spent: z.string().optional(),
      tags: z.string().optional(),
    })
    .optional(),
});

// Validation schema for cart events
const CartEventSchema = z.object({
  id: z.string().optional(),
  total_price: z.string().optional(),
  currency: z.string().optional(),
  customer: z
    .object({
      id: z.number().optional(),
      email: z.string().optional(),
    })
    .optional(),
  line_items: z.array(z.any()).optional(),
  _metadata: z
    .object({
      processed_at: z.string(),
      shop_domain: z.string(),
      topic: z.string(),
      version: z.string(),
    })
    .optional(),
  _cart_metrics: z
    .object({
      total_price: z.string().optional(),
      currency: z.string().optional(),
      line_items_count: z.number().optional(),
      customer_id: z.number().optional(),
    })
    .optional(),
});

/**
 * Validate API key from request headers
 */
function validateApiKey(req: Request): boolean {
  const authHeader = req.headers.authorization;
  const expectedApiKey = process.env.SHOPIFY_WEBHOOK_API_KEY;

  if (!expectedApiKey) {
    console.warn("SHOPIFY_WEBHOOK_API_KEY not configured");
    return false;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const providedApiKey = authHeader.substring(7);
  return providedApiKey === expectedApiKey;
}

/**
 * Verify webhook signature from Gadget
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.IPICK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('IPICK_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Process order events
 */
async function processOrderEvent(webhookData: any) {
  try {
    const orderData = OrderEventSchema.parse(webhookData.payload);

    // Store order event in database
    await prisma.shopifyEvent.create({
      data: {
        event_id: webhookData.event_id,
        shop_domain: webhookData.shop_domain,
        topic: webhookData.topic,
        triggered_at: new Date(webhookData.triggered_at),
        processed_at: new Date(),
        event_type: "order",
        resource_id: orderData.id.toString(),
        payload: webhookData.payload,
        metadata: {
          order_number: orderData.order_number,
          total_price: orderData.total_price,
          currency: orderData.currency,
          financial_status: orderData.financial_status,
          fulfillment_status: orderData.fulfillment_status,
          customer_email: orderData.customer?.email,
          line_items_count: orderData.line_items?.length || 0,
        },
      },
    });

    // Track order event for analytics
    if (
      webhookData.topic === "orders/create" ||
      webhookData.topic === "orders/paid"
    ) {
      await prisma.trackingEvent.create({
        data: {
          eventType: "shopify_order",
          eventData: {
            shop_domain: webhookData.shop_domain,
            order_id: orderData.id,
            order_number: orderData.order_number,
            total_price: orderData.total_price,
            currency: orderData.currency,
            customer_email: orderData.customer?.email,
            topic: webhookData.topic,
          },
          businessId: 1, // Default business ID for webhook events
          affiliateId: "webhook",
          platform: "shopify",
        },
      });
    }

    console.log(
      `Processed order event: ${webhookData.topic} for order ${orderData.id}`,
    );
  } catch (error) {
    console.error("Error processing order event:", error);
    throw error;
  }
}

/**
 * Process product events
 */
async function processProductEvent(webhookData: any) {
  try {
    const productData = ProductEventSchema.parse(webhookData.payload);

    // Store product event in database
    await prisma.shopifyEvent.create({
      data: {
        event_id: webhookData.event_id,
        shop_domain: webhookData.shop_domain,
        topic: webhookData.topic,
        triggered_at: new Date(webhookData.triggered_at),
        processed_at: new Date(),
        event_type: "product",
        resource_id: productData.id.toString(),
        payload: webhookData.payload,
        metadata: {
          title: productData.title,
          handle: productData.handle,
          product_type: productData.product_type,
          vendor: productData.vendor,
          status: productData.status,
          variants_count: productData.variants?.length || 0,
        },
      },
    });

    console.log(
      `Processed product event: ${webhookData.topic} for product ${productData.id}`,
    );
  } catch (error) {
    console.error("Error processing product event:", error);
    throw error;
  }
}

/**
 * Process customer events
 */
async function processCustomerEvent(webhookData: any) {
  try {
    const customerData = CustomerEventSchema.parse(webhookData.payload);

    // Store customer event in database
    await prisma.shopifyEvent.create({
      data: {
        event_id: webhookData.event_id,
        shop_domain: webhookData.shop_domain,
        topic: webhookData.topic,
        triggered_at: new Date(webhookData.triggered_at),
        processed_at: new Date(),
        event_type: "customer",
        resource_id: customerData.id.toString(),
        payload: webhookData.payload,
        metadata: {
          email: customerData.email,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          orders_count: customerData.orders_count,
          total_spent: customerData.total_spent,
        },
      },
    });

    console.log(
      `Processed customer event: ${webhookData.topic} for customer ${customerData.id}`,
    );
  } catch (error) {
    console.error("Error processing customer event:", error);
    throw error;
  }
}

/**
 * Process cart events
 */
async function processCartEvent(webhookData: any) {
  try {
    const cartData = CartEventSchema.parse(webhookData.payload);

    // Store cart event in database
    await prisma.shopifyEvent.create({
      data: {
        event_id: webhookData.event_id,
        shop_domain: webhookData.shop_domain,
        topic: webhookData.topic,
        triggered_at: new Date(webhookData.triggered_at),
        processed_at: new Date(),
        event_type: "cart",
        resource_id: cartData.id || "unknown",
        payload: webhookData.payload,
        metadata: {
          total_price: cartData.total_price,
          currency: cartData.currency,
          customer_email: cartData.customer?.email,
          line_items_count: cartData.line_items?.length || 0,
        },
      },
    });

    // Track cart events for analytics
    await prisma.trackingEvent.create({
      data: {
        eventType: "shopify_cart",
        eventData: {
          shop_domain: webhookData.shop_domain,
          cart_id: cartData.id,
          total_price: cartData.total_price,
          currency: cartData.currency,
          customer_email: cartData.customer?.email,
          topic: webhookData.topic,
        },
        businessId: 1, // Default business ID for webhook events
        affiliateId: "webhook",
        platform: "shopify",
      },
    });

    console.log(
      `Processed cart event: ${webhookData.topic} for cart ${cartData.id}`,
    );
  } catch (error) {
    console.error("Error processing cart event:", error);
    throw error;
  }
}

/**
 * Main webhook handler
 */
export async function handleShopifyWebhook(req: Request, res: Response) {
  try {
    // Validate API key
    if (!validateApiKey(req)) {
      console.warn("Invalid API key for Shopify webhook");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate webhook source
    const webhookSource = req.headers["x-webhook-source"];
    if (webhookSource !== "shopify-tracking-app") {
      console.warn("Invalid webhook source:", webhookSource);
      return res.status(400).json({ error: "Invalid webhook source" });
    }

    // Parse and validate webhook data
    const webhookData = ShopifyWebhookSchema.parse(req.body);

    console.log(
      `Received Shopify webhook: ${webhookData.topic} from ${webhookData.shop_domain}`,
    );

    // Process events based on topic
    const topic = webhookData.topic;

    if (topic.startsWith("orders/")) {
      await processOrderEvent(webhookData);
    } else if (topic.startsWith("products/")) {
      await processProductEvent(webhookData);
    } else if (topic.startsWith("customers/")) {
      await processCustomerEvent(webhookData);
    } else if (topic.startsWith("carts/")) {
      await processCartEvent(webhookData);
    } else if (topic.startsWith("checkouts/")) {
      // Process checkout events similar to cart events
      await processCartEvent(webhookData);
    } else {
      // Store other events generically
      await prisma.shopifyEvent.create({
        data: {
          event_id: webhookData.event_id,
          shop_domain: webhookData.shop_domain,
          topic: webhookData.topic,
          triggered_at: new Date(webhookData.triggered_at),
          processed_at: new Date(),
          event_type: "other",
          resource_id: "unknown",
          payload: webhookData.payload,
          metadata: {},
        },
      });

      console.log(`Processed generic event: ${webhookData.topic}`);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      event_id: webhookData.event_id,
      topic: webhookData.topic,
    });
  } catch (error) {
    console.error("Error processing Shopify webhook:", error);

    // Return 200 to prevent Shopify from retrying, but log the error
    res.status(200).json({
      success: false,
      error: "Webhook processed with errors",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Direct Shopify webhook endpoint: POST /api/shopify/webhooks
router.post(
  '/webhooks',
  // Shopify requires raw body for HMAC verification
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const hmacHeader = req.headers['x-shopify-hmac-sha256'];
      const topic = (req.headers['x-shopify-topic'] as string) || '';
      const shopDomain = (req.headers['x-shopify-shop-domain'] as string) || '';
      const eventId = (req.headers['x-shopify-webhook-id'] as string) || '';

      if (!verifyShopifyHmac(req.body as Buffer, hmacHeader)) {
        console.warn('Invalid Shopify HMAC for direct webhook');
        return res.status(401).send('Unauthorized');
      }

      // Parse JSON payload
      const payload = JSON.parse((req.body as Buffer).toString('utf8'));

      // Build internal webhook data structure consumed by processors
      const webhookData = {
        topic: topic,
        shop_domain: shopDomain,
        event_id: eventId || (payload?.id ? String(payload.id) : undefined) || crypto.randomUUID(),
        triggered_at: new Date().toISOString(),
        payload: payload,
      } as any;

      // Route by topic
      if (topic.startsWith('orders/')) {
        await processOrderEvent(webhookData);
      } else if (topic.startsWith('products/')) {
        await processProductEvent(webhookData);
      } else if (topic.startsWith('customers/')) {
        await processCustomerEvent(webhookData);
      } else if (topic.startsWith('carts/') || topic.startsWith('checkouts/')) {
        await processCartEvent(webhookData);
      } else {
        // Generic persistence
        await prisma.shopifyEvent.create({
          data: {
            event_id: webhookData.event_id,
            shop_domain: webhookData.shop_domain,
            topic: webhookData.topic,
            triggered_at: new Date(webhookData.triggered_at),
            processed_at: new Date(),
            event_type: 'other',
            resource_id: payload?.id ? String(payload.id) : 'unknown',
            payload: webhookData.payload,
            metadata: {},
          },
        });
      }

      // Respond 200 OK quickly
      res.status(200).send('OK');
    } catch (error) {
      console.error('Direct Shopify webhook error:', error);
      // Still respond 200 to avoid retries storm; monitor logs for failures
      res.status(200).send('OK');
    }
  }
);

/**
 * Get webhook statistics
 */
export async function getWebhookStats(req: Request, res: Response) {
  try {
    const stats = await prisma.shopifyEvent.groupBy({
      by: ["event_type", "topic"],
      _count: {
        id: true,
      },
      where: {
        processed_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const totalEvents = await prisma.shopifyEvent.count({
      where: {
        processed_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const uniqueShops = await prisma.shopifyEvent.groupBy({
      by: ["shop_domain"],
      _count: {
        id: true,
      },
    });

    res.json({
      success: true,
      data: {
        total_events_24h: totalEvents,
        unique_shops: uniqueShops.length,
        events_by_type: stats,
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting webhook stats:", error);
    res.status(500).json({ error: "Failed to get webhook statistics" });
  }
}

// Handle Shopify connection created
async function handleShopifyConnectionCreated(data: any) {
  try {
    const { shop, businessId } = data.payload;
    
    if (businessId) {
      await businessService.updateBusiness(businessId, {
        shopifyShop: shop,
        shopifyConnectedAt: new Date(),
        shopifyStatus: 'connected'
      });
      console.log(`Shopify connection created for business ${businessId}, shop: ${shop}`);
    }
  } catch (error) {
    console.error('Error handling Shopify connection created:', error);
  }
}

// Handle Shopify connection updated
async function handleShopifyConnectionUpdated(data: any) {
  try {
    const { shop, businessId, status } = data.payload;
    
    if (businessId) {
      await businessService.updateBusiness(businessId, {
        shopifyShop: shop,
        shopifyStatus: status,
        updatedAt: new Date()
      });
      console.log(`Shopify connection updated for business ${businessId}, shop: ${shop}, status: ${status}`);
    }
  } catch (error) {
    console.error('Error handling Shopify connection updated:', error);
  }
}

// Handle Shopify connection deleted
async function handleShopifyConnectionDeleted(data: any) {
  try {
    const { businessId } = data.payload;
    
    if (businessId) {
      await businessService.updateBusiness(businessId, {
        shopifyShop: null,
        shopifyAccessToken: null,
        shopifyScopes: null,
        shopifyConnectedAt: null,
        shopifyStatus: 'disconnected'
      });
      console.log(`Shopify connection deleted for business ${businessId}`);
    }
  } catch (error) {
    console.error('Error handling Shopify connection deleted:', error);
  }
}

// Handle order created
async function handleOrderCreated(data: any) {
  try {
    const { order, shop, clickId } = data.payload;
    
    // Store order attribution data
    if (clickId && order) {
      // This would integrate with your existing order tracking system
      console.log(`Order created with click attribution: ${order.id}, click: ${clickId}, shop: ${shop}`);
    }
  } catch (error) {
    console.error('Error handling order created:', error);
  }
}

// Handle order updated
async function handleOrderUpdated(data: any) {
  try {
    const { order, shop } = data.payload;
    
    // Update order status if needed
    console.log(`Order updated: ${order.id}, shop: ${shop}`);
  } catch (error) {
    console.error('Error handling order updated:', error);
  }
}

// POST /api/webhooks/gadget - Handle webhooks from Gadget
router.post('/gadget', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-gadget-signature'] as string;
    const payload = req.body;

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const data = JSON.parse(payload);
    console.log('Received Gadget webhook:', data);

    // Handle different webhook types
    switch (data.type) {
      case 'shopify_connection_created':
        await handleShopifyConnectionCreated(data);
        break;
      case 'shopify_connection_updated':
        await handleShopifyConnectionUpdated(data);
        break;
      case 'shopify_connection_deleted':
        await handleShopifyConnectionDeleted(data);
        break;
      case 'order_created':
        await handleOrderCreated(data);
        break;
      case 'order_updated':
        await handleOrderUpdated(data);
        break;
      default:
        console.log('Unknown webhook type:', data.type);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Gadget webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
