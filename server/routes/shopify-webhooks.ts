import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/database';

// Validation schema for Shopify webhook data
const ShopifyWebhookSchema = z.object({
  topic: z.string(),
  shop_domain: z.string(),
  event_id: z.string(),
  triggered_at: z.string(),
  payload: z.record(z.any()),
  timestamp: z.string(),
  source: z.literal('shopify-tracking-app')
});

// Validation schema for order events
const OrderEventSchema = z.object({
  id: z.number(),
  order_number: z.string().optional(),
  total_price: z.string().optional(),
  currency: z.string().optional(),
  financial_status: z.string().optional(),
  fulfillment_status: z.string().optional(),
  customer: z.object({
    id: z.number().optional(),
    email: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional()
  }).optional(),
  line_items: z.array(z.any()).optional(),
  _metadata: z.object({
    processed_at: z.string(),
    shop_domain: z.string(),
    topic: z.string(),
    version: z.string()
  }).optional(),
  _order_metrics: z.object({
    total_price: z.string().optional(),
    currency: z.string().optional(),
    line_items_count: z.number().optional(),
    customer_id: z.number().optional(),
    financial_status: z.string().optional(),
    fulfillment_status: z.string().optional()
  }).optional()
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
  _metadata: z.object({
    processed_at: z.string(),
    shop_domain: z.string(),
    topic: z.string(),
    version: z.string()
  }).optional(),
  _product_metrics: z.object({
    product_type: z.string().optional(),
    vendor: z.string().optional(),
    tags: z.string().optional(),
    variants_count: z.number().optional(),
    status: z.string().optional()
  }).optional()
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
  _metadata: z.object({
    processed_at: z.string(),
    shop_domain: z.string(),
    topic: z.string(),
    version: z.string()
  }).optional(),
  _customer_metrics: z.object({
    email: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    orders_count: z.number().optional(),
    total_spent: z.string().optional(),
    tags: z.string().optional()
  }).optional()
});

// Validation schema for cart events
const CartEventSchema = z.object({
  id: z.string().optional(),
  total_price: z.string().optional(),
  currency: z.string().optional(),
  customer: z.object({
    id: z.number().optional(),
    email: z.string().optional()
  }).optional(),
  line_items: z.array(z.any()).optional(),
  _metadata: z.object({
    processed_at: z.string(),
    shop_domain: z.string(),
    topic: z.string(),
    version: z.string()
  }).optional(),
  _cart_metrics: z.object({
    total_price: z.string().optional(),
    currency: z.string().optional(),
    line_items_count: z.number().optional(),
    customer_id: z.number().optional()
  }).optional()
});

/**
 * Validate API key from request headers
 */
