import express from 'express';
import crypto from 'crypto';
import { businessService } from '../services/database';
import { 
  SHOPIFY_OAUTH_CONFIG, 
  SHOPIFY_OAUTH_URLS, 
  generateShopifyAuthUrl, 
  validateShopifyShop, 
  validateOAuthConfig, 
  SHOPIFY_WEBHOOK_CONFIG,
  parseOAuthState,
  exchangeCodeForToken
} from '../config/shopify-oauth';
import { requireBusinessAuth } from '../middleware/business-auth';

async function registerShopifyWebhook(params: { shop: string; accessToken: string; topic: string; address: string }) {
  const { shop, accessToken, topic, address } = params;
  try {
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-10';
    const url = `https://${shop}/admin/api/${apiVersion}/webhooks.json`;
    const body = {
      webhook: {
        topic,
        address,
        format: 'json'
      }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Failed to register webhook:', resp.status, text);
      return false;
    }

    console.log(`Registered Shopify webhook ${topic} -> ${address} for ${shop}`);
    return true;
  } catch (err) {
    console.error('Error registering Shopify webhook:', err);
    return false;
  }
}

const router = express.Router();

// Store OAuth states in memory (in production, use Redis or database)
const oauthStates = new Map<string, { businessId: number; timestamp: number }>();

// GET /api/shopify/oauth/connect - Start direct Shopify OAuth flow
router.get('/connect', requireBusinessAuth, async (req, res) => {
  try {
    console.log('Shopify OAuth connect request received:', {
      query: req.query,
      business: (req as any).business,
      headers: req.headers
    });

    const { shop } = req.query;
    const business = (req as any).business;
    const businessId = business?.id;

    // Validate shop parameter
    if (!shop || typeof shop !== 'string') {
      console.error('Missing or invalid shop parameter:', shop);
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    // Validate shop format
    if (!validateShopifyShop(shop)) {
      console.error('Invalid shop format:', shop);
      return res.status(400).json({ 
        error: 'Invalid shop format. Please use format: your-store.myshopify.com' 
      });
    }

    // Validate business exists
    if (!businessId) {
      console.error('No business ID found in request');
      return res.status(401).json({ error: 'Business authentication required' });
    }

    // Validate OAuth configuration
    if (!validateOAuthConfig()) {
      console.error('OAuth configuration is invalid');
      return res.status(500).json({ error: 'OAuth configuration is invalid. Please check SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.' });
    }

    console.log('Business found:', { id: business.id, name: business.name });

    // Disconnect any existing Shopify connection before starting new OAuth flow
    console.log(`Disconnecting existing Shopify connection for business ${businessId} before connecting to ${shop}`);
    
    try {
      await businessService.updateBusiness(businessId, {
        shopifyAccessToken: null,
        shopifyShop: null,
        shopifyScopes: null,
        shopifyConnectedAt: null,
        shopifyStatus: 'disconnected'
      });
      
      console.log(`Successfully disconnected existing Shopify connection for business ${businessId}`);
    } catch (disconnectError) {
      console.error('Failed to disconnect existing connection:', disconnectError);
      // Continue with OAuth flow even if disconnect fails
    }

    // Generate direct Shopify OAuth URL
    const authUrl = generateShopifyAuthUrl(shop, businessId.toString());

    console.log('Generated Shopify OAuth URL:', authUrl);
    console.log('Environment info:', {
      NODE_ENV: process.env.NODE_ENV,
      SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
      SHOPIFY_CLIENT_ID: SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_ID ? 'Set' : 'Not set',
      SHOPIFY_CLIENT_SECRET: SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_SECRET ? 'Set' : 'Not set'
    });
    
    res.json({
      success: true,
      message: 'OAuth URL generated successfully',
      redirectUrl: authUrl,
      shop: shop,
      businessId: businessId,
      note: 'Direct Shopify OAuth flow - user will be redirected to Shopify for authorization',
      debug: {
        callbackUrl: SHOPIFY_OAUTH_URLS.callback,
        scopes: SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES,
        clientId: SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_ID ? 'Set' : 'Not set'
      }
    });

  } catch (error) {
    console.error('Shopify OAuth connect error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to start OAuth flow',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/shopify/oauth/callback - Handle direct Shopify OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, shop, error, error_description } = req.query;

    console.log('Shopify OAuth callback received:', {
      code: code ? 'Present' : 'Missing',
      state: state ? 'Present' : 'Missing',
      shop: shop,
      error: error,
      error_description: error_description,
      query: req.query
    });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error from Shopify:', { error, error_description });
      const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:8083'}/business/dashboard?shopify_error=true&error=${encodeURIComponent(error as string)}`;
      return res.redirect(errorUrl);
    }

    // Validate required parameters
    if (!code || !state || !shop) {
      console.error('Missing required OAuth parameters:', { code: !!code, state: !!state, shop: !!shop });
      const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:8083'}/business/dashboard?shopify_error=missing_params`;
      return res.redirect(errorUrl);
    }

    // Parse and validate state parameter
    const stateData = parseOAuthState(state as string);
    if (!stateData) {
      console.error('Invalid OAuth state parameter');
      const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:8083'}/business/dashboard?shopify_error=invalid_state`;
      return res.redirect(errorUrl);
    }

    const { businessId } = stateData;

    // Validate shop format
    if (!validateShopifyShop(shop as string)) {
      console.error('Invalid shop format in callback:', shop);
      const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:8083'}/business/dashboard?shopify_error=invalid_shop`;
      return res.redirect(errorUrl);
    }

    try {
      // Exchange authorization code for access token
      console.log('Exchanging authorization code for access token...');
      const tokenData = await exchangeCodeForToken(shop as string, code as string);

      console.log('Token exchange successful:', {
        businessId: businessId,
        shop: shop,
        scopes: tokenData.scopes,
        hasAccessToken: !!tokenData.accessToken
      });

      // Update business with connection info
      await businessService.updateBusiness(parseInt(businessId), {
        shopifyAccessToken: tokenData.accessToken,
        shopifyShop: shop as string,
        shopifyScopes: tokenData.scopes,
        shopifyConnectedAt: new Date(),
        shopifyStatus: 'connected'
      });

      console.log('Shopify OAuth callback successful:', {
        businessId: businessId,
        shop: shop,
        scopes: tokenData.scopes
      });

      // Redirect to dashboard with success message
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8083'}/business/dashboard?shopify_connected=true&shop=${shop}&businessId=${businessId}`;
      
      res.redirect(redirectUrl);

    } catch (tokenError) {
      console.error('Token exchange failed:', tokenError);
      const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:8083'}/business/dashboard?shopify_error=token_exchange_failed`;
      res.redirect(errorUrl);
    }

  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:8083'}/business/dashboard?shopify_error=true`;
    res.redirect(errorUrl);
  }
});

