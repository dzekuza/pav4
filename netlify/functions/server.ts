import serverless from 'serverless-http';
import { createServer } from '../../server/netlify-server';

// Create a handler that initializes the server on first request
let app: any = null;
let isInitializing = false;

const initializeApp = async () => {
  if (app) return app;
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return app;
  }
  
  isInitializing = true;
  try {
    console.log('Starting server initialization...');
    console.log('Environment check:', {
      NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? 'Set' : 'Not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV
    });
    
    app = await createServer();
    console.log('Server initialized successfully');
  } catch (error) {
    console.error('Failed to initialize server:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Create a basic Express app as fallback
    const express = require('express');
    app = express();
    app.use(express.json());
    app.get('*', (req: any, res: any) => {
      res.status(500).json({ 
        error: 'Server initialization failed',
        details: error instanceof Error ? error.message : String(error)
      });
    });
  } finally {
    isInitializing = false;
  }
  return app;
};

export const handler = async (event: any, context: any) => {
  try {
    const server = await initializeApp();
    const serverlessHandler = serverless(server);
    return serverlessHandler(event, context);
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Server handler failed',
        details: error instanceof Error ? error.message : String(error)
      })
    };
  }
};
