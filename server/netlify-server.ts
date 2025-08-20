// Ensure DATABASE_URL is set for Netlify deployment
if (process.env.NETLIFY_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.NETLIFY_DATABASE_URL;
}

// Import the server factory
import { createServer } from "./index";

// Create and export the Express app instance as default
const app = createServer();

export default app;
