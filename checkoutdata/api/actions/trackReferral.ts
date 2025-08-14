export const run: ActionRun = async ({ params, logger, api, connections }) => {
  // Apply defaults for optional parameters
  const utmSource = params.utmSource || 'ipick';
  const utmMedium = params.utmMedium || 'suggestion';
  const utmCampaign = params.utmCampaign || 'business_tracking';

  // Find the shopifyShop record by matching businessDomain to domain or myshopifyDomain
  const shop = await api.shopifyShop.findFirst({
    filter: {
      OR: [
        { domain: { equals: params.businessDomain } },
        { myshopifyDomain: { equals: params.businessDomain } }
      ]
    }
  });

  if (!shop) {
    throw new Error(`No shop found for business domain: ${params.businessDomain}`);
  }

  // Create the businessReferral record
  const referral = await api.businessReferral.create({
    referralId: params.referralId,
    businessDomain: params.businessDomain,
    targetUrl: params.targetUrl,
    sourceUrl: params.sourceUrl,
    productName: params.productName,
    userId: params.userId,
    clickedAt: new Date(),
    utmSource: utmSource,
    utmMedium: utmMedium,
    utmCampaign: utmCampaign,
    conversionStatus: 'pending',
    shop: {
      _link: shop.id
    }
  });

  logger.info(`Created referral tracking record for referralId: ${params.referralId}, businessDomain: ${params.businessDomain}`);

  return {
    success: true,
    referral: referral
  };
};

export const params = {
  referralId: { 
    type: "string" 
  },
  businessDomain: { 
    type: "string" 
  },
  targetUrl: { 
    type: "string" 
  },
  sourceUrl: { 
    type: "string" 
  },
  productName: { 
    type: "string" 
  },
  userId: { 
    type: "string" 
  },
  utmSource: { 
    type: "string" 
  },
  utmMedium: { 
    type: "string" 
  },
  utmCampaign: { 
    type: "string" 
  }
};
