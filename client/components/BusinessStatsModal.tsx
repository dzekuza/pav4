import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, ExternalLink } from 'lucide-react';

interface BusinessStats {
  id: number;
  name: string;
  domain: string;
  website: string;
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  adminCommissionRate: number;
  projectedFee: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface BusinessStatsModalProps {
  business: BusinessStats;
  isOpen: boolean;
  onClose: () => void;
}

export function BusinessStatsModal({ business, isOpen, onClose }: BusinessStatsModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {business.name} - Detailed Statistics
          </DialogTitle>
          <DialogDescription>
            Comprehensive analytics and performance metrics for {business.domain}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Business Information
                <Badge variant="outline">{business.domain}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Website:</span>
                  <a 
                    href={business.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  >
                    {business.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <span className="font-medium">Commission Rate:</span>
                  <Badge variant="secondary" className="ml-2">{business.adminCommissionRate}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(business.totalVisits)}</div>
                <p className="text-xs text-muted-foreground">
                  Users who visited products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(business.totalPurchases)}</div>
                <p className="text-xs text-muted-foreground">
                  Successful purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(business.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Total sales revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{business.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Visit to purchase ratio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Analysis</CardTitle>
              <CardDescription>
                Revenue breakdown and commission calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-700">Average Order Value</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(business.averageOrderValue)}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-700">Commission Rate</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {business.adminCommissionRate}%
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-700">Projected Fee</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(business.projectedFee)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Visit Performance</span>
                    <span className="text-sm">{formatNumber(business.totalVisits)} visits</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((business.totalVisits / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Purchase Performance</span>
                    <span className="text-sm">{formatNumber(business.totalPurchases)} purchases</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((business.totalPurchases / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm">{business.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(business.conversionRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 