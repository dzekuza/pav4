import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface CheckoutData {
  id: string;
  email?: string;
  totalPrice: string;
  currency: string;
  checkoutStatus: string;
  sourceName: string;
  createdAt: string;
  completedAt?: string;
}

interface MyPageStats {
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  totalCheckouts: number;
  pendingCheckouts: number;
  pendingRevenue: number;
  completedCheckouts: number;
  completedRevenue: number;
  appRedirectRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
  recentCheckouts: CheckoutData[];
  // Tracking metrics
  totalPageViews: number;
  totalProductViews: number;
  totalAddToCart: number;
  totalSessions: number;
  cartToPurchaseRate: number;
}

interface BusinessMyPageDashboardProps {
  businessDomain: string;
}

export default function BusinessMyPageDashboard({
  businessDomain,
}: BusinessMyPageDashboardProps) {
  const [stats, setStats] = useState<MyPageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRevenueTab, setActiveRevenueTab] = useState<
    "all" | "app-redirect"
  >("all");

  useEffect(() => {
    fetchMyPageStats();
  }, [businessDomain]);

  const fetchMyPageStats = async () => {
    try {
      const response = await fetch(
        `/api/business/mypage/stats?domain=${encodeURIComponent(businessDomain)}`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        console.error("Failed to fetch My Page stats");
      }
    } catch (error) {
      console.error("Error fetching My Page stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="p-6 text-center">
          <p className="text-white/70">Unable to load My Page statistics.</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getRevenueDisplay = () => {
    if (activeRevenueTab === "all") {
      return formatCurrency(stats.totalRevenue);
    } else {
      return formatCurrency(stats.appRedirectRevenue);
    }
  };

  const getRevenueDescription = () => {
    if (activeRevenueTab === "all") {
      return "Total revenue from all sources";
    } else {
      return "Revenue from app redirects only";
    }
  };

  return (
    <div className="space-y-6">
      {/* Revenue Tabs */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Revenue Overview</CardTitle>
          <CardDescription className="text-white/80">
            Track your revenue from different sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeRevenueTab}
            onValueChange={(value) =>
              setActiveRevenueTab(value as "all" | "app-redirect")
            }
          >
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger
                value="all"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
              >
                All Revenue
              </TabsTrigger>
              <TabsTrigger
                value="app-redirect"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
              >
                App Redirect Revenue
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-sm text-white/80">
                  Total revenue from all sources
                </p>
              </div>
            </TabsContent>
            <TabsContent value="app-redirect" className="mt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(stats.appRedirectRevenue)}
                </div>
                <p className="text-sm text-white/80">
                  Revenue from app redirects only
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSessions.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">
              Unique user sessions tracked
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Completed Checkouts
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedCheckouts.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Successful purchases</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Pending Checkouts
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingCheckouts.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">In progress checkouts</p>
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
              {stats.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Session to purchase ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Page Views
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPageViews.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Total page views tracked</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Product Views
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalProductViews.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Product page views</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Add to Cart
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
              Cart to Purchase
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.cartToPurchaseRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Cart to purchase rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Revenue Breakdown</CardTitle>
            <CardDescription className="text-white/80">
              Detailed revenue analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                Completed Revenue
              </span>
              <span className="text-sm font-bold text-green-500">
                {formatCurrency(stats.completedRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                Pending Revenue
              </span>
              <span className="text-sm font-bold text-yellow-500">
                {formatCurrency(stats.pendingRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                App Redirect Revenue
              </span>
              <span className="text-sm font-bold text-blue-500">
                {formatCurrency(stats.appRedirectRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                Average Order Value
              </span>
              <span className="text-sm font-bold text-white">
                {formatCurrency(stats.averageOrderValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Checkout Status</CardTitle>
            <CardDescription className="text-white/80">
              Current checkout pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">
                  Completed
                </span>
                <span className="text-sm text-white">
                  {stats.completedCheckouts.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${stats.totalCheckouts > 0 ? (stats.completedCheckouts / stats.totalCheckouts) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">Pending</span>
                <span className="text-sm text-white">
                  {stats.pendingCheckouts.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{
                    width: `${stats.totalCheckouts > 0 ? (stats.pendingCheckouts / stats.totalCheckouts) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-500">
                    {stats.completedCheckouts.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/80">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-500">
                    {stats.pendingCheckouts.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/80">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Checkouts */}
      {stats.recentCheckouts.length > 0 && (
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Recent Checkouts</CardTitle>
            <CardDescription className="text-white/80">
              Latest checkout activity with session tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentCheckouts.slice(0, 5).map((checkout) => (
                <div
                  key={checkout.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {checkout.checkoutStatus === "In Progress" ? (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {checkout.email || `Checkout #${checkout.id.slice(-8)}`}
                      </div>
                      <div className="text-xs text-white/60">
                        {new Date(checkout.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-blue-400">
                        Source: {checkout.sourceName || "Direct"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(
                        parseFloat(checkout.totalPrice),
                        checkout.currency,
                      )}
                    </div>
                    <Badge
                      variant={
                        checkout.checkoutStatus === "In Progress"
                          ? "secondary"
                          : "default"
                      }
                      className={
                        checkout.checkoutStatus === "In Progress"
                          ? "bg-yellow-500 text-black"
                          : "bg-green-500"
                      }
                    >
                      {checkout.checkoutStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Analytics */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Session Analytics</CardTitle>
          <CardDescription className="text-white/80">
            User journey tracking and conversion funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {stats.totalSessions.toLocaleString()}
              </div>
              <div className="text-sm text-white/80">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.totalPageViews.toLocaleString()}
              </div>
              <div className="text-sm text-white/80">Page Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {stats.totalAddToCart.toLocaleString()}
              </div>
              <div className="text-sm text-white/80">Add to Cart</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/80">
                Page View to Product View
              </span>
              <span className="text-sm font-bold text-white">
                {stats.totalPageViews > 0
                  ? (
                      (stats.totalProductViews / stats.totalPageViews) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${stats.totalPageViews > 0 ? Math.min((stats.totalProductViews / stats.totalPageViews) * 100, 100) : 0}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-white/80">
                Product View to Add to Cart
              </span>
              <span className="text-sm font-bold text-white">
                {stats.totalProductViews > 0
                  ? (
                      (stats.totalAddToCart / stats.totalProductViews) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{
                  width: `${stats.totalProductViews > 0 ? Math.min((stats.totalAddToCart / stats.totalProductViews) * 100, 100) : 0}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-white/80">
                Add to Cart to Purchase
              </span>
              <span className="text-sm font-bold text-white">
                {stats.cartToPurchaseRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(stats.cartToPurchaseRate, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
