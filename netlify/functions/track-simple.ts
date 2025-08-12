import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the event data
    const eventData = JSON.parse(event.body || '{}');
    
    // Log the event (in production, this would go to a database)
    console.log('PriceHunt Tracking Event:', {
      timestamp: new Date().toISOString(),
      event_type: eventData.event_type,
      business_id: eventData.business_id,
      affiliate_id: eventData.affiliate_id,
      platform: eventData.platform,
      session_id: eventData.session_id,
      url: eventData.url,
      page_title: eventData.page_title,
      data: eventData.data,
      user_agent: eventData.user_agent,
      referrer: eventData.referrer,
    });

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Event tracked successfully',
        event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error processing tracking event:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to process tracking event',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
