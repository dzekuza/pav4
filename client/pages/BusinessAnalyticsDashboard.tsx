import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Eye,
  Filter,
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
  logo?: string | null;
}

interface AnalyticsData {
  dailyVisits: { date: string; visits: number }[];
  dailyRevenue: { date: string; revenue: number }[];
  topProducts: { name: string; clicks: number; purchases: number }[];
  conversionTrends: { date: string; rate: number }[];
}

export default function BusinessAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(
    null,
  );
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/business/auth/check", {
          credentials: "include",
        });
        if (response.status === 401) {
          navigate("/business-login");
          return;
        }
        fetchAnalyticsData();
      } catch (error) {
        console.error("Error checking authentication:", error);
        navigate("/business-login");
      }
    };
    checkAuth();
  }, [navigate, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);

      // Fetch real analytics data from API
      const [clicksResponse, conversionsResponse, realTimeStatsResponse] =
        await Promise.all([
          fetch("/api/business/activity/clicks", { credentials: "include" }),
          fetch("/api/business/activity/conversions", {
            credentials: "include",
          }),
          fetch("/api/business/stats/realtime", { credentials: "include" }),
        ]);

      // Check if any response is not ok
      if (!clicksResponse.ok || !conversionsResponse.ok || !realTimeStatsResponse.ok) {
        // Check if it's an authentication error
        if (
          clicksResponse.status === 401 ||
          conversionsResponse.status === 401 ||
          realTimeStatsResponse.status === 401
        ) {
          navigate("/business-login");
          return;
        }
        throw new Error("Failed to fetch analytics data. Please try again.");
      }

      // Check content type to ensure we're getting JSON
      const contentType = clicksResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format. Please try again.");
      }

      const clicksJson = await clicksResponse.json();
      const conversionsJson = await conversionsResponse.json();
      const realTimeStatsData = realTimeStatsResponse.ok
        ? await realTimeStatsResponse.json()
        : { success: false, stats: {} };

      // Ensure clicks and conversions are arrays
      const clicks = Array.isArray(clicksJson)
        ? clicksJson
        : clicksJson.clicks || [];
      const conversions = Array.isArray(conversionsJson)
        ? conversionsJson
        : conversionsJson.conversions || [];

      // Process clicks data for daily visits
      const dailyVisitsMap = new Map<string, number>();
      clicks.forEach((click: any) => {
        const date = new Date(click.timestamp).toISOString().split("T")[0];
        dailyVisitsMap.set(date, (dailyVisitsMap.get(date) || 0) + 1);
      });

      // Process conversions data for daily revenue
      const dailyRevenueMap = new Map<string, number>();
      conversions.forEach((conversion: any) => {
        const date = new Date(conversion.timestamp).toISOString().split("T")[0];
        dailyRevenueMap.set(
          date,
          (dailyRevenueMap.get(date) || 0) + conversion.amount,
        );
      });

      // Generate daily data for the selected time range
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const dailyVisits = generateDailyDataFromMap(dailyVisitsMap, days);
      const dailyRevenue = generateDailyDataFromMap(dailyRevenueMap, days);

      // Process top products from clicks and conversions
      const productClicks = new Map<string, number>();
      const productPurchases = new Map<string, number>();

      clicks.forEach((click: any) => {
        // Extract product name from URL or productId
        let productName = "Unknown Product";
        
        if (click.url) {
          productName = extractProductName(click.url);
        } else if (click.productId) {
          productName = extractProductName(click.productId);
        } else if (click.productName) {
          productName = click.productName;
        }
        
        // Skip if we couldn't extract a meaningful name
        if (productName === "Unknown Product" || productName.length < 2) {
          return;
        }
        
        productClicks.set(
          productName,
          (productClicks.get(productName) || 0) + 1,
        );
      });

      conversions.forEach((conversion: any) => {
        // For conversions, try to get the actual product name
        let productName = "Unknown Product";
        
        if (conversion.url) {
          productName = extractProductName(conversion.url);
        } else if (conversion.productId) {
          productName = extractProductName(conversion.productId);
        } else if (conversion.productName) {
          productName = conversion.productName;
        } else if (conversion.orderId) {
          productName = `Order ${conversion.orderId}`;
        }
        
        // Skip if we couldn't extract a meaningful name
        if (productName === "Unknown Product" || productName.length < 2) {
          return;
        }
        
        productPurchases.set(
          productName,
          (productPurchases.get(productName) || 0) + 1,
        );
      });

      const topProducts = Array.from(productClicks.entries())
        .map(([name, clicks]) => ({
          name,
          clicks,
          purchases: productPurchases.get(name) || 0,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      // If no products with meaningful names, show a message
      if (topProducts.length === 0 || topProducts.every(p => p.name === "Unknown Product")) {
        console.log("No meaningful product names found in analytics data");
      }

      // Calculate conversion trends
      const conversionTrends = dailyVisits.map((day) => {
        const dayVisits = day.visits;
        const dayConversions =
          dailyRevenue.find((d) => d.date === day.date)?.revenue || 0;
        const rate = dayVisits > 0 ? (dayConversions / dayVisits) * 100 : 0;
        return {
          date: day.date,
          rate: rate,
        };
      });

      const realData: AnalyticsData = {
        dailyVisits,
        dailyRevenue,
        topProducts,
        conversionTrends,
      };

      setAnalyticsData(realData);
      setBusinessStats(realTimeStatsData.success ? realTimeStatsData.stats : null);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailyDataFromMap = (
    dataMap: Map<string, number>,
    days: number,
  ) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      data.push({
        date: dateString,
        visits: dataMap.get(dateString) || 0,
        revenue: dataMap.get(dateString) || 0,
      });
    }
    return data;
  };

  const extractProductName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      
      // Get the last meaningful part of the URL
      const lastPart = pathParts[pathParts.length - 1];
      
      if (!lastPart) {
        // If no path parts, try to get meaningful info from hostname
        const hostname = urlObj.hostname;
        if (hostname && hostname !== 'localhost') {
          return hostname.replace(/^www\./, '').split('.')[0];
        }
        return "Unknown Product";
      }
      
      // Clean up the product name
      let productName = lastPart
        .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
        .replace(/\.(html|php|asp|jsp)$/i, '') // Remove file extensions
        .replace(/\d+$/, '') // Remove trailing numbers
        .trim();
      
      // Capitalize words
      productName = productName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // If the result is empty or too short, try the parent directory
      if (productName.length < 2 && pathParts.length > 1) {
        const parentPart = pathParts[pathParts.length - 2];
        productName = parentPart
          .replace(/[-_]/g, ' ')
          .replace(/\.(html|php|asp|jsp)$/i, '')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      return productName || "Unknown Product";
    } catch {
      // If URL parsing fails, try to extract meaningful info from the string
      if (typeof url === 'string' && url.length > 0) {
        const parts = url.split('/').filter(Boolean);
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
          return lastPart
            .replace(/[-_]/g, ' ')
            .replace(/\.(html|php|asp|jsp)$/i, '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ') || "Unknown Product";
        }
      }
      return "Unknown Product";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Analytics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Visits
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.dailyVisits
                .reduce((sum, day) => sum + day.visits, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-white/80">
              Last{" "}
              {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"}{" "}
              days
            </p>
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
              $
              {analyticsData?.dailyRevenue
                .reduce((sum, day) => sum + day.revenue, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Total revenue</p>
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
              {businessStats?.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Overall rate</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Avg Daily Visits
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData?.dailyVisits.length > 0
                ? Math.round(
                    analyticsData.dailyVisits.reduce(
                      (sum, day) => sum + day.visits,
                      0,
                    ) / analyticsData.dailyVisits.length,
                  )
                : 0}
            </div>
            <p className="text-xs text-white/80">Average per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => setTimeRange("7d")}
          className={`${timeRange === "7d" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
        >
          7 Days
        </Button>
        <Button
          size="sm"
          onClick={() => setTimeRange("30d")}
          className={`${timeRange === "30d" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
        >
          30 Days
        </Button>
        <Button
          size="sm"
          onClick={() => setTimeRange("90d")}
          className={`${timeRange === "90d" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
        >
          90 Days
        </Button>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-white">Daily Visits</CardTitle>
                <CardDescription className="text-white/80">
                  Visitor traffic over the last{" "}
                  {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"}{" "}
                  days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.dailyVisits.length === 0 ||
                analyticsData.dailyVisits.every((day) => day.visits === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">
                      No visit data available for the selected time range.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analyticsData.dailyVisits.slice(-7).map((day, index) => {
                      const maxVisits = Math.max(
                        ...analyticsData.dailyVisits.map((d) => d.visits),
                        1,
                      );
                      return (
                        <div
                          key={day.date}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-white/70">
                            {formatDate(day.date)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${(day.visits / maxVisits) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {day.visits}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-white">Daily Revenue</CardTitle>
                <CardDescription className="text-white/80">
                  Revenue generated over the last{" "}
                  {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"}{" "}
                  days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.dailyRevenue.length === 0 ||
                analyticsData.dailyRevenue.every((day) => day.revenue === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">
                      No revenue data available for the selected time range.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analyticsData.dailyRevenue.slice(-7).map((day, index) => {
                      const maxRevenue = Math.max(
                        ...analyticsData.dailyRevenue.map((d) => d.revenue),
                        1,
                      );
                      return (
                        <div
                          key={day.date}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-white/70">
                            {formatDate(day.date)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${(day.revenue / maxRevenue) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              ${day.revenue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-white">
                Top Performing Products
              </CardTitle>
              <CardDescription className="text-white/80">
                Products with the highest engagement and conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.topProducts.length === 0 || analyticsData.topProducts.every(p => p.name === "Unknown Product") ? (
                <div className="text-center py-8">
                  <p className="text-white/70">
                    No product data available for the selected time range.
                  </p>
                  <p className="text-xs text-white/50 mt-2">
                    Product names will appear here once tracking data is available.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyticsData.topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.clicks} clicks, {product.purchases}{" "}
                            purchases
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {product.clicks > 0
                            ? (
                                (product.purchases / product.clicks) *
                                100
                              ).toFixed(1)
                            : "0.0"}
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Conversion
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-white">
                Conversion Rate Trends
              </CardTitle>
              <CardDescription className="text-white/80">
                How your conversion rate has changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.conversionTrends.length === 0 ||
              analyticsData.conversionTrends.every(
                (trend) => trend.rate === 0,
              ) ? (
                <div className="text-center py-8">
                  <p className="text-white/70">
                    No conversion trend data available for the selected time
                    range.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analyticsData.conversionTrends
                    .slice(-10)
                    .map((trend, index) => {
                      const maxRate = Math.max(
                        ...analyticsData.conversionTrends.map((t) => t.rate),
                        1,
                      );
                      return (
                        <div
                          key={trend.date}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-white/70">
                            {formatDate(trend.date)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((trend.rate / maxRate) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {trend.rate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
