import type { Handler, HandlerResponse } from "@netlify/functions";
import { trackEvent } from "../../server/routes/track-event";

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Only allow POST and GET requests
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed',
      }),
    };
  }

  try {
    let body: any = {};

    if (event.httpMethod === 'POST') {
      // Parse the request body for POST requests
      body = event.body ? JSON.parse(event.body) : {};
    } else if (event.httpMethod === 'GET') {
      // Parse query parameters for GET requests (image beacon fallback)
      const params = event.queryStringParameters || {};
      body = {
        event_type: params.event_type,
        business_id: params.business_id,
        affiliate_id: params.affiliate_id,
        platform: params.platform || 'shopify',
        session_id: params.session_id,
        user_agent: event.headers['user-agent'] || 'unknown',
        referrer: event.headers.referer || '',
        timestamp: parseInt(params.timestamp || Date.now().toString()),
        url: params.url || '',
        data: params.data ? JSON.parse(params.data) : {},
        page_title: params.page_title || ''
      };
    }
    
    // Create a mock Express request object
    const req = {
      body,
      headers: event.headers,
      ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown',
      connection: { remoteAddress: 'unknown' },
    };

    // Create a mock Express response object
    let responseBody = '';
    let responseStatus = 200;
    let responseHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    const res = {
      status: (code: number) => {
        responseStatus = code;
        return res;
      },
      json: (data: any) => {
        responseBody = JSON.stringify(data);
        return res;
      },
      setHeader: (name: string, value: string) => {
        responseHeaders[name] = value;
        return res;
      },
    };

    // Call the trackEvent function
    await trackEvent(req as any, res as any);

    // For GET requests (image beacon), return a 1x1 transparent pixel
    if (event.httpMethod === 'GET') {
      const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: pixel.toString('base64'),
        isBase64Encoded: true
      } as HandlerResponse;
    }

    return {
      statusCode: responseStatus,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    console.error('Error in track-event function:', error);
    
    // For GET requests, still return a pixel even on error
    if (event.httpMethod === 'GET') {
      const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: pixel.toString('base64'),
        isBase64Encoded: true
      } as HandlerResponse;
    }
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
