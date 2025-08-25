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
      const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Shopify Connection Error - iPick</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: 600;
        }
        p {
            margin: 0 0 20px 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Shopify Connection Failed</h1>
        <p>Error: <strong>${error}</strong></p>
        <p>${error_description || 'An error occurred during the connection process.'}</p>
        <p>Closing this window...</p>
        <div class="spinner"></div>
    </div>
    
    <script>
        // Send error message to parent window
        if (window.opener) {
            window.opener.postMessage({
                type: 'SHOPIFY_OAUTH_ERROR',
                error: '${error}',
                error_description: '${error_description || ''}',
                timestamp: Date.now()
            }, '*');
            
            // Close the popup after a short delay
            setTimeout(() => {
                window.close();
            }, 3000);
        } else {
            // If no opener, redirect to dashboard
            setTimeout(() => {
                window.location.href = '${process.env.FRONTEND_URL || 'https://ipick.io'}/business/dashboard?shopify_error=true&error=${encodeURIComponent(error as string)}';
            }, 3000);
        }
    </script>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      return res.send(errorHtml);
    }

      // Validate required parameters
    if (!code || !state || !shop) {
      console.error('Missing required OAuth parameters:', { code: !!code, state: !!state, shop: !!shop });
      const errorUrl = `${process.env.FRONTEND_URL || 'https://ipick.io'}/business/dashboard?shopify_error=missing_params`;
      return res.redirect(errorUrl);
    }

    // Parse and validate state parameter
    const stateData = parseOAuthState(state as string);
    if (!stateData) {
      console.error('Invalid OAuth state parameter');
      const errorUrl = `${process.env.FRONTEND_URL || 'https://ipick.io'}/business/dashboard?shopify_error=invalid_state`;
      return res.redirect(errorUrl);
    }

    const { businessId } = stateData;

    // Validate shop format
    if (!validateShopifyShop(shop as string)) {
      console.error('Invalid shop format in callback:', shop);
      const errorUrl = `${process.env.FRONTEND_URL || 'https://ipick.io'}/business/dashboard?shopify_error=invalid_shop`;
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

      // Create webhook automatically after successful connection
      try {
        const webhookUrl = `${process.env.FRONTEND_URL || 'https://ipick.io'}/api/shopify/webhooks`;
        
        const webhookData = {
          webhook: {
            topic: "orders/create",
            address: webhookUrl,
            format: "json"
          }
        };

        const webhookResponse = await fetch(`https://${shop}/admin/api/2024-10/webhooks.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': tokenData.accessToken
          },
          body: JSON.stringify(webhookData)
        });

        if (webhookResponse.ok) {
          const webhookResult = await webhookResponse.json();
          console.log('Webhook created automatically:', webhookResult);
        } else {
          console.warn('Failed to create webhook automatically:', await webhookResponse.text());
        }
      } catch (webhookError) {
        console.warn('Error creating webhook automatically:', webhookError);
      }

      // Return HTML page that closes the popup and sends message to parent
      const successHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Shopify Connected - iPick</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: 600;
        }
        p {
            margin: 0 0 20px 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .spinner {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Shopify Connected Successfully!</h1>
        <p>Your store <strong>${shop}</strong> has been connected to iPick.</p>
        <p>Closing this window and refreshing your dashboard...</p>
        <div class="spinner"></div>
    </div>
    
    <script>
        // Send message to parent window
        if (window.opener) {
            window.opener.postMessage({
                type: 'SHOPIFY_OAUTH_SUCCESS',
                shop: '${shop}',
                businessId: '${businessId}',
                timestamp: Date.now()
            }, '*');
            
            // Close the popup after a short delay
            setTimeout(() => {
                window.close();
            }, 2000);
        } else {
            // If no opener, redirect to dashboard
            setTimeout(() => {
                window.location.href = '${process.env.FRONTEND_URL || 'https://ipick.io'}/business/dashboard?shopify_connected=true&shop=${shop}&businessId=${businessId}';
            }, 2000);
        }
    </script>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(successHtml);

    } catch (tokenError) {
      console.error('Token exchange failed:', tokenError);
      const errorUrl = `${process.env.FRONTEND_URL || 'https://ipick.io'}/business/dashboard?shopify_error=token_exchange_failed`;
        res.redirect(errorUrl);
    }

  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    const errorUrl = `${process.env.FRONTEND_URL || 'https://ipick.io'}/business/dashboard?shopify_error=true`;
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

// POST /api/shopify/oauth/create-webhook - Create webhook for connected store
router.post('/create-webhook', requireBusinessAuth, async (req, res) => {
  try {
    const business = (req as any).business;
    const businessId = business?.id;
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (!business.shopifyShop || business.shopifyStatus !== 'connected') {
      return res.status(400).json({ error: 'Shopify store not connected' });
    }

    const shop = business.shopifyShop;
    const accessToken = business.shopifyAccessToken;

    if (!accessToken) {
      return res.status(400).json({ error: 'Shopify access token not found' });
    }

    // Create webhook using Shopify Admin API
    const webhookUrl = `${process.env.FRONTEND_URL || 'https://ipick.io'}/api/shopify/webhooks`;
    
    const webhookData = {
      webhook: {
        topic: "orders/create",
        address: webhookUrl,
        format: "json"
      }
    };

    const response = await fetch(`https://${shop}/admin/api/2024-10/webhooks.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create webhook:', errorText);
      return res.status(500).json({ error: 'Failed to create webhook' });
    }

    const webhookResponse = await response.json();
    console.log('Webhook created successfully:', webhookResponse);

    res.json({
      success: true,
      message: 'Webhook created successfully',
      webhook: webhookResponse.webhook,
      webhookUrl: webhookUrl
    });

  } catch (error) {
    console.error('Webhook creation error:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// GET /api/shopify/oauth/webhooks - List webhooks for connected store
router.get('/webhooks', requireBusinessAuth, async (req, res) => {
  try {
    const business = (req as any).business;
    const businessId = business?.id;
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (!business.shopifyShop || business.shopifyStatus !== 'connected') {
      return res.status(400).json({ error: 'Shopify store not connected' });
    }

    const shop = business.shopifyShop;
    const accessToken = business.shopifyAccessToken;

    if (!accessToken) {
      return res.status(400).json({ error: 'Shopify access token not found' });
    }

    // Get webhooks using Shopify Admin API
    const response = await fetch(`https://${shop}/admin/api/2024-10/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get webhooks:', errorText);
      return res.status(500).json({ error: 'Failed to get webhooks' });
    }

    const webhooksResponse = await response.json();
    console.log('Webhooks retrieved successfully:', webhooksResponse);

    res.json({
      success: true,
      webhooks: webhooksResponse.webhooks
    });

  } catch (error) {
    console.error('Webhook retrieval error:', error);
    res.status(500).json({ error: 'Failed to get webhooks' });
  }
});

// DELETE /api/shopify/oauth/webhook/:id - Delete specific webhook
router.delete('/webhook/:id', requireBusinessAuth, async (req, res) => {
  try {
    const business = (req as any).business;
    const businessId = business?.id;
    const webhookId = req.params.id;
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (!business.shopifyShop || business.shopifyStatus !== 'connected') {
      return res.status(400).json({ error: 'Shopify store not connected' });
    }

    const shop = business.shopifyShop;
    const accessToken = business.shopifyAccessToken;

    if (!accessToken) {
      return res.status(400).json({ error: 'Shopify access token not found' });
    }

    // Delete webhook using Shopify Admin API
    const response = await fetch(`https://${shop}/admin/api/2024-10/webhooks/${webhookId}.json`, {
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to delete webhook:', errorText);
      return res.status(500).json({ error: 'Failed to delete webhook' });
    }

    console.log('Webhook deleted successfully:', webhookId);

    res.json({
      success: true,
      message: 'Webhook deleted successfully',
      webhookId: webhookId
    });

  } catch (error) {
    console.error('Webhook deletion error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

export default router;
