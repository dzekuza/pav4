// Ensure DATABASE_URL is set for Netlify deployment
if (process.env.NETLIFY_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.NETLIFY_DATABASE_URL;
}

// Export the createServer function for use in serverless functions
export { createServer } from "./index";
