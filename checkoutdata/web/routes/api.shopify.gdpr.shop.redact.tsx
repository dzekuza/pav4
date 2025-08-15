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
        // Delete shop-related records
        await api.businessReferral.deleteMany({
          filter: {
            shop: { equals: shop.id }
          }
        });

        // Delete shop data (you may want to anonymize instead of delete)
        await api.shopifyShop.delete({
          id: shop.id
        });

        console.log('Shop data erased successfully');
      } else {
        console.log('Shop not found for domain:', shop_domain);
      }
    } catch (deleteError) {
      console.error('Error deleting shop data:', deleteError);
    }

    return json({
      success: true,
      message: 'Shop data erased successfully'
    });

  } catch (error) {
    console.error('Error processing shop data erasure:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export default function ShopDataErasure() {
  return null;
}
