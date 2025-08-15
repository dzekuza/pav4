interface SampleReferralData {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referralId: string;
  targetUrl: string;
  productName: string;
}

interface CreatedReferral {
  referralId: string;
  utmSource: string;
  id: string;
}

interface ErrorReferral {
  referralId: string;
  error: string;
}

interface ActionResults {
  created: CreatedReferral[];
  skipped: string[];
  errors: ErrorReferral[];
}

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const shopId = connections.shopify.currentShopId;
  
  if (!shopId) {
    throw new Error("No current shop found");
  }

  // Convert shopId to string for API calls
  const shopIdString = String(shopId);

  // Get shop details for business domain
  const shop = await api.shopifyShop.findOne(shopIdString, {
    select: { id: true, domain: true, myshopifyDomain: true }
  });

  const businessDomain: string = shop.domain || shop.myshopifyDomain || "godislove.lt";
  
  // Sample data for testing
  const sampleReferrals: SampleReferralData[] = [
    {
      utmSource: 'pavlo4',
      utmMedium: 'suggestion', 
      utmCampaign: 'business_tracking',
      referralId: 'pavlo4_ref_001',
      targetUrl: 'https://godislove.lt/products/spiritual-guidance',
      productName: 'Spiritual Guidance Package'
    },
    {
      utmSource: 'pavlo4',
      utmMedium: 'suggestion',
      utmCampaign: 'business_tracking', 
      referralId: 'pavlo4_ref_002',
      targetUrl: 'https://godislove.lt/products/prayer-books',
      productName: 'Prayer Book Collection'
    },
    {
      utmSource: 'ipick',
      utmMedium: 'suggestion',
      utmCampaign: 'business_tracking',
      referralId: 'ipick_ref_001', 
      targetUrl: 'https://godislove.lt/products/religious-jewelry',
      productName: 'Religious Jewelry Set'
    },
    {
      utmSource: 'ipick',
      utmMedium: 'suggestion',
      utmCampaign: 'business_tracking',
      referralId: 'ipick_ref_002',
      targetUrl: 'https://godislove.lt/products/devotional-items',
      productName: 'Devotional Items Bundle'
    }
  ];

  const results: ActionResults = {
    created: [],
    skipped: [],
    errors: []
  };

  const now = new Date();
  
  for (const referralData of sampleReferrals) {
    try {
      // Check if referral already exists
      const existing = await api.businessReferral.maybeFindFirst({
        filter: { referralId: { equals: referralData.referralId } }
      });
      
      if (existing) {
        logger.info(`Referral ${referralData.referralId} already exists, skipping`);
        results.skipped.push(referralData.referralId);
        continue;
      }

      // Create the referral record
      const referral = await api.businessReferral.create({
        businessDomain,
        utmSource: referralData.utmSource,
        utmMedium: referralData.utmMedium,
        utmCampaign: referralData.utmCampaign,
        referralId: referralData.referralId,
        targetUrl: referralData.targetUrl,
        productName: referralData.productName,
        conversionStatus: 'pending',
        clickedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        shop: {
          _link: shopIdString
        }
      });

      logger.info(`Created business referral: ${referralData.referralId} for ${referralData.utmSource}`);
      results.created.push({
        referralId: referralData.referralId,
        utmSource: referralData.utmSource,
        id: referral.id
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to create referral ${referralData.referralId}: ${errorMessage}`);
      results.errors.push({
        referralId: referralData.referralId,
        error: errorMessage
      });
    }
  }

  logger.info(`Sample business referrals creation complete. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`);
  
  return {
    success: true,
    shopId: shopIdString,
    businessDomain,
    summary: results
  };
};
