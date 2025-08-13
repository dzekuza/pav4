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
import { SearchHeader } from "@/components/SearchHeader";
import { Eye, ShoppingCart, DollarSign, Calendar, Filter, Trash2 } from "lucide-react";
import { useBusinessAuth } from "@/hooks/use-auth";

interface ActivityItem {
  id: string;
  type: "click" | "purchase" | "add_to_cart" | "checkout_start" | "checkout_complete" | "page_view" | "product_view";
  productName: string;
  productUrl: string;
  status: "browsed" | "purchased" | "abandoned" | "added to cart" | "checkout started" | "checkout completed" | "viewed";
  amount?: number;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  ip?: string;
  customerId?: string;
}

export default function BusinessActivity() {
  const { business } = useBusinessAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "clicks" | "purchases" | "add_to_cart" | "checkout" | "page_views">("all");
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    conversionRate: 0,
  });
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setIsLoading(true);

      // Fetch click logs, conversions, and tracking events
      const [clicksResponse, conversionsResponse, eventsResponse] = await Promise.all([
        fetch("/api/business/activity/clicks", { credentials: "include" }),
        fetch("/api/business/activity/conversions", { credentials: "include" }),
        fetch("/api/business/activity/events", { credentials: "include" }),
      ]);

      const clicksJson = clicksResponse.ok
        ? await clicksResponse.json()
        : { clicks: [] };
      const conversionsJson = conversionsResponse.ok
        ? await conversionsResponse.json()
        : { conversions: [] };
      const eventsJson = eventsResponse.ok
        ? await eventsResponse.json()
        : { events: [] };

      const clicks = Array.isArray(clicksJson)
        ? clicksJson
        : clicksJson.clicks || [];
      const conversions = Array.isArray(conversionsJson)
        ? conversionsJson
        : conversionsJson.conversions || [];
      const events = Array.isArray(eventsJson)
        ? eventsJson
        : eventsJson.events || [];

      // Combine and format the data
      const combinedActivities: ActivityItem[] = [
        ...clicks.map((click: any) => ({
          id: `click-${click.id}`,
          type: "click" as const,
          productName: extractProductName(click.productUrl),
          productUrl: click.productUrl,
          status: "browsed" as const,
          timestamp: click.timestamp,
          userAgent: click.userAgent,
          referrer: click.referrer,
          ip: click.ipAddress,
        })),
        ...conversions.map((conversion: any) => ({
          id: `purchase-${conversion.id}`,
          type: "purchase" as const,
          productName: `Order ${conversion.orderId}`,
          productUrl: conversion.domain,
          status: "purchased" as const,
          amount: conversion.amount,
          timestamp: conversion.timestamp,
          customerId: conversion.customerId,
        })),
        ...events.map((event: any) => {
          const eventData = typeof event.eventData === 'string' 
            ? JSON.parse(event.eventData) 
            : event.eventData || {};
          
          return {
            id: `event-${event.id}`,
            type: event.eventType as any,
            productName: getEventProductName(event, eventData),
            productUrl: event.url || eventData.url || '',
            status: getEventStatus(event.eventType),
            amount: eventData.total || eventData.value || eventData.price,
            timestamp: event.timestamp,
            userAgent: event.userAgent,
            referrer: event.referrer,
            ip: event.ipAddress,
          };
        }),
      ];

      // Sort by timestamp (newest first)
      combinedActivities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      setActivities(combinedActivities);

      // Calculate stats including tracking events
      const totalClicks = clicks.length;
      const totalPurchases = conversions.length;
      const totalRevenue = conversions.reduce(
        (sum: number, conv: any) => sum + conv.amount,
        0,
      );
      
      // Add revenue from tracking events
      const trackingRevenue = events.reduce((sum: number, event: any) => {
        const eventData = typeof event.eventData === 'string' 
          ? JSON.parse(event.eventData) 
          : event.eventData || {};
        return sum + (eventData.total || eventData.value || 0);
      }, 0);
      
      const totalRevenueCombined = totalRevenue + trackingRevenue;
      const conversionRate =
        totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;

      setStats({
        totalClicks,
        totalPurchases,
        totalRevenue: totalRevenueCombined,
        conversionRate,
      });
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearActivity = async () => {
    if (!confirm("Are you sure you want to clear all activity data? This action cannot be undone.")) {
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
        });
        
        // Show success message
        alert("Activity data cleared successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to clear activity: ${errorData.error || "Unknown error"}`);
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
      const pathParts = urlObj.pathname
        .split("/")
        .filter((part) => part.length > 0);
      const lastPart = pathParts[pathParts.length - 1];
      return lastPart
        ? lastPart
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())
        : "Product";
    } catch {
      return "Product";
    }
  };

  const getEventProductName = (event: any, eventData: any): string => {
    // Try to get product name from event data first
    if (eventData.productName || eventData.title) {
      return eventData.productName || eventData.title;
    }
    
    // Try to extract from URL
    if (event.url) {
      return extractProductName(event.url);
    }
    
    // Default based on event type
    switch (event.eventType) {
      case 'page_view':
        return 'Page View';
      case 'checkout_start':
      case 'checkout_complete':
        return 'Checkout';
      case 'add_to_cart':
        return eventData.productName || 'Product Added to Cart';
      default:
        return 'Product';
    }
  };

  const getEventStatus = (eventType: string): string => {
    switch (eventType) {
      case 'add_to_cart':
        return 'added to cart';
      case 'checkout_start':
        return 'checkout started';
      case 'checkout_complete':
        return 'checkout completed';
      case 'page_view':
        return 'viewed';
      case 'product_view':
        return 'viewed';
      case 'purchase':
        return 'purchased';
      default:
        return 'viewed';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "purchased":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Purchased
          </Badge>
        );
      case "checkout completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Checkout Completed
          </Badge>
        );
      case "checkout started":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Checkout Started
          </Badge>
        );
      case "added to cart":
        return (
          <Badge variant="default" className="bg-orange-100 text-orange-800">
            Added to Cart
          </Badge>
        );
      case "browsed":
        return <Badge variant="secondary">Browsed</Badge>;
      case "viewed":
        return <Badge variant="secondary">Viewed</Badge>;
      case "abandoned":
        return <Badge variant="destructive">Abandoned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "click":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "purchase":
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case "add_to_cart":
        return <ShoppingCart className="h-4 w-4 text-orange-500" />;
      case "checkout_start":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case "checkout_complete":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "page_view":
        return <Eye className="h-4 w-4 text-gray-500" />;
      case "product_view":
        return <Eye className="h-4 w-4 text-purple-500" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    if (filter === "clicks") return activity.type === "click";
    if (filter === "purchases") return activity.type === "purchase";
    if (filter === "add_to_cart") return activity.type === "add_to_cart";
    if (filter === "checkout") return activity.type === "checkout_start" || activity.type === "checkout_complete";
    if (filter === "page_views") return activity.type === "page_view" || activity.type === "product_view";
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader showBackButton={false} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">User Activity</h1>
          <p className="text-white/70">
            Track user interactions and purchases for{" "}
            {business?.name || "your business"}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6 mb-8">
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
                Total Purchases
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-white/80">Total sales revenue</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Conversion Rate
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.conversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-white/80">Click to purchase ratio</p>
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
                {activities.filter(a => a.type === 'add_to_cart').length.toLocaleString()}
              </div>
              <p className="text-xs text-white/80">Cart additions</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Checkouts
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities.filter(a => a.type === 'checkout_start' || a.type === 'checkout_complete').length.toLocaleString()}
              </div>
              <p className="text-xs text-white/80">Checkout events</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => setFilter("all")}
              className={`${filter === "all" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
            >
              All Activity
            </Button>
            <Button
              size="sm"
              onClick={() => setFilter("clicks")}
              className={`${filter === "clicks" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
            >
              Clicks Only
            </Button>
            <Button
              size="sm"
              onClick={() => setFilter("add_to_cart")}
              className={`${filter === "add_to_cart" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
            >
              Add to Cart
            </Button>
            <Button
              size="sm"
              onClick={() => setFilter("checkout")}
              className={`${filter === "checkout" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
            >
              Checkout
            </Button>
            <Button
              size="sm"
              onClick={() => setFilter("purchases")}
              className={`${filter === "purchases" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
            >
              Purchases Only
            </Button>
            <Button
              size="sm"
              onClick={() => setFilter("page_views")}
              className={`${filter === "page_views" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"} rounded-full`}
            >
              Page Views
            </Button>
          </div>
          <Button
            size="sm"
            onClick={fetchActivity}
            className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            <Filter className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={clearActivity}
            disabled={isClearing || activities.length === 0}
            variant="destructive"
            className="rounded-full bg-red-600 hover:bg-red-700 text-white border border-red-500"
          >
            {isClearing ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {isClearing ? "Clearing..." : "Clear Activity"}
          </Button>
        </div>

        {/* Activity Table */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activity found</p>
                <p className="text-sm text-white/70">
                  User activity will appear here once customers start browsing
                  your products
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(activity.type)}
                            <span className="capitalize">{activity.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            <div className="font-medium">
                              {activity.productName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {activity.productUrl}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(activity.status)}</TableCell>
                        <TableCell>
                          {activity.amount ? (
                            <span className="font-medium text-green-600">
                              ${activity.amount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {activity.customerId && (
                              <div>Customer: {activity.customerId}</div>
                            )}
                            {activity.ip && <div>IP: {activity.ip}</div>}
                          </div>
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
    </div>
  );
}
