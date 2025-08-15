import { json, type ActionFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { id, email, total_price, source_url, source_name, shop_domain } = body;

    console.log('Checkout created webhook received:', {
      checkoutId: id,
      email,
      totalPrice: total_price,
      sourceUrl: source_url,
      sourceName: source_name,
      shopDomain: shop_domain
    });

    // Find the shop by domain
    const shop = await api.shopifyShop.findFirst({
      filter: {
        OR: [
          { domain: { equals: shop_domain } },
          { myshopifyDomain: { equals: shop_domain } }
        ]
      }
    });

    if (!shop) {
      console.error(`No shop found for domain: ${shop_domain}`);
      return json({ error: 'Shop not found' }, { status: 404 });
    }

    // Create checkout record
    const checkout = await api.shopifyCheckout.create({
      checkoutId: id?.toString(),
      email: email,
      totalPrice: total_price?.toString(),
      sourceUrl: source_url,
      sourceName: source_name,
      shop: {
        _link: shop.id
      }
    });

    console.log('Checkout record created successfully:', checkout.id);

    return json({
      success: true,
      checkoutId: checkout.id
    });

  } catch (error) {
    console.error('Error processing checkout created webhook:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export default function CheckoutCreatedWebhook() {
  return null;
}
