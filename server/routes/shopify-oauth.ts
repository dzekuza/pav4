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

// GET /api/shopify/oauth/connect - Start OAuth flow using Gadget for external app
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

    // Use Gadget's OAuth flow for external app
    // This follows the strategy: authUrl = `https://itrcks--development.gadget.app/api/auth/shopify/install?shop=${shopDomain}`
    const gadgetAuthUrl = generateShopifyAuthUrl(shop, businessId.toString());

    console.log('Generated Gadget OAuth URL:', gadgetAuthUrl);
    console.log('Environment info:', {
      NODE_ENV: process.env.NODE_ENV,
      SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      GADGET_API_URL: process.env.GADGET_API_URL,
      isProduction: process.env.NODE_ENV === 'production' || 
                   process.env.SHOPIFY_APP_URL?.includes('ipick.io') ||
                   process.env.FRONTEND_URL?.includes('ipick.io')
    });
    
    res.json({
      success: true,
      message: 'OAuth URL generated successfully',
      redirectUrl: gadgetAuthUrl,
      shop: shop,
      businessId: businessId,
      note: 'Using Gadget OAuth flow - Gadget will handle callback internally, connection status will be notified via webhook',
      debug: {
        callbackUrl: gadgetAuthUrl.includes('redirectUri=') ? 
          decodeURIComponent(gadgetAuthUrl.split('redirectUri=')[1]) : 'Not found',
        isProduction: process.env.NODE_ENV === 'production' || 
                     process.env.SHOPIFY_APP_URL?.includes('ipick.io') ||
                     process.env.FRONTEND_URL?.includes('ipick.io')
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

// GET /api/shopify/oauth/callback - Handle OAuth callback from Gadget (if Gadget redirects back to us)
router.get('/callback', async (req, res) => {
  try {
    const { shop, businessId, success, error, connectionId } = req.query;

    console.log('Gadget OAuth callback received:', {
      shop: shop,
      businessId: businessId,
      success: success,
      error: error,
      connectionId: connectionId,
      query: req.query
    });

    // If Gadget redirects back to us with connection info
    if (shop && businessId) {
      // Validate required parameters
      if (!shop || !businessId) {
        console.error('Missing required parameters:', { shop: !!shop, businessId: !!businessId });
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      if (error) {
        console.error('OAuth error from Gadget:', error);
        const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:8084'}/business/dashboard?shopify_error=true&error=${encodeURIComponent(error as string)}`;
        return res.redirect(errorUrl);
      }

      // Update business with connection info
      try {
        await businessService.updateBusiness(parseInt(businessId as string), {
          shopifyShop: shop as string,
          shopifyScopes: SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES,
          shopifyConnectedAt: new Date(),
          shopifyStatus: 'connected'
        });

        console.log('Shopify OAuth callback successful:', {
          businessId: businessId,
          shop: shop,
          scopes: SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES
        });

        // Redirect to dashboard with success message
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8084'}/business/dashboard?shopify_connected=true&shop=${shop}&businessId=${businessId}`;
        
        res.redirect(redirectUrl);

      } catch (dbError) {
        console.error('Database update failed:', dbError);
        const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:8084'}/business/dashboard?shopify_error=db_error`;
        res.redirect(errorUrl);
      }
    } else {
      // If no parameters, this might be a direct callback from Gadget after internal processing
      // In this case, we should redirect to the dashboard and let the webhook handle the connection status
      console.log('Gadget callback received without parameters - redirecting to dashboard');
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8084'}/business/dashboard?shopify_processing=true`;
      res.redirect(redirectUrl);
    }

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

// POST /api/shopify/oauth/webhook - Handle Gadget webhook for OAuth completion
router.post('/webhook', async (req, res) => {
  try {
    console.log('Gadget OAuth webhook received:', {
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
        
        // Update business with connection info
        if (data.businessId && data.shop) {
          try {
            await businessService.updateBusiness(parseInt(data.businessId), {
              shopifyShop: data.shop,
              shopifyScopes: data.scopes || SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES,
              shopifyConnectedAt: new Date(),
              shopifyStatus: 'connected'
            });
            console.log('Business updated with Shopify connection:', data.businessId);
          } catch (dbError) {
            console.error('Failed to update business:', dbError);
          }
        }
        break;
      
      case 'shopify_connection_deleted':
        console.log('Shopify connection deleted');
        // Handle connection deletion
        if (data.businessId) {
          try {
            await businessService.updateBusiness(parseInt(data.businessId), {
              shopifyAccessToken: null,
              shopifyShop: null,
              shopifyScopes: null,
              shopifyConnectedAt: null,
              shopifyStatus: 'disconnected'
            });
            console.log('Business disconnected from Shopify:', data.businessId);
          } catch (dbError) {
            console.error('Failed to disconnect business:', dbError);
          }
        }
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

// GET /api/shopify/oauth/manual-update - Manually update connection status (for debugging/testing)
router.get('/manual-update', requireBusinessAuth, async (req, res) => {
  try {
    const { shop } = req.query;
    const business = (req as any).business;
    const businessId = business?.id;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    console.log(`Manually updating Shopify connection for business ${businessId} to shop ${shop}`);

    // Update business with connection info
    await businessService.updateBusiness(businessId, {
      shopifyShop: shop,
      shopifyScopes: SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES,
      shopifyConnectedAt: new Date(),
      shopifyStatus: 'connected'
    });

    console.log(`Successfully manually updated Shopify connection for business ${businessId}`);

    res.json({
      success: true,
      message: 'Shopify connection manually updated',
      shop: shop,
      businessId: businessId,
      status: 'connected'
    });

  } catch (error) {
    console.error('Manual update error:', error);
    res.status(500).json({ error: 'Failed to manually update connection' });
  }
});

// GET /api/shopify/oauth/test-gadget - Test Gadget API connectivity
router.get('/test-gadget', requireBusinessAuth, async (req, res) => {
  try {
    console.log('Testing Gadget API connectivity...');
    console.log('GADGET_API_URL:', SHOPIFY_OAUTH_CONFIG.GADGET_API_URL);
    console.log('GADGET_API_KEY:', SHOPIFY_OAUTH_CONFIG.GADGET_API_KEY ? 'Set' : 'Not set');

    if (!SHOPIFY_OAUTH_CONFIG.GADGET_API_KEY) {
      return res.status(500).json({
        error: 'Gadget API key not configured',
        message: 'Please set the GADGET_API_KEY environment variable',
        config: {
          GADGET_API_URL: SHOPIFY_OAUTH_CONFIG.GADGET_API_URL,
          GADGET_API_KEY: 'Not set'
        }
      });
    }

    // Test basic connectivity to Gadget
    try {
      const testResponse = await fetch(`${SHOPIFY_OAUTH_CONFIG.GADGET_API_URL}/api/shopifyShops?first=1`, {
        headers: {
          'Authorization': `Bearer ${SHOPIFY_OAUTH_CONFIG.GADGET_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Gadget test response status:', testResponse.status);

      if (testResponse.ok) {
        const testData = await testResponse.json();
        res.json({
          success: true,
          message: 'Gadget API connection successful',
          status: testResponse.status,
          data: testData,
          config: {
            GADGET_API_URL: SHOPIFY_OAUTH_CONFIG.GADGET_API_URL,
            GADGET_API_KEY: 'Set (hidden)'
          }
        });
      } else {
        const errorText = await testResponse.text();
        res.status(500).json({
          error: 'Gadget API test failed',
          status: testResponse.status,
          response: errorText.substring(0, 500),
          config: {
            GADGET_API_URL: SHOPIFY_OAUTH_CONFIG.GADGET_API_URL,
            GADGET_API_KEY: 'Set (hidden)'
          }
        });
      }
    } catch (testError) {
      console.error('Gadget API test error:', testError);
      res.status(500).json({
        error: 'Failed to connect to Gadget API',
        details: testError.message,
        config: {
          GADGET_API_URL: SHOPIFY_OAUTH_CONFIG.GADGET_API_URL,
          GADGET_API_KEY: 'Set (hidden)'
        }
      });
    }

  } catch (error) {
    console.error('Test Gadget error:', error);
    res.status(500).json({ error: 'Failed to test Gadget API' });
  }
});

// GET /api/shopify/oauth/fetch-token - Fetch access token from Gadget
router.get('/fetch-token', requireBusinessAuth, async (req, res) => {
  try {
    const { shop } = req.query;
    const business = (req as any).business;
    const businessId = business?.id;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    console.log(`Fetching access token from Gadget for business ${businessId} and shop ${shop}`);

    // Try to fetch the access token from Gadget using the correct API structure
    try {
      // First, try to get the shop connection from Gadget
      const gadgetResponse = await fetch(`${SHOPIFY_OAUTH_CONFIG.GADGET_API_URL}/api/shopifyShops?filter=${encodeURIComponent(JSON.stringify({ domain: { equals: shop } }))}`, {
        headers: {
          'Authorization': `Bearer ${SHOPIFY_OAUTH_CONFIG.GADGET_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Gadget API response status:', gadgetResponse.status);

      if (gadgetResponse.ok) {
        const gadgetData = await gadgetResponse.json();
        console.log('Gadget shop data:', gadgetData);

        // Look for the shop with access token
        const shopRecord = gadgetData.shopifyShops?.find((shopData: any) => 
          shopData.domain === shop && shopData.accessToken
        );

        if (shopRecord && shopRecord.accessToken) {
          console.log(`Found access token for shop ${shop}`);

          // Update business with connection info including access token
          await businessService.updateBusiness(businessId, {
            shopifyShop: shop,
            shopifyAccessToken: shopRecord.accessToken,
            shopifyScopes: shopRecord.scopes || SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES,
            shopifyConnectedAt: new Date(),
            shopifyStatus: 'connected'
          });

          res.json({
            success: true,
            message: 'Access token fetched and stored successfully',
            shop: shop,
            businessId: businessId,
            status: 'connected',
            hasAccessToken: true,
            scopes: shopRecord.scopes
          });
        } else {
          console.log(`No access token found for shop ${shop}`);
          
          // Try alternative approach - check if shop exists but no token
          if (gadgetData.shopifyShops?.length > 0) {
            res.json({
              success: false,
              message: 'Shop found but no access token available',
              shop: shop,
              businessId: businessId,
              status: 'no_token',
              note: 'The shop is connected but access token is not available'
            });
          } else {
            res.json({
              success: false,
              message: 'No shop found with this domain',
              shop: shop,
              businessId: businessId,
              status: 'not_found'
            });
          }
        }
      } else {
        const errorText = await gadgetResponse.text();
        console.error('Failed to fetch from Gadget:', gadgetResponse.status, errorText);
        
        // If it's a configuration error, provide helpful guidance
        if (gadgetResponse.status === 400 || gadgetResponse.status === 500) {
          res.status(500).json({ 
            error: 'Gadget API configuration issue',
            details: 'The Gadget app may not be properly configured for Shopify OAuth',
            status: gadgetResponse.status,
            response: errorText.substring(0, 200) // First 200 chars of error
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to fetch access token from Gadget',
            status: gadgetResponse.status,
            response: errorText.substring(0, 200)
          });
        }
      }
    } catch (gadgetError) {
      console.error('Error fetching from Gadget:', gadgetError);
      res.status(500).json({ 
        error: 'Failed to connect to Gadget API',
        details: gadgetError.message
      });
    }

  } catch (error) {
    console.error('Fetch token error:', error);
    res.status(500).json({ error: 'Failed to fetch access token' });
  }
});

// GET /api/shopify/oauth/update-with-token - Update connection with access token
router.get('/update-with-token', requireBusinessAuth, async (req, res) => {
  try {
    const { shop, accessToken } = req.query;
    const business = (req as any).business;
    const businessId = business?.id;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    if (!accessToken || typeof accessToken !== 'string') {
      return res.status(400).json({ error: 'Access token is required' });
    }

    console.log(`Updating Shopify connection with access token for business ${businessId} to shop ${shop}`);

    // Update business with connection info including access token
    await businessService.updateBusiness(businessId, {
      shopifyShop: shop,
      shopifyAccessToken: accessToken,
      shopifyScopes: SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES,
      shopifyConnectedAt: new Date(),
      shopifyStatus: 'connected'
    });

    console.log(`Successfully updated Shopify connection with access token for business ${businessId}`);

    res.json({
      success: true,
      message: 'Shopify connection updated with access token',
      shop: shop,
      businessId: businessId,
      status: 'connected',
      hasAccessToken: true
    });

  } catch (error) {
    console.error('Update with token error:', error);
    res.status(500).json({ error: 'Failed to update connection with access token' });
  }
});

// GET /api/shopify/oauth/debug-status - Debug endpoint to check current business status
router.get('/debug-status', requireBusinessAuth, async (req, res) => {
  try {
    const business = (req as any).business;
    const businessId = business?.id;
    
    console.log(`Debug status for business ${businessId}:`, {
      shopifyShop: business.shopifyShop,
      shopifyStatus: business.shopifyStatus,
      shopifyConnectedAt: business.shopifyConnectedAt,
      shopifyScopes: business.shopifyScopes
    });

    res.json({
      success: true,
      businessId: businessId,
      shopifyShop: business.shopifyShop,
      shopifyStatus: business.shopifyStatus,
      shopifyConnectedAt: business.shopifyConnectedAt,
      shopifyScopes: business.shopifyScopes,
      isConnected: !!(business.shopifyShop && business.shopifyStatus === 'connected')
    });

  } catch (error) {
    console.error('Debug status error:', error);
    res.status(500).json({ error: 'Failed to get debug status' });
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
          gadgetApiUrl: !SHOPIFY_OAUTH_CONFIG.GADGET_API_URL,
          gadgetApiKey: !SHOPIFY_OAUTH_CONFIG.GADGET_API_KEY,
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

    // Generate the Gadget OAuth authorization URL
    const installUrl = generateShopifyAuthUrl(shop as string, '1'); // Test business ID

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
    
    // Generate test URL following Gadget's OAuth flow
    const testUrl = generateShopifyAuthUrl(testShop, '1'); // Test business ID
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
