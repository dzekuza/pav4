import express from 'express';
import crypto from 'crypto';
import { businessService } from '../services/database';

const router = express.Router();

// POST /api/webhooks/gadget - Handle Gadget webhooks
router.post('/gadget', async (req, res) => {
  try {
    console.log('Gadget webhook received:', {
      body: req.body,
      headers: req.headers
    });

    // Verify webhook signature if needed
    const webhookSecret = process.env.IPICK_WEBHOOK_SECRET;
    if (webhookSecret) {
      // TODO: Implement webhook signature verification
      console.log('Webhook secret verification would go here');
    }

    const { event, data } = req.body;

    console.log('Webhook event:', event);
    console.log('Webhook data:', data);

    // Handle different webhook events
    switch (event) {
      case 'shopify_connection_created':
      case 'shopify_connection_updated':
        console.log('Shopify connection event:', event);
        await handleShopifyConnection(data);
        break;
      
      case 'shopify_connection_deleted':
        console.log('Shopify connection deleted');
        await handleShopifyDisconnection(data);
        break;
      
      case 'shopify_shop_created':
      case 'shopify_shop_updated':
        console.log('Shopify shop event:', event);
        await handleShopifyShopUpdate(data);
        break;
      
      default:
        console.log('Unknown webhook event:', event);
    }

    res.json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle Shopify connection events
async function handleShopifyConnection(data: any) {
  try {
    console.log('Processing Shopify connection:', data);

    // Extract shop information
    const shop = data.shop;
    if (!shop) {
      console.error('No shop data in connection event');
      return;
    }

    // Find business by shop domain (you might want to store this mapping)
    // For now, we'll try to find by domain
    const business = await businessService.findBusinessByDomain(shop.domain || shop.myshopifyDomain);
    
    if (business) {
      // Update business with Shopify connection info
      await businessService.updateBusiness(business.id, {
        shopifyShop: shop.domain || shop.myshopifyDomain,
        shopifyScopes: shop.scopes || 'read_products,read_orders,read_customers',
        shopifyConnectedAt: new Date(),
        shopifyStatus: 'connected'
      });

      console.log('Updated business with Shopify connection:', {
        businessId: business.id,
        shop: shop.domain || shop.myshopifyDomain
      });
    } else {
      console.log('No business found for shop:', shop.domain || shop.myshopifyDomain);
    }

  } catch (error) {
    console.error('Error handling Shopify connection:', error);
  }
}

// Handle Shopify disconnection events
async function handleShopifyDisconnection(data: any) {
  try {
    console.log('Processing Shopify disconnection:', data);

    const shop = data.shop;
    if (!shop) {
      console.error('No shop data in disconnection event');
      return;
    }

    // Find and update business
    const business = await businessService.findBusinessByDomain(shop.domain || shop.myshopifyDomain);
    
    if (business) {
      await businessService.updateBusiness(business.id, {
        shopifyAccessToken: null,
        shopifyShop: null,
        shopifyScopes: null,
        shopifyConnectedAt: null,
        shopifyStatus: 'disconnected'
      });

      console.log('Disconnected business from Shopify:', {
        businessId: business.id,
        shop: shop.domain || shop.myshopifyDomain
      });
    }

  } catch (error) {
    console.error('Error handling Shopify disconnection:', error);
  }
}

// Handle Shopify shop updates
async function handleShopifyShopUpdate(data: any) {
  try {
    console.log('Processing Shopify shop update:', data);

    const shop = data.shop;
    if (!shop) {
      console.error('No shop data in shop update event');
      return;
    }

    // Update business if connected to this shop
    const business = await businessService.findBusinessByDomain(shop.domain || shop.myshopifyDomain);
    
    if (business) {
      await businessService.updateBusiness(business.id, {
        shopifyShop: shop.domain || shop.myshopifyDomain,
        // Update other fields as needed
      });

      console.log('Updated business shop info:', {
        businessId: business.id,
        shop: shop.domain || shop.myshopifyDomain
      });
    }

  } catch (error) {
    console.error('Error handling Shopify shop update:', error);
  }
}

export default router;
