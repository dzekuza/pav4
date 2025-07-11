import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleScrape } from "./routes/scrape";
import { saveSearchHistory, getSearchHistory } from "./routes/search-history";

// Load environment variables
dotenv.config();

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/scrape", handleScrape);
  app.post("/api/search-history", saveSearchHistory);
  app.get("/api/search-history", getSearchHistory);

  return app;
}
