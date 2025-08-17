import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, X } from "lucide-react";
import { format, subDays } from 'date-fns';

interface FiltersBarProps {
  shopDomain: string;
  onShopDomainChange: (domain: string) => void;
  shopifyAccessToken?: string;
  onShopifyAccessTokenChange?: (token: string) => void;
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  selectedEventTypes: string[];
  onEventTypesChange: (types: string[]) => void;
  onClearFilters: () => void;
}

const EVENT_TYPE_OPTIONS = [
  'page_view',
  'product_view',
  'add_to_cart',
  'checkout_start',
  'purchase',
  'click',
];

export function FiltersBar({
  shopDomain,
  onShopDomainChange,
  shopifyAccessToken,
  onShopifyAccessTokenChange,
  dateRange,
  onDateRangeChange,
  selectedEventTypes,
  onEventTypesChange,
  onClearFilters,
}: FiltersBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQuickDateSelect = (days: number) => {
    const to = new Date().toISOString().split('T')[0];
    const from = format(subDays(new Date(), days), 'yyyy-MM-dd');
    onDateRangeChange({ from, to });
  };

  const toggleEventType = (eventType: string) => {
    if (selectedEventTypes.includes(eventType)) {
      onEventTypesChange(selectedEventTypes.filter(t => t !== eventType));
    } else {
      onEventTypesChange([...selectedEventTypes, eventType]);
    }
  };

  const hasActiveFilters = shopDomain || selectedEventTypes.length > 0 || 
    dateRange.from !== format(subDays(new Date(), 30), 'yyyy-MM-dd') || 
    dateRange.to !== format(new Date(), 'yyyy-MM-dd');

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-white border-white/30 hover:bg-white/10"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white border-white/30 hover:bg-white/10"
            >
              {isExpanded ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Shop Domain Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Shop Domain</label>
            <Input
              type="text"
              placeholder="e.g., shop.myshopify.com"
              value={shopDomain}
              onChange={(e) => onShopDomainChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          {/* Shopify Access Token Filter */}
          {onShopifyAccessTokenChange && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Shopify Access Token</label>
              <Input
                type="password"
                placeholder="shpua_..."
                value={shopifyAccessToken || ""}
                onChange={(e) => onShopifyAccessTokenChange(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <p className="text-xs text-white/60">
                Required to fetch Shopify data. Get this from your Shopify Partner account.
              </p>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateSelect(7)}
                className="text-white border-white/30 hover:bg-white/10"
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateSelect(30)}
                className="text-white border-white/30 hover:bg-white/10"
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateSelect(90)}
                className="text-white border-white/30 hover:bg-white/10"
              >
                Last 90 days
              </Button>
            </div>
          </div>

          {/* Event Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Event Types</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPE_OPTIONS.map((eventType) => (
                <Badge
                  key={eventType}
                  variant={selectedEventTypes.includes(eventType) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    selectedEventTypes.includes(eventType)
                      ? 'bg-blue-600 text-white'
                      : 'text-white border-white/30 hover:bg-white/10'
                  }`}
                  onClick={() => toggleEventType(eventType)}
                >
                  {eventType.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-white/10">
              <div className="text-sm text-white/80 mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-2">
                {shopDomain && (
                  <Badge variant="secondary" className="text-white bg-white/20">
                    Shop: {shopDomain}
                  </Badge>
                )}
                {selectedEventTypes.length > 0 && (
                  <Badge variant="secondary" className="text-white bg-white/20">
                    Events: {selectedEventTypes.length}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-white bg-white/20">
                  Date: {dateRange.from} to {dateRange.to}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
