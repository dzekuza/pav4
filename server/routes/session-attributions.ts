import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireBusinessAuth } from "../middleware/business-auth";

const router = express.Router();
const prisma = new PrismaClient();

// Get session attributions for a business
router.get("/session-attributions", requireBusinessAuth, async (req, res) => {
  try {
    const businessId = parseInt(req.query.business_id as string);
    const dateRange = req.query.date_range as string || "7d";
    
    // Verify the business belongs to the authenticated user
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        neonUserId: (req as any).business?.neonUserId,
      },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found or access denied",
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get session attributions
    const attributions = await prisma.sessionAttribution.findMany({
      where: {
        businessId: businessId,
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Get tracking events for session count
    const trackingEvents = await prisma.trackingEvent.findMany({
      where: {
        businessId: businessId,
        timestamp: {
          gte: startDate,
          lte: now,
        },
        eventType: {
          in: ["page_view", "product_view", "add_to_cart"],
        },
      },
      select: {
        sessionId: true,
      },
    });

    // Calculate statistics
    const uniqueSessions = new Set(trackingEvents.map(event => event.sessionId)).size;
    const totalOrders = attributions.length;
    const totalRevenue = attributions.reduce((sum, attr) => sum + attr.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const conversionRate = uniqueSessions > 0 ? (totalOrders / uniqueSessions) * 100 : 0;

    const stats = {
      totalSessions: uniqueSessions,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      conversionRate,
    };

    res.json({
      success: true,
      attributions,
      stats,
    });
  } catch (error) {
    console.error("Error fetching session attributions:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Get attribution summary by UTM parameters
router.get("/session-attributions/summary", requireBusinessAuth, async (req, res) => {
  try {
    const businessId = parseInt(req.query.business_id as string);
    const dateRange = req.query.date_range as string || "7d";
    
    // Verify the business belongs to the authenticated user
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        neonUserId: (req as any).business?.neonUserId,
      },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found or access denied",
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get attribution summary by UTM source
    const sourceSummary = await prisma.sessionAttribution.groupBy({
      by: ["utmSource"],
      where: {
        businessId: businessId,
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get attribution summary by UTM medium
    const mediumSummary = await prisma.sessionAttribution.groupBy({
      by: ["utmMedium"],
      where: {
        businessId: businessId,
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get attribution summary by UTM campaign
    const campaignSummary = await prisma.sessionAttribution.groupBy({
      by: ["utmCampaign"],
      where: {
        businessId: businessId,
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get daily revenue data
    const dailyRevenue = await prisma.sessionAttribution.groupBy({
      by: ["timestamp"],
      where: {
        businessId: businessId,
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    res.json({
      success: true,
      summary: {
        bySource: sourceSummary.map(item => ({
          source: item.utmSource || "Direct",
          orders: item._count.id,
          revenue: item._sum.totalAmount || 0,
        })),
        byMedium: mediumSummary.map(item => ({
          medium: item.utmMedium || "Direct",
          orders: item._count.id,
          revenue: item._sum.totalAmount || 0,
        })),
        byCampaign: campaignSummary.map(item => ({
          campaign: item.utmCampaign || "Direct",
          orders: item._count.id,
          revenue: item._sum.totalAmount || 0,
        })),
        dailyRevenue: dailyRevenue.map(item => ({
          date: item.timestamp.toISOString().split('T')[0],
          revenue: item._sum.totalAmount || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching attribution summary:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
