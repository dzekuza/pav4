import { ActionOptions } from "gadget-server";
import { randomUUID } from "crypto";

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const { businessDomain, ipickUrl, targetUrl, productName, utmCampaign } = params as {
    businessDomain: string;
    ipickUrl?: string;
    targetUrl: string;
    productName?: string;
    utmCampaign: string;
  };
  
  // Validate required parameters
  if (!businessDomain) {
    throw new Error("businessDomain parameter is required");
  }
  if (!targetUrl) {
    throw new Error("targetUrl parameter is required");
  }
  if (!utmCampaign) {
    throw new Error("utmCampaign parameter is required");
  }
  
  // Get the current shop ID for tenancy
  const shopId = connections.shopify.currentShopId;
  if (!shopId) {
    throw new Error("Shop ID is required for tenancy");
  }
  
  // Generate a unique referral ID
  const referralId = randomUUID();
  
  // Record the current timestamp for the click
  const clickedAt = new Date();
  
  // Create the tracking record in businessReferral table
  const businessReferral = await api.businessReferral.create({
    businessDomain,
    referralId,
    targetUrl,
    productName: productName || null,
    utmSource: 'ipick',
    utmMedium: 'price-comparison',
    utmCampaign,
    clickedAt,
    sourceUrl: ipickUrl || null,
    shop: {
      _link: shopId.toString()
    },
    conversionStatus: 'pending'
  });
  
  // Build the trackable URL with UTM parameters
  const urlObj = new URL(targetUrl);
  urlObj.searchParams.set('utm_source', 'ipick');
  urlObj.searchParams.set('utm_medium', 'price-comparison');
  urlObj.searchParams.set('utm_campaign', utmCampaign);
  urlObj.searchParams.set('referral_id', referralId);
  
  const trackableUrl = urlObj.toString();
  
  console.log(`Created iPick tracking record with referral ID: ${referralId}`);
  
  return {
    success: true,
    referralId,
    trackableUrl,
    businessReferral: {
      id: (businessReferral as any).id,
      referralId: (businessReferral as any).referralId,
      businessDomain: (businessReferral as any).businessDomain,
      targetUrl: (businessReferral as any).targetUrl,
      clickedAt: (businessReferral as any).clickedAt
    }
  };
};

export const params = {
  businessDomain: {
    type: "string"
  },
  ipickUrl: {
    type: "string"
  },
  targetUrl: {
    type: "string"
  },
  productName: {
    type: "string"
  },
  utmCampaign: {
    type: "string"
  }
};

export const options: ActionOptions = {
  returnType: true
};
