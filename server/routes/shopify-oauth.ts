import express from 'express';
import crypto from 'crypto';
import { businessService } from '../services/database';
import { 
  SHOPIFY_OAUTH_CONFIG, 
  SHOPIFY_OAUTH_URLS, 
  generateShopifyAuthUrl, 
  validateShopifyShop, 
  validateOAuthConfig, 
  SHOPIFY_WEBHOOK_CONFIG 
} from '../config/shopify-oauth';
import { requireBusinessAuth } from '../middleware/business-auth';

const router = express.Router();

// Store OAuth states in memory (in production, use Redis or database)
const oauthStates = new Map<string, { businessId: number; timestamp: number }>();

// GET /api/shopify/oauth/connect - Start OAuth flow using direct Shopify OAuth
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
    const shopPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopPattern.test(shop)) {
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

    console.log('Business found:', { id: business.id, name: business.name });

    // IMPORTANT: Disconnect any existing Shopify connection before starting new OAuth flow
    // This ensures users can connect to any Shopify store regardless of their registered domain
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

    // Generate a secure state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with business ID and timestamp
    oauthStates.set(state, {
      businessId: businessId,
      timestamp: Date.now()
    });

    // Build the Shopify OAuth authorization URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8083';
    const redirectUri = `${baseUrl}/api/shopify/oauth/callback`;
    
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_KEY}&` +
      `scope=${encodeURIComponent(SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    console.log('Generated Shopify OAuth URL:', authUrl);
    
    res.json({
      success: true,
      message: 'OAuth URL generated successfully',
      redirectUrl: authUrl,
      shop: shop,
      businessId: businessId,
      state: state
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

// GET /api/shopify/oauth/prepare - Prepare OAuth flow (check if user needs to login to Shopify first)
router.get('/prepare', requireBusinessAuth, async (req, res) => {
  try {
    const { shop } = req.query;
    const business = (req as any).business;
    const businessId = business?.id;

    console.log('Shopify OAuth prepare request:', { shop, businessId });

    // Validate shop parameter
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    // Validate shop format
    const shopPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopPattern.test(shop)) {
      return res.status(400).json({ 
        error: 'Invalid shop format. Please use format: your-store.myshopify.com' 
      });
    }

    // Check if user needs to login to Shopify first
    const shopifyLoginUrl = `https://${shop}/admin`;
    
    res.json({
      success: true,
      message: 'OAuth preparation successful',
      shop: shop,
      requiresShopifyLogin: true,
      shopifyLoginUrl: shopifyLoginUrl,
      nextStep: 'login_to_shopify',
      instructions: [
        '1. Click the Shopify login link below',
        '2. Log in to your Shopify store',
        '3. Return to this page and click Connect again'
      ]
    });

  } catch (error) {
    console.error('Shopify OAuth prepare error:', error);
    res.status(500).json({ error: 'Failed to prepare OAuth flow' });
  }
});

// GET /api/shopify/oauth/callback - Handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, shop, hmac } = req.query;

    console.log('Shopify OAuth callback received:', {
      code: !!code,
      state: !!state,
      shop: shop,
      hmac: !!hmac,
      query: req.query
    });

    // Validate required parameters
    if (!code || !state || !shop) {
      console.error('Missing OAuth parameters:', { code: !!code, state: !!state, shop: !!shop });
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
      console.error('Invalid or expired state parameter:', state);
      return res.status(400).json({ error: 'Invalid or expired state parameter' });
    }

    // Clean up used state
    oauthStates.delete(state as string);

    console.log('State validation successful:', {
      businessId: stateData.businessId,
      shop: shop
    });

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET || '',
        code: code
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange code for access token:', errorText);
      throw new Error('Failed to exchange code for access token');
    }

    const tokenData = await tokenResponse.json();
    console.log('Access token received:', {
      hasToken: !!tokenData.access_token,
      scope: tokenData.scope,
      expiresIn: tokenData.expires_in
    });

    // Store the shop information and access token in the database
    await businessService.updateBusiness(stateData.businessId, {
      shopifyShop: shop as string,
      shopifyAccessToken: tokenData.access_token,
      shopifyScopes: tokenData.scope,
      shopifyConnectedAt: new Date(),
      shopifyStatus: 'connected'
    });

    console.log('Shopify OAuth callback successful:', {
      businessId: stateData.businessId,
      shop: shop,
      scopes: tokenData.scope
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
    
    console.log(`Disconnecting Shopify store for business ${businessId} (current shop: ${currentShop || 'none'})`);
    
    // Remove Shopify credentials
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
      disconnectedShop: currentShop
    });

  } catch (error) {
    console.error('Shopify OAuth disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Shopify store' });
  }
});

