import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, connections }) => {
  // Check for iPick referrals and update business referral conversion status
  try {
    // Ensure shopId exists before proceeding
    if (!record.shopId) {
      logger.warn({ checkoutId: record.id }, "No shopId found on checkout record");
      return;
    }

    let utmParams: { source?: string; medium?: string; campaign?: string } = {};
    
    // Extract UTM parameters from sourceUrl if available
    if (record.sourceUrl) {
      const url = new URL(record.sourceUrl);
      utmParams.source = url.searchParams.get('utm_source') || undefined;
      utmParams.medium = url.searchParams.get('utm_medium') || undefined;
      utmParams.campaign = url.searchParams.get('utm_campaign') || undefined;
    }
    
    // Check if this checkout came from iPick with the expected UTM parameters
    if (utmParams.source === 'ipick' && 
        utmParams.medium === 'suggestion' && 
        utmParams.campaign === 'business_tracking') {
      
      logger.info({ 
        checkoutId: record.id, 
        shopId: record.shopId,
        utmParams 
      }, "Detected iPick referral checkout");
      
      // Find existing businessReferral record with matching UTM parameters and shop
      const existingReferral = await api.businessReferral.findFirst({
        filter: {
          AND: [
            { utmSource: { equals: utmParams.source } },
            { utmMedium: { equals: utmParams.medium } },
            { utmCampaign: { equals: utmParams.campaign } },
            { shopId: { equals: record.shopId } }
          ]
        }
      });
      
      if (existingReferral) {
        // Determine conversion status based on checkout completion
        const newConversionStatus = record.processingStatus === 'complete' ? 'converted' : 'pending';
        
        // Update the business referral conversion status
        await api.businessReferral.update(existingReferral.id, {
          conversionStatus: newConversionStatus
        });
        
        logger.info({
          referralId: existingReferral.id,
          conversionStatus: newConversionStatus,
          checkoutId: record.id
        }, "Updated business referral conversion status");
      } else {
        logger.warn({
          checkoutId: record.id,
          shopId: record.shopId,
          utmParams
        }, "No matching business referral found for iPick checkout");
      }
    }
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      checkoutId: record.id 
    }, "Error processing iPick referral checkout");
  }
};

export const options: ActionOptions = { actionType: "create" };
