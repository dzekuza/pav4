import { RouteHandler } from "gadget-server";

interface RequestBody {
  shop: string;
  redirectUrl?: string;
  userId?: string;
}

const route: RouteHandler<{ Body: RequestBody }> = async ({ request, reply, logger }) => {
  try {
    // Set CORS headers for ipick.io domain
    await reply.header('Access-Control-Allow-Origin', 'https://ipick.io');
    await reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    await reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { shop, redirectUrl, userId } = request.body;

    // Validate shop domain format
    if (!shop) {
      await reply.code(400).send({ error: 'Shop domain is required' });
      return;
    }

    // Ensure shop domain is in correct format
    let shopDomain = shop.trim().toLowerCase();
    if (!shopDomain.includes('.')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }
    
    // Validate it's a myshopify.com domain
    if (!shopDomain.endsWith('.myshopify.com')) {
      await reply.code(400).send({ error: 'Invalid shop domain format. Must be a valid Shopify store domain.' });
      return;
    }

    // Use Gadget's built-in Shopify app installation flow
    const installUrl = `https://itrcks--development.gadget.app/api/shopify/install?shop=${encodeURIComponent(shopDomain)}`;

    logger.info({ shop: shopDomain, userId }, 'Redirecting to Gadget Shopify installation flow');

    await reply.send({
      success: true,
      installUrl: installUrl,
      shop: shopDomain
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error({ error: errorMessage }, 'Error initiating Shopify installation');
    await reply.code(500).send({ error: 'Internal server error' });
  }
};

// Set route options including request body schema validation
route.options = {
  schema: {
    body: {
      type: "object",
      properties: {
        shop: { type: "string" },
        redirectUrl: { type: "string" },
        userId: { type: "string" }
      },
      required: ["shop"]
    }
  }
};

export default route;