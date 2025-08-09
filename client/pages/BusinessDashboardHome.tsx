import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';

interface BusinessStats {
  id: number;
  name: string;
  domain: string;
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  adminCommissionRate: number;
  projectedFee: number;
  averageOrderValue: number;
  conversionRate: number;
}

export default function BusinessDashboardHome() {
  const { stats } = useOutletContext<{ stats: BusinessStats }>();

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  // Add default values to prevent undefined errors
  const safeStats = {
    totalVisits: stats.totalVisits || 0,
    totalPurchases: stats.totalPurchases || 0,
    totalRevenue: stats.totalRevenue || 0,
    adminCommissionRate: stats.adminCommissionRate || 0,
    projectedFee: stats.projectedFee || 0,
    averageOrderValue: stats.averageOrderValue || 0,
    conversionRate: stats.conversionRate || 0,
  };

  return (
    <div className="space-y-6 text-white">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Visits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.totalVisits.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Users who visited your products
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Successful purchases made
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${safeStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-white/80">
              Total sales revenue
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeStats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-white/80">
              Visit to purchase ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Revenue Analysis</CardTitle>
            <CardDescription className="text-white/80">
              Detailed breakdown of your business performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Average Order Value</span>
              <span className="text-sm font-bold text-white">${safeStats.averageOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Commission Rate</span>
              <Badge variant="outline" className="text-white border-white/30">{safeStats.adminCommissionRate}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Projected Fee</span>
              <span className="text-sm font-bold text-white">${safeStats.projectedFee.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
            <CardDescription className="text-white/80">
              Key performance indicators for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">Total Visits</span>
                <span className="text-sm text-white">{safeStats.totalVisits.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((safeStats.totalVisits / 1000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">Total Purchases</span>
                <span className="text-sm text-white">{safeStats.totalPurchases.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((safeStats.totalPurchases / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">Conversion Rate</span>
                <span className="text-sm text-white">{safeStats.conversionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(safeStats.conversionRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 