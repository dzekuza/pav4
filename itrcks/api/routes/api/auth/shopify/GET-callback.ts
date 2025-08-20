import { RouteHandler } from "gadget-server";

interface RouteParams {
  Querystring: {
    code?: string;
    state?: string;
    shop?: string;
    hmac?: string;
    businessId?: string;
  };
}

const route: RouteHandler<RouteParams> = async ({ request, reply, api, logger }) => {
  try {
    const { code, state, shop, hmac, businessId } = request.query;

    logger.info({ 
      code: !!code, 
      state: !!state, 
      shop, 
      hmac: !!hmac,
      businessId 
    }, "Shopify OAuth callback received");

    // Validate required parameters
    if (!code || !shop) {
      logger.error("Missing required OAuth parameters");
      const errorUrl = `https://ipick.io/business/dashboard?shopify_error=missing_params`;
      await reply.redirect(302, errorUrl);
      return;
    }

    // Validate shop domain format
    const shopDomain = shop.toString().toLowerCase();
    if (!shopDomain.endsWith('.myshopify.com')) {
      logger.error("Invalid shop domain in callback");
      const errorUrl = `https://ipick.io/business/dashboard?shopify_error=invalid_shop`;
      await reply.redirect(302, errorUrl);
      return;
    }

    // Validate HMAC if provided (for additional security)
    if (hmac) {
      // TODO: Implement HMAC validation
      logger.info("HMAC validation would go here");
    }

    // Check if shop was successfully installed
    const installedShop = await api.shopifyShop.findFirst({
      filter: {
        OR: [
          { domain: { equals: shopDomain } },
          { myshopifyDomain: { equals: shopDomain } }
        ]
      },
      select: {
        id: true,
        domain: true,
        name: true,
        email: true,
        state: true,
        shopifyCreatedAt: true
      }
    });

    if (installedShop) {
      logger.info({ 
        shopId: installedShop.id, 
        shop: shopDomain,
        state: installedShop.state 
      }, "Shop successfully installed");

      // Create a success page that closes the popup and notifies the parent window
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Success</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f8f9fa;
            }
            .success { 
              color: #28a745; 
              font-size: 24px; 
              margin-bottom: 20px;
            }
            .message { 
              color: #6c757d; 
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="success">✅ Successfully Connected!</div>
          <div class="message">Your Shopify store has been connected successfully.</div>
          <div class="message">This window will close automatically...</div>
          <script>
            // Notify parent window of success
            if (window.opener) {
              window.opener.postMessage({
                type: 'shopify-oauth-success',
                shop: '${shopDomain}',
                shopId: '${installedShop.id}'
              }, '*');
            }
            
            // Close popup after 2 seconds
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
        </html>
      `;

      await reply.type('text/html').send(successHtml);

    } else {
      logger.warn({ shop: shopDomain }, "Shop not found in database after OAuth");
      
      // Create an error page that closes the popup
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f8f9fa;
            }
            .error { 
              color: #dc3545; 
              font-size: 24px; 
              margin-bottom: 20px;
            }
            .message { 
              color: #6c757d; 
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="error">❌ Connection Failed</div>
          <div class="message">Failed to connect your Shopify store.</div>
          <div class="message">This window will close automatically...</div>
          <script>
            // Notify parent window of error
            if (window.opener) {
              window.opener.postMessage({
                type: 'shopify-oauth-error',
                shop: '${shopDomain}',
                error: 'installation_failed'
              }, '*');
            }
            
            // Close popup after 2 seconds
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
        </html>
      `;

      await reply.type('text/html').send(errorHtml);
    }

  } catch (error) {
    const err = error as Error;
    logger.error({ 
      error: err.message, 
      stack: err.stack 
    }, "OAuth callback error");
    
    // Create an error page that closes the popup
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f8f9fa;
          }
          .error { 
            color: #dc3545; 
            font-size: 24px; 
            margin-bottom: 20px;
          }
          .message { 
            color: #6c757d; 
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="error">❌ OAuth Error</div>
        <div class="message">An error occurred during the OAuth process.</div>
        <div class="message">This window will close automatically...</div>
        <script>
          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage({
              type: 'shopify-oauth-error',
              error: 'callback_error'
            }, '*');
          }
          
          // Close popup after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
    `;

    await reply.type('text/html').send(errorHtml);
  }
};

// Configure route options
route.options = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        code: { type: "string" },
        state: { type: "string" },
        shop: { type: "string" },
        hmac: { type: "string" },
        businessId: { type: "string" }
      },
      required: ["code", "shop"]
    }
  }
};

export default route;
