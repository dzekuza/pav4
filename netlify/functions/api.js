import serverless from 'serverless-http';
import { createServer } from '../../server/netlify-server.ts';

// Create the Express app
let app;
let serverlessHandler;

// Initialize the server
async function initializeServer() {
  if (!app) {
    try {
      app = await createServer();
      serverlessHandler = serverless(app);
      console.log('Server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize server:', error);
      throw error;
    }
  }
  return serverlessHandler;
}

export const handler = async (event, context) => {
  console.log('Netlify function called:', {
    path: event.path,
    method: event.httpMethod,
    headers: event.headers
  });

  try {
    // Initialize server if not already done
    const serverHandler = await initializeServer();
    
    // Call the serverless handler
    const result = await serverHandler(event, context);
    
    console.log('Handler result:', {
      statusCode: result.statusCode,
      headers: result.headers
    });
    
    return result;
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
    };
  }
};
