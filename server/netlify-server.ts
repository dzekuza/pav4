// Ensure DATABASE_URL is set for Netlify deployment
if (process.env.NETLIFY_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.NETLIFY_DATABASE_URL
}

// Re-export server factory for Netlify function entry at netlify/functions/server.ts
export { createServer } from './index'