import serverless from 'serverless-http'
import { createServer } from './index'

// Ensure DATABASE_URL is set for Netlify deployment
if (process.env.NETLIFY_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.NETLIFY_DATABASE_URL
}

let cached: any = null

export const handler = async (event: any, context: any) => {
  if (!cached) {
    cached = createServer()
  }
  const app = await cached
  const sls = serverless(app)
  return sls(event, context)
} 