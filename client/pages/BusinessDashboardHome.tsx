import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  RefreshCw,
} from "lucide-react";

interface BusinessStats {
  id: number;
  name: string;
  domain: string;
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  adminCommissionRate: number;
  projectedFee: number;
  averageOrderValue: number;
  conversionRate: number;
  totalClicks: number;
  totalConversions: number;
  totalAddToCart: number;
  totalPageViews: number;
  totalProductViews: number;
  totalSessions: number;
  cartToPurchaseRate: number;
  logo?: string | null;
}

interface ReferralUrls {
  businessId: number;
  businessName: string;
  domain: string;
  affiliateId: string;
  referralUrl: string;
  trackingUrl: string;
  instructions: {
    referralUrl: string;
    trackingUrl: string;
  };
}

export default function BusinessDashboardHome() {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [referralUrls, setReferralUrls] = useState<ReferralUrls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchReferralUrls = async () => {
    try {
      const response = await fetch("/api/business/referral-url", {
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/business/login");
        return;
      }

      if (!response.ok) {
        console.error("Failed to fetch referral URLs");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setReferralUrls(data.data);
      }
    } catch (error) {
      console.error("Error fetching referral URLs:", error);
    }
  };

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Calculate date range for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      // Fetch consolidated data from the dashboard API (same as analytics)
      const response = await fetch(
        `/api/business/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=100`,
        {
          credentials: "include",
        },
      );

      if (response.status === 401) {
        navigate("/business/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      console.log("Dashboard API Response in Home:", data);

      if (data.success) {
        // Extract and calculate stats from the consolidated data
        const { summary, recentCheckouts, recentOrders } = data.data; // Fix: access data.data

        console.log("Extracted data in Home:", {
          summary,
          checkoutsCount: recentCheckouts?.length,
          ordersCount: recentOrders?.length,
        });

        // Use summary data directly from the API response
        const totalCheckouts = summary?.totalCheckouts || 0;
        const totalOrders = summary?.totalOrders || 0;
        const totalRevenue = summary?.totalRevenue || 0;
        const conversionRate = summary?.conversionRate || 0;

        // Calculate average order value
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate projected fee (5% commission)
        const projectedFee = totalRevenue * 0.05;

        console.log("Processed stats in Home:", {
          totalCheckouts,
          totalOrders,
          totalRevenue,
          conversionRate,
          averageOrderValue,
          projectedFee,
        });

        // Create consolidated stats object
        const consolidatedStats: BusinessStats = {
          id: 0, // Will be set by the parent component
          name: "", // Will be set by the parent component
          domain: "", // Will be set by the parent component
          totalVisits: totalCheckouts, // Use checkouts as visits
          totalPurchases: totalOrders,
          totalRevenue: totalRevenue,
          conversionRate: conversionRate,
          averageOrderValue: averageOrderValue,
          projectedFee: projectedFee,
          adminCommissionRate: 5, // Default commission rate
          totalClicks: totalCheckouts, // Use checkouts as clicks
          totalConversions: totalOrders,
          totalAddToCart: 0, // Not tracked in Gadget data
          totalPageViews: 1, // Default value
          totalProductViews: 0, // Not tracked in Gadget data
          totalSessions: 1, // Default value
          cartToPurchaseRate: 0, // Not applicable with current data
        };

        setStats(consolidatedStats);
      }
    } catch (error) {
      console.error("Error fetching business stats:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReferralUrls();
  }, [navigate]);

  const handleRefresh = () => {
    fetchStats(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Failed to load dashboard data. Please try refreshing the page.
        </p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Add default values to prevent undefined errors
  const safeStats = {
    totalVisits: stats?.totalVisits || 0,
    totalPurchases: stats?.totalPurchases || 0,
    totalRevenue: stats?.totalRevenue || 0,
    adminCommissionRate: stats?.adminCommissionRate || 0,
    projectedFee: stats?.projectedFee || 0,
    averageOrderValue: stats?.averageOrderValue || 0,
    conversionRate: stats?.conversionRate || 0,
    totalClicks: stats?.totalClicks || 0,
    totalConversions: stats?.totalConversions || 0,
    totalAddToCart: stats?.totalAddToCart || 0,
    totalPageViews: stats?.totalPageViews || 0,
    totalProductViews: stats?.totalProductViews || 0,
    totalSessions: stats?.totalSessions || 0,
    cartToPurchaseRate: stats?.cartToPurchaseRate || 0,
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Visits
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeStats.totalVisits.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">
              Users who visited your products
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Purchases
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeStats.totalPurchases.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Successful purchases made</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${safeStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Total sales revenue</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeStats.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Click to purchase ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Add to Cart
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeStats.totalAddToCart.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Cart additions</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Cart Conversion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeStats.cartToPurchaseRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Cart to purchase rate</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeStats.totalSessions.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Unique sessions</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Page Views
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeStats.totalPageViews.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Total page views</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Revenue Analysis</CardTitle>
            <CardDescription className="text-white/80">
              Detailed breakdown of your business performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                Average Order Value
              </span>
              <span className="text-sm font-bold text-white">
                €{safeStats.averageOrderValue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                Commission Rate
              </span>
              <Badge variant="outline" className="text-white border-white/30">
                {safeStats.adminCommissionRate}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                Projected Fee
              </span>
              <span className="text-sm font-bold text-white">
                €{safeStats.projectedFee.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
            <CardDescription className="text-white/80">
              Key performance indicators for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">
                  Total Visits
                </span>
                <span className="text-sm text-white">
                  {safeStats.totalVisits.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min((safeStats.totalVisits / 1000) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">
                  Total Purchases
                </span>
                <span className="text-sm text-white">
                  {safeStats.totalPurchases.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min((safeStats.totalPurchases / 100) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">
                  Conversion Rate
                </span>
                <span className="text-sm text-white">
                  {safeStats.conversionRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(safeStats.conversionRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral URLs Section */}
      {referralUrls && (
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">
              Your Unique Referral URLs
            </CardTitle>
            <CardDescription className="text-white/80">
              Use these URLs to track customers coming from your affiliate links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  General Referral URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={referralUrls.referralUrl}
                    readOnly
                    className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(referralUrls.referralUrl)
                    }
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  {referralUrls.instructions.referralUrl}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Domain-Specific Tracking URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={referralUrls.trackingUrl}
                    readOnly
                    className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(referralUrls.trackingUrl)
                    }
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  {referralUrls.instructions.trackingUrl}
                </p>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                <h4 className="text-sm font-medium text-blue-300 mb-2">
                  How to Use:
                </h4>
                <ul className="text-xs text-white/80 space-y-1">
                  <li>
                    • <strong>General URL:</strong> Use this for general
                    affiliate marketing
                  </li>
                  <li>
                    • <strong>Domain URL:</strong> Use this to track traffic to
                    your specific domain
                  </li>
                  <li>
                    • Both URLs contain your unique affiliate ID:{" "}
                    <code className="bg-white/10 px-1 rounded">
                      {referralUrls.affiliateId}
                    </code>
                  </li>
                  <li>
                    • When customers click these links, we'll track them as
                    coming from your affiliate
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
