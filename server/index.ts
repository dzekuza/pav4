import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { handleDemo } from "./routes/demo";
import n8nScrapeRouter from "./routes/n8n-scrape";
import favoritesRouter from "./routes/favorites";
import affiliateRouter from "./routes/affiliate";
import salesRouter from "./routes/sales";
import { saveSearchHistory, getSearchHistory } from "./routes/search-history";
import {
  register,
  login,
  logout,
  getCurrentUser,
  addToSearchHistory,
  getUserSearchHistory,
  getAllUsers,
} from "./routes/auth";
import { requireAuth, requireAdmin, optionalAuth, clearRLSContext } from "./middleware/auth";
import { requireAdminAuth } from "./middleware/admin-auth";
import { healthCheckHandler } from "./routes/health";
import { getLocationHandler } from "./services/location";
import { gracefulShutdown, checkDatabaseConnection, businessService } from "./services/database";
import {
  registerBusiness,
  getAllBusinesses,
  getActiveBusinesses,
  getBusinessByDomain,
  updateBusiness,
  deleteBusiness,
  verifyBusiness,
  getBusinessStats,
  updateBusinessCommission,
  getBusinessDetailedStats,
  updateBusinessPassword,
  getBusinessClicks,
  getBusinessConversions,
} from "./routes/business";
import {
  registerBusiness as registerBusinessAuth,
  loginBusiness,
  getCurrentBusiness,
  logoutBusiness,
  getBusinessStats as getBusinessAuthStats,
  verifyBusinessTracking,
} from "./routes/business-auth";
import {
  authRateLimit,
  apiRateLimit,
  businessRateLimit,
  validateRegistration,
  validateBusinessRegistration,
  validateLogin,
  handleValidationErrors,
  cache,
  securityHeaders,
  requestLogger,
  sanitizeInput,
  validateUrl,
} from "./middleware/security";
import { requireBusinessAuth } from "./middleware/business-auth";
import redirectRouter from "./routes/redirect";
import trackSaleRouter from "./routes/track-sale";
import trackProductVisitRouter from "./routes/track-product-visit";
import { trackEvent, getTrackingEvents } from "./routes/track-event";

// Load environment variables
dotenv.config();

// Environment variables
console.log("Environment variables loaded:");
console.log("NODE_ENV:", process.env.NODE_ENV);

