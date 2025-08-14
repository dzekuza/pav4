import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  ExternalLink,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface BusinessDashboardData {
  summary: {
    totalBusinesses: number;
    businessDomain: string;
    totalCheckouts: number;
    completedCheckouts: number;
    totalOrders: number;
    conversionRate: number;
    totalRevenue: number;
    currency: string;
  };
  businesses: Array<{
    id: string;
    domain: string;
    myshopifyDomain: string;
    name: string;
    email: string;
    currency: string;
    plan: string;
    createdAt: string;
  }>;
  recentCheckouts: Array<{
    id: string;
    email: string;
    totalPrice: string;
    currency: string;
    createdAt: string;
    completedAt: string | null;
    shop: { id: string; domain: string; name: string };
    sourceUrl: string | null;
    sourceName: string | null;
    isPavlo4Referral: boolean;
  }>;
  recentOrders: Array<{
    id: string;
    name: string;
    email: string;
    totalPrice: string;
    currency: string;
    financialStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
    shop: { id: string; domain: string; name: string };
  }>;
  referralStatistics: {
    totalReferrals: number;
    pavlo4Referrals: number;
    pavlo4ConversionRate: number;
    totalConversions: number;
    referralRevenue: number;
    topSources: Record<string, number>;
  };
  trends: {
    last30Days: {
      checkouts: number;
      orders: number;
      revenue: number;
    };
    last7Days: {
      checkouts: number;
      orders: number;
      revenue: number;
    };
  };
  orderStatuses: Record<string, number>;
  recentReferrals: Array<{
    id: string;
    referralId: string;
    businessDomain: string;
    source: string | null;
    medium: string | null;
    campaign: string | null;
    conversionStatus: string | null;
    conversionValue: number | null;
    clickedAt: string;
    shop: { id: string; domain: string; name: string };
    isPavlo4: boolean;
  }>;
}

interface BusinessAnalyticsDashboardProps {
  businessDomain: string;
}

export default function BusinessAnalyticsDashboard({ businessDomain }: BusinessAnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<BusinessDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d"); // 7d, 30d, 90d
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [businessDomain, dateRange]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const response = await fetch(
        `/api/business/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=100`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.dashboardData);
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch dashboard data",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "fulfilled":
        return "bg-green-500";
      case "pending":
      case "unfulfilled":
        return "bg-yellow-500";
      case "cancelled":
      case "refunded":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No dashboard data available.</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, trends, referralStatistics, recentCheckouts, recentOrders } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Business Analytics Dashboard</h2>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range)}
              className="text-white"
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Checkouts
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalCheckouts.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">
              {summary.completedCheckouts} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Orders
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">
              {formatCurrency(summary.totalRevenue, summary.currency)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Conversion Rate
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">
              Checkout to order ratio
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Pavlo4 Referrals
            </CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralStatistics.pavlo4Referrals}
            </div>
            <p className="text-xs text-white/80">
              {referralStatistics.pavlo4ConversionRate.toFixed(1)}% conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Recent Trends</CardTitle>
            <CardDescription className="text-white/80">
              Performance over the last 30 days vs 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Checkouts</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{trends.last7Days.checkouts}</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Orders</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{trends.last7Days.orders}</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Revenue</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">
                  {formatCurrency(trends.last7Days.revenue, summary.currency)}
                </span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Referral Sources</CardTitle>
            <CardDescription className="text-white/80">
              Top traffic sources and conversions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Total Referrals</span>
              <span className="text-sm text-white">{referralStatistics.totalReferrals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Pavlo4 Referrals</span>
              <span className="text-sm text-white">{referralStatistics.pavlo4Referrals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Total Conversions</span>
              <span className="text-sm text-white">{referralStatistics.totalConversions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Referral Revenue</span>
              <span className="text-sm text-white">
                {formatCurrency(referralStatistics.referralRevenue, summary.currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Recent Checkouts</CardTitle>
            <CardDescription className="text-white/80">
              Latest checkout activity with source tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCheckouts.slice(0, 5).map((checkout) => (
                <div key={checkout.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {checkout.email || "Anonymous"}
                      </span>
                      {checkout.isPavlo4Referral && (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          Pavlo4
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-white/60">
                      {formatDate(checkout.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {formatCurrency(parseFloat(checkout.totalPrice || "0"), checkout.currency)}
                    </div>
                    <div className="text-xs text-white/60">
                      {checkout.completedAt ? "Completed" : "Pending"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Recent Orders</CardTitle>
            <CardDescription className="text-white/80">
              Latest order activity with financial status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {order.name || order.email || "Anonymous"}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(order.financialStatus)}`}></div>
                    </div>
                    <div className="text-xs text-white/60">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {formatCurrency(parseFloat(order.totalPrice || "0"), order.currency)}
                    </div>
                    <div className="text-xs text-white/60 capitalize">
                      {order.financialStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Activity */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Recent Referral Activity</CardTitle>
          <CardDescription className="text-white/80">
            Latest referral clicks and conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.recentReferrals.slice(0, 10).map((referral) => (
              <div key={referral.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {referral.source || "Direct"}
                    </span>
                    {referral.isPavlo4 && (
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        Pavlo4
                      </Badge>
                    )}
                    {referral.conversionStatus === "converted" && (
                      <Badge variant="outline" className="text-blue-500 border-blue-500">
                        Converted
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-white/60">
                    {referral.medium && `${referral.medium}`}
                    {referral.campaign && ` • ${referral.campaign}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">
                    {formatDate(referral.clickedAt)}
                  </div>
                  {referral.conversionValue && (
                    <div className="text-xs text-white/60">
                      {formatCurrency(referral.conversionValue, summary.currency)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