// GET /api/shopify/oauth/force-disconnect - Force disconnect (for testing/debugging)
router.get('/force-disconnect', requireBusinessAuth, async (req, res) => {
  try {
    const business = (req as any).business;
    const businessId = business?.id;
    
    // Get current business info for logging
    const currentShop = business?.shopifyShop;
    
    console.log(`Force disconnecting Shopify store for business ${businessId} (current shop: ${currentShop || 'none'})`);
    
    // Remove Shopify credentials
    await businessService.updateBusiness(businessId, {
      shopifyAccessToken: null,
      shopifyShop: null,
      shopifyScopes: null,
      shopifyConnectedAt: null,
      shopifyStatus: 'disconnected'
    });

    console.log(`Successfully force disconnected Shopify store for business ${businessId}`);

    res.json({
      success: true,
      message: 'Shopify store force disconnected successfully',
      disconnectedShop: currentShop,
      note: 'You can now connect to any Shopify store'
    });

  } catch (error) {
    console.error('Shopify OAuth force disconnect error:', error);
    res.status(500).json({ error: 'Failed to force disconnect Shopify store' });
  }
});

// GET /api/shopify/oauth/webhook-config - Get webhook configuration for Gadget
router.get('/webhook-config', requireBusinessAuth, async (req, res) => {
  try {
    const business = (req as any).business;
    const businessId = business?.id;
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

          res.json({
        success: true,
        webhookEndpoint: `${process.env.FRONTEND_URL || 'https://ipick.io'}${SHOPIFY_WEBHOOK_CONFIG.ENDPOINT}`,
        webhookSecret: SHOPIFY_OAUTH_CONFIG.IPICK_WEBHOOK_SECRET ? 'configured' : 'missing',
        shop: business.shopifyShop,
        events: SHOPIFY_WEBHOOK_CONFIG.EVENTS
      });

  } catch (error) {
    console.error('Webhook config error:', error);
    res.status(500).json({ error: 'Failed to get webhook configuration' });
  }
});

