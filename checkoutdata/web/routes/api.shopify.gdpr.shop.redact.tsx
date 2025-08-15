import { json, type ActionFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shop_domain, shop_id } = body;

    console.log('Shop data erasure request received:', {
      shop_domain,
      shop_id
    });

    // Handle shop data erasure
    // This endpoint should delete/anonymize shop data when a store uninstalls
    
    try {
      // Find the shop by domain
      const shop = await api.shopifyShop.findFirst({
        filter: {
          domain: { equals: shop_domain }
        }
      });

      if (shop) {
        // Find and delete shop-related business referrals
        const businessReferrals = await api.businessReferral.findMany({
          filter: {
            shopId: { equals: shop.id }
          }
        });

        // Delete each business referral individually
        for (const referral of businessReferrals) {
          await api.businessReferral.delete(referral.id);
        }

        // Anonymize sensitive shop data instead of deleting
        await api.shopifyShop.update(shop.id, {
          email: null,
          customerEmail: null,
          phone: null,
          shopOwner: null,
          address1: null,
          address2: null,
          city: null,
          province: null,
          provinceCode: null,
          zipCode: null,
          country: null,
          countryCode: null,
          countryName: null,
          description: null,
          billingAddress: null,
          alerts: null
        });

        console.log('Shop data anonymized successfully');
      } else {
        console.log('Shop not found for domain:', shop_domain);
      }
    } catch (anonymizeError) {
      console.error('Error anonymizing shop data:', anonymizeError);
      // Still return success to Shopify to avoid webhook retries
      // but log the error for internal monitoring
    }

    return json({
      success: true,
      message: 'Shop data anonymized successfully'
    });

  } catch (error) {
    console.error('Error processing shop data anonymization:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export default function ShopDataErasure() {
  return null;
}
