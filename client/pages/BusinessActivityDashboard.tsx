import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  ShoppingCart,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  Trash2,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type:
    | "click"
    | "purchase"
    | "add_to_cart"
    | "checkout_start"
    | "checkout_complete"
    | "page_view"
    | "product_view"
    | "conversion";
  productName: string;
  productUrl: string;
  status:
    | "browsed"
    | "purchased"
    | "abandoned"
    | "added_to_cart"
    | "checkout_started"
    | "checkout_completed"
    | "viewed";
  amount?: number | string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  ip?: string;
  eventData?: any;
  platform?: string;
  sessionId?: string;
  sourceUrl?: string;
  sourceName?: string;
}

export default function BusinessActivityDashboard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "clicks" | "purchases" | "add_to_cart" | "checkout" | "page_views"
  >("all");
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    conversionRate: 0,
    totalAddToCart: 0,
    totalPageViews: 0,
    totalProductViews: 0,
    totalCheckouts: 0,
    cartToPurchaseRate: 0,
    averageOrderValue: 0,
    totalSessions: 0,
  });
  const [isClearing, setIsClearing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/business/auth/check", {
          credentials: "include",
        });
        if (response.status === 401) {
          navigate("/business/login");
          return;
        }
        fetchActivity();
      } catch (error) {
        console.error("Error checking authentication:", error);
        navigate("/business/login");
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchActivity = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Calculate date range for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      // Fetch consolidated data from the dashboard API (same as other pages)
      const dashboardResponse = await fetch(
        `/api/business/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=100&testMode=true`,
        {
          credentials: "include",
        },
      );

      if (!dashboardResponse.ok) {
        if (dashboardResponse.status === 401) {
          navigate("/business-login");
          return;
        }
        throw new Error("Failed to fetch activity data. Please try again.");
      }

      const dashboardData = await dashboardResponse.json();
      console.log("Dashboard API Response in Activity:", dashboardData);

      if (!dashboardData.success) {
        throw new Error(
          dashboardData.error || "Failed to fetch dashboard data",
        );
      }

      // Extract data from the consolidated dashboard response
      const { recentCheckouts, recentOrders } = dashboardData.data; // Fix: access data.data

      console.log("Extracted data in Activity:", {
        checkoutsCount: recentCheckouts?.length,
        ordersCount: recentOrders?.length,
      });

      // Use consolidated data for all activity
      const clicks = recentCheckouts || [];
      const conversions = recentOrders || [];
      const events = recentCheckouts || []; // Use checkouts as events

      // Create consolidated stats from the data
      const totalCheckouts = recentCheckouts?.length || 0;
      const totalOrders = recentOrders?.length || 0;
      const totalRevenue =
        recentOrders?.reduce((sum: number, order: any) => {
          const price = parseFloat(order.totalPrice || "0");
          return sum + (isNaN(price) ? 0 : price);
        }, 0) || 0;
      const conversionRate =
        totalCheckouts > 0 ? (totalOrders / totalCheckouts) * 100 : 0;
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const realTimeStats = {
        totalVisits: totalCheckouts,
        totalPurchases: totalOrders,
        totalRevenue: totalRevenue,
        conversionRate: conversionRate,
        averageOrderValue: averageOrderValue,
        projectedFee: totalRevenue * 0.05,
        totalClicks: totalCheckouts,
        totalConversions: totalOrders,
        totalAddToCart: 0,
        totalPageViews: 1,
        totalProductViews: 0,
        totalSessions: 1,
        cartToPurchaseRate: 0,
        totalCheckouts: totalCheckouts, // Add this property
      };

      // Combine and format the data using consolidated structure
      const combinedActivities: ActivityItem[] = [
        // Checkouts (from consolidated data)
        ...clicks.map((checkout: any) => ({
          id: `checkout-${checkout.id}`,
          type: "checkout_start" as const,
          productName: checkout.name || checkout.email || "Checkout",
          productUrl: checkout.sourceUrl || "Shopify Checkout",
          status: "checkout_started" as const,
          amount: parseFloat(checkout.totalPrice) || 0,
          timestamp: checkout.createdAt,
          userAgent: checkout.userAgent,
          referrer: checkout.sourceUrl,
          ip: checkout.ipAddress,
          sourceUrl: checkout.sourceUrl,
          sourceName: checkout.sourceName,
        })),
        // Orders (from consolidated data)
        ...conversions.map((order: any) => ({
          id: `order-${order.id}`,
          type: "purchase" as const,
          productName: order.name || `Order ${order.id}`,
          productUrl: order.shop?.domain || "Shopify Order",
          status: "purchased" as const,
          amount: parseFloat(order.totalPrice) || 0,
          timestamp: order.createdAt,
          userAgent: order.userAgent,
          referrer: order.referrer,
          ip: order.ipAddress,
          sourceUrl: order.sourceUrl,
          sourceName: order.sourceName,
        })),
      ];

      // Sort by timestamp (newest first)
      combinedActivities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      setActivities(combinedActivities);

      // Use real-time stats if available, otherwise calculate from activity data
      if (realTimeStats) {
        setStats({
          totalClicks: realTimeStats.totalClicks || 0,
          totalPurchases: realTimeStats.totalPurchases || 0,
          totalRevenue: realTimeStats.totalRevenue || 0,
          conversionRate: realTimeStats.conversionRate || 0,
          totalAddToCart: realTimeStats.totalAddToCart || 0,
          totalPageViews: realTimeStats.totalPageViews || 0,
          totalProductViews: realTimeStats.totalProductViews || 0,
          totalCheckouts: realTimeStats.totalCheckouts || 0,
          cartToPurchaseRate: realTimeStats.cartToPurchaseRate || 0,
          averageOrderValue: realTimeStats.averageOrderValue || 0,
          totalSessions: realTimeStats.totalSessions || 0,
        });
      } else {
        // Fallback calculation from activity data
        const totalClicks = clicks.length;
        const totalPurchases =
          conversions.length +
          events.filter((e: any) => e.eventType === "purchase").length;
        const totalAddToCart = events.filter(
          (e: any) => e.eventType === "add_to_cart",
        ).length;
        const totalPageViews = events.filter(
          (e: any) => e.eventType === "page_view",
        ).length;
        const totalProductViews = events.filter(
          (e: any) => e.eventType === "product_view",
        ).length;
        const totalCheckouts = events.filter(
          (e: any) =>
            e.eventType === "checkout_start" ||
            e.eventType === "checkout_complete",
        ).length;

        const totalRevenue =
          conversions.reduce(
            (sum: number, conv: any) => sum + (conv.amount || 0),
            0,
          ) +
          events
            .filter((e: any) => e.eventType === "purchase")
            .reduce((sum: number, e: any) => {
              const eventData =
                typeof e.eventData === "string"
                  ? JSON.parse(e.eventData)
                  : e.eventData;
              return (
                sum +
                (eventData.total ||
                  eventData.total_amount ||
                  eventData.amount ||
                  0)
              );
            }, 0) +
          events
            .filter((e: any) => e.eventType === "checkout_complete")
            .reduce((sum: number, e: any) => {
              const eventData =
                typeof e.eventData === "string"
                  ? JSON.parse(e.eventData)
                  : e.eventData;
              return (
                sum +
                (eventData.total ||
                  eventData.total_amount ||
                  eventData.amount ||
                  0)
              );
            }, 0);

        const conversionRate =
          totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;
        const cartToPurchaseRate =
          totalAddToCart > 0 ? (totalPurchases / totalAddToCart) * 100 : 0;
        const averageOrderValue =
          totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

        // Count unique sessions from all data sources
        const allSessionIds = new Set([
          ...clicks.map((c: any) => c.sessionId).filter(Boolean),
          ...conversions.map((c: any) => c.sessionId).filter(Boolean),
          ...events.map((e: any) => e.sessionId).filter(Boolean),
        ]);
        const totalSessions = allSessionIds.size;

        setStats({
          totalClicks,
          totalPurchases,
          totalRevenue,
          conversionRate,
          totalAddToCart,
          totalPageViews,
          totalProductViews,
          totalCheckouts,
          cartToPurchaseRate,
          averageOrderValue,
          totalSessions,
        });
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
      setError("Failed to load activity data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchActivity(true);
  };

  const clearActivity = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all activity data? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsClearing(true);

      const response = await fetch("/api/business/activity/clear", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Clear local state
        setActivities([]);
        setStats({
          totalClicks: 0,
          totalPurchases: 0,
          totalRevenue: 0,
          conversionRate: 0,
          totalAddToCart: 0,
          totalPageViews: 0,
          totalProductViews: 0,
          totalCheckouts: 0,
          cartToPurchaseRate: 0,
          averageOrderValue: 0,
          totalSessions: 0,
        });

        // Show success message
        alert("Activity data cleared successfully!");
      } else {
        const errorData = await response.json();
        alert(
          `Failed to clear activity: ${errorData.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error clearing activity:", error);
      alert("Failed to clear activity data. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const extractProductName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);

      // Try to get the last meaningful part of the URL
      const lastPart = pathParts[pathParts.length - 1];

      if (lastPart) {
        // Clean up the product name
        let productName = lastPart
          .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
          .replace(/\.[^/.]+$/, "") // Remove file extensions
          .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word
          .trim();

        // If it's too short or generic, try the second to last part
        if (productName.length < 3 || productName.toLowerCase() === "product") {
          const secondLastPart = pathParts[pathParts.length - 2];
          if (secondLastPart) {
            productName = secondLastPart
              .replace(/[-_]/g, " ")
              .replace(/\.[^/.]+$/, "")
              .replace(/\b\w/g, (l) => l.toUpperCase())
              .trim();
          }
        }

        return productName || "Product";
      }

      // If no path parts, try to extract from domain or return generic
      const hostname = urlObj.hostname;
      if (hostname && hostname !== "localhost") {
        return hostname.replace(/^www\./, "").replace(/\.[^/.]+$/, "");
      }

      return "Product";
    } catch {
      return "Product";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "purchased":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-0">
            Purchased
          </Badge>
        );
      case "checkout_completed":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-0">
            Checkout Completed
          </Badge>
        );
      case "checkout_started":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-0">
            Checkout Started
          </Badge>
        );
      case "browsed":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-0">
            Browsed
          </Badge>
        );
      case "abandoned":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-0">
            Abandoned
          </Badge>
        );
      case "added_to_cart":
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-0">
            Added to Cart
          </Badge>
        );
      case "viewed":
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-0">
            Viewed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-white border-white/30">
            {status}
          </Badge>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "click":
        return <Eye className="h-4 w-4 text-blue-600" />;
      case "purchase":
      case "conversion":
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case "add_to_cart":
        return <ShoppingCart className="h-4 w-4 text-orange-600" />;
      case "checkout_start":
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case "checkout_complete":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "page_view":
        return <Eye className="h-4 w-4 text-purple-600" />;
      case "product_view":
        return <Eye className="h-4 w-4 text-indigo-600" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number | string | undefined): string => {
    if (!amount) return "-";

    let numericAmount: number;

    // Handle string amounts
    if (typeof amount === "string") {
      // Remove currency symbols and commas
      const cleanAmount = amount.replace(/[$,€£]/g, "").trim();
      numericAmount = parseFloat(cleanAmount);
    } else {
      numericAmount = amount;
    }

    // Handle amounts that might be in cents (common in e-commerce)
    if (numericAmount && numericAmount < 1000 && numericAmount > 0) {
      // If amount is less than 1000, it might be in cents
      // Check if it looks like cents (e.g., 1999 for €19.99)
      if (numericAmount > 100) {
        numericAmount = numericAmount / 100;
      }
    }

    return numericAmount && !isNaN(numericAmount)
      ? `€${numericAmount.toFixed(2)}`
      : "-";
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "click":
        return "Clicked";
      case "purchase":
      case "conversion":
        return "Purchased";
      case "add_to_cart":
        return "Added to Cart";
      case "checkout_start":
        return "Checkout Started";
      case "checkout_complete":
        return "Checkout Completed";
      case "page_view":
        return "Viewed Page";
      case "product_view":
        return "Viewed Product";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
    }
  };

  const getReferrerName = (activity: ActivityItem) => {
    // Check sourceUrl first (from Shopify data)
    if (activity.sourceUrl) {
      if (
        activity.sourceUrl.includes("ipick.io") ||
        activity.sourceUrl.includes("iPick.io")
      ) {
        return "iPick.io";
      }
      if (
        activity.sourceUrl.includes("google.com") ||
        activity.sourceUrl.includes("bing.com")
      ) {
        return "Search Engine";
      }
      if (
        activity.sourceUrl.includes("facebook.com") ||
        activity.sourceUrl.includes("instagram.com")
      ) {
        return "Social Media";
      }
      return "Other";
    }

    // Check sourceName (from Shopify data)
    if (activity.sourceName) {
      if (
        activity.sourceName.toLowerCase().includes("ipick") ||
        activity.sourceName.toLowerCase().includes("pavlo")
      ) {
        return "iPick.io";
      }
      if (activity.sourceName.toLowerCase() === "web") {
        return "Direct";
      }
      return activity.sourceName;
    }

    // Check referrer field
    if (activity.referrer) {
      if (
        activity.referrer.includes("ipick.io") ||
        activity.referrer.includes("iPick.io")
      ) {
        return "iPick.io";
      }
      if (
        activity.referrer.includes("google.com") ||
        activity.referrer.includes("bing.com")
      ) {
        return "Search Engine";
      }
      if (
        activity.referrer.includes("facebook.com") ||
        activity.referrer.includes("instagram.com")
      ) {
        return "Social Media";
      }
      return "Other";
    }

    return "Direct";
  };

  const getReferrerBadge = (activity: ActivityItem) => {
    const referrer = getReferrerName(activity);

    switch (referrer) {
      case "iPick.io":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            iPick.io
          </Badge>
        );
      case "Search Engine":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            Search Engine
          </Badge>
        );
      case "Social Media":
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            Social Media
          </Badge>
        );
      case "Direct":
        return (
          <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
            Direct
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
            {referrer}
          </Badge>
        );
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === "clicks") return activity.type === "click";
    if (filter === "purchases") return activity.type === "purchase";
    if (filter === "add_to_cart") return activity.type === "add_to_cart";
    if (filter === "checkout")
      return (
        activity.type === "checkout_start" ||
        activity.type === "checkout_complete"
      );
    if (filter === "page_views") return activity.type === "page_view";
    return true;
  });

  if (isLoading && !isRefreshing) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 text-white">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <Button
          onClick={handleRefresh}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Activity Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Clicks
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Product page visits</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Add to Cart
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAddToCart.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Cart additions</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Purchases
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPurchases.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Successful conversions</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Revenue from purchases</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Avg Order Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-white/80">Average per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Page Views
            </CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPageViews.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Page visits</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Product Views
            </CardTitle>
            <Eye className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalProductViews.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Product page visits</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Conversion Rate
            </CardTitle>
            <Filter className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Click to purchase</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Cart Conversion
            </CardTitle>
            <Filter className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.cartToPurchaseRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Cart to purchase</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSessions.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Unique sessions</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Checkouts
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCheckouts.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Checkout events</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {stats.totalPurchases > 0
                  ? stats.conversionRate.toFixed(1)
                  : "0"}
                %
              </div>
              <div className="text-sm text-white/80">
                Click to Purchase Rate
              </div>
              <div className="text-xs text-white/60 mt-1">
                {stats.totalClicks} clicks → {stats.totalPurchases} purchases
              </div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {stats.totalAddToCart > 0
                  ? stats.cartToPurchaseRate.toFixed(1)
                  : "0"}
                %
              </div>
              <div className="text-sm text-white/80">Cart to Purchase Rate</div>
              <div className="text-xs text-white/60 mt-1">
                {stats.totalAddToCart} cart additions → {stats.totalPurchases}{" "}
                purchases
              </div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                €{stats.averageOrderValue.toFixed(2)}
              </div>
              <div className="text-sm text-white/80">Average Order Value</div>
              <div className="text-xs text-white/60 mt-1">
                Total: €{stats.totalRevenue.toFixed(2)} / {stats.totalPurchases}{" "}
                orders
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          onClick={() => setFilter("all")}
          className={`${filter === "all" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
        >
          All Activity
        </Button>
        <Button
          onClick={() => setFilter("clicks")}
          className={`${filter === "clicks" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
        >
          Clicks Only
        </Button>
        <Button
          onClick={() => setFilter("add_to_cart")}
          className={`${filter === "add_to_cart" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
        >
          Add to Cart
        </Button>
        <Button
          onClick={() => setFilter("checkout")}
          className={`${filter === "checkout" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
        >
          Checkout
        </Button>
        <Button
          onClick={() => setFilter("purchases")}
          className={`${filter === "purchases" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
        >
          Purchases Only
        </Button>
        <Button
          onClick={() => setFilter("page_views")}
          className={`${filter === "page_views" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
        >
          Page Views
        </Button>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-white/10 text-white hover:bg-white/20 rounded-full sm:ml-auto w-full sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
        <Button
          onClick={clearActivity}
          disabled={isClearing || activities.length === 0}
          variant="destructive"
          className="bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 rounded-full w-full sm:w-auto"
        >
          {isClearing ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-300 border-t-transparent mr-2" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          {isClearing ? "Clearing..." : "Clear Activity"}
        </Button>
      </div>

      {/* Activity Table */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-white/70">
              <p>No activity found for the selected filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead className="text-white border-b border-white/20 pb-3">
                      Type
                    </TableHead>
                    <TableHead className="text-white border-b border-white/20 pb-3">
                      Product
                    </TableHead>
                    <TableHead className="text-white border-b border-white/20 pb-3">
                      Status
                    </TableHead>
                    <TableHead className="text-white border-b border-white/20 pb-3 hidden sm:table-cell">
                      Amount
                    </TableHead>
                    <TableHead className="text-white border-b border-white/20 pb-3">
                      Date
                    </TableHead>
                    <TableHead className="text-white border-b border-white/20 pb-3">
                      Referred by
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.slice(0, 20).map((activity, index) => (
                    <TableRow
                      key={activity.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(activity.type)}
                          <span className="text-white">
                            {getTypeDisplayName(activity.type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="max-w-[150px] sm:max-w-xs truncate">
                          <a
                            href={activity.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:underline transition-colors duration-200"
                            title={activity.productName}
                          >
                            {activity.productName}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(activity.status)}
                      </TableCell>
                      <TableCell className="py-4 hidden sm:table-cell">
                        <span className="text-white">
                          {formatAmount(activity.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-white/60" />
                          <span className="text-white/80">
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getReferrerBadge(activity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
