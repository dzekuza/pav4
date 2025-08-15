import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const { reason } = params;
  const shopId = connections.shopify.currentShopId;

  if (!shopId) {
    throw new Error("No shop context available");
  }

  // Find the current user's authorization record
  const userAuth = await api.userAuthorization.findFirst({
    filter: {
      shop: { equals: shopId }
    }
  });

  if (!userAuth) {
    throw new Error("No user authorization record found for current shop");
  }

  // Update the authorization record to revoke consent
  const updatedAuth = await api.userAuthorization.update(userAuth.id, {
    revokedAt: new Date(),
    revokedReason: reason,
    isTrackingEnabled: false
  });

  // Log the revocation for compliance purposes
  logger.info({
    action: "tracking_consent_revoked",
    shopId: shopId,
    userAuthId: userAuth.id,
    revokedAt: updatedAuth.revokedAt,
    reason: reason,
    merchantEmail: userAuth.merchantEmail
  }, "Tracking consent revoked for compliance");

  // Return confirmation of revocation
  return {
    success: true,
    message: "Tracking consent has been successfully revoked",
    revokedAt: updatedAuth.revokedAt,
    reason: reason
  };
};

export const params = {
  reason: { 
    type: "string"
  }
};

export const options: ActionOptions = {
  triggers: { api: true }
};
