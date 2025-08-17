import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { KPICards } from "@/components/dashboard/KPICards";
import { ShopifyKPICards } from "@/components/dashboard/ShopifyKPICards";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { EventsTable } from "@/components/dashboard/EventsTable";
import { ShopifyOrdersTable } from "@/components/dashboard/ShopifyOrdersTable";
import { useGadgetEvents, useGadgetOrders, useGadgetAggregates, extractEventsFromPages, extractOrdersFromPages, extractAggregatesFromPages } from "@/hooks/useGadget";
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
  const [referralUrls, setReferralUrls] = useState<ReferralUrls | null>(null);
  const [shopDomain, setShopDomain] = useState("checkoutipick.myshopify.com");
  const [shopifyAccessToken, setShopifyAccessToken] = useState("shpua_2b819ec253e95573ad4e8d3e0a2af183");
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const navigate = useNavigate();

  // Gadget data hooks
  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
    fetchNextPage: fetchNextEvents,
    hasNextPage: hasNextEvents,
    isFetchingNextPage: isFetchingNextEvents,
  } = useGadgetEvents({
    first: 100,
    shopDomain: shopDomain || undefined,
    eventType: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
    from: dateRange.from,
    to: dateRange.to,
  });

  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    fetchNextPage: fetchNextOrders,
    hasNextPage: hasNextOrders,
    isFetchingNextPage: isFetchingNextOrders,
  } = useGadgetOrders({
    first: 100,
    shopDomain: shopDomain || undefined,
    from: dateRange.from,
    to: dateRange.to,
  });

  const {
    data: aggregatesData,
    isLoading: aggregatesLoading,
    error: aggregatesError,
    fetchNextPage: fetchNextAggregates,
    hasNextPage: hasNextAggregates,
    isFetchingNextPage: isFetchingNextAggregates,
  } = useGadgetAggregates({
    first: 30,
    shopDomain: shopDomain || undefined,
    from: dateRange.from,
    to: dateRange.to,
  });

  // Extract data from infinite query results
  const events = extractEventsFromPages(eventsData);
  const orders = extractOrdersFromPages(ordersData);
  const aggregates = extractAggregatesFromPages(aggregatesData);

  const isLoading = eventsLoading || ordersLoading || aggregatesLoading;
  const hasError = eventsError || ordersError || aggregatesError;

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

  useEffect(() => {
    fetchReferralUrls();
  }, [navigate]);

  const handleClearFilters = () => {
    setShopDomain("checkoutipick.myshopify.com");
    setShopifyAccessToken("shpua_2b819ec253e95573ad4e8d3e0a2af183");
    setDateRange({
      from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd')
    });
    setSelectedEventTypes([]);
  };

  if (hasError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">
          Failed to load dashboard data. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-white/80">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <FiltersBar
        shopDomain={shopDomain}
        onShopDomainChange={setShopDomain}
        shopifyAccessToken={shopifyAccessToken}
        onShopifyAccessTokenChange={setShopifyAccessToken}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedEventTypes={selectedEventTypes}
        onEventTypesChange={setSelectedEventTypes}
        onClearFilters={handleClearFilters}
      />

      {/* Shopify KPI Cards */}
      <ShopifyKPICards
        shopDomain={shopDomain}
        accessToken={shopifyAccessToken}
        dateRange={dateRange}
        aggregates={aggregates}
        events={events}
        isLoading={isLoading}
      />

      {/* Shopify Orders Table */}
      <ShopifyOrdersTable
        shopDomain={shopDomain}
        accessToken={shopifyAccessToken}
        dateRange={dateRange}
      />

      {/* Gadget Events Table */}
      <EventsTable
        events={events}
        isLoading={eventsLoading}
        hasNextPage={hasNextEvents}
        isFetchingNextPage={isFetchingNextEvents}
        onLoadMore={() => fetchNextEvents()}
      />

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
