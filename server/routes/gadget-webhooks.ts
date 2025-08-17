import express from 'express';
import crypto from 'crypto';
import { businessService } from '../services/database.js';

const router = express.Router();

// Verify webhook signature from Gadget
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

export default router;
