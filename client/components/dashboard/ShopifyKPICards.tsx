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
  Package,
  Eye,
} from "lucide-react";
import { useShopifyOrders, useShopifyProducts, useShopifyCustomers, useShopifyShop } from "@/hooks/useShopify";
import type { GadgetAggregate, GadgetEvent } from '../../../shared/types/gadget';

interface ShopifyKPICardsProps {
  shopDomain: string;
  accessToken: string;
  dateRange: { from: string; to: string };
  // Keep Gadget data for comparison/fallback
  aggregates: GadgetAggregate[];
  events: GadgetEvent[];
  isLoading?: boolean;
}

export function ShopifyKPICards({ 
  shopDomain, 
  accessToken, 
  dateRange, 
  aggregates, 
  events, 
  isLoading = false 
}: ShopifyKPICardsProps) {
  // Fetch Shopify data
  const { data: ordersData, isLoading: ordersLoading } = useShopifyOrders(shopDomain, accessToken, {
    limit: 250,
    created_at_min: dateRange.from,
    created_at_max: dateRange.to,
  });

  const { data: productsData, isLoading: productsLoading } = useShopifyProducts(shopDomain, accessToken, {
    limit: 250,
    status: 'active',
  });

  const { data: customersData, isLoading: customersLoading } = useShopifyCustomers(shopDomain, accessToken, {
    limit: 250,
  });

  const { data: shopData, isLoading: shopLoading } = useShopifyShop(shopDomain, accessToken);

  // Calculate KPIs from Shopify data
  const orders = ordersData?.orders || [];
  const products = productsData?.products || [];
  const customers = customersData?.customers || [];
  
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  
  // Calculate conversion rate (orders / customers who have ordered)
  const customersWithOrders = customers.filter(c => c.orders_count > 0).length;
  const conversionRate = totalCustomers > 0 ? (customersWithOrders / totalCustomers) * 100 : 0;

  // Gadget data for comparison - now optional since we're removing Gadget
  const totalSessions = aggregates.length > 0 ? aggregates.reduce((sum, agg) => sum + agg.sessions, 0) : 0;
  const totalProductViews = aggregates.length > 0 ? aggregates.reduce((sum, agg) => sum + agg.productViews, 0) : 0;
  const totalAddToCart = events.filter(e => e.eventType === 'add_to_cart').length;
  const totalCheckoutStart = events.filter(e => e.eventType === 'checkout_start').length;

  const isShopifyLoading = ordersLoading || productsLoading || customersLoading || shopLoading;
  const hasShopifyData = !isShopifyLoading && (orders.length > 0 || products.length > 0 || customers.length > 0);

  if (isLoading || isShopifyLoading) {
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
      {/* Header with shop info */}
      {shopData?.shop && (
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5" />
              {shopData.shop.name} ({shopData.shop.myshopify_domain})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-white/60">Plan:</span>
                <span className="ml-2 text-white">{shopData.shop.plan?.display_name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-white/60">Currency:</span>
                <span className="ml-2 text-white">{shopData.shop.currency || 'USD'}</span>
              </div>
              <div>
                <span className="text-white/60">Created:</span>
                <span className="ml-2 text-white">{new Date(shopData.shop.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-white/60">Status:</span>
                <span className="ml-2 text-white">{shopData.shop.plan?.display_name === 'Developer Preview' ? 'Test Store' : 'Live Store'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shopify Data Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProducts.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Active products in store</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCustomers.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Registered customers</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Completed orders</p>
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
              €{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Total sales revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Average Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{averageOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-white/80">Per order average</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Customer Conversion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-white/80">Customers with orders</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Gadget Sessions
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSessions.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Tracked sessions</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Gadget Events
            </CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.length.toLocaleString()}
            </div>
            <p className="text-xs text-white/80">Tracked events</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Shopify Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Products</span>
              <span className="text-sm font-bold text-white">{totalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Customers</span>
              <span className="text-sm font-bold text-white">{totalCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Orders</span>
              <span className="text-sm font-bold text-white">{totalOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Revenue</span>
              <span className="text-sm font-bold text-white">€{totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">AOV</span>
              <span className="text-sm font-bold text-white">€{averageOrderValue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">Gadget Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Sessions</span>
              <span className="text-sm font-bold text-white">{totalSessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Product Views</span>
              <span className="text-sm font-bold text-white">{totalProductViews}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Add to Cart</span>
              <span className="text-sm font-bold text-white">{totalAddToCart}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Checkout Start</span>
              <span className="text-sm font-bold text-white">{totalCheckoutStart}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Total Events</span>
              <span className="text-sm font-bold text-white">{events.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No Data Message */}
      {!hasShopifyData && !isShopifyLoading && (
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-white">No Shopify Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/80">
              The store doesn't have any orders, products, or customers yet. 
              This is normal for a new store or test environment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
