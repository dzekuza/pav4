import { preventCrossShopDataAccess } from "gadget-server/shopify";

export const run: ActionRun = async ({ params, logger, api, connections, session }) => {
  // Apply defaults for optional parameters
  const utmSource = params.utmSource || 'ipick';
  const utmMedium = params.utmMedium || 'suggestion';
  const utmCampaign = params.utmCampaign || 'business_tracking';

  // For authenticated Shopify merchants, use their shop from session
  if (session && (session as any).shopId) {
    // Create the businessReferral record with the authenticated shop
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
        _link: (session as any).shopId
      }
    });

    console.log(`Created referral tracking record for authenticated shop: ${(session as any).shopId}, referralId: ${params.referralId}`);

    return {
      success: true,
      referral: referral
    };
  }

  // For unauthenticated requests (external tracking), find shop by domain
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
      _link: (shop as any).id
    }
  });

  console.log(`Created referral tracking record for referralId: ${params.referralId}, businessDomain: ${params.businessDomain}`);

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
