import serverless from "serverless-http";
import type { Handler, HandlerResponse } from "@netlify/functions";
import type { Express } from "express";
import { createServer } from "../../server/netlify-server";

let cached: Express | null = null;

export const handler: Handler = async (event, context) => {
  if (!cached) {
    cached = await createServer();
  }
  const sls = serverless(cached);
  return sls(
    event as any,
    context as any,
  ) as unknown as Promise<HandlerResponse>;
};
