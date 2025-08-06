import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { neon } from "@netlify/neon";
dotenv.config();
const sql = neon();
async function testDatabaseConnection() {
  try {
    console.log("Testing database connection with Neon...");
    const result = await sql`SELECT 1 as test`;
    console.log("Database connection successful:", result);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
function generateBusinessToken(businessId, email) {
  return jwt.sign(
    { businessId, email, type: "business" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function verifyBusinessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
const businessService = {
  async findBusinessByEmail(email) {
    try {
      const result = await sql`
                SELECT * FROM business 
                WHERE email = ${email}
            `;
      return result[0] || null;
    } catch (error) {
      console.error("Error finding business by email:", error);
      return null;
    }
  },
  async findBusinessById(id) {
    try {
      const result = await sql`
                SELECT * FROM business 
                WHERE id = ${id}
            `;
      return result[0] || null;
    } catch (error) {
      console.error("Error finding business by id:", error);
      return null;
    }
  },
  async createBusiness(data) {
    try {
      const result = await sql`
                INSERT INTO business (name, domain, website, email, password, affiliate_id, is_active, created_at, updated_at)
                VALUES (${data.name}, ${data.domain}, ${data.website}, ${data.email}, ${data.password}, ${data.affiliateId}, true, NOW(), NOW())
                RETURNING *
            `;
      return result[0] || null;
    } catch (error) {
      console.error("Error creating business:", error);
      return null;
    }
  },
  async getBusinessStatistics(businessId) {
    try {
      console.log("Getting business statistics for businessId:", businessId);
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        console.log("Database connection failed, cannot get business statistics");
        return null;
      }
      const businessResult = await sql`
                SELECT id, name, domain, total_visits, total_purchases, total_revenue, commission, admin_commission_rate, affiliate_id, tracking_verified
                FROM business 
                WHERE id = ${businessId}
            `;
      const business = businessResult[0];
      console.log("Business found:", business);
      if (!business) {
        console.log("Business not found for ID:", businessId);
        return null;
      }
      const [clicks, conversions] = await Promise.all([
        sql`
                    SELECT * FROM business_click 
                    WHERE business_id = ${businessId}
                    ORDER BY timestamp DESC 
                    LIMIT 10
                `,
        sql`
                    SELECT * FROM business_conversion 
                    WHERE business_id = ${businessId}
                    ORDER BY timestamp DESC 
                    LIMIT 10
                `
      ]);
      console.log("Recent clicks count:", clicks.length);
      console.log("Recent conversions count:", conversions.length);
      const averageOrderValue = business.total_purchases > 0 ? business.total_revenue / business.total_purchases : 0;
      const conversionRate = business.total_visits > 0 ? business.total_purchases / business.total_visits * 100 : 0;
      const projectedFee = business.total_revenue * (business.admin_commission_rate / 100);
      const result = {
        id: business.id,
        name: business.name,
        domain: business.domain,
        totalVisits: business.total_visits,
        totalPurchases: business.total_purchases,
        totalRevenue: business.total_revenue,
        commission: business.commission,
        adminCommissionRate: business.admin_commission_rate,
        affiliateId: business.affiliate_id,
        trackingVerified: business.tracking_verified,
        averageOrderValue,
        conversionRate,
        projectedFee,
        recentClicks: clicks,
        recentConversions: conversions
      };
      console.log("Returning business statistics:", result);
      return result;
    } catch (error) {
      console.error("Error getting business statistics:", error);
      return null;
    }
  }
};
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
  app.get("/api/debug/env", (req, res) => {
    res.json({
      NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? "SET" : "NOT SET",
      JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
      NODE_ENV: "production",
      FRONTEND_URL: process.env.FRONTEND_URL
    });
  });
  app.get("/api/debug/db", async (req, res) => {
    try {
      console.log("Testing database connection from debug endpoint...");
      const dbConnected2 = await testDatabaseConnection();
      if (dbConnected2) {
        const businessResult = await sql`
                    SELECT id, name, email, domain 
                    FROM business 
                    WHERE id = 3
                `;
        const business = businessResult[0];
        res.json({
          success: true,
          databaseConnected: true,
          businessFound: !!business,
          business
        });
      } else {
        res.json({
          success: false,
          databaseConnected: false,
          error: "Database connection failed"
        });
      }
    } catch (error) {
      console.error("Database test error:", error);
      res.json({
        success: false,
        databaseConnected: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app.get("/api/location", (req, res) => {
    res.json({
      success: true,
      location: {
        country: "LT",
        city: "Vilnius"
      }
    });
  });
  app.get("/api/auth/me", (req, res) => {
    res.json({
      success: false,
      message: "Not authenticated"
    });
  });
  app.get("/api/business/auth/me", async (req, res) => {
    try {
      let token = req.cookies.business_token;
      if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }
      if (!token) {
        return res.json({
          business: null,
          authenticated: false
        });
      }
      const decoded = verifyBusinessToken(token);
      if (!decoded || decoded.type !== "business") {
        return res.json({
          business: null,
          authenticated: false
        });
      }
      const business = await businessService.findBusinessById(decoded.businessId);
      if (!business) {
        return res.json({
          business: null,
          authenticated: false
        });
      }
      res.json({
        business: {
          id: business.id,
          name: business.name,
          domain: business.domain,
          email: business.email,
          affiliateId: business.affiliate_id,
          trackingVerified: business.tracking_verified
        },
        authenticated: true
      });
    } catch (error) {
      console.error("Error getting current business:", error);
      res.json({
        business: null,
        authenticated: false
      });
    }
  });
  app.post("/api/business/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email and password are required"
        });
      }
      const business = await businessService.findBusinessByEmail(email);
      if (!business) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password"
        });
      }
      if (!business.is_active) {
        return res.status(401).json({
          success: false,
          error: "Business account is deactivated"
        });
      }
      const isPasswordValid = await bcrypt.compare(password, business.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password"
        });
      }
      const token = generateBusinessToken(business.id, business.email);
      res.cookie("business_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.json({
        success: true,
        business: {
          id: business.id,
          name: business.name,
          domain: business.domain,
          email: business.email
        },
        message: "Business login successful"
      });
    } catch (error) {
      console.error("Error logging in business:", error);
      res.status(500).json({ success: false, error: "Failed to login" });
    }
  });
  app.post("/api/business/auth/logout", (req, res) => {
    res.clearCookie("business_token");
    res.json({ success: true, message: "Business logged out successfully" });
  });
  app.get("/api/business/auth/stats", async (req, res) => {
    try {
      console.log("Stats endpoint called");
      let token = req.cookies.business_token;
      if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }
      console.log("Token found:", !!token);
      if (!token) {
        console.log("No token found");
        return res.status(401).json({
          success: false,
          error: "Not authenticated"
        });
      }
      const decoded = verifyBusinessToken(token);
      console.log("Token decoded:", decoded);
      if (!decoded || decoded.type !== "business") {
        console.log("Invalid token:", decoded);
        return res.status(401).json({
          success: false,
          error: "Invalid token"
        });
      }
      console.log("Business ID from token:", decoded.businessId);
      const stats = await businessService.getBusinessStatistics(decoded.businessId);
      console.log("Stats result:", !!stats);
      if (!stats) {
        console.log("Business not found in getBusinessStatistics");
        return res.status(404).json({
          success: false,
          error: "Business not found"
        });
      }
      console.log("Returning successful stats response");
      res.json({ success: true, stats });
    } catch (error) {
      console.error("Error getting business stats:", error);
      res.status(500).json({ success: false, error: "Failed to get business statistics" });
    }
  });
  app.post("/api/business/register", async (req, res) => {
    try {
      const {
        name,
        domain,
        website,
        email,
        password,
        description,
        logo,
        contactEmail,
        contactPhone,
        address,
        country,
        category,
        commission
      } = req.body;
      console.log("Business registration request:", { name, domain, email });
      if (!name || !domain || !website || !email || !password) {
        return res.status(400).json({
          success: false,
          error: "Name, domain, website, email, and password are required"
        });
      }
      if (!email.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format"
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters long"
        });
      }
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return res.status(400).json({
          success: false,
          error: "Invalid domain format"
        });
      }
      const dbConnected2 = await testDatabaseConnection();
      if (!dbConnected2) {
        return res.status(500).json({
          success: false,
          error: "Database connection failed"
        });
      }
      const existingDomainResult = await sql`
                SELECT id FROM business WHERE domain = ${domain}
            `;
      if (existingDomainResult.length > 0) {
        return res.status(400).json({
          success: false,
          error: "A business with this domain already exists"
        });
      }
      const existingEmailResult = await sql`
                SELECT id FROM business WHERE email = ${email}
            `;
      if (existingEmailResult.length > 0) {
        return res.status(400).json({
          success: false,
          error: "A business with this email already exists"
        });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const affiliateId = `aff_${domain.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`;
      const result = await sql`
                INSERT INTO business (
                    name, domain, website, email, password, description, logo, 
                    contact_email, contact_phone, address, country, category, 
                    commission, affiliate_id, is_active, created_at, updated_at
                ) VALUES (
                    ${name}, ${domain}, ${website}, ${email}, ${hashedPassword}, 
                    ${description || ""}, ${logo || ""}, ${contactEmail || ""}, 
                    ${contactPhone || ""}, ${address || ""}, ${country || ""}, 
                    ${category || ""}, ${commission ? parseFloat(commission) : 0}, 
                    ${affiliateId}, true, NOW(), NOW()
                ) RETURNING id, name, domain, email, affiliate_id
            `;
      const business = result[0];
      console.log("Business created successfully:", business.id);
      res.status(201).json({
        success: true,
        business: {
          id: business.id,
          name: business.name,
          domain: business.domain,
          email: business.email,
          affiliateId: business.affiliate_id
        },
        message: "Business registered successfully. You can now log in with your email and password."
      });
    } catch (error) {
      console.error("Error registering business:", error);
      res.status(500).json({
        success: false,
        error: "Failed to register business",
        details: error instanceof Error ? error.message : String(error)
      });
    }
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
          const result = await sql`
                        INSERT INTO tracking_event (
                            event_type, business_id, affiliate_id, platform, session_id, 
                            user_agent, referrer, timestamp, url, event_data, ip_address
                        ) VALUES (
                            ${event_type}, ${parseInt(business_id)}, ${affiliate_id}, 
                            ${platform || "universal"}, ${session_id}, ${user_agent}, 
                            ${referrer}, ${new Date(timestamp)}, ${url}, ${JSON.stringify(data || {})}, 
                            ${req.ip || req.connection.remoteAddress || "unknown"}
                        ) RETURNING id
                    `;
          const trackingEvent = result[0];
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
          note: "Database not available - check NETLIFY_DATABASE_URL environment variable"
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
  createServer
};
//# sourceMappingURL=netlify-server.mjs.map
