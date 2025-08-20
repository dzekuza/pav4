import serverless from 'serverless-http';
import app from '../../server/netlify-server';

export const handler = serverless(app);
