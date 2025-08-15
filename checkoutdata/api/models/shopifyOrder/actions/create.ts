import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api, connections }) => {
  // Enhanced referral conversion tracking for orders with flexible iPick detection
  try {
    logger.info({
      orderId: record.id,
      sourceUrl: record.sourceUrl,
      sourceName: record.sourceName,
      email: record.email,
      totalPrice: record.totalPrice,
      shopId: record.shopId
    }, "Processing order for iPick affiliate tracking");

    let isIpickOrder = false;
    let matchedReferral = null;
    let detectionMethod = null;
    let detectionDetails = {};

    // Method 1: Check for unique referral URLs in sourceUrl
    if (record.sourceUrl) {
      // Check for unique referral URLs containing affiliate IDs
      const referralUrlMatch = record.sourceUrl.match(/\/ref\/(aff_[a-zA-Z0-9_]+)/);
      const trackingUrlMatch = record.sourceUrl.match(/\/track\/(aff_[a-zA-Z0-9_]+)\/([^\/]+)/);
      
      if (referralUrlMatch || trackingUrlMatch) {
        const affiliateId = referralUrlMatch ? referralUrlMatch[1] : trackingUrlMatch![1];
        const targetDomain = trackingUrlMatch ? trackingUrlMatch[2] : null;
        
        detectionMethod = "unique_referral_url";
        detectionDetails = { affiliateId, targetDomain, sourceUrl: record.sourceUrl };
        
        logger.info(detectionDetails, "Found affiliate URL match in order");
        
        // Find the business referral record with flexible matching
        const referralFilters: (BusinessReferralFilter | null)[] = [];
        if (targetDomain) {
          referralFilters.push({
            AND: [
              { referralId: { equals: affiliateId } },
              { businessDomain: { equals: targetDomain } }
            ]
          });
        }
        referralFilters.push({ referralId: { equals: affiliateId } });
        
        matchedReferral = await api.businessReferral.findFirst({
          filter: { OR: referralFilters }
        });
        
        if (matchedReferral) {
          isIpickOrder = true;
          logger.info({
            referralId: matchedReferral.referralId,
            businessDomain: matchedReferral.businessDomain,
            conversionStatus: matchedReferral.conversionStatus,
            detectionMethod
          }, "Matched referral record for order");
        }
      }
    }

    // Method 2: Enhanced UTM parameter checking (flexible iPick sources)
    if (!isIpickOrder && record.sourceUrl) {
      try {
        const url = new URL(record.sourceUrl);
        const utmSource = url.searchParams.get('utm_source')?.toLowerCase();
        const utmMedium = url.searchParams.get('utm_medium')?.toLowerCase();
        const utmCampaign = url.searchParams.get('utm_campaign')?.toLowerCase();
        
        detectionDetails = { utmSource, utmMedium, utmCampaign, sourceUrl: record.sourceUrl };
        
        // Accept both 'ipick' and 'pavlo4' as valid iPick sources
        const isIpickSource = utmSource === 'ipick' || utmSource === 'pavlo4';
        const isValidMedium = utmMedium === 'suggestion' || utmMedium === 'referral' || utmMedium === 'affiliate';
        const isValidCampaign = utmCampaign === 'business_tracking' || utmCampaign === 'ipick_tracking';
        
        if (isIpickSource && isValidMedium && isValidCampaign) {
          isIpickOrder = true;
          detectionMethod = "utm_parameters";
          
          logger.info(detectionDetails, "Matched iPick order by UTM parameters");
          
          // Try to find matching business referral by UTM parameters
          matchedReferral = await api.businessReferral.findFirst({
            filter: {
              utmSource: { 
                in: [utmSource, 'ipick', 'pavlo4'] 
              }
            }
          });
        }
      } catch (urlError) {
        logger.warn({ sourceUrl: record.sourceUrl, error: String(urlError) }, "Failed to parse sourceUrl as URL for UTM extraction");
      }
    }

    // Method 3: Domain-based detection for ipick.io URLs
    if (!isIpickOrder && record.sourceUrl) {
      try {
        const url = new URL(record.sourceUrl);
        const hostname = url.hostname.toLowerCase();
        
        if (hostname.includes('ipick.io') || hostname.includes('ipick.com')) {
          isIpickOrder = true;
          detectionMethod = "domain_detection";
          detectionDetails = { hostname, sourceUrl: record.sourceUrl };
          
          logger.info(detectionDetails, "Matched iPick order by domain detection");
          
          // Try to find matching business referral
          matchedReferral = await api.businessReferral.findFirst({
            filter: {
              OR: [
                { utmSource: { equals: "ipick" } },
                { businessDomain: { in: ["ipick.io", "ipick.com"] } }
              ]
            }
          });
        }
      } catch (urlError) {
        logger.warn({ sourceUrl: record.sourceUrl, error: String(urlError) }, "Failed to parse sourceUrl for domain detection");
      }
    }

    // Method 4: Flexible term matching for iPick-related terms in URLs
    if (!isIpickOrder && record.sourceUrl) {
      const sourceUrlLower = record.sourceUrl.toLowerCase();
      const ipickTerms = ['ipick', 'pavlo', 'pavlo4', 'price-comparison', 'product-comparison'];
      const foundTerms = ipickTerms.filter(term => sourceUrlLower.includes(term));
      
      if (foundTerms.length > 0) {
        isIpickOrder = true;
        detectionMethod = "url_term_matching";
        detectionDetails = { foundTerms, sourceUrl: record.sourceUrl };
        
        logger.info(detectionDetails, "Matched iPick order by URL term matching");
        
        // Try to find matching business referral
        matchedReferral = await api.businessReferral.findFirst({
          filter: {
            OR: [
              { utmSource: { in: foundTerms } },
              { businessDomain: { in: foundTerms } }
            ]
          }
        });
      }
    }

    // Method 5: Enhanced sourceName checking with flexible terms
    if (!isIpickOrder && record.sourceName) {
      const sourceNameLower = record.sourceName.toLowerCase();
      const ipickTerms = ['ipick', 'pavlo', 'pavlo4', 'price comparison', 'product comparison', 'shopping comparison'];
      const foundTerms = ipickTerms.filter(term => sourceNameLower.includes(term));
      
      if (foundTerms.length > 0) {
        isIpickOrder = true;
        detectionMethod = "source_name_matching";
        detectionDetails = { foundTerms, sourceName: record.sourceName };
        
        logger.info(detectionDetails, "Matched iPick order by sourceName matching");
        
        // Try to find matching business referral
        const searchTerms = foundTerms.map(term => term.replace(' ', ''));
        matchedReferral = await api.businessReferral.findFirst({
          filter: {
            OR: [
              { utmSource: { in: searchTerms } },
              { businessDomain: { in: foundTerms.concat(searchTerms) } }
            ]
          }
        });
      }
    }

    // Method 6: Enhanced timing-based matching (48-hour window)
    if (!isIpickOrder) {
      const orderTime = new Date(record.createdAt);
      const cutoffTime = new Date(orderTime.getTime() - (48 * 60 * 60 * 1000)); // 48 hours ago
      
      // Find pending referrals within the time window for this shop
      const pendingReferrals = await api.businessReferral.findMany({
        filter: {
          AND: [
            { conversionStatus: { equals: "pending" } },
            { clickedAt: { greaterThan: cutoffTime.toISOString() } },
            { shopId: { equals: record.shopId } }
          ]
        },
        first: 10,
        sort: { clickedAt: "Descending" }
      });
      
      logger.info({ 
        pendingReferralsCount: pendingReferrals.length, 
        cutoffTime: cutoffTime.toISOString(),
        orderTime: orderTime.toISOString()
      }, "Found pending referrals within 48 hours for timing-based matching");
      
      if (pendingReferrals.length > 0) {
        // Use the most recent referral
        matchedReferral = pendingReferrals[0];
        isIpickOrder = true;
        detectionMethod = "timing_based_matching";
        detectionDetails = {
          referralId: matchedReferral.referralId,
          businessDomain: matchedReferral.businessDomain,
          clickedAt: matchedReferral.clickedAt,
          timeDifference: orderTime.getTime() - new Date(matchedReferral.clickedAt).getTime()
        };
        
        logger.info(detectionDetails, "Matched iPick order by timing-based matching");
      }
    }

    // Update the matched referral if found
    if (matchedReferral && isIpickOrder) {
      const conversionValue = parseFloat(record.totalPrice || "0");
      
      await api.businessReferral.update(matchedReferral.id, {
        conversionStatus: "converted",
        conversionValue: conversionValue
      });

      logger.info({
        orderId: record.id,
        referralId: matchedReferral.id,
        conversionValue: conversionValue,
        detectionMethod,
        detectionDetails,
        referralSource: matchedReferral.utmSource,
        referralMedium: matchedReferral.utmMedium,
        referralCampaign: matchedReferral.utmCampaign
      }, "Successfully marked referral as converted for order");
    } else if (isIpickOrder) {
      logger.warn({
        orderId: record.id,
        detectionMethod,
        detectionDetails,
        shopId: record.shopId
      }, "iPick order detected but no matching referral found");
    } else {
      logger.info({
        orderId: record.id,
        shopId: record.shopId,
        sourceUrl: record.sourceUrl,
        sourceName: record.sourceName
      }, "Order processed - no iPick referral indicators found");
    }

  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      orderId: record.id,
      shopId: record.shopId
    }, "Error processing iPick referral conversion for order");
  }
};

export const options: ActionOptions = { actionType: "create" };