// POST /api/shopify/oauth/webhook - Handle Gadget webhooks for Shopify OAuth
router.post('/webhook', async (req, res) => {
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
        // The connection was successful in Gadget
        // We can update our local database if needed
        break;
      
      case 'shopify_connection_deleted':
        console.log('Shopify connection deleted');
        // Handle connection deletion
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

// GET /api/shopify/oauth/test-connect - Test OAuth flow without authentication (for testing only)
router.get('/test-connect', async (req, res) => {
  try {
    const { shop } = req.query;

    // Validate OAuth configuration
    if (!validateOAuthConfig()) {
      return res.status(500).json({ 
        error: 'Shopify OAuth is not properly configured. Please contact support.',
        missing: {
          shopifyApiKey: !SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_KEY,
          shopifyApiSecret: !SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_SECRET,
          shopifyAppUrl: !SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL,
          webhookSecret: !SHOPIFY_OAUTH_CONFIG.IPICK_WEBHOOK_SECRET
        }
      });
    }

    if (!shop) {
      return res.status(400).json({ 
        error: 'Shop parameter is required',
        example: '/api/shopify/oauth/test-connect?shop=your-store.myshopify.com'
      });
    }

    // Validate shop format
    if (!validateShopifyShop(shop as string)) {
      return res.status(400).json({ 
        error: 'Invalid shop format. Use: your-store.myshopify.com'
      });
    }

    // Generate a secure state parameter
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with test business ID (for testing only)
    oauthStates.set(state, {
      businessId: 1, // Test business ID
      timestamp: Date.now()
    });

    // Generate the Shopify OAuth authorization URL with state parameter
    const installUrl = generateShopifyAuthUrl(shop as string, state);

    console.log(`Test redirect to Shopify OAuth for shop: ${shop}`);
    console.log(`Install URL: ${installUrl}`);

    // Return the URL instead of redirecting for testing
    res.json({
      success: true,
      message: 'OAuth flow test successful',
      shop: shop,
      state: state,
      installUrl: installUrl,
      note: 'This is a test endpoint. In production, use the authenticated /connect endpoint.'
    });

  } catch (error) {
    console.error('Shopify OAuth test connect error:', error);
    res.status(500).json({ error: 'Failed to start OAuth flow test' });
  }
});

// GET /api/shopify/oauth/test-config - Test OAuth configuration without any auth (for debugging)
router.get('/test-config', async (req, res) => {
  try {
    console.log('Testing OAuth configuration...');
    
    // Check environment variables
    const config = {
      GADGET_API_URL: process.env.GADGET_API_URL || 'Not set',
      SHOPIFY_INSTALL_URL: process.env.SHOPIFY_INSTALL_URL || 'Not set',
      SHOPIFY_CALLBACK_URL: process.env.SHOPIFY_CALLBACK_URL || 'Not set',
      GADGET_API_KEY: process.env.GADGET_API_KEY ? 'Set' : 'Not set',
      IPICK_WEBHOOK_SECRET: process.env.IPICK_WEBHOOK_SECRET ? 'Set' : 'Not set'
    };
    
    console.log('Environment variables:', config);
    
    // Test validation function
    const isValid = validateOAuthConfig();
    console.log('OAuth config validation:', isValid);
    
    // Test shop validation
    const testShop = 'checkoutipick.myshopify.com';
    const isShopValid = validateShopifyShop(testShop);
    console.log('Shop validation for', testShop, ':', isShopValid);
    
    // Generate test URL following Shopify's OAuth flow
    const testUrl = generateShopifyAuthUrl(testShop);
    console.log('Test URL:', testUrl);
    
    res.json({
      success: true,
      message: 'OAuth configuration test',
      config: config,
      validation: {
        oauthConfig: isValid,
        shopValidation: isShopValid,
        testShop: testShop
      },
      testUrl: testUrl,
      note: 'This endpoint tests OAuth configuration without authentication',
      gadgetDocs: 'Following Gadget Shopify OAuth best practices'
    });

  } catch (error) {
    console.error('OAuth config test error:', error);
    res.status(500).json({ 
      error: 'OAuth config test failed',
      message: error.message 
    });
  }
});

// GET /api/shopify/oauth/gadget-test - Test Gadget API integration
router.get('/gadget-test', async (req, res) => {
  try {
    console.log('Testing Gadget API integration...');
    
    // Test Gadget API connection
    const gadgetApiUrl = process.env.GADGET_API_URL || 'https://itrcks--development.gadget.app';
    const testUrl = `${gadgetApiUrl}/api/shopify/install?shop=test-store.myshopify.com`;
    
    console.log('Gadget API URL:', gadgetApiUrl);
    console.log('Test install URL:', testUrl);
    
    res.json({
      success: true,
      message: 'Gadget API integration test',
      gadgetApiUrl: gadgetApiUrl,
      testInstallUrl: testUrl,
      note: 'This tests the Gadget Shopify OAuth integration',
      documentation: 'https://docs.gadget.dev/guides'
    });

  } catch (error) {
    console.error('Gadget API test error:', error);
    res.status(500).json({ 
      error: 'Gadget API test failed',
      message: error.message 
    });
  }
});

// GET /api/shopify/oauth/test-simple - Simple test without auth
router.get('/test-simple', async (req, res) => {
  try {
    console.log('Simple OAuth test endpoint called');
    
    res.json({
      success: true,
      message: 'OAuth test endpoint working',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        gadgetApiUrl: process.env.GADGET_API_URL ? 'Set' : 'Not set',
        shopifyInstallUrl: process.env.SHOPIFY_INSTALL_URL ? 'Set' : 'Not set',
        gadgetApiKey: process.env.GADGET_API_KEY ? 'Set' : 'Not set'
      }
    });

  } catch (error) {
    console.error('Simple OAuth test error:', error);
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

// GET /api/shopify/oauth/debug - Debug endpoint to check OAuth state
router.get('/debug', async (req, res) => {
  try {
    const { shop } = req.query;
    
    console.log('OAuth debug request:', { shop });
    
    res.json({
      success: true,
      message: 'OAuth debug information',
      environment: {
        gadgetApiUrl: process.env.GADGET_API_URL,
        shopifyInstallUrl: process.env.SHOPIFY_INSTALL_URL,
        shopifyCallbackUrl: process.env.SHOPIFY_CALLBACK_URL,
        gadgetApiKey: process.env.GADGET_API_KEY ? 'Set' : 'Not set',
        webhookSecret: process.env.IPICK_WEBHOOK_SECRET ? 'Set' : 'Not set'
      },
      oauthStates: Array.from(oauthStates.entries()).map(([state, data]) => ({
        state: state.substring(0, 8) + '...',
        businessId: data.businessId,
        timestamp: new Date(data.timestamp).toISOString()
      })),
      shop: shop,
      note: 'This endpoint provides debug information for OAuth troubleshooting'
    });

  } catch (error) {
    console.error('OAuth debug error:', error);
    res.status(500).json({ error: 'Debug endpoint failed' });
  }
});

export default router;
