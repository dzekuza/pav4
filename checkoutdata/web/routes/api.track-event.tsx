import { json, type ActionFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const expectedToken = 'gsk-X89z6jDWkTRqgq7htYnZi4wcXQ8L3B9g';
    
    if (token !== expectedToken) {
      return json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return json({ success: false, error: 'Method not allowed' }, { status: 405 });
    }

    // Parse the request body
    const body = await request.json();
    const {
      event_type,
      business_id,
      affiliate_id,
      platform,
      session_id,
      user_agent,
      referrer,
      timestamp,
      url,
      page_title,
      data
    } = body;

    // Validate required fields
    if (!event_type || !business_id || !affiliate_id) {
      return json({ 
        success: false, 
        error: 'Missing required fields: event_type, business_id, affiliate_id' 
      }, { status: 400 });
    }

    // Validate event type
    const allowedEventTypes = ['page_view', 'product_view', 'add_to_cart', 'browse', 'search'];
    if (!allowedEventTypes.includes(event_type)) {
      return json({ 
        success: false, 
        error: `Invalid event_type. Allowed: ${allowedEventTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Find the business by domain or ID
    let shop = null;
    try {
      // Try to find shop by business_id (assuming it's a domain)
      shop = await api.shopifyShop.findFirst({
        filter: {
          OR: [
            { domain: { equals: business_id } },
            { myshopifyDomain: { equals: business_id } },
            { id: { equals: business_id } }
          ]
        }
      });
    } catch (error) {
      console.error('Error finding shop:', error);
    }

    // If shop found, create a business referral record
    if (shop) {
      try {
        // Create a business referral record for tracking
        await api.businessReferral.create({
          businessDomain: business_id,
          referralId: session_id,
          targetUrl: url,
          sourceUrl: referrer,
          productName: data?.product_title || null,
          userId: session_id,
          clickedAt: new Date(timestamp),
          utmSource: 'ipick',
          utmMedium: 'tracker',
          utmCampaign: event_type,
          conversionStatus: 'pending',
          shop: {
            _link: shop.id
          }
        });
      } catch (error) {
        console.error('Error creating business referral:', error);
      }
    } else {
      console.log('No shop found for business_id:', business_id);
    }

    // Log the tracking event
    console.log('Tracking event received:', {
      event_type,
      business_id,
      affiliate_id,
      platform,
      session_id,
      timestamp
    });

    return json({ 
      success: true, 
      message: 'Event tracked successfully',
      shop_found: !!shop
    });

  } catch (error) {
    console.error('Error processing tracking event:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

export default function TrackEvent() {
  return null;
}
