import type { Handler, HandlerResponse } from "@netlify/functions";
import { trackEvent } from "../../server/routes/track-event";

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight requests
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
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed',
      }),
    };
  }

  try {
    // Parse the request body
    const body = event.body ? JSON.parse(event.body) : {};
    
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

    return {
      statusCode: responseStatus,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    console.error('Error in track-event function:', error);
    
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
