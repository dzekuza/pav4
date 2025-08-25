import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Users, ShoppingCart, Eye, CreditCard } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Business {
  id: string;
  name: string;
  domain: string;
  shopifyShop?: string;
  shopifyAccessToken?: string;
  shopifyScopes?: string;
  shopifyConnectedAt?: string;
  shopifyStatus?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReferralUrls {
  referralUrl: string;
  trackingUrl: string;
  affiliateId: string;
  instructions: {
    referralUrl: string;
    trackingUrl: string;
  };
}

interface TrackingEvent {
  id: string;
  eventType: string;
  eventData: any;
  businessId: string;
  affiliateId: string;
  platform: string;
  timestamp: string;
  url?: string;
  referrer?: string;
  userAgent?: string;
  sessionId?: string;
}

interface ShopifyEvent {
  id: string;
  event_id: string;
  shop_domain: string;
  topic: string;
  triggered_at: string;
  processed_at: string;
  event_type: string;
  resource_id: string;
  payload: any;
  metadata: any;
}

interface UnifiedEvent {
  id: string;
  sessionId: string;
  eventType: string;
  path: string;
  occurredAt: string;
  productId?: string | null;
  shopDomain?: string | null;
  clickId?: string | null;
  metadata?: any;
  value?: number | null;
  currency?: string | null;
}

export default function BusinessDashboardHome() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [referralUrls, setReferralUrls] = useState<ReferralUrls | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [shopifyEvents, setShopifyEvents] = useState<ShopifyEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Extract shop domain from business
  const shopDomain = business?.shopifyShop || "";
  const shopifyAccessToken = business?.shopifyAccessToken || "";

  useEffect(() => {
    fetchBusinessData();
  }, []);

  useEffect(() => {
    if (business) {
      fetchEvents();
    }
  }, [business, dateRange]);

  const fetchBusinessData = async () => {
    try {
      const response = await fetch("/api/business/dashboard");
      if (response.ok) {
        const data = await response.json();
        setBusiness(data.business);
        setReferralUrls(data.referralUrls);
      }
    } catch (error) {
      console.error("Error fetching business data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);

      // Fetch tracking events from our new tracking system
      const trackingResponse = await fetch(`/api/business/activity/events?limit=100`, {
        credentials: "include",
      });

      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        setTrackingEvents(trackingData.events || []);
      }

      // Fetch Shopify webhook events if connected
      if (shopifyAccessToken) {
        const shopifyResponse = await fetch(`/api/shopify/events?shop=${shopDomain}&limit=100`);
        if (shopifyResponse.ok) {
          const shopifyData = await shopifyResponse.json();
          setShopifyEvents(shopifyData.events || []);
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setEventsLoading(false);
    }
  };

  // Convert events to unified format for display
  const getUnifiedEvents = (): UnifiedEvent[] => {
    const convertedEvents: UnifiedEvent[] = [];
    
    // Convert tracking events from our new system
    trackingEvents.forEach(event => {
      convertedEvents.push({
        id: event.id,
        sessionId: event.sessionId || `session_${event.id}`,
        eventType: event.eventType,
        path: event.url || '',
        occurredAt: event.timestamp,
        productId: event.eventData?.productId || null,
        shopDomain: event.platform === 'shopify' ? event.affiliateId : null,
        clickId: event.affiliateId || null,
        metadata: event.eventData,
        value: event.eventData?.value || null,
        currency: event.eventData?.currency || null
      });
    });
    
    // Convert Shopify webhook events
    shopifyEvents.forEach(event => {
      convertedEvents.push({
        id: event.id,
        sessionId: `webhook_${event.id}`,
        eventType: event.topic,
        path: '',
        occurredAt: event.processed_at,
        productId: event.metadata?.productId || null,
        shopDomain: event.shop_domain,
        clickId: 'webhook',
        metadata: event.metadata,
        value: event.metadata?.value || null,
        currency: event.metadata?.currency || null
      });
    });
    
    return convertedEvents.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  };

  // Convert date range to string format for FiltersBar
  const stringDateRange = {
    from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  };

  const handleDateRangeChange = (range: { from: string; to: string }) => {
    setDateRange({
      from: new Date(range.from),
      to: new Date(range.to)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="mt-4 text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Business Not Found</h1>
          <p className="text-white/80">Please check your business configuration.</p>
        </div>
      </div>
    );
  }

  const unifiedEvents = getUnifiedEvents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {business.name}!
            </h1>
            <p className="text-white/80 mt-2">
              Track your affiliate performance and customer interactions
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-white border-white/20">
              {business.shopifyStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
            </Badge>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal text-white border-white/20",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Events
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {unifiedEvents.length.toLocaleString()}
              </div>
              <p className="text-xs text-white/80">
                All tracking events
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Page Views
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {unifiedEvents.filter(e => e.eventType === 'page_view').length.toLocaleString()}
              </div>
              <p className="text-xs text-white/80">
                Product page visits
              </p>
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
                {unifiedEvents.filter(e => e.eventType === 'add_to_cart').length.toLocaleString()}
              </div>
              <p className="text-xs text-white/80">
                Cart additions
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Checkouts
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {unifiedEvents.filter(e => e.eventType === 'checkout' || e.eventType === 'purchase_complete').length.toLocaleString()}
              </div>
              <p className="text-xs text-white/80">
                Checkout events
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Recent Events</CardTitle>
            <CardDescription className="text-white/80">
              Latest tracking events from your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-2 text-white">Loading events...</span>
              </div>
            ) : unifiedEvents.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events found</p>
                <p className="text-sm text-white/70">
                  Events will appear here once customers start browsing your products
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-medium text-white">Event Type</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Path</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Product ID</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-white">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unifiedEvents.slice(0, 10).map((event) => (
                      <tr key={event.id} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-white border-white/20">
                            {event.eventType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-white/80 max-w-xs truncate">
                          {event.path}
                        </td>
                        <td className="py-3 px-4 text-white/80">
                          {event.productId || '-'}
                        </td>
                        <td className="py-3 px-4 text-white/80">
                          {event.value ? `${event.currency || '$'}${event.value}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-white/80">
                          {format(new Date(event.occurredAt), 'MMM dd, HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral URLs */}
        {referralUrls && (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="text-white">Your Referral Links</CardTitle>
              <CardDescription className="text-white/80">
                Use these links to track affiliate performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white">Referral URL</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={referralUrls.referralUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(referralUrls.referralUrl)}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white">Tracking URL</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={referralUrls.trackingUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(referralUrls.trackingUrl)}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
