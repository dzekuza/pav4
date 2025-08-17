import express from 'express';
import crypto from 'crypto';
import { requireBusinessAuth } from '../middleware/business-auth.js';
import { SHOPIFY_OAUTH_CONFIG, SHOPIFY_OAUTH_URLS, generateShopifyAuthUrl, validateShopifyShop, validateOAuthConfig } from '../config/shopify-oauth.js';
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
        error: 'Shopify OAuth is not properly configured. Please contact support.'
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

    // Generate authorization URL
    const authUrl = generateShopifyAuthUrl(shop as string, state);

    res.json({
      success: true,
      authUrl,
      shop,
      state
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

    // Exchange code for access token
    const tokenResponse = await fetch(SHOPIFY_OAUTH_URLS.accessToken(shop as string), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_KEY,
        client_secret: SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_SECRET,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      console.error('Shopify token exchange failed:', await tokenResponse.text());
      return res.status(400).json({ error: 'Failed to exchange code for access token' });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, scope } = tokenData;

    if (!access_token) {
      return res.status(400).json({ error: 'No access token received from Shopify' });
    }

    // Store the access token in the database
    await businessService.updateBusiness(stateData.businessId, {
      shopifyAccessToken: access_token,
      shopifyShop: shop as string,
      shopifyScopes: scope,
      shopifyConnectedAt: new Date()
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
      lastConnected: business.shopifyConnectedAt || business.updatedAt
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
      shopifyConnectedAt: null
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

export default router;
