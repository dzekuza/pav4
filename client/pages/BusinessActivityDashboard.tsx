import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    conversionRate: 0,
    totalAddToCart: 0,
    totalPageViews: 0,
    totalProductViews: 0,
    cartToPurchaseRate: 0,
    averageOrderValue: 0,
    totalSessions: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/business/auth/check', { credentials: 'include' });
        if (response.status === 401) {
          navigate('/business/login');
          return;
        }
        fetchActivity();
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/business/login');
      }
    };
    checkAuth();
  }, [navigate]);

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

      // Check if any response is not ok
      if (!clicksResponse.ok || !conversionsResponse.ok || !eventsResponse.ok) {
        // Check if it's an authentication error
        if (clicksResponse.status === 401 || conversionsResponse.status === 401 || eventsResponse.status === 401) {
          navigate('/business-login');
          return;
        }
        throw new Error('Failed to fetch activity data. Please try again.');
      }

      // Check content type to ensure we're getting JSON
      const contentType = clicksResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format. Please try again.');
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
          productName: conversion.productTitle || extractProductName(conversion.productUrl),
          productUrl: conversion.productUrl,
          status: 'purchased' as const,
          amount: conversion.productPrice ? parseFloat(conversion.productPrice) : undefined,
          timestamp: conversion.timestamp,
          userAgent: conversion.userAgent,
          referrer: conversion.referrer,
          ip: conversion.ipAddress
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
      const totalPageViews = events.filter((e: any) => e.eventType === 'page_view').length;
      const totalProductViews = events.filter((e: any) => e.eventType === 'product_view').length;
      
      const totalRevenue = conversions.reduce((sum: number, conv: any) => sum + (conv.amount || 0), 0) +
                          events.filter((e: any) => e.eventType === 'purchase')
                                .reduce((sum: number, e: any) => {
                                  const eventData = typeof e.eventData === 'string' ? JSON.parse(e.eventData) : e.eventData;
                                  return sum + (eventData.total || 0);
                                }, 0);
      
      const conversionRate = totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;
      const cartToPurchaseRate = totalAddToCart > 0 ? (totalPurchases / totalAddToCart) * 100 : 0;
      const averageOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;
      
      // Count unique sessions from all data sources
      const allSessionIds = new Set([
        ...clicks.map((c: any) => c.sessionId).filter(Boolean),
        ...conversions.map((c: any) => c.sessionId).filter(Boolean),
        ...events.map((e: any) => e.sessionId).filter(Boolean)
      ]);
      const totalSessions = allSessionIds.size;

      setStats({
        totalClicks,
        totalPurchases,
        totalRevenue,
        conversionRate,
        totalAddToCart,
        totalPageViews,
        totalProductViews,
        cartToPurchaseRate,
        averageOrderValue,
        totalSessions
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
            <CardTitle className="text-sm font-medium text-white">Add to Cart</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAddToCart.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Cart additions
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
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
            <DollarSign className="h-4 w-4 text-green-500" />
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
            <CardTitle className="text-sm font-medium text-white">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-white/80">
              Average per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Page visits
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Product Views</CardTitle>
            <Eye className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProductViews.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Product page visits
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Conversion Rate</CardTitle>
            <Filter className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-white/80">
              Click to purchase
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Cart Conversion</CardTitle>
            <Filter className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cartToPurchaseRate.toFixed(1)}%</div>
            <p className="text-xs text-white/80">
              Cart to purchase
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Unique sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {stats.totalPurchases > 0 ? stats.conversionRate.toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-white/80">Click to Purchase Rate</div>
              <div className="text-xs text-white/60 mt-1">
                {stats.totalClicks} clicks → {stats.totalPurchases} purchases
              </div>
            </div>
            
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {stats.totalAddToCart > 0 ? stats.cartToPurchaseRate.toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-white/80">Cart to Purchase Rate</div>
              <div className="text-xs text-white/60 mt-1">
                {stats.totalAddToCart} cart additions → {stats.totalPurchases} purchases
              </div>
            </div>
            
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                ${stats.averageOrderValue.toFixed(2)}
              </div>
              <div className="text-sm text-white/80">Average Order Value</div>
              <div className="text-xs text-white/60 mt-1">
                Total: ${stats.totalRevenue.toFixed(2)} / {stats.totalPurchases} orders
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
          className="bg-white/10 text-white hover:bg-white/20 rounded-full sm:ml-auto w-full sm:w-auto"
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead className="text-white border-b border-white/20 pb-3">Type</TableHead>
                    <TableHead className="text-white border-b border-white/20 pb-3">Product</TableHead>
                    <TableHead className="text-white border-b border-white/20 pb-3">Status</TableHead>
                    <TableHead className="text-white border-b border-white/20 pb-3 hidden sm:table-cell">Amount</TableHead>
                    <TableHead className="text-white border-b border-white/20 pb-3">Date</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredActivities.slice(0, 20).map((activity, index) => (
                  <TableRow 
                    key={activity.id}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(activity.type)}
                        <span className="capitalize text-white">{activity.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="max-w-[150px] sm:max-w-xs truncate">
                        <a 
                          href={activity.productUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-white hover:underline transition-colors duration-200"
                          title={activity.productName}
                        >
                          {activity.productName}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(activity.status)}
                    </TableCell>
                    <TableCell className="py-4 hidden sm:table-cell">
                      <span className="text-white">{activity.amount ? `$${activity.amount.toFixed(2)}` : '-'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-white/60" />
                        <span className="text-white/80">{formatDate(activity.timestamp)}</span>
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
  );
} 