import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, ShoppingCart, DollarSign, Calendar, Filter } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'click' | 'purchase';
  productName: string;
  productUrl: string;
  status: 'browsed' | 'purchased' | 'abandoned';
  amount?: number;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  ip?: string;
}

export default function BusinessActivityDashboard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'clicks' | 'purchases'>('all');
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setIsLoading(true);
      
      // Fetch both click logs and conversions
      const [clicksResponse, conversionsResponse] = await Promise.all([
        fetch('/api/business/activity/clicks', { credentials: 'include' }),
        fetch('/api/business/activity/conversions', { credentials: 'include' })
      ]);

      const clicks = clicksResponse.ok ? await clicksResponse.json() : [];
      const conversions = conversionsResponse.ok ? await conversionsResponse.json() : [];

      // Combine and format the data
      const combinedActivities: ActivityItem[] = [
        ...clicks.map((click: any) => ({
          id: `click-${click.id}`,
          type: 'click' as const,
          productName: extractProductName(click.productId),
          productUrl: click.productId,
          status: 'browsed' as const,
          timestamp: click.timestamp,
          userAgent: click.userAgent,
          referrer: click.referrer,
          ip: click.ip
        })),
        ...conversions.map((conversion: any) => ({
          id: `purchase-${conversion.id}`,
          type: 'purchase' as const,
          productName: `Order ${conversion.orderId}`,
          productUrl: conversion.domain,
          status: 'purchased' as const,
          amount: conversion.amount,
          timestamp: conversion.timestamp,
          customerId: conversion.customerId
        }))
      ];

      // Sort by timestamp (newest first)
      combinedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(combinedActivities);

      // Calculate stats
      const totalClicks = clicks.length;
      const totalPurchases = conversions.length;
      const totalRevenue = conversions.reduce((sum: number, conv: any) => sum + conv.amount, 0);
      const conversionRate = totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;

      setStats({
        totalClicks,
        totalPurchases,
        totalRevenue,
        conversionRate
      });

    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoading(false);
    }
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
        return <Badge className="bg-green-100 text-green-800">Purchased</Badge>;
      case 'browsed':
        return <Badge className="bg-blue-100 text-blue-800">Browsed</Badge>;
      case 'abandoned':
        return <Badge className="bg-red-100 text-red-800">Abandoned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'click':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
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
    return true;
  });

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Product page visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Successful conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Revenue from purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Click to purchase ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Activity
        </Button>
        <Button
          variant={filter === 'clicks' ? 'default' : 'outline'}
          onClick={() => setFilter('clicks')}
        >
          Clicks Only
        </Button>
        <Button
          variant={filter === 'purchases' ? 'default' : 'outline'}
          onClick={() => setFilter('purchases')}
        >
          Purchases Only
        </Button>
      </div>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No activity found for the selected filter.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.slice(0, 20).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(activity.type)}
                        <span className="capitalize">{activity.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        <a 
                          href={activity.productUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {activity.productName}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(activity.status)}
                    </TableCell>
                    <TableCell>
                      {activity.amount ? `$${activity.amount.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(activity.timestamp)}
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