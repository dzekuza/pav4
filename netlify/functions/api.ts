import serverless from "serverless-http";
import { createServer } from "./dist/netlify-server.mjs";

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
    try {
      console.log("Creating server instance...");
      app = await createServer();
      console.log("Server instance created successfully");
    } catch (error) {
      console.error("Error creating server instance:", error);
      throw error;
    }
  }
  return app;
};

export const handler = async (event: any, context: any) => {
  try {
    console.log("Handler called with event:", {
      path: event.path,
      httpMethod: event.httpMethod,
      headers: event.headers
    });

    const serverApp = await getApp();
    const serverlessHandler = serverless(serverApp);
    const result = await serverlessHandler(event, context);

    console.log("Handler completed successfully");
    return result;
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      })
    };
  }
};
