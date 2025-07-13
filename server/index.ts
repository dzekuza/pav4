import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import { handleScrape } from "./routes/scrape";
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
  app.post("/api/scrape", optionalAuth, handleScrape);
  app.get("/api/location", getLocationHandler);

  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getCurrentUser);

  // Protected routes - require authentication
  app.post("/api/search-history", requireAuth, addToSearchHistory);
  app.get("/api/search-history", requireAuth, getUserSearchHistory);

  // Legacy search history (for backward compatibility)
  app.post("/api/legacy/search-history", saveSearchHistory);
  app.get("/api/legacy/search-history", getSearchHistory);

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, getAllUsers);

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
