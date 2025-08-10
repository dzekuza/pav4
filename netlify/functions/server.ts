import serverless from 'serverless-http'
import type { Handler } from '@netlify/functions'
import { createServer } from '../../server/netlify-server'

let cached: ReturnType<typeof createServer> | null = null

export const handler: Handler = async (event, context) => {
  if (!cached) {
    cached = await createServer()
  }
  const app = await cached
  const sls = serverless(app)
  return sls(event as any, context as any)
}


