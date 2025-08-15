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
    console.log("Processing order for affiliate tracking:", {
      orderId: record.id,
      sourceUrl: record.sourceUrl,
      sourceName: record.sourceName,
      email: record.email,
      totalPrice: record.totalPrice
    });

    // Method 1: Check for unique referral URLs in sourceUrl
    let isAffiliateOrder = false;
    let matchedReferral = null;
    let referralSource = null;
    let referralMedium = null;
    let referralCampaign = null;

    if (record.sourceUrl) {
      // Check for unique referral URLs containing affiliate IDs
      const referralUrlMatch = record.sourceUrl.match(/\/ref\/(aff_[a-zA-Z0-9_]+)/);
      const trackingUrlMatch = record.sourceUrl.match(/\/track\/(aff_[a-zA-Z0-9_]+)\/([^\/]+)/);
      
      if (referralUrlMatch || trackingUrlMatch) {
        const affiliateId = referralUrlMatch ? referralUrlMatch[1] : trackingUrlMatch![1];
        const targetDomain = trackingUrlMatch ? trackingUrlMatch[2] : null;
        
        console.log("Found affiliate URL match:", { affiliateId, targetDomain });
        
        // Find the business referral record
        const referralQuery = targetDomain 
          ? { affiliateId: { equals: affiliateId }, businessDomain: { equals: targetDomain } }
          : { affiliateId: { equals: affiliateId } };
        
        matchedReferral = await api.businessReferral.findFirst({
          filter: referralQuery
        });
        
        if (matchedReferral) {
          isAffiliateOrder = true;
          referralSource = matchedReferral.utmSource;
          referralMedium = matchedReferral.utmMedium;
          referralCampaign = matchedReferral.utmCampaign;
          
          console.log("Matched referral record:", {
            referralId: matchedReferral.referralId,
            businessDomain: matchedReferral.businessDomain,
            conversionStatus: matchedReferral.conversionStatus
          });
        }
      }
    }

    // Method 2: Check UTM parameters in sourceUrl (existing logic)
    if (!isAffiliateOrder && record.sourceUrl) {
      const url = new URL(record.sourceUrl);
      const utmSource = url.searchParams.get('utm_source');
      const utmMedium = url.searchParams.get('utm_medium');
      const utmCampaign = url.searchParams.get('utm_campaign');
      
      if (utmSource === 'ipick' && utmMedium === 'suggestion' && utmCampaign === 'business_tracking') {
        isAffiliateOrder = true;
        referralSource = utmSource;
        referralMedium = utmMedium;
        referralCampaign = utmCampaign;
        
        console.log("Matched UTM parameters for affiliate order");
      }
    }

    // Method 3: Enhanced timing-based matching with converted referrals (48-hour window)
    if (!isAffiliateOrder) {
      const orderTime = new Date(record.createdAt);
      const cutoffTime = new Date(orderTime.getTime() - (48 * 60 * 60 * 1000)); // 48 hours ago
      
      // Find pending referrals within the time window
      const pendingReferrals = await api.businessReferral.findMany({
        filter: {
          conversionStatus: { equals: "pending" },
          clickedAt: { greaterThan: cutoffTime.toISOString() }
        },
        first: 10
      });
      
      console.log(`Found ${pendingReferrals.length} pending referrals within 48 hours`);
      
      for (const referral of pendingReferrals) {
        // Check if this referral matches the order (by timing)
        // Note: We don't have email field in businessReferral, so we'll use timing only
        matchedReferral = referral;
        isAffiliateOrder = true;
        referralSource = referral.utmSource;
        referralMedium = referral.utmMedium;
        referralCampaign = referral.utmCampaign;
        
        console.log("Matched referral by timing:", {
          referralId: referral.referralId,
          businessDomain: referral.businessDomain
        });
        break;
      }
    }

    // Method 4: Check sourceName for affiliate indicators
    if (!isAffiliateOrder && record.sourceName) {
      const sourceNameLower = record.sourceName.toLowerCase();
      if (sourceNameLower.includes('ipick') || sourceNameLower.includes('pavlo') || sourceNameLower.includes('price comparison')) {
        isAffiliateOrder = true;
        referralSource = 'ipick';
        referralMedium = 'suggestion';
        referralCampaign = 'business_tracking';
        
        console.log("Matched affiliate order by sourceName:", record.sourceName);
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
