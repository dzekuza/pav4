import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Users, ShoppingCart, DollarSign, Eye } from "lucide-react";
import { getCompleteAnalytics } from "@/lib/tracking";

interface AnalyticsEvent {
  event_type: string;
  timestamp: string;
  business_domain: string;
  data: any;
}

interface AnalyticsSummary {
  totalClicks: number;
  totalCheckouts: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

export function BusinessAnalyticsDashboard({ businessDomain }: { businessDomain: string }) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null
  });

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const analyticsData = await getCompleteAnalytics(
        businessDomain,
        dateRange.startDate,
        dateRange.endDate
      );
      
      setEvents(analyticsData);
      
      // Calculate summary
      const clicks = analyticsData.filter(e => e.event_type === 'product_click').length;
      const checkouts = analyticsData.filter(e => e.event_type === 'checkout_start').length;
      const orders = analyticsData.filter(e => e.event_type === 'order_created').length;
      const revenue = analyticsData
        .filter(e => e.event_type === 'order_created')
        .reduce((sum, e) => sum + parseFloat(e.data.totalPrice || 0), 0);
      
      const conversionRate = clicks > 0 ? (orders / clicks) * 100 : 0;
      const averageOrderValue = orders > 0 ? revenue / orders : 0;
      
      setSummary({
        totalClicks: clicks,
        totalCheckouts: checkouts,
        totalOrders: orders,
        totalRevenue: revenue,
        conversionRate,
        averageOrderValue
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (businessDomain) {
      loadAnalytics();
    }
  }, [businessDomain, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'product_click':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'checkout_start':
        return <ShoppingCart className="w-4 h-4 text-orange-500" />;
      case 'checkout_complete':
        return <ShoppingCart className="w-4 h-4 text-green-500" />;
      case 'order_created':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'product_click':
        return 'bg-blue-100 text-blue-800';
      case 'checkout_start':
        return 'bg-orange-100 text-orange-800';
      case 'checkout_complete':
        return 'bg-green-100 text-green-800';
      case 'order_created':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Complete customer journey for {businessDomain}
          </p>
        </div>
        <Button onClick={loadAnalytics} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalClicks}</div>
              <p className="text-xs text-muted-foreground">
                Product page visits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checkouts</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCheckouts}</div>
              <p className="text-xs text-muted-foreground">
                Started checkout process
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Completed purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Total sales value
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversion Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {summary.conversionRate.toFixed(2)}%
              </div>
              <p className="text-sm text-muted-foreground">
                {summary.totalOrders} orders from {summary.totalClicks} clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(summary.averageOrderValue)}
              </div>
              <p className="text-sm text-muted-foreground">
                Per completed order
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Journey Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete flow from click to purchase
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getEventColor(event.event_type)}>
                        {event.event_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm">
                      {event.event_type === 'product_click' && (
                        <p>User clicked on product: <strong>{event.data.product_name}</strong></p>
                      )}
                      {event.event_type === 'checkout_start' && (
                        <p>User started checkout - Total: <strong>{formatCurrency(parseFloat(event.data.totalPrice || 0))}</strong></p>
                      )}
                      {event.event_type === 'checkout_complete' && (
                        <p>User completed checkout - Total: <strong>{formatCurrency(parseFloat(event.data.totalPrice || 0))}</strong></p>
                      )}
                      {event.event_type === 'order_created' && (
                        <p>Order created - Total: <strong>{formatCurrency(parseFloat(event.data.totalPrice || 0))}</strong> | Status: <strong>{event.data.financialStatus}</strong></p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No analytics data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
