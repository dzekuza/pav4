import React, { useState } from 'react';
import { useGadgetEvents } from '../hooks/useGadgetEvents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, TrendingUp, Eye, ShoppingCart, CreditCard, Package } from 'lucide-react';

interface EventsDashboardProps {
  shopId?: string;
  shopDomain?: string;
}

export function EventsDashboard({ 
  shopId = "91283456333", // Default to the shop ID you provided
  shopDomain = "checkoutipick.myshopify.com"
}: EventsDashboardProps) {
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const from = new Date();
    
    switch (dateRange) {
      case '1d':
        from.setDate(now.getDate() - 1);
        break;
      case '7d':
        from.setDate(now.getDate() - 7);
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        break;
      case '90d':
        from.setDate(now.getDate() - 90);
        break;
      default:
        from.setDate(now.getDate() - 7);
    }
    
    return {
      from: from.toISOString(),
      to: now.toISOString()
    };
  };

  const { from, to } = getDateRange();
  
  const { 
    events, 
    stats, 
    shop, 
    loading, 
    error, 
    refetch, 
    loadMore, 
    hasNextPage 
  } = useGadgetEvents(shopId, {
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
    first: 100,
    dateFrom: from,
    dateTo: to,
    eventType: selectedEventType === 'all' ? undefined : [selectedEventType]
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return <Eye className="h-4 w-4" />;
      case 'product_view':
        return <Package className="h-4 w-4" />;
      case 'add_to_cart':
        return <ShoppingCart className="h-4 w-4" />;
      case 'begin_checkout':
      case 'checkout_completed':
        return <CreditCard className="h-4 w-4" />;
      case 'purchase':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading events data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-6">
        <AlertDescription>
          Error loading events: {error}
          <Button onClick={refetch} variant="outline" size="sm" className="ml-4">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Behavior Analytics</h1>
          <p className="text-muted-foreground">
            {shop?.name || shopDomain} • Shop ID: {shopId}
          </p>
        </div>
        <Button onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-type">Event Type</Label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="page_view">Page Views</SelectItem>
                  <SelectItem value="product_view">Product Views</SelectItem>
                  <SelectItem value="add_to_cart">Add to Cart</SelectItem>
                  <SelectItem value="begin_checkout">Begin Checkout</SelectItem>
                  <SelectItem value="checkout_completed">Checkout Completed</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentEvents} in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Event Types</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.eventTypeBreakdown).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Different event types tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentEvents}</div>
              <p className="text-xs text-muted-foreground">
                Events in last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event Type Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Event Type Breakdown</CardTitle>
            <CardDescription>
              Distribution of different event types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.eventTypeBreakdown).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="flex items-center gap-1">
                  {getEventIcon(type)}
                  {type.replace('_', ' ')}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            Latest customer interactions and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="table" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Session</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.eventType)}
                          <Badge variant="outline">
                            {event.eventType.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(event.occurredAt)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {event.path}
                      </TableCell>
                      <TableCell>
                        {event.productId ? (
                          <Badge variant="secondary">{event.productId}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {event.value ? formatCurrency(event.value, event.currency) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {event.sessionId.substring(0, 8)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {hasNextPage && (
                <div className="flex justify-center">
                  <Button onClick={loadMore} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list" className="space-y-4">
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getEventIcon(event.eventType)}
                          <div>
                            <h4 className="font-semibold capitalize">
                              {event.eventType.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(event.occurredAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {event.value && (
                            <p className="font-semibold">
                              {formatCurrency(event.value, event.currency)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Session: {event.sessionId.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Path:</span> {event.path}
                        </p>
                        {event.productId && (
                          <p className="text-sm">
                            <span className="font-medium">Product:</span> {event.productId}
                          </p>
                        )}
                        {event.quantity && (
                          <p className="text-sm">
                            <span className="font-medium">Quantity:</span> {event.quantity}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {hasNextPage && (
                <div className="flex justify-center">
                  <Button onClick={loadMore} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
