import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, connections }) => {
  // Enhanced referral conversion tracking for orders
  try {
    // Ensure shopId exists before proceeding
    if (!record.shopId) {
      logger.warn({ orderId: record.id }, "No shopId found on order, skipping referral conversion processing");
      return;
    }

    logger.info({
      orderId: record.id,
      shopId: record.shopId,
      email: record.email,
      totalPrice: record.totalPrice,
      createdAt: record.createdAt
    }, "Processing order for affiliate conversion tracking");

    // Method 1: Try to match by checkout token if available
    let matchedReferral = null;
    if (record.checkoutToken) {
      logger.info({ orderId: record.id, checkoutToken: record.checkoutToken }, "Attempting to match by checkout token");
      
      // Look for referrals that might be linked to this checkout
      const tokenReferrals = await api.businessReferral.findMany({
        filter: {
          shopId: { equals: record.shopId },
          conversionStatus: { equals: "pending" }
        },
        first: 100
      });

      // Check if any referral has a matching token in the targetUrl or sourceUrl
      for (const referral of tokenReferrals) {
        if (referral.targetUrl && referral.targetUrl.includes(record.checkoutToken)) {
          matchedReferral = referral;
          logger.info({
            orderId: record.id,
            referralId: referral.id,
            method: "checkout_token_match"
          }, "Found referral match by checkout token");
          break;
        }
      }
    }

    // Method 2: Try to match by email if available
    if (!matchedReferral && record.email) {
      logger.info({ orderId: record.id, email: record.email }, "Attempting to match by email");
      
      // Look for recent referrals for this shop
      const emailReferrals = await api.businessReferral.findMany({
        filter: {
          shopId: { equals: record.shopId },
          conversionStatus: { equals: "pending" }
        },
        first: 100,
        sort: { clickedAt: "Descending" }
      });

      // For email matching, we'd need to store email in referrals or use a different approach
      // This is a placeholder for future enhancement
    }

    // Method 3: Enhanced timing-based matching with better logic
    if (!matchedReferral) {
      logger.info({ orderId: record.id }, "Attempting timing-based referral matching");
      
      const orderCreatedAt = record.createdAt || new Date();
      const timeWindowHours = 48; // Extended to 48 hours for better matching
      const timeWindowMs = timeWindowHours * 60 * 60 * 1000;

      // Get all pending referrals for this shop
      const pendingReferrals = await api.businessReferral.findMany({
        filter: {
          shopId: { equals: record.shopId },
          conversionStatus: { equals: "pending" }
        },
        first: 250,
        sort: { clickedAt: "Descending" }
      });

      logger.info({
        orderId: record.id,
        pendingReferralsCount: pendingReferrals.length,
        timeWindowHours
      }, "Found pending referrals for timing-based matching");

      // Find the most recent referral within the time window
      for (const referral of pendingReferrals) {
        if (referral.clickedAt) {
          const timeDiff = orderCreatedAt.getTime() - new Date(referral.clickedAt).getTime();
          
          // If the referral was clicked before the order and within our time window
          if (timeDiff >= 0 && timeDiff <= timeWindowMs) {
            matchedReferral = referral;
            logger.info({
              orderId: record.id,
              referralId: referral.id,
              timeDiffHours: Math.round(timeDiff / (1000 * 60 * 60)),
              method: "timing_based_match"
            }, "Found referral match by timing");
            break;
          }
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
        conversionValue: conversionValue,
        referralSource: matchedReferral.utmSource,
        referralMedium: matchedReferral.utmMedium,
        referralCampaign: matchedReferral.utmCampaign
      }, "Successfully marked referral as converted for order");
    } else {
      logger.warn({
        orderId: record.id,
        shopId: record.shopId,
        email: record.email,
        totalPrice: record.totalPrice
      }, "No matching referral found for order - this may be a direct customer");
    }

  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      orderId: record.id 
    }, "Error processing referral conversion for order");
  }
};

export const options: ActionOptions = { actionType: "create" };
