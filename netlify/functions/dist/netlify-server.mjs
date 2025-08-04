import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import { PrismaClient } from "@prisma/client";
dotenv.config();
const createPrismaClient = () => {
  console.log("Creating Prisma client with DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    return null;
  }
  return new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};
const prisma = globalThis.__prisma || createPrismaClient();
async function testDatabaseConnection() {
  try {
    if (!prisma) {
      console.error("Prisma client not initialized - DATABASE_URL missing");
      return false;
    }
    await prisma.$connect();
    console.log("Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
async function createServer() {
  console.log("Testing database connection...");
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error("Failed to connect to database on startup");
  } else {
    console.log("Database connection successful on startup");
  }
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://rsms.me"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.searchapi.io",
          "https://n8n.srv824584.hstgr.cloud",
          "https://pavlo4.netlify.app"
        ]
      }
    }
  }));
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());
  app.use(compression());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/track-event", async (req, res) => {
    try {
      const {
        event_type,
        business_id,
        affiliate_id,
        platform,
        session_id,
        user_agent,
        referrer,
        timestamp,
        url,
        data
      } = req.body;
      console.log("Track event request:", { event_type, business_id, affiliate_id, platform });
      if (!event_type || !business_id || !affiliate_id) {
        console.log("Missing required fields:", { event_type, business_id, affiliate_id });
        return res.status(400).json({
          success: false,
          error: "Missing required fields: event_type, business_id, affiliate_id"
        });
      }
      console.log("Testing database connection...");
      const dbConnected2 = await testDatabaseConnection();
      if (dbConnected2) {
        try {
          console.log("Creating tracking event in database...");
          const trackingEvent = await prisma.trackingEvent.create({
            data: {
              eventType: event_type,
              businessId: parseInt(business_id),
              affiliateId: affiliate_id,
              platform: platform || "universal",
              sessionId: session_id,
              userAgent: user_agent,
              referrer,
              timestamp: new Date(timestamp),
              url,
              eventData: data || {},
              ipAddress: req.ip || req.connection.remoteAddress || "unknown"
            }
          });
          console.log("Tracking event created:", trackingEvent.id);
          res.json({
            success: true,
            message: "Event tracked successfully",
            event_id: trackingEvent.id
          });
        } catch (dbError) {
          console.error("Database operation failed:", dbError);
          res.json({
            success: true,
            message: "Event tracked successfully (logged only)",
            event_id: Date.now(),
            note: "Database operation failed, but event was logged"
          });
        }
      } else {
        console.log("Event received (no database):", {
          event_type,
          business_id,
          affiliate_id,
          platform,
          session_id,
          user_agent,
          referrer,
          timestamp,
          url,
          data
        });
        res.json({
          success: true,
          message: "Event tracked successfully (logged only)",
          event_id: Date.now(),
          note: "Database not available - check DATABASE_URL environment variable"
        });
      }
    } catch (error) {
      console.error("Error tracking event:", error);
      res.status(500).json({
        success: false,
        error: "Failed to track event",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  return app;
}
export {
  createServer,
  prisma
};
//# sourceMappingURL=netlify-server.mjs.map
