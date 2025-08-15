import { ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

export const run: ActionRun = async ({ params, logger, api, request, session }) => {
  const {
    sessionId,
    eventType,
    businessDomain,
    userId,
    email,
    pageUrl,
    pageTitle,
    referrerUrl,
    productId,
    productName,
    productPrice,
    cartValue,
    discountCode,
    discountValue,
    checkoutId,
    orderId,
    utmSource,
    utmMedium,
    utmCampaign,
    deviceType,
    browserName,
    eventData
  } = params;

  try {
    let shop;
    
    // For authenticated Shopify merchants, use their shop from session
    if (session && (session as any).shopId) {
      shop = await api.shopifyShop.findFirst({
        filter: { id: { equals: (session as any).shopId } },
        select: { id: true, domain: true, myshopifyDomain: true }
      });
      
      if (!shop) {
        console.error(`Shop not found for authenticated session: ${(session as any).shopId}`);
        throw new Error(`Shop not found for authenticated session: ${(session as any).shopId}`);
      }
    } else {
      // For unauthenticated requests (external tracking), find shop by domain
      shop = await api.shopifyShop.findFirst({
        filter: {
          OR: [
            { domain: { equals: businessDomain } },
            { myshopifyDomain: { equals: businessDomain } }
          ]
        },
        select: { id: true, domain: true, myshopifyDomain: true }
      });

      if (!shop) {
        console.error(`Shop not found for business domain: ${businessDomain}`);
        throw new Error(`Shop not found for business domain: ${businessDomain}`);
      }
    }

    // Look for existing businessReferral if UTM parameters are present
    let businessReferral = null;
    if (utmSource && utmMedium && utmCampaign) {
      try {
        businessReferral = await api.businessReferral.findFirst({
          filter: {
            AND: [
              { shopId: { equals: shop.id } },
              { utmSource: { equals: utmSource } },
              { utmMedium: { equals: utmMedium } },
              { utmCampaign: { equals: utmCampaign } }
            ]
          },
          select: { id: true, referralId: true }
        });
      } catch (error) {
        // BusinessReferral not found, which is fine - continue without linking
        console.log(`No matching business referral found for UTM parameters`);
      }
    }

    // Get IP address from request
    const ipAddress = request?.ip || request?.headers?.['x-forwarded-for'] || request?.headers?.['x-real-ip'] || null;

    // Create customerJourney record
    const journeyData: any = {
      sessionId,
      eventType,
      shop: { _link: shop.id },
      timestamp: new Date(),
      ipAddress,
      userId,
      email,
      pageUrl,
      pageTitle,
      referrerUrl,
      productId,
      productName,
      productPrice,
      cartValue,
      discountCode,
      discountValue,
      checkoutId,
      orderId,
      utmSource,
      utmMedium,
      utmCampaign,
      deviceType,
      browserName,
      eventData
    };

    // Link to businessReferral if found
    if (businessReferral) {
      journeyData.businessReferral = { _link: businessReferral.id };
    }

    const customerJourney = await api.customerJourney.create(journeyData);

    console.log(`Customer journey tracked successfully`);

    return {
      success: true,
      journeyId: (customerJourney as any).id,
      sessionId,
      eventType,
      shopId: shop.id,
      businessReferralId: businessReferral?.id
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to track customer journey: ${errorMessage}`);
    throw error;
  }
};

export const params = {
  sessionId: {
    type: "string"
  },
  eventType: {
    type: "string"
  },
  businessDomain: {
    type: "string"
  },
  userId: {
    type: "string"
  },
  email: {
    type: "string"
  },
  pageUrl: {
    type: "string"
  },
  pageTitle: {
    type: "string"
  },
  referrerUrl: {
    type: "string"
  },
  productId: {
    type: "string"
  },
  productName: {
    type: "string"
  },
  productPrice: {
    type: "number"
  },
  cartValue: {
    type: "number"
  },
  discountCode: {
    type: "string"
  },
  discountValue: {
    type: "number"
  },
  checkoutId: {
    type: "string"
  },
  orderId: {
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
  },
  deviceType: {
    type: "string"
  },
  browserName: {
    type: "string"
  },
  eventData: {
    type: "object",
    additionalProperties: true
  }
};

export const options: ActionOptions = {
  returnType: true,
  triggers: {
    api: true
  }
};
