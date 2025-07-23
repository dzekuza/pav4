import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import { handleDemo } from "./routes/demo";
import n8nScrapeRouter from "./routes/n8n-scrape";
import favoritesRouter from "./routes/favorites";
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
import { requireAuth, requireAdmin, optionalAuth } from "./middleware/auth";
import { requireAdminAuth } from "./middleware/admin-auth";
import { healthCheckHandler } from "./routes/health";
import { getLocationHandler } from "./services/location";
import { gracefulShutdown, checkDatabaseConnection } from "./services/database";
import {
  getAllAffiliateUrls,
  getAffiliateStats,
  createAffiliateUrl,
  updateAffiliateUrl,
  deleteAffiliateUrl,
  trackAffiliateClick,
  trackAffiliateConversion,
} from "./routes/affiliate";
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
} from "./routes/business";
import {
  registerBusiness as registerBusinessAuth,
  loginBusiness,
  getCurrentBusiness,
  logoutBusiness,
  getBusinessStats as getBusinessAuthStats,
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
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.searchapi.io", "https://n8n.srv824584.hstgr.cloud"],
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
    "https://pavlo4.netlify.app",
    "https://app.pavlo.com" // Assuming this is your custom domain
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

  // Authentication routes with rate limiting and validation
  app.post("/api/auth/register", 
    authRateLimit,
    validateRegistration,
    handleValidationErrors,
    register
  );
  app.post("/api/auth/login", 
    authRateLimit,
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
  app.get("/api/admin/affiliate/urls", requireAuth, requireAdmin, getAllAffiliateUrls);
  app.get("/api/admin/affiliate/stats", requireAuth, requireAdmin, getAffiliateStats);
  app.post("/api/admin/affiliate/urls", requireAuth, requireAdmin, createAffiliateUrl);
  app.put("/api/admin/affiliate/urls/:id", requireAuth, requireAdmin, updateAffiliateUrl);
  app.delete("/api/admin/affiliate/urls/:id", requireAuth, requireAdmin, deleteAffiliateUrl);
  
  // Public affiliate tracking endpoints
  app.get("/api/affiliate/click/:id", trackAffiliateClick);
  app.post("/api/affiliate/conversion", trackAffiliateConversion);
  
  // Business authentication routes with rate limiting and validation
  app.post("/api/business/auth/register", 
    businessRateLimit,
    validateBusinessRegistration,
    handleValidationErrors,
    registerBusinessAuth
  );
  app.post("/api/business/auth/login", 
    businessRateLimit,
    validateLogin,
    handleValidationErrors,
    loginBusiness
  );
  app.get("/api/business/auth/me", getCurrentBusiness);
  app.post("/api/business/auth/logout", logoutBusiness);
  app.get("/api/business/auth/stats", getBusinessAuthStats);
  
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

  // Public search routes with rate limiting and validation
  app.post("/api/scrape", 
    apiRateLimit,
    validateUrl,
    (req, res) => {
      // Redirect to the n8n webhook scraping endpoint
      req.url = '/n8n-scrape';
      n8nScrapeRouter(req, res, () => {});
    }
  );
  app.use("/api", 
    apiRateLimit,
    validateUrl,
    n8nScrapeRouter
  ); // N8N scraping routes (public)
  
  // TestSprite compatibility routes with rate limiting and validation
  app.post("/api/scrape-product", 
    apiRateLimit,
    validateUrl,
    (req, res) => {
      // Redirect to the n8n webhook scraping endpoint
      req.url = '/n8n-scrape';
      n8nScrapeRouter(req, res, () => {});
    }
  );
  app.post("/api/n8n-webhook-scrape", 
    apiRateLimit,
    validateUrl,
    (req, res) => {
      // Redirect to the n8n webhook scraping endpoint
      req.url = '/n8n-scrape';
      n8nScrapeRouter(req, res, () => {});
    }
  );
  app.get("/api/location-info", getLocationHandler);

  // Health check route
  app.get("/api/health", healthCheckHandler);

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
