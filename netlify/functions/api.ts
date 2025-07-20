import serverless from "serverless-http";
import { createServer } from "../../server";

// Add debugging for Netlify environment
console.log("Netlify function environment:", {
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL,
  DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET"
});

// Create server instance
let app: any = null;

const getApp = async () => {
  if (!app) {
    app = await createServer();
  }
  return app;
};

export const handler = async (event: any, context: any) => {
  const serverApp = await getApp();
  const serverlessHandler = serverless(serverApp);
  return serverlessHandler(event, context);
};
