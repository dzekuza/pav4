import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const { referralId, sessionId, conversionType, conversionValue, checkoutId, orderId, discountCode, discountValue } = params;

  try {
    // Find the business referral by referralId
    const businessReferral = await api.businessReferral.findFirst({
      filter: {
        referralId: { equals: referralId }
      },
      select: {
        id: true,
        shopId: true,
        conversionStatus: true,
        conversionValue: true
      }
    });

    if (!businessReferral) {
      console.warn(`Business referral not found for referralId: ${referralId}`);
      return {
        success: false,
        error: "Referral not found"
      };
    }

    // Determine the new conversion status based on conversion type
    let newStatus = businessReferral.conversionStatus;
    if (conversionType === 'checkout_start' && businessReferral.conversionStatus === 'pending') {
      newStatus = 'converted';
    } else if (conversionType === 'checkout_complete' || conversionType === 'order_created') {
      newStatus = 'converted';
    }

    // Update the business referral with conversion information
    const updatedReferral = await api.businessReferral.update(businessReferral.id, {
      conversionStatus: newStatus,
      conversionValue: conversionValue || businessReferral.conversionValue
    });

    // Create customer journey record for this conversion event
    await api.customerJourney.create({
      sessionId,
      eventType: conversionType === 'checkout_start' ? 'checkout_start' : 
                 conversionType === 'checkout_complete' ? 'checkout_complete' : 'purchase',
      timestamp: new Date(),
      shop: { _link: businessReferral.shopId },
      businessReferral: { _link: businessReferral.id },
      cartValue: conversionValue,
      checkoutId,
      orderId,
      discountCode,
      discountValue
    });

    console.log(`Conversion recorded for referralId: ${referralId}, type: ${conversionType}, value: ${conversionValue}`);

    return {
      success: true,
      referralId: referralId || "",
      conversionType: conversionType || "",
      conversionValue: conversionValue || 0,
      newStatus: newStatus || "pending"
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error recording conversion: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const options: ActionOptions = {
  triggers: {
    api: true
  }
};

export const params = {
  referralId: { 
    type: "string"
  },
  sessionId: { 
    type: "string"
  },
  conversionType: { 
    type: "string"
  },
  conversionValue: { 
    type: "number" 
  },
  checkoutId: { 
    type: "string" 
  },
  orderId: { 
    type: "string" 
  },
  discountCode: { 
    type: "string" 
  },
  discountValue: { 
    type: "number" 
  }
};
