import serverless from 'serverless-http'
import type { Handler } from '@netlify/functions'
import { createServer } from './index'

let cached: any = null

export const handler: Handler = async (event, context) => {
  if (!cached) {
    cached = createServer()
  }
  const app = await cached
  const sls = serverless(app)
  return sls(event as any, context as any)
} 