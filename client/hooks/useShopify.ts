import { useQuery } from '@tanstack/react-query';

// Shopify API types
export interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  total_price: string;
  currency: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  created_at: string;
  updated_at: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    inventory_quantity: number;
  }>;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  total_spent: string;
  created_at: string;
  updated_at: string;
}

// Fetcher functions - using our server proxy
async function fetchShopifyData<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.set(key, value.toString());
    }
  });
  
  const url = `/api/shopify${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Hook for Shopify orders
export function useShopifyOrders(shopDomain: string, accessToken: string, params: {
  limit?: number;
  status?: string;
  created_at_min?: string;
  created_at_max?: string;
} = {}) {
  return useQuery({
    queryKey: ['shopify-orders', shopDomain, params],
    queryFn: () => fetchShopifyData<{ orders: ShopifyOrder[] }>('/orders', {
      shopDomain,
      accessToken,
      ...params
    }),
    enabled: !!shopDomain && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for Shopify products
export function useShopifyProducts(shopDomain: string, accessToken: string, params: {
  limit?: number;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: ['shopify-products', shopDomain, params],
    queryFn: () => fetchShopifyData<{ products: ShopifyProduct[] }>('/products', {
      shopDomain,
      accessToken,
      ...params
    }),
    enabled: !!shopDomain && !!accessToken,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for Shopify customers
export function useShopifyCustomers(shopDomain: string, accessToken: string, params: {
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ['shopify-customers', shopDomain, params],
    queryFn: () => fetchShopifyData<{ customers: ShopifyCustomer[] }>('/customers', {
      shopDomain,
      accessToken,
      ...params
    }),
    enabled: !!shopDomain && !!accessToken,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for Shopify shop info
export function useShopifyShop(shopDomain: string, accessToken: string) {
  return useQuery({
    queryKey: ['shopify-shop', shopDomain],
    queryFn: () => fetchShopifyData<{ shop: any }>('/shop', {
      shopDomain,
      accessToken
    }),
    enabled: !!shopDomain && !!accessToken,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
