import { json, type ActionFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shop_domain, customer, orders_to_redact } = body;

    console.log('Customer data request received:', {
      shop_domain,
      customer_id: customer?.id,
      orders_count: orders_to_redact?.length || 0
    });

    // Handle customer data request
    // This endpoint should return customer data in a specific format
    // For now, we'll log the request and return a success response
    
    // You can implement actual data export logic here
    // The response should contain customer data in the format Shopify expects

    return json({
      success: true,
      message: 'Customer data request processed'
    });

  } catch (error) {
    console.error('Error processing customer data request:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export default function CustomerDataRequest() {
  return null;
}
