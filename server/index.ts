import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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
import { healthCheckHandler } from "./routes/health";
import { getLocationHandler } from "./services/location";
import { gracefulShutdown } from "./services/database";

// Load environment variables
dotenv.config();

// Environment variables
console.log("Environment variables loaded:");
console.log("NODE_ENV:", process.env.NODE_ENV);

export function createServer() {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || "http://localhost:8080"
          : "http://localhost:8080",
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Public API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/scrape", requireAuth, (req, res) => {
    // Redirect to the n8n webhook scraping endpoint
    req.url = '/n8n-scrape';
    n8nScrapeRouter(req, res, () => {});
  });
  app.use("/api", n8nScrapeRouter); // N8N scraping routes
  app.get("/api/location", getLocationHandler);
  app.post("/api/location", getLocationHandler);
  app.get("/api/supported-countries", (req, res) => {
    const { getSupportedCountries } = require("./services/location");
    const countries = getSupportedCountries();
    res.json({ countries });
  });

  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
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
  
  // Favorites routes
  app.use("/api/favorites", favoritesRouter);
  
  // TestSprite compatibility routes
  app.post("/api/user/search-history", requireAuth, addToSearchHistory);
  app.get("/api/user/search-history", requireAuth, getUserSearchHistory);

  // Legacy search history (for backward compatibility)
  app.post("/api/legacy/search-history", saveSearchHistory);
  app.get("/api/legacy/search-history", getSearchHistory);

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, getAllUsers);
  
  // TestSprite compatibility routes
  app.post("/api/scrape-product", requireAuth, (req, res) => {
    // Redirect to the n8n webhook scraping endpoint
    req.url = '/n8n-scrape';
    n8nScrapeRouter(req, res, () => {});
  });
  app.post("/api/n8n-webhook-scrape", requireAuth, (req, res) => {
    // Redirect to the n8n webhook scraping endpoint
    req.url = '/n8n-scrape';
    n8nScrapeRouter(req, res, () => {});
  });
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
