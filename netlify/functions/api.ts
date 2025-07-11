import serverless from "serverless-http";
import { createServer } from "../../server";

const app = createServer();

// Export the serverless handler
export const handler = serverless(app);
