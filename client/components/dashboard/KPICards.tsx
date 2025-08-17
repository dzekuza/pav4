import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Eye,
  MousePointer,
} from "lucide-react";
import type { GadgetAggregate, GadgetEvent, GadgetOrder } from '../../../shared/types/gadget';

interface KPICardsProps {
  aggregates: GadgetAggregate[];
  events: GadgetEvent[];
  orders: GadgetOrder[];
  isLoading?: boolean;
}

export function KPICards({ aggregates, events, orders, isLoading = false }: KPICardsProps) {
  // Calculate KPIs from the data
  const totalSessions = aggregates.reduce((sum, agg) => sum + agg.sessions, 0);
  const totalProductViews = aggregates.reduce((sum, agg) => sum + agg.productViews, 0);
  const totalAddToCart = events.filter(e => e.eventType === 'add_to_cart').length;
  const totalCheckoutStart = events.filter(e => e.eventType === 'checkout_start').length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  
  // Calculate conversion rates
  const conversionRate = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;
  const cartConversionRate = totalAddToCart > 0 ? (totalOrders / totalAddToCart) * 100 : 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Get the most common currency for display
  const currencies = orders.map(o => o.currency).filter(Boolean);
  const displayCurrency = currencies.length > 0 ? currencies[0] : 'USD';

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="border-white/10 bg-white/5 text-white animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-white/20 rounded"></div>
              <div className="h-4 w-4 bg-white/20 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-white/20 rounded mb-2"></div>
              <div className="h-3 w-32 bg-white/20 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSessions.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">
              Unique user sessions
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Product Views
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProductViews.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Product page views</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Add to Cart
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAddToCart.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Cart additions</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Checkout Start
            </CardTitle>
            <MousePointer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCheckoutStart.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Checkout initiations</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Successful purchases</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Session to order rate</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Cart Conversion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cartConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Cart to purchase rate</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayCurrency} {totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Total sales revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Revenue Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                Average Order Value
              </span>
              <span className="text-sm font-bold text-white">
                {displayCurrency} {averageOrderValue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                Commission Rate
              </span>
              <span className="text-sm font-bold text-white">
                5%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">
                Projected Fee
              </span>
              <span className="text-sm font-bold text-white">
                {displayCurrency} {(totalRevenue * 0.05).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">
                  Total Sessions
                </span>
                <span className="text-sm text-white">
                  {totalSessions.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min((totalSessions / 1000) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">
                  Total Orders
                </span>
                <span className="text-sm text-white">
                  {totalOrders.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min((totalOrders / 100) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">
                  Conversion Rate
                </span>
                <span className="text-sm text-white">
                  {conversionRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(conversionRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