export async function createServer() {
  // Check database connection on startup
  const dbStatus = await checkDatabaseConnection();
  console.log('Database status:', dbStatus.status, dbStatus.message);

  const app = express();

  // Trust Netlify/Heroku/Cloud proxy for correct req.ip and rate limiting
  app.set('trust proxy', 1);

  // Security middleware
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
          "https://pavlo4.netlify.app",
          "http://localhost:5746",
          "http://localhost:5747",
          "http://localhost:8082",
          "http://localhost:8083",
          "ws://localhost:5746",
          "ws://localhost:5747",
          "ws://localhost:8082",
          "ws://localhost:8083"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://rsms.me"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Compression middleware
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
  }));

  // CORS configuration
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:8083",
    "http://localhost:8084",
    "https://pavlo4.netlify.app",
    "https://app.pavlo.com", // Assuming this is your custom domain
    "http://127.0.0.1:8083",
    "http://[::1]:8083"
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
        callback(null, true);
      } else {
        console.error(`CORS error: Origin ${origin} not allowed`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
  };

  app.use(cors(corsOptions));

  // Additional middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(sanitizeInput);
  app.use(clearRLSContext); // Clear RLS context after each request

  // Public API routes with caching
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", cache(300), handleDemo); // Cache for 5 minutes
  app.get("/api/location", cache(600), getLocationHandler); // Cache for 10 minutes
  app.post("/api/location", getLocationHandler);
  app.get("/api/supported-countries", cache(3600), (req, res) => { // Cache for 1 hour
    const { getSupportedCountries } = require("./services/location");
    const countries = getSupportedCountries();
    res.json({ countries });
  });

  // Authentication routes without rate limiting
  app.post("/api/auth/register",
    validateRegistration,
    handleValidationErrors,
    register
  );
  app.post("/api/auth/login",
    validateLogin,
    handleValidationErrors,
    login
  );
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getCurrentUser);

  // TestSprite compatibility routes (redirects)
  app.post("/api/register", register);
  app.post("/api/login", login);
  app.post("/api/logout", logout);
  app.get("/api/user/me", getCurrentUser);

  // Protected routes - require authentication
  app.post("/api/search-history", requireAuth, addToSearchHistory);
  app.get("/api/search-history", requireAuth, getUserSearchHistory);

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, getAllUsers);

  // Affiliate routes
  app.use("/api/affiliate", affiliateRouter);
  app.use("/api/sales", salesRouter);

  // Business authentication routes without rate limiting
  app.post("/api/business/auth/register",
    validateBusinessRegistration,
    handleValidationErrors,
    registerBusinessAuth
  );
  app.post("/api/business/auth/login",
    validateLogin,
    handleValidationErrors,
    loginBusiness
  );
  app.get("/api/business/auth/me", getCurrentBusiness);
  app.post("/api/business/auth/logout", logoutBusiness);
  app.get("/api/business/auth/stats", getBusinessAuthStats);
  app.post("/api/business/verify-tracking", verifyBusinessTracking);

  // Tracking routes (moved before global middleware to prevent conflicts)
  app.post("/api/track-event", trackEvent);
  app.get("/api/tracking-events", getTrackingEvents);

  // Test tracking route
  app.post("/api/test-tracking", async (req, res) => {
    try {
      console.log('Test tracking route called');
      const { prisma } = await import("./services/database");
      
      const testEvent = await prisma.trackingEvent.create({
        data: {
          eventType: 'test',
          businessId: 1,
          affiliateId: 'test-affiliate-123',
          platform: 'test',
          sessionId: 'test-session',
          userAgent: 'test-agent',
          referrer: 'test-referrer',
          timestamp: new Date(),
          url: 'test-url',
          eventData: { test: true },
          ipAddress: '127.0.0.1'
        }
      });
      
      res.json({
        success: true,
        message: "Test tracking event created",
        event_id: testEvent.id
      });
    } catch (error) {
      console.error("Test tracking error:", error);
      res.status(500).json({
        success: false,
        error: "Test tracking failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Business routes with caching and validation
  app.post("/api/business/register", registerBusiness);
  app.get("/api/business/active", cache(300), getActiveBusinesses); // Cache for 5 minutes
  app.get("/api/business/domain/:domain", cache(600), getBusinessByDomain); // Cache for 10 minutes

  // Admin business routes
  app.get("/api/admin/business", requireAuth, requireAdmin, getAllBusinesses);
  app.get("/api/admin/business/stats", requireAuth, requireAdmin, getBusinessStats);
  app.get("/api/admin/business/:id/stats", requireAuth, requireAdmin, getBusinessDetailedStats);
  app.put("/api/admin/business/:id", requireAuth, requireAdmin, updateBusiness);
  app.put("/api/admin/business/:id/commission", requireAuth, requireAdmin, updateBusinessCommission);
  app.put("/api/admin/business/:id/password", requireAuth, requireAdmin, updateBusinessPassword);
  app.delete("/api/admin/business/:id", requireAuth, requireAdmin, deleteBusiness);
  app.post("/api/admin/business/:id/verify", requireAuth, requireAdmin, verifyBusiness);

  // Favorites routes
  app.use("/api/favorites", favoritesRouter);

  // TestSprite compatibility routes
  app.post("/api/user/search-history", requireAuth, addToSearchHistory);
  app.get("/api/user/search-history", requireAuth, getUserSearchHistory);

  // Legacy search history (for backward compatibility)
  app.post("/api/legacy/search-history", saveSearchHistory);
  app.get("/api/legacy/search-history", getSearchHistory);

  // Public search routes without rate limiting
  app.post("/api/scrape",
    validateUrl,
    (req, res) => {
      req.url = '/n8n-scrape';
      n8nScrapeRouter(req, res, () => { });
    }
  );
  app.use("/api",
    validateUrl,
    n8nScrapeRouter
  ); // N8N scraping routes (public)

  // TestSprite compatibility routes with rate limiting and validation
  app.post("/api/scrape-product",
    validateUrl,
    (req, res) => {
      req.url = '/n8n-scrape';
      n8nScrapeRouter(req, res, () => { });
    }
  );
  app.post("/api/n8n-webhook-scrape",
    validateUrl,
    (req, res) => {
      req.url = '/n8n-scrape';
      n8nScrapeRouter(req, res, () => { });
    }
  );
  app.get("/api/location-info", getLocationHandler);

  // Health check route
  app.get("/api/health", healthCheckHandler);

  // Test tracking page
  app.get("/test-tracking.html", (req, res) => {
    res.sendFile('public/test-tracking.html', { root: process.cwd() });
  });

  // Affiliate/product redirect route for tracking
  app.get('/go/:affiliateId/:productId', async (req, res) => {
    const { affiliateId, productId } = req.params;
    // Look up the real product URL
    const productUrl = await businessService.getProductUrlByAffiliateAndProductId(affiliateId, productId);
    if (!productUrl) {
      return res.status(404).send('Product not found');
    }
    // Log the click
    await businessService.logClick({
      affiliateId,
      productId,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      ip: req.ip,
    });
    // Build redirect URL with UTM parameters and a unique token
    const utmParams = new URLSearchParams({
      utm_source: 'pavlo4',
      utm_medium: 'affiliate',
      utm_campaign: 'product_suggestion',
      aff_token: Math.random().toString(36).slice(2, 12),
    });
    const redirectUrl = productUrl + (productUrl.includes('?') ? '&' : '?') + utmParams.toString();
    return res.redirect(302, redirectUrl);
  });

  // Admin: Get suggestion filter state
  app.get("/api/admin/settings/suggestion-filter", requireAuth, requireAdmin, async (req, res) => {
    try {
      const enabled = await businessService.getSuggestionFilterEnabled();
      res.json({ enabled });
    } catch (err) {
      res.status(500).json({ error: "Failed to get suggestion filter state" });
    }
  });

  // Admin: Set suggestion filter state
  app.post("/api/admin/settings/suggestion-filter", requireAuth, requireAdmin, express.json(), async (req, res) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "'enabled' must be a boolean" });
      }
      await businessService.setSuggestionFilterEnabled(enabled);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to set suggestion filter state" });
    }
  });

  // Business: Get user activity (click logs)
  app.get("/api/business/activity", requireBusinessAuth, async (req, res) => {
    try {
      const businessId = (req as any).business?.id;
      if (!businessId) return res.status(401).json({ error: "Not authenticated as business" });
      const logs = await businessService.getBusinessClickLogs(businessId);
      res.json({ logs });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch business activity logs" });
    }
  });

  // Business: Get clicks activity
  app.get("/api/business/activity/clicks", getBusinessClicks);

  // Business: Get conversions activity
  app.get("/api/business/activity/conversions", getBusinessConversions);

  // Redirect routes
  app.use("/api", redirectRouter);
  app.use("/api", trackSaleRouter);
  app.use("/api", trackProductVisitRouter);

  // Graceful shutdown handler
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully");
    await gracefulShutdown();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully");
    await gracefulShutdown();
    process.exit(0);
  });

  return app;
}
