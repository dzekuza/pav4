import { ActionOptions } from "gadget-server";
import { randomUUID } from "crypto";

export const run: ActionRun = async ({ params, logger, api, connections, request }) => {
  try {
    // Get current shop ID from Shopify connection
    const shopId = connections.shopify.currentShopId;
    if (!shopId) {
      throw new Error("No shop context available");
    }

    // Check if authorization record already exists for this shop
    let authorization = await api.userAuthorization.maybeFindFirst({
      filter: {
        shop: { equals: shopId }
      }
    });

    if (authorization) {
      // Update existing authorization's updatedAt timestamp
      authorization = await api.userAuthorization.update(authorization.id, {
        // This will automatically update the updatedAt field
      });

      logger.info({ shopId, authorizationId: authorization.id }, "Updated existing user authorization");

      return {
        status: "existing",
        isInitialized: true,
        authorization: {
          id: authorization.id,
          trackingId: authorization.trackingId,
          isTrackingEnabled: authorization.isTrackingEnabled,
          trackingScope: authorization.trackingScope,
          merchantEmail: authorization.merchantEmail,
          consentGivenAt: authorization.consentGivenAt
        }
      };
    }

    // Get shop details to extract merchant information
    const shop = await api.shopifyShop.findOne(shopId);
    if (!shop) {
      throw new Error(`Shop with ID ${shopId} not found`);
    }

    // Generate unique tracking ID
    const trackingId = randomUUID();

    // Extract IP address and user agent from request
    const ipAddress = request?.ip || request?.headers?.['x-forwarded-for'] || request?.headers?.['x-real-ip'] || 'unknown';
    const userAgent = request?.headers?.['user-agent'] || 'unknown';

    // Create new authorization record
    const newAuthorization = await api.userAuthorization.create({
      shop: { _link: shopId },
      merchantEmail: shop.email || shop.customerEmail || `${shop.myshopifyDomain}@shopify.com`,
      merchantName: shop.shopOwner || shop.name || shop.myshopifyDomain,
      trackingId: trackingId,
      consentGivenAt: new Date(),
      isTrackingEnabled: true,
      trackingScope: "full",
      ipAddress: typeof ipAddress === 'string' ? ipAddress : (Array.isArray(ipAddress) ? ipAddress[0] : 'unknown'),
      userAgent: typeof userAgent === 'string' ? userAgent : 'unknown',
      consentVersion: "1.0",
      notificationPreferences: {
        email: true,
        analytics: true,
        marketing: false
      }
    });

    logger.info({ shopId, authorizationId: newAuthorization.id, trackingId }, "Created new user authorization");

    return {
      status: "created",
      isInitialized: true,
      authorization: {
        id: newAuthorization.id,
        trackingId: newAuthorization.trackingId,
        isTrackingEnabled: newAuthorization.isTrackingEnabled,
        trackingScope: newAuthorization.trackingScope,
        merchantEmail: newAuthorization.merchantEmail,
        consentGivenAt: newAuthorization.consentGivenAt
      }
    };

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, "Failed to initialize user authorization");
    
    return {
      status: "error",
      isInitialized: false,
      error: error.message,
      authorization: null
    };
  }
};

export const options: ActionOptions = {
  triggers: {
    api: true
  },
  returnType: true
};
