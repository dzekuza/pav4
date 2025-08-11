import React from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  ExternalLink,
} from "lucide-react";

interface Business {
  id: number;
  name: string;
  domain: string;
  website: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  isVerified: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  country?: string;
  category?: string;
  commission: number;
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  adminCommissionRate: number;
  createdAt: string;
  updatedAt: string;
}

interface BusinessStatsModalProps {
  business: Business;
  onClose: () => void;
}

export function BusinessStatsModal({
  business,
  onClose,
}: BusinessStatsModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  // Calculate derived statistics
  const projectedFee =
    (business.totalRevenue * business.adminCommissionRate) / 100;
  const averageOrderValue =
    business.totalPurchases > 0
      ? business.totalRevenue / business.totalPurchases
      : 0;
  const conversionRate =
    business.totalVisits > 0
      ? (business.totalPurchases / business.totalVisits) * 100
      : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {business.name} - Detailed Statistics
          </DialogTitle>
          <DialogDescription>
            Comprehensive analytics and performance metrics for{" "}
            {business.domain}
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
                  <Badge variant="secondary" className="ml-2">
                    {business.adminCommissionRate}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Visits
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(business.totalVisits)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Users who visited products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Purchases
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(business.totalPurchases)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successful transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(business.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gross sales amount
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conversionRate.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Visits to purchases
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Average Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(averageOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Revenue per purchase
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Projected Fee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(projectedFee)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {business.adminCommissionRate}% of total revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Revenue per Visit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {business.totalVisits > 0
                    ? formatCurrency(
                        business.totalRevenue / business.totalVisits,
                      )
                    : "$0.00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average revenue per visit
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Conversion Efficiency:
                  </span>
                  <Badge
                    variant={
                      conversionRate > 5
                        ? "default"
                        : conversionRate > 2
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {conversionRate > 5
                      ? "Excellent"
                      : conversionRate > 2
                        ? "Good"
                        : "Needs Improvement"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Revenue Performance:
                  </span>
                  <Badge
                    variant={
                      business.totalRevenue > 10000
                        ? "default"
                        : business.totalRevenue > 5000
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {business.totalRevenue > 10000
                      ? "High"
                      : business.totalRevenue > 5000
                        ? "Medium"
                        : "Low"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Traffic Quality:</span>
                  <Badge
                    variant={
                      business.totalVisits > 1000
                        ? "default"
                        : business.totalVisits > 500
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {business.totalVisits > 1000
                      ? "High"
                      : business.totalVisits > 500
                        ? "Medium"
                        : "Low"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
