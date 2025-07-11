import { RequestHandler } from "express";
import { healthCheck } from "../services/database";

// Basic health check
export const healthCheckHandler: RequestHandler = async (req, res) => {
  try {
    const dbHealth = await healthCheck.checkConnection();
    const stats = await healthCheck.getStats();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbHealth,
      stats: stats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
