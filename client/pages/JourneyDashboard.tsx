import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { SearchHeader } from "../components/SearchHeader";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  LogOut,
  Settings,
  Package,
  Route,
  ArrowLeft,
  Eye,
  MousePointer,
  Heart,
  Share,
  MessageCircle,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";

interface MockBusinessStats {
  id: number;
  name: string;
  domain: string;
  affiliateId: string;
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  adminCommissionRate: number;
  projectedFee: number;
  averageOrderValue: number;
  conversionRate: number;
  // New Journey-specific metrics
  totalPageViews: number;
  totalProductViews: number;
  totalAddToCart: number;
  totalWishlist: number;
  totalShares: number;
  totalReviews: number;
  totalSessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  topProducts: Array<{
    name: string;
    views: number;
    revenue: number;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    conversionRate: number;
  }>;
}

export default function JourneyDashboard() {
  const [stats, setStats] = useState<MockBusinessStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "customers" | "products"
  >("overview");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Generate mock data
    generateMockStats();
  }, []);

  const generateMockStats = () => {
    // Simulate API delay
    setTimeout(() => {
      const mockStats: MockBusinessStats = {
        id: 1,
        name: "Demo Business",
        domain: "demo-store.com",
        affiliateId: "demo_aff_123",
        totalVisits: 15420,
        totalPurchases: 1234,
        totalRevenue: 45678.9,
        adminCommissionRate: 5,
        projectedFee: 2283.95,
        averageOrderValue: 37.02,
        conversionRate: 8.0,
        // New Journey metrics
        totalPageViews: 45678,
        totalProductViews: 23456,
        totalAddToCart: 3456,
        totalWishlist: 1234,
        totalShares: 567,
        totalReviews: 890,
        totalSessions: 12345,
        bounceRate: 35.2,
        avgSessionDuration: 245, // seconds
        topProducts: [
          { name: "Wireless Headphones", views: 2345, revenue: 12345.67 },
          { name: "Smart Watch", views: 1890, revenue: 9876.54 },
          { name: "Laptop Stand", views: 1567, revenue: 5432.1 },
          { name: "Phone Case", views: 1234, revenue: 3456.78 },
        ],
        customerSegments: [
          { segment: "New Customers", count: 567, percentage: 45.9 },
          { segment: "Returning Customers", count: 445, percentage: 36.1 },
          { segment: "VIP Customers", count: 222, percentage: 18.0 },
        ],
        trafficSources: [
          { source: "Direct", visits: 5678, conversionRate: 12.5 },
          { source: "Organic Search", visits: 4567, conversionRate: 8.2 },
          { source: "Social Media", visits: 3456, conversionRate: 6.8 },
          { source: "Referral", visits: 2345, conversionRate: 4.5 },
        ],
      };
      setStats(mockStats);
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/business/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/business-login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleBackToSelector = () => {
    navigate("/business/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader showBackButton={false} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader showBackButton={false} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                Unable to load journey statistics.
              </p>
              <Button
                onClick={() => navigate("/business-login")}
                className="mt-4"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <img
        src="/pagebg.png"
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100"
      />
      <SearchHeader showBackButton={false} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToSelector}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard Selector
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Route className="h-6 w-6 text-purple-400" />
                Journey Dashboard
              </h1>
              <p className="text-gray-300 text-sm">
                Enhanced analytics with mock data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-purple-500/20 text-purple-300"
            >
              Mock Data
            </Badge>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/10 rounded-lg p-1">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "analytics", label: "Analytics", icon: PieChart },
            { id: "customers", label: "Customers", icon: Users },
            { id: "products", label: "Products", icon: Package },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Total Visits</p>
                      <p className="text-2xl font-bold">
                        {stats.totalVisits.toLocaleString()}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Conversion Rate</p>
                      <p className="text-2xl font-bold">
                        {stats.conversionRate}%
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Avg Session</p>
                      <p className="text-2xl font-bold">
                        {Math.floor(stats.avgSessionDuration / 60)}m{" "}
                        {stats.avgSessionDuration % 60}s
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Bounce Rate</p>
                      <p className="text-2xl font-bold">{stats.bounceRate}%</p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5" />
                    Engagement Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Page Views</span>
                    <span className="font-semibold">
                      {stats.totalPageViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Product Views</span>
                    <span className="font-semibold">
                      {stats.totalProductViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Add to Cart</span>
                    <span className="font-semibold">
                      {stats.totalAddToCart.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Wishlist</span>
                    <span className="font-semibold">
                      {stats.totalWishlist.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Shares</span>
                    <span className="font-semibold">
                      {stats.totalShares.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Reviews</span>
                    <span className="font-semibold">
                      {stats.totalReviews.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Revenue</span>
                    <span className="font-semibold">
                      €{stats.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Orders</span>
                    <span className="font-semibold">
                      {stats.totalPurchases.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Avg Order Value</span>
                    <span className="font-semibold">
                      €{stats.averageOrderValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Commission Rate</span>
                    <span className="font-semibold">
                      {stats.adminCommissionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Projected Fee</span>
                    <span className="font-semibold">
                      €{stats.projectedFee.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.trafficSources.map((source, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                        <span className="font-medium">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {source.visits.toLocaleString()} visits
                        </div>
                        <div className="text-sm text-gray-300">
                          {source.conversionRate}% conversion
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
                <CardDescription>
                  Breakdown of your customer base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.customerSegments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded"
                    >
                      <span className="font-medium">{segment.segment}</span>
                      <div className="text-right">
                        <div className="font-semibold">
                          {segment.count.toLocaleString()} customers
                        </div>
                        <div className="text-sm text-gray-300">
                          {segment.percentage}% of total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
                <CardDescription>Your best-selling products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {product.views.toLocaleString()} views
                        </div>
                        <div className="text-sm text-gray-300">
                          €{product.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
