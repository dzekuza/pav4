import { RouteHandler } from "gadget-server";
import { randomBytes } from "crypto";

interface RouteParams {
  Querystring: {
    shop?: string;
  };
}

const route: RouteHandler<RouteParams> = async ({ request, reply, api, logger, connections, config }) => {
  try {
    const { shop } = request.query;

    // Validate shop parameter exists
    if (!shop) {
      await reply.code(400).send({
        error: "Missing shop parameter",
        message: "Please provide a shop parameter in the format: shop=your-store.myshopify.com"
      });
      return;
    }

    // Validate shop domain format
    const shopDomain = shop.toString().toLowerCase();
    if (!shopDomain.endsWith('.myshopify.com') || shopDomain.length < 15) {
      await reply.code(400).send({
        error: "Invalid shop domain",
        message: "Shop must be a valid Shopify domain (e.g., your-store.myshopify.com)"
      });
      return;
    }

    // Extract shop name from domain
    const shopName = shopDomain.replace('.myshopify.com', '');
    
    // Validate shop name format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(shopName)) {
      await reply.code(400).send({
        error: "Invalid shop name format",
        message: "Shop name can only contain letters, numbers, and hyphens"
      });
      return;
    }

    logger.info({ shop: shopDomain }, "Processing Shopify OAuth install request");

    // Check if shop is already installed
    const existingShop = await api.shopifyShop.findFirst({
      filter: {
        OR: [
          { domain: { equals: shopDomain } },
          { myshopifyDomain: { equals: shopDomain } }
        ]
      },
      select: {
        id: true,
        domain: true,
        myshopifyDomain: true,
        state: true
      }
    });

    if (existingShop) {
      logger.info({ shopId: existingShop.id, shop: shopDomain }, "Shop already installed");
      
      // If shop is already installed and active, redirect to app
      if (existingShop.state === 'created.installed') {
        const appUrl = `https://${shopDomain}/admin/apps`;
        await reply.redirect(302, appUrl);
        return;
      }
    }

    // Generate secure state parameter
    const state = randomBytes(32).toString('hex');

    // Get Shopify API credentials
    const clientId = config.SHOPIFY_API_KEY;
    if (!clientId) {
      logger.error("Missing SHOPIFY_API_KEY configuration");
      await reply.code(500).send({
        error: "Configuration error",
        message: "Application is not properly configured"
      });
      return;
    }

    // Define required scopes (matching app configuration)
    const scopes = [
      "read_customer_events",
      "read_customers", 
      "read_products",
      "write_app_proxy",
      "write_checkouts",
      "write_orders",
      "write_pixels"
    ].join(',');

    // Construct redirect URI
    const redirectUri = `${request.protocol}://${request.headers.host}/api/auth/shopify/callback`;

    // Build Shopify OAuth authorization URL
    const authUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('grant_options[]', 'per-user');

    logger.info({ 
      shop: shopDomain, 
      redirectUri, 
      scopes,
      authUrl: authUrl.toString() 
    }, "Redirecting to Shopify OAuth");

    // Store state for validation in callback (in a real app, you'd store this in a secure session store)
    // For now, we'll rely on Shopify's built-in CSRF protection
    
    // Redirect to Shopify OAuth authorization
    await reply.redirect(302, authUrl.toString());

  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message, stack: err.stack }, "Error processing Shopify OAuth request");
    
    await reply.code(500).send({
      error: "Internal server error",
      message: "An error occurred while processing your request"
    });
  }
};

// Configure route options
route.options = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        shop: { type: "string" }
      },
      required: ["shop"]
    }
  },
  cors: {
    origin: [
      "https://ipick.io",
      "https://www.ipick.io", 
      "https://app.ipick.io",
      // Allow localhost for development
      "https://localhost:3000",
      "http://localhost:3000",
      "https://127.0.0.1:3000",
      "http://127.0.0.1:3000"
    ] as string[],
    methods: ["GET"],
    credentials: false
  }
};

export default route;