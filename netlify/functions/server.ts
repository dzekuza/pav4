import serverless from 'serverless-http';
import { createServer } from '../../server/index';

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
    app = await createServer();
    console.log('Server initialized successfully');
  } catch (error) {
    console.error('Failed to initialize server:', error);
    // Create a basic Express app as fallback
    const express = require('express');
    app = express();
    app.use(express.json());
    app.get('*', (req: any, res: any) => {
      res.status(500).json({ error: 'Server initialization failed' });
    });
  } finally {
    isInitializing = false;
  }
  return app;
};

export const handler = async (event: any, context: any) => {
  const server = await initializeApp();
  const serverlessHandler = serverless(server);
  return serverlessHandler(event, context);
};
