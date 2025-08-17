import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, ShoppingCart } from "lucide-react";
import { format } from 'date-fns';
import { useShopifyOrders } from '@/hooks/useShopify';

interface ShopifyOrdersTableProps {
  shopDomain: string;
  accessToken: string;
  dateRange: { from: string; to: string };
}

export function ShopifyOrdersTable({
  shopDomain,
  accessToken,
  dateRange,
}: ShopifyOrdersTableProps) {
  const { data: ordersData, isLoading } = useShopifyOrders(shopDomain, accessToken, {
    limit: 50,
    created_at_min: dateRange.from,
    created_at_max: dateRange.to,
  });

  const orders = ordersData?.orders || [];
  if (isLoading) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            <span className="ml-2 text-white/60">Loading orders...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-white">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <p className="text-lg font-medium mb-2">No Orders Yet</p>
            <p className="text-sm">
              This store hasn't received any orders yet. 
              Orders will appear here once customers start making purchases.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-white">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-white">Order</TableHead>
              <TableHead className="text-white">Customer</TableHead>
              <TableHead className="text-white">Items</TableHead>
              <TableHead className="text-white">Total</TableHead>
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.slice(0, 10).map((order) => (
              <TableRow key={order.id} className="border-white/10">
                <TableCell className="text-white/80">
                  <div>
                    <div className="font-medium">{order.name}</div>
                    <div className="text-xs text-white/60">#{order.order_number}</div>
                  </div>
                </TableCell>
                <TableCell className="text-white/80">
                  {order.customer ? (
                    <div>
                      <div>{order.customer.first_name} {order.customer.last_name}</div>
                      <div className="text-xs text-white/60">{order.customer.email}</div>
                    </div>
                  ) : (
                    <span className="text-white/60">Guest</span>
                  )}
                </TableCell>
                <TableCell className="text-white/80">
                  <div className="space-y-1">
                    {order.line_items.slice(0, 2).map((item) => (
                      <div key={item.id} className="text-sm">
                        {item.title} × {item.quantity}
                      </div>
                    ))}
                    {order.line_items.length > 2 && (
                      <div className="text-xs text-white/60">
                        +{order.line_items.length - 2} more items
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-white/80">
                  <div className="font-medium">
                    {order.currency} {parseFloat(order.total_price).toFixed(2)}
                  </div>
                </TableCell>
                <TableCell className="text-white/80">
                  {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <a
                    href={`https://${shopDomain}/admin/orders/${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {orders.length > 10 && (
          <div className="mt-4 text-center text-white/60">
            Showing 10 of {orders.length} orders
          </div>
        )}
      </CardContent>
    </Card>
  );
}
