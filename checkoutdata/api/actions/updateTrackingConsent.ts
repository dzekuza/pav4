import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const shopId = connections.shopify.currentShopId;
  
  if (!shopId) {
    throw new Error("Shop ID not found in context");
  }
  
  // Find existing authorization record for this shop
  const authorization = await api.userAuthorization.findFirst({
    filter: { shopId: { equals: shopId } }
  });
  
  if (!authorization) {
    throw new Error("User authorization record not found for this shop");
  }
  
  // Validate trackingScope enum value
  const validTrackingScopes = ["basic", "full", "analytics_only"];
  if (params.trackingScope && !validTrackingScopes.includes(params.trackingScope)) {
    throw new Error(`Invalid trackingScope. Must be one of: ${validTrackingScopes.join(", ")}`);
  }
  
  // Update the authorization record
  const updatedAuthorization = await api.userAuthorization.update(authorization.id, {
    isTrackingEnabled: params.isTrackingEnabled,
    trackingScope: params.trackingScope,
    notificationPreferences: params.notificationPreferences,
    businessDomain: params.businessDomain,
    consentUpdatedAt: new Date()
  });
  
  // Log the consent change for audit purposes
  logger.info({
    shopId,
    authorizationId: authorization.id,
    previousConsent: {
      isTrackingEnabled: authorization.isTrackingEnabled,
      trackingScope: authorization.trackingScope,
      businessDomain: authorization.businessDomain
    },
    newConsent: {
      isTrackingEnabled: params.isTrackingEnabled,
      trackingScope: params.trackingScope,
      businessDomain: params.businessDomain
    }
  }, "Tracking consent updated");
  
  return {
    success: true,
    authorization: updatedAuthorization
  };
};

export const params = {
  isTrackingEnabled: { type: "boolean" },
  trackingScope: { type: "string" },
  notificationPreferences: { 
    type: "object", 
    additionalProperties: true 
  },
  businessDomain: { type: "string" }
};

export const options: ActionOptions = {
  returnType: true
};
