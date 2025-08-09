import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, ShoppingCart, DollarSign, Calendar, Filter, RefreshCw, AlertCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'click' | 'purchase' | 'add_to_cart' | 'page_view' | 'product_view' | 'conversion';
  productName: string;
  productUrl: string;
  status: 'browsed' | 'purchased' | 'abandoned' | 'added_to_cart' | 'viewed';
  amount?: number;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  ip?: string;
  eventData?: any;
  platform?: string;
  sessionId?: string;
}

export default function BusinessActivityDashboard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'clicks' | 'purchases' | 'add_to_cart' | 'page_views'>('all');
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Fetch clicks, conversions, and tracking events
      const [clicksResponse, conversionsResponse, eventsResponse] = await Promise.all([
        fetch('/api/business/activity/clicks', { credentials: 'include' }),
        fetch('/api/business/activity/conversions', { credentials: 'include' }),
        fetch('/api/business/activity/events', { credentials: 'include' })
      ]);

      if (!clicksResponse.ok || !conversionsResponse.ok || !eventsResponse.ok) {
        throw new Error('Failed to fetch activity data');
      }

      const clicksJson = await clicksResponse.json();
      const conversionsJson = await conversionsResponse.json();
      const eventsJson = await eventsResponse.json();

      const clicks = Array.isArray(clicksJson) ? clicksJson : (clicksJson.clicks || []);
      const conversions = Array.isArray(conversionsJson) ? conversionsJson : (conversionsJson.conversions || []);
      const events = Array.isArray(eventsJson) ? eventsJson : (eventsJson.events || []);

      // Combine and format the data
      const combinedActivities: ActivityItem[] = [
        // Business clicks
        ...clicks.map((click: any) => ({
          id: `click-${click.id}`,
          type: 'click' as const,
          productName: extractProductName(click.productUrl),
          productUrl: click.productUrl,
          status: 'browsed' as const,
          timestamp: click.timestamp,
          userAgent: click.userAgent,
          referrer: click.referrer,
          ip: click.ipAddress
        })),
        // Business conversions
        ...conversions.map((conversion: any) => ({
          id: `conversion-${conversion.id}`,
          type: 'conversion' as const,
          productName: conversion.productTitle || `Order ${conversion.orderId}`,
          productUrl: conversion.productUrl || conversion.domain,
          status: 'purchased' as const,
          amount: conversion.amount,
          timestamp: conversion.timestamp,
          customerId: conversion.customerId
        })),
        // Tracking events (add to cart, purchases, page views, etc.)
        ...events.map((event: any) => {
          const eventData = typeof event.eventData === 'string' ? JSON.parse(event.eventData) : event.eventData;
          
          let type: ActivityItem['type'] = 'click';
          let status: ActivityItem['status'] = 'browsed';
          let productName = 'Product';
          let amount: number | undefined;

          switch (event.eventType) {
            case 'add_to_cart':
              type = 'add_to_cart';
              status = 'added_to_cart';
              productName = eventData.product_name || 'Product';
              break;
            case 'purchase':
              type = 'purchase';
              status = 'purchased';
              productName = `Order ${eventData.order_id || 'Unknown'}`;
              amount = eventData.total;
              break;
            case 'page_view':
              type = 'page_view';
              status = 'viewed';
              productName = 'Page View';
              break;
            case 'product_view':
              type = 'product_view';
              status = 'viewed';
              productName = eventData.product_name || 'Product';
              break;
            default:
              type = 'click';
              status = 'browsed';
          }

          return {
            id: `event-${event.id}`,
            type,
            productName,
            productUrl: event.url || '',
            status,
            amount,
            timestamp: event.timestamp,
            userAgent: event.userAgent,
            referrer: event.referrer,
            ip: event.ipAddress,
            eventData,
            platform: event.platform,
            sessionId: event.sessionId
          };
        })
      ];

      // Sort by timestamp (newest first)
      combinedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(combinedActivities);

      // Calculate stats
      const totalClicks = clicks.length;
      const totalPurchases = conversions.length + events.filter((e: any) => e.eventType === 'purchase').length;
      const totalAddToCart = events.filter((e: any) => e.eventType === 'add_to_cart').length;
      const totalRevenue = conversions.reduce((sum: number, conv: any) => sum + (conv.amount || 0), 0) +
                          events.filter((e: any) => e.eventType === 'purchase')
                                .reduce((sum: number, e: any) => {
                                  const eventData = typeof e.eventData === 'string' ? JSON.parse(e.eventData) : e.eventData;
                                  return sum + (eventData.total || 0);
                                }, 0);
      const conversionRate = totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;

      setStats({
        totalClicks,
        totalPurchases,
        totalRevenue,
        conversionRate
      });

    } catch (error) {
      console.error('Error fetching activity:', error);
      setError('Failed to load activity data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchActivity(true);
  };

  const extractProductName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      return pathParts[pathParts.length - 1] || 'Product';
    } catch {
      return 'Product';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'purchased':
        return <Badge className="bg-green-500/20 text-green-300 border-0">Purchased</Badge>;
      case 'browsed':
        return <Badge className="bg-blue-500/20 text-blue-300 border-0">Browsed</Badge>;
      case 'abandoned':
        return <Badge className="bg-red-500/20 text-red-300 border-0">Abandoned</Badge>;
      case 'added_to_cart':
        return <Badge className="bg-orange-500/20 text-orange-300 border-0">Added to Cart</Badge>;
      case 'viewed':
        return <Badge className="bg-purple-500/20 text-purple-300 border-0">Viewed</Badge>;
      default:
        return <Badge variant="outline" className="text-white border-white/30">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'click':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'purchase':
      case 'conversion':
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case 'add_to_cart':
        return <ShoppingCart className="h-4 w-4 text-orange-600" />;
      case 'page_view':
        return <Eye className="h-4 w-4 text-purple-600" />;
      case 'product_view':
        return <Eye className="h-4 w-4 text-indigo-600" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'clicks') return activity.type === 'click';
    if (filter === 'purchases') return activity.type === 'purchase';
    if (filter === 'add_to_cart') return activity.type === 'add_to_cart';
    if (filter === 'page_views') return activity.type === 'page_view';
    return true;
  });

  if (isLoading && !isRefreshing) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 text-white">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <Button onClick={handleRefresh} className="bg-red-500 hover:bg-red-600 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Clicks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Product page visits
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Successful conversions
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Revenue from purchases
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Conversion Rate</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-white/80">
              Click to purchase ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          onClick={() => setFilter('all')}
          className={`${filter === 'all' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} rounded-full`}
        >
          All Activity
        </Button>
        <Button
          onClick={() => setFilter('clicks')}
          className={`${filter === 'clicks' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} rounded-full`}
        >
          Clicks Only
        </Button>
        <Button
          onClick={() => setFilter('add_to_cart')}
          className={`${filter === 'add_to_cart' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} rounded-full`}
        >
          Add to Cart
        </Button>
        <Button
          onClick={() => setFilter('purchases')}
          className={`${filter === 'purchases' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} rounded-full`}
        >
          Purchases Only
        </Button>
        <Button
          onClick={() => setFilter('page_views')}
          className={`${filter === 'page_views' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} rounded-full`}
        >
          Page Views
        </Button>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-white/10 text-white hover:bg-white/20 rounded-full ml-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Activity Table */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-white/70">
              <p>No activity found for the selected filter.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Type</TableHead>
                  <TableHead className="text-white">Product</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Amount</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.slice(0, 20).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(activity.type)}
                        <span className="capitalize text-white">{activity.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        <a 
                          href={activity.productUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-white hover:underline"
                        >
                          {activity.productName}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(activity.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-white">{activity.amount ? `$${activity.amount.toFixed(2)}` : '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-white/80">{formatDate(activity.timestamp)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 