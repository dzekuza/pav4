import { json, type ActionFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { id, email, total_price, source_url, source_name, shop_domain } = body;

    console.log('Order created webhook received:', {
      orderId: id,
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

    // Create order record
    const order = await api.shopifyOrder.create({
      orderId: id?.toString(),
      email: email,
      totalPrice: total_price?.toString(),
      sourceUrl: source_url,
      sourceName: source_name,
      shop: {
        _link: shop.id
      }
    });

    console.log('Order record created successfully:', order.id);

    return json({
      success: true,
      orderId: order.id
    });

  } catch (error) {
    console.error('Error processing order created webhook:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export default function OrderCreatedWebhook() {
  return null;
}
