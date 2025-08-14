import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, connections }) => {
  // Mark referral conversions when orders are completed
  try {
    // Ensure shopId exists before proceeding
    if (!record.shopId) {
      logger.warn({ orderId: record.id }, "No shopId found on order, skipping referral conversion processing");
      return;
    }

    // Find pending business referrals for this shop
    const pendingReferrals = await api.businessReferral.findMany({
      filter: {
        shopId: { equals: record.shopId },
        conversionStatus: { equals: "pending" }
      },
      first: 250
    });

    if (pendingReferrals.length === 0) {
      return;
    }

    let matchedReferral = null;

    // Try to match by checkout token first
    if (record.checkoutToken) {
      // Look for referrals that might be linked to this checkout token
      // Since we don't have a direct checkout token field on referral, 
      // we'll use timing-based matching as the primary method
    }

    // Match based on timing - find referrals clicked shortly before this order was created
    const orderCreatedAt = record.createdAt || new Date();
    const timeWindowHours = 24; // Look for referrals clicked within 24 hours before order creation
    const timeWindowMs = timeWindowHours * 60 * 60 * 1000;

    for (const referral of pendingReferrals) {
      if (referral.clickedAt) {
        const timeDiff = orderCreatedAt.getTime() - new Date(referral.clickedAt).getTime();
        
        // If the referral was clicked before the order and within our time window
        if (timeDiff >= 0 && timeDiff <= timeWindowMs) {
          matchedReferral = referral;
          break; // Use the first match (could be refined to use most recent)
        }
      }
    }

    // Update the matched referral if found
    if (matchedReferral) {
      const conversionValue = parseFloat(record.totalPrice || "0");
      
      await api.businessReferral.update(matchedReferral.id, {
        conversionStatus: "converted",
        conversionValue: conversionValue
      });

      logger.info({
        orderId: record.id,
        referralId: matchedReferral.id,
        conversionValue: conversionValue
      }, "Marked referral as converted for order");
    }
  } catch (error: unknown) {
    logger.error({ error: error instanceof Error ? error.message : String(error), orderId: record.id }, "Error processing referral conversion");
  }
};

export const options: ActionOptions = { actionType: "create" };
