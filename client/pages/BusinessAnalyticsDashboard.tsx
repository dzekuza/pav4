import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ShoppingCart,
  DollarSign,
  Target,
  TrendingUp,
} from "lucide-react";

// Types for the API response
interface DashboardData {
  success: boolean;
  data: {
    summary: {
      totalCheckouts: number;
      totalOrders: number;
      totalRevenue: number;
      currency: string;
      conversionRate: number;
    };
    recentCheckouts: Array<{
      id: string;
      email: string | null;
      totalPrice: string;
      currency: string;
      createdAt: string;
      name: string;
    }>;
    recentOrders: Array<{
      id: string;
      name: string;
      email: string | null;
      totalPrice: string;
      currency: string;
      financialStatus: string;
      createdAt: string;
    }>;
  };
}

export default function BusinessAnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
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

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/business-login");
          return;
        }
        throw new Error("Failed to fetch dashboard data");
      }

      const data: DashboardData = await response.json();
      console.log("Raw API Response:", data);
      
      if (!data.success) {
        throw new Error("API returned error");
      }

      setDashboardData(data);
      console.log("Dashboard data set:", data.data.summary);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70">No data available</p>
      </div>
    );
  }

  const { summary, recentCheckouts, recentOrders } = dashboardData.data;
  const currency = summary.currency || "EUR";

  return (
    <div className="space-y-6 text-white">
      {/* Analytics Overview Cards */}
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
              {summary.totalCheckouts.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">
              Last {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} days
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
              {formatCurrency(summary.totalRevenue, currency)}
            </div>
            <p className="text-xs text-white/80">From tracked orders</p>
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
            <p className="text-xs text-white/80">Checkout to order</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.totalOrders}
            </div>
            <p className="text-xs text-white/80">Completed orders</p>
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
          <TabsTrigger value="checkouts">Checkouts</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-white">Recent Checkouts</CardTitle>
                <CardDescription className="text-white/80">
                  Latest checkout activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentCheckouts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">No recent checkouts found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentCheckouts.slice(0, 5).map((checkout) => (
                      <div key={checkout.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <div>
                          <div className="font-medium text-sm">
                            {checkout.name || `Checkout #${checkout.id}`}
                          </div>
                          <div className="text-xs text-white/70">
                            {checkout.email || 'No email'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {formatCurrency(parseFloat(checkout.totalPrice), checkout.currency)}
                          </div>
                          <div className="text-xs text-white/70">
                            {formatDate(checkout.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-white">Recent Orders</CardTitle>
                <CardDescription className="text-white/80">
                  Latest order activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">No recent orders found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <div>
                          <div className="font-medium text-sm">
                            {order.name}
                          </div>
                          <div className="text-xs text-white/70">
                            {order.email || 'No email'} • {order.financialStatus}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {formatCurrency(parseFloat(order.totalPrice), order.currency)}
                          </div>
                          <div className="text-xs text-white/70">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checkouts" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Total Checkouts
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalCheckouts}
                </div>
                <p className="text-xs text-white/80">Started checkouts</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Completed Orders
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalOrders}
                </div>
                <p className="text-xs text-white/80">Successful orders</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Total Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.totalRevenue, currency)}
                </div>
                <p className="text-xs text-white/80">From tracked orders</p>
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
                <p className="text-xs text-white/80">Checkout to order</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-white">All Checkouts</CardTitle>
              <CardDescription className="text-white/80">
                Complete list of checkout activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentCheckouts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">No checkouts found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCheckouts.map((checkout) => (
                    <div key={checkout.id} className="flex items-center justify-between p-3 bg-white/5 rounded">
                      <div>
                        <div className="font-medium text-sm">
                          {checkout.name || `Checkout #${checkout.id}`}
                        </div>
                        <div className="text-xs text-white/70">
                          {checkout.email || 'No email'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {formatCurrency(parseFloat(checkout.totalPrice), checkout.currency)}
                        </div>
                        <div className="text-xs text-white/70">
                          {formatDate(checkout.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalOrders}
                </div>
                <p className="text-xs text-white/80">All orders</p>
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
                  {formatCurrency(summary.totalRevenue, currency)}
                </div>
                <p className="text-xs text-white/80">From all orders</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  Average Order Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalOrders > 0 
                    ? formatCurrency(summary.totalRevenue / summary.totalOrders, currency)
                    : formatCurrency(0, currency)
                  }
                </div>
                <p className="text-xs text-white/80">Per order</p>
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
                <p className="text-xs text-white/80">Checkout to order</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-white">All Orders</CardTitle>
              <CardDescription className="text-white/80">
                Complete list of order activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">No orders found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-white/5 rounded">
                      <div>
                        <div className="font-medium text-sm">
                          {order.name}
                        </div>
                        <div className="text-xs text-white/70">
                          {order.email || 'No email'} • {order.financialStatus}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {formatCurrency(parseFloat(order.totalPrice), order.currency)}
                        </div>
                        <div className="text-xs text-white/70">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