function validateApiKey(req: Request): boolean {
  const authHeader = req.headers.authorization;
  const expectedApiKey = process.env.SHOPIFY_WEBHOOK_API_KEY;
  
  if (!expectedApiKey) {
    console.warn('SHOPIFY_WEBHOOK_API_KEY not configured');
    return false;
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const providedApiKey = authHeader.substring(7);
  return providedApiKey === expectedApiKey;
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
        event_type: 'order',
        resource_id: orderData.id.toString(),
        payload: webhookData.payload,
        metadata: {
          order_number: orderData.order_number,
          total_price: orderData.total_price,
          currency: orderData.currency,
          financial_status: orderData.financial_status,
          fulfillment_status: orderData.fulfillment_status,
          customer_email: orderData.customer?.email,
          line_items_count: orderData.line_items?.length || 0
        }
      }
    });

    // Track order event for analytics
    if (webhookData.topic === 'orders/create' || webhookData.topic === 'orders/paid') {
      await prisma.trackEvent.create({
        data: {
          event_type: 'shopify_order',
          event_data: {
            shop_domain: webhookData.shop_domain,
            order_id: orderData.id,
            order_number: orderData.order_number,
            total_price: orderData.total_price,
            currency: orderData.currency,
            customer_email: orderData.customer?.email,
            topic: webhookData.topic
          },
          timestamp: new Date(),
          source: 'shopify-webhook'
        }
      });
    }

    console.log(`Processed order event: ${webhookData.topic} for order ${orderData.id}`);
  } catch (error) {
    console.error('Error processing order event:', error);
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
        event_type: 'product',
        resource_id: productData.id.toString(),
        payload: webhookData.payload,
        metadata: {
          title: productData.title,
          handle: productData.handle,
          product_type: productData.product_type,
          vendor: productData.vendor,
          status: productData.status,
          variants_count: productData.variants?.length || 0
        }
      }
    });

    console.log(`Processed product event: ${webhookData.topic} for product ${productData.id}`);
  } catch (error) {
    console.error('Error processing product event:', error);
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
        event_type: 'customer',
        resource_id: customerData.id.toString(),
        payload: webhookData.payload,
        metadata: {
          email: customerData.email,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          orders_count: customerData.orders_count,
          total_spent: customerData.total_spent
        }
      }
    });

    console.log(`Processed customer event: ${webhookData.topic} for customer ${customerData.id}`);
  } catch (error) {
    console.error('Error processing customer event:', error);
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
        event_type: 'cart',
        resource_id: cartData.id || 'unknown',
        payload: webhookData.payload,
        metadata: {
          total_price: cartData.total_price,
          currency: cartData.currency,
          customer_email: cartData.customer?.email,
          line_items_count: cartData.line_items?.length || 0
        }
      }
    });

    // Track cart events for analytics
    await prisma.trackEvent.create({
      data: {
        event_type: 'shopify_cart',
        event_data: {
          shop_domain: webhookData.shop_domain,
          cart_id: cartData.id,
          total_price: cartData.total_price,
          currency: cartData.currency,
          customer_email: cartData.customer?.email,
          topic: webhookData.topic
        },
        timestamp: new Date(),
        source: 'shopify-webhook'
      }
    });

    console.log(`Processed cart event: ${webhookData.topic} for cart ${cartData.id}`);
  } catch (error) {
    console.error('Error processing cart event:', error);
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
      console.warn('Invalid API key for Shopify webhook');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate webhook source
    const webhookSource = req.headers['x-webhook-source'];
    if (webhookSource !== 'shopify-tracking-app') {
      console.warn('Invalid webhook source:', webhookSource);
      return res.status(400).json({ error: 'Invalid webhook source' });
    }

    // Parse and validate webhook data
    const webhookData = ShopifyWebhookSchema.parse(req.body);
    
    console.log(`Received Shopify webhook: ${webhookData.topic} from ${webhookData.shop_domain}`);

    // Process events based on topic
    const topic = webhookData.topic;
    
    if (topic.startsWith('orders/')) {
      await processOrderEvent(webhookData);
    } else if (topic.startsWith('products/')) {
      await processProductEvent(webhookData);
    } else if (topic.startsWith('customers/')) {
      await processCustomerEvent(webhookData);
    } else if (topic.startsWith('carts/')) {
      await processCartEvent(webhookData);
    } else if (topic.startsWith('checkouts/')) {
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
          event_type: 'other',
          resource_id: 'unknown',
          payload: webhookData.payload,
          metadata: {}
        }
      });
      
      console.log(`Processed generic event: ${webhookData.topic}`);
    }

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      event_id: webhookData.event_id,
      topic: webhookData.topic
    });

  } catch (error) {
    console.error('Error processing Shopify webhook:', error);
    
    // Return 200 to prevent Shopify from retrying, but log the error
    res.status(200).json({ 
      success: false, 
      error: 'Webhook processed with errors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get webhook statistics
 */
export async function getWebhookStats(req: Request, res: Response) {
  try {
    const stats = await prisma.shopifyEvent.groupBy({
      by: ['event_type', 'topic'],
      _count: {
        id: true
      },
      where: {
        processed_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    const totalEvents = await prisma.shopifyEvent.count({
      where: {
        processed_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const uniqueShops = await prisma.shopifyEvent.groupBy({
      by: ['shop_domain'],
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      data: {
        total_events_24h: totalEvents,
        unique_shops: uniqueShops.length,
        events_by_type: stats,
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting webhook stats:', error);
    res.status(500).json({ error: 'Failed to get webhook statistics' });
  }
}
