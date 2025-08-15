import { json, type ActionFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shop_domain, customer, orders_to_redact } = body;

    console.log('Customer data erasure request received:', {
      shop_domain,
      customer_id: customer?.id,
      orders_count: orders_to_redact?.length || 0
    });

    // Handle customer data erasure
    // This endpoint should delete/anonymize customer data
    
    // Delete customer-related records from your database
    try {
      // Find and delete business referrals for this customer
      const businessReferrals = await api.businessReferral.findMany({
        filter: {
          userId: { equals: customer?.id?.toString() || '' }
        }
      });

      // Delete each business referral individually
      for (const referral of businessReferrals) {
        await api.businessReferral.delete(referral.id);
      }

      // Find and delete customer journey records
      const customerJourneys = await api.customerJourney.findMany({
        filter: {
          userId: { equals: customer?.id?.toString() || '' }
        }
      });

      // Delete each customer journey individually
      for (const journey of customerJourneys) {
        await api.customerJourney.delete(journey.id);
      }

      console.log('Customer data erased successfully');
    } catch (deleteError) {
      console.error('Error deleting customer data:', deleteError);
    }

    return json({
      success: true,
      message: 'Customer data erased successfully'
    });

  } catch (error) {
    console.error('Error processing customer data erasure:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export default function CustomerDataErasure() {
  return null;
}
