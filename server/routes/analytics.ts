import { RequestHandler } from "express";

// Simple in-memory analytics storage (in production, use a database)
interface ClickEvent {
  id: string;
  timestamp: number;
  userId: string;
  requestId: string;
  productUrl: string;
  store: string;
  price: number;
  currency: string;
  userAgent: string;
  referer: string;
  ip: string;
}

interface PurchaseEvent {
  id: string;
  timestamp: number;
  userId: string;
  requestId: string;
  clickId: string;
  productUrl: string;
  store: string;
  purchaseAmount: number;
  currency: string;
  confirmed: boolean;
}

const clickEvents: ClickEvent[] = [];
const purchaseEvents: PurchaseEvent[] = [];

// Generate unique tracking ID
function generateTrackingId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Track product link clicks
export const trackClick: RequestHandler = async (req, res) => {
  try {
    const { requestId, productUrl, store, price, currency, userId } = req.body;

    if (!requestId || !productUrl || !store) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const clickId = generateTrackingId();
    const userAgent = req.headers["user-agent"] || "";
    const referer = req.headers.referer || "";
    const ip = req.ip || req.connection.remoteAddress || "";

    const clickEvent: ClickEvent = {
      id: clickId,
      timestamp: Date.now(),
      userId: userId || `anon_${ip.replace(/[.:]/g, "_")}`,
      requestId,
      productUrl,
      store,
      price: parseFloat(price) || 0,
      currency: currency || "USD",
      userAgent,
      referer,
      ip,
    };

    clickEvents.push(clickEvent);

    // Return tracking URL with embedded tracking ID
    const trackingUrl = addTrackingToUrl(productUrl, clickId, requestId);

    console.log(`Click tracked: ${clickId} for ${store} - ${productUrl}`);

    res.json({
      success: true,
      clickId,
      trackingUrl,
      message: "Click tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({ error: "Failed to track click" });
  }
};

// Track purchases (called from tracking pixels or webhooks)
export const trackPurchase: RequestHandler = async (req, res) => {
  try {
    const { clickId, purchaseAmount, currency, confirmed = false } = req.body;

    if (!clickId) {
      return res.status(400).json({ error: "Missing clickId" });
    }

    // Find the original click event
    const originalClick = clickEvents.find((c) => c.id === clickId);
    if (!originalClick) {
      return res.status(404).json({ error: "Click event not found" });
    }

    const purchaseId = generateTrackingId();

    const purchaseEvent: PurchaseEvent = {
      id: purchaseId,
      timestamp: Date.now(),
      userId: originalClick.userId,
      requestId: originalClick.requestId,
      clickId,
      productUrl: originalClick.productUrl,
      store: originalClick.store,
      purchaseAmount: parseFloat(purchaseAmount) || originalClick.price,
      currency: currency || originalClick.currency,
      confirmed,
    };

    purchaseEvents.push(purchaseEvent);

    console.log(
      `Purchase tracked: ${purchaseId} for ${originalClick.store} - $${purchaseAmount}`,
    );

    res.json({
      success: true,
      purchaseId,
      message: "Purchase tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking purchase:", error);
    res.status(500).json({ error: "Failed to track purchase" });
  }
};

// Get analytics data for admin dashboard
export const getAnalytics: RequestHandler = async (req, res) => {
  try {
    const { timeframe = "7d" } = req.query;

    const now = Date.now();
    const timeframes = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const timeframeDuration =
      timeframes[timeframe as keyof typeof timeframes] || timeframes["7d"];
    const startTime = now - timeframeDuration;

    // Filter events by timeframe
    const recentClicks = clickEvents.filter((c) => c.timestamp >= startTime);
    const recentPurchases = purchaseEvents.filter(
      (p) => p.timestamp >= startTime,
    );

    // Calculate metrics
    const totalClicks = recentClicks.length;
    const totalPurchases = recentPurchases.length;
    const conversionRate =
      totalClicks > 0 ? ((totalPurchases / totalClicks) * 100).toFixed(2) : 0;
    const totalRevenue = recentPurchases.reduce(
      (sum, p) => sum + p.purchaseAmount,
      0,
    );

    // Top stores by clicks
    const storeClicks = recentClicks.reduce(
      (acc, click) => {
        acc[click.store] = (acc[click.store] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Top stores by revenue
    const storeRevenue = recentPurchases.reduce(
      (acc, purchase) => {
        acc[purchase.store] =
          (acc[purchase.store] || 0) + purchase.purchaseAmount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Recent activity
    const recentActivity = [
      ...recentClicks.map((c) => ({ ...c, type: "click" })),
      ...recentPurchases.map((p) => ({ ...p, type: "purchase" })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    res.json({
      summary: {
        totalClicks,
        totalPurchases,
        conversionRate: `${conversionRate}%`,
        totalRevenue: totalRevenue.toFixed(2),
        timeframe,
      },
      storeClicks,
      storeRevenue,
      recentActivity,
      charts: {
        clicksByDay: getClicksByDay(recentClicks),
        purchasesByDay: getPurchasesByDay(recentPurchases),
      },
    });
  } catch (error) {
    console.error("Error getting analytics:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
};

// Helper function to add tracking parameters to product URLs
function addTrackingToUrl(
  originalUrl: string,
  clickId: string,
  requestId: string,
): string {
  try {
    const url = new URL(originalUrl);
    url.searchParams.set("ph_click", clickId);
    url.searchParams.set("ph_request", requestId);
    url.searchParams.set("ph_source", "pricehunt");
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original URL
    console.error("Failed to add tracking to URL:", error);
    return originalUrl;
  }
}

// Helper function to group clicks by day
function getClicksByDay(clicks: ClickEvent[]) {
  const groups = clicks.reduce(
    (acc, click) => {
      const day = new Date(click.timestamp).toDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(groups)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Helper function to group purchases by day
function getPurchasesByDay(purchases: PurchaseEvent[]) {
  const groups = purchases.reduce(
    (acc, purchase) => {
      const day = new Date(purchase.timestamp).toDateString();
      acc[day] = (acc[day] || 0) + purchase.purchaseAmount;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(groups)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
