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
    let isIPickReferral = false;
    let detectionMethod = '';
    
    // Extract UTM parameters from sourceUrl if available
    if (record.sourceUrl) {
      const url = new URL(record.sourceUrl);
      utmParams.source = url.searchParams.get('utm_source') || undefined;
      utmParams.medium = url.searchParams.get('utm_medium') || undefined;
      utmParams.campaign = url.searchParams.get('utm_campaign') || undefined;
      
      // Method 1: Check for iPick UTM sources (ipick or ipick.io)
      if ((utmParams.source === 'ipick' || utmParams.source === 'ipick.io') && 
          utmParams.medium === 'suggestion' && 
          utmParams.campaign === 'business_tracking') {
        isIPickReferral = true;
        detectionMethod = 'utm_exact_match';
      }
      
      // Method 2: Check for ipick.io domain in the URL
      if (!isIPickReferral && url.hostname.includes('ipick.io')) {
        isIPickReferral = true;
        detectionMethod = 'domain_match';
      }
      
      // Method 3: Check for iPick-related terms in URL path or query parameters
      if (!isIPickReferral) {
        const fullUrl = url.toString().toLowerCase();
        const ipickTerms = ['ipick', 'ipick.io', 'pavlp'];
        
        for (const term of ipickTerms) {
          if (fullUrl.includes(term)) {
            isIPickReferral = true;
            detectionMethod = 'url_term_match';
            break;
          }
        }
      }
      
      // Method 4: Check for flexible UTM parameter combinations
      if (!isIPickReferral && utmParams.source && 
          (utmParams.source.toLowerCase().includes('ipick') || 
           utmParams.source.toLowerCase().includes('pavlo'))) {
        isIPickReferral = true;
        detectionMethod = 'utm_flexible_match';
      }
    }
    
    // Enhanced logging for debugging
    logger.info({ 
      checkoutId: record.id, 
      shopId: record.shopId,
      sourceUrl: record.sourceUrl,
      utmParams,
      isIPickReferral,
      detectionMethod,
      processingStatus: record.processingStatus
    }, "Processing checkout for iPick referral detection");
    
    if (isIPickReferral) {
      logger.info({ 
        checkoutId: record.id, 
        shopId: record.shopId,
        utmParams,
        detectionMethod 
      }, "Detected iPick referral checkout");
      
      // Build flexible query conditions for business referral matching
      const filterConditions = [];
      
      // Try exact UTM match first if we have all parameters
      if (utmParams.source && utmParams.medium && utmParams.campaign) {
        filterConditions.push({
          AND: [
            { utmSource: { equals: utmParams.source } },
            { utmMedium: { equals: utmParams.medium } },
            { utmCampaign: { equals: utmParams.campaign } },
            { shopId: { equals: record.shopId } }
          ]
        });
      }
      
      // Try flexible source matching with known iPick sources
      filterConditions.push({
        AND: [
          { 
            utmSource: { 
              in: ['ipick', 'ipick.io'] 
            } 
          },
          { shopId: { equals: record.shopId } }
        ]
      });
      
      // Try partial source matching for any iPick-related sources
      filterConditions.push({
        AND: [
          {
            OR: [
              { utmSource: { startsWith: 'ipick' } },
              { utmSource: { startsWith: 'pavlo' } },
              { utmSource: { contains: 'ipick' } },
              { utmSource: { contains: 'pavlo' } }
            ]
          },
          { shopId: { equals: record.shopId } }
        ]
      });
      
      let existingReferral = null;
      
      // Try each filter condition in order of preference
      for (const filterCondition of filterConditions) {
        try {
          existingReferral = await api.businessReferral.findFirst({
            filter: filterCondition
          });
          
          if (existingReferral) {
            logger.info({
              referralId: existingReferral.id,
              filterUsed: JSON.stringify(filterCondition),
              checkoutId: record.id
            }, "Found business referral using filter");
            break;
          }
        } catch (queryError) {
          logger.warn({
            error: queryError instanceof Error ? queryError.message : String(queryError),
            filterCondition: JSON.stringify(filterCondition)
          }, "Error querying business referral with filter");
        }
      }
      
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
          checkoutId: record.id,
          detectionMethod,
          existingReferralData: {
            utmSource: existingReferral.utmSource,
            utmMedium: existingReferral.utmMedium,
            utmCampaign: existingReferral.utmCampaign
          }
        }, "Updated business referral conversion status");
      } else {
        logger.warn({
          checkoutId: record.id,
          shopId: record.shopId,
          utmParams,
          detectionMethod,
          sourceUrl: record.sourceUrl
        }, "No matching business referral found for iPick checkout after trying all filter methods");
      }
    } else {
      logger.debug({
        checkoutId: record.id,
        sourceUrl: record.sourceUrl,
        utmParams
      }, "Checkout not identified as iPick referral");
    }
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      checkoutId: record.id,
      sourceUrl: record.sourceUrl
    }, "Error processing iPick referral checkout");
  }
};

export const options: ActionOptions = { actionType: "create" };