// GET /api/shopify/oauth/status - Check OAuth status
router.get('/status', requireBusinessAuth, async (req, res) => {
  try {
    const business = (req as any).business;
    const businessId = business?.id;
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const isConnected = !!(business.shopifyShop && business.shopifyStatus === 'connected');
    
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
    const business = (req as any).business;
    const businessId = business?.id;
    
    // Get current business info for logging
    const currentShop = business?.shopifyShop;
    
    if (!businessId) {
      return res.status(401).json({ error: 'Business authentication required' });
    }

    console.log(`Disconnecting Shopify store for business ${businessId}, current shop: ${currentShop}`);

    // Update business to disconnect Shopify
    await businessService.updateBusiness(businessId, {
      shopifyAccessToken: null,
      shopifyShop: null,
      shopifyScopes: null,
      shopifyConnectedAt: null,
      shopifyStatus: 'disconnected'
    });

    console.log(`Successfully disconnected Shopify store for business ${businessId}`);

    res.json({
      success: true,
      message: 'Shopify store disconnected successfully',
      businessId: businessId,
      previousShop: currentShop
    });

  } catch (error) {
    console.error('Shopify OAuth disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Shopify store' });
  }
});

// GET /api/shopify/oauth/config - Get OAuth configuration info
router.get('/config', requireBusinessAuth, async (req, res) => {
  try {
    const business = (req as any).business;
    const businessId = business?.id;
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const isConnected = !!(business.shopifyShop && business.shopifyStatus === 'connected');
    
    res.json({
      success: true,
      config: {
        clientId: SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_ID ? 'Set' : 'Not set',
        clientSecret: SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_SECRET ? 'Set' : 'Not set',
        appUrl: SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL,
        scopes: SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES,
        apiVersion: SHOPIFY_OAUTH_CONFIG.SHOPIFY_VERSION,
        webhookSecret: SHOPIFY_OAUTH_CONFIG.IPICK_WEBHOOK_SECRET ? 'Set' : 'Not set'
      },
      business: {
        id: businessId,
        isConnected,
        shop: business.shopifyShop,
        status: business.shopifyStatus || 'disconnected',
        lastConnected: business.shopifyConnectedAt
      },
      urls: {
        callback: SHOPIFY_OAUTH_URLS.callback,
        redirectUrls: SHOPIFY_OAUTH_URLS.redirectUrls
      }
    });

  } catch (error) {
    console.error('Shopify OAuth config error:', error);
    res.status(500).json({ error: 'Failed to get OAuth configuration' });
  }
});

export default router;
