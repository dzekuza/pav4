import express from 'express';
import crypto from 'crypto';
import { requireBusinessAuth } from '../middleware/business-auth.js';
import { SHOPIFY_OAUTH_CONFIG, SHOPIFY_OAUTH_URLS, generateShopifyAuthUrl, validateShopifyShop, validateOAuthConfig, GADGET_WEBHOOK_CONFIG } from '../config/shopify-oauth.js';
import { businessService } from '../services/database.js';

const router = express.Router();

// Store OAuth state for security
const oauthStates = new Map<string, { businessId: number; timestamp: number }>();

// GET /api/shopify/oauth/connect - Start OAuth flow
router.get('/connect', requireBusinessAuth, async (req, res) => {
  try {
    const { shop } = req.query;
    const businessId = (req as any).businessId;

    // Validate OAuth configuration
    if (!validateOAuthConfig()) {
      return res.status(500).json({ 
        error: 'Shopify OAuth is not properly configured. Please contact support.',
        missing: {
          gadgetApiUrl: !SHOPIFY_OAUTH_CONFIG.GADGET_API_URL,
          installUrl: !SHOPIFY_OAUTH_CONFIG.SHOPIFY_INSTALL_URL,
          callbackUrl: !SHOPIFY_OAUTH_CONFIG.SHOPIFY_CALLBACK_URL,
          webhookSecret: !SHOPIFY_OAUTH_CONFIG.IPICK_WEBHOOK_SECRET
        }
      });
    }

    if (!shop) {
      return res.status(400).json({ 
        error: 'Shop parameter is required',
        example: '/api/shopify/oauth/connect?shop=your-store.myshopify.com'
      });
    }

    // Validate shop format
    if (!validateShopifyShop(shop as string)) {
      return res.status(400).json({ 
        error: 'Invalid shop format. Use: your-store.myshopify.com'
      });
    }

    // Generate state parameter for security
    const state = crypto.randomBytes(32).toString('hex');
    oauthStates.set(state, { 
      businessId, 
      timestamp: Date.now() 
    });

    // Clean up old states (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, value] of oauthStates.entries()) {
      if (value.timestamp < oneHourAgo) {
        oauthStates.delete(key);
      }
    }

    // Generate authorization URL using Gadget's install endpoint
    const authUrl = generateShopifyAuthUrl(shop as string, state);

    res.json({
      success: true,
      authUrl,
      shop,
      state,
      webhookEndpoint: `${process.env.FRONTEND_URL || 'https://ipick.io'}${GADGET_WEBHOOK_CONFIG.ENDPOINT}`,
      webhookSecret: SHOPIFY_OAUTH_CONFIG.IPICK_WEBHOOK_SECRET ? 'configured' : 'missing'
    });

  } catch (error) {
    console.error('Shopify OAuth connect error:', error);
    res.status(500).json({ error: 'Failed to start OAuth flow' });
  }
});

// GET /api/shopify/oauth/callback - Handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, shop, hmac } = req.query;

    // Validate required parameters
    if (!code || !state || !shop) {
      return res.status(400).json({ error: 'Missing required OAuth parameters' });
    }

    // Validate HMAC if provided
    if (hmac) {
      // TODO: Implement HMAC validation for additional security
      console.log('HMAC validation would go here');
    }

    // Verify state parameter
    const stateData = oauthStates.get(state as string);
    if (!stateData) {
      return res.status(400).json({ error: 'Invalid or expired state parameter' });
    }

    // Clean up used state
    oauthStates.delete(state as string);

    // For Gadget API integration, we'll handle the OAuth flow differently
    // The Gadget API will handle the token exchange and store the connection
    // We'll just store the shop information and mark it as connected
    
    // Store the shop information in the database
    await businessService.updateBusiness(stateData.businessId, {
      shopifyShop: shop as string,
      shopifyScopes: SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES,
      shopifyConnectedAt: new Date(),
      shopifyStatus: 'connected'
    });

    // Redirect to dashboard with success message
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8084'}/business/dashboard?shopify_connected=true&shop=${shop}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:8084'}/business/dashboard?shopify_error=true`;
    res.redirect(errorUrl);
  }
});

// GET /api/shopify/oauth/status - Check OAuth status
router.get('/status', requireBusinessAuth, async (req, res) => {
  try {
    const businessId = (req as any).businessId;
    
    const business = await businessService.getBusinessById(businessId);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const isConnected = !!(business.shopifyAccessToken && business.shopifyShop);
    
    res.json({
      success: true,
      isConnected,
      shop: business.shopifyShop,
      scopes: business.shopifyScopes,
      lastConnected: business.shopifyConnectedAt || business.updatedAt,
      status: business.shopifyStatus || 'disconnected',
      webhookConfigured: !!SHOPIFY_OAUTH_CONFIG.IPICK_WEBHOOK_SECRET
    });

  } catch (error) {
    console.error('Shopify OAuth status error:', error);
    res.status(500).json({ error: 'Failed to get OAuth status' });
  }
});

// POST /api/shopify/oauth/disconnect - Disconnect Shopify store
router.post('/disconnect', requireBusinessAuth, async (req, res) => {
  try {
    const businessId = (req as any).businessId;
    
    // Remove Shopify credentials
    await businessService.updateBusiness(businessId, {
      shopifyAccessToken: null,
      shopifyShop: null,
      shopifyScopes: null,
      shopifyConnectedAt: null,
      shopifyStatus: 'disconnected'
    });

    res.json({
      success: true,
      message: 'Shopify store disconnected successfully'
    });

  } catch (error) {
    console.error('Shopify OAuth disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Shopify store' });
  }
});

// GET /api/shopify/oauth/webhook-config - Get webhook configuration for Gadget
router.get('/webhook-config', requireBusinessAuth, async (req, res) => {
  try {
    const businessId = (req as any).businessId;
    
    const business = await businessService.getBusinessById(businessId);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      success: true,
      webhookEndpoint: `${process.env.FRONTEND_URL || 'https://ipick.io'}${GADGET_WEBHOOK_CONFIG.ENDPOINT}`,
      webhookSecret: SHOPIFY_OAUTH_CONFIG.IPICK_WEBHOOK_SECRET ? 'configured' : 'missing',
      shop: business.shopifyShop,
      events: GADGET_WEBHOOK_CONFIG.EVENTS
    });

  } catch (error) {
    console.error('Webhook config error:', error);
    res.status(500).json({ error: 'Failed to get webhook configuration' });
  }
});

export default router;
