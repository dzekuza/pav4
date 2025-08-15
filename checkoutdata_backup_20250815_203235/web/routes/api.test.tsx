import { json, type LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
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

    // Simple test response
    return json({
      success: true,
      message: "API connection working",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error("Error in test API:", error);
    return json({
      success: false,
      error: "Failed to process request"
    }, { status: 500 });
  }
};
