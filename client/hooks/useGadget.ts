import { useInfiniteQuery } from '@tanstack/react-query';
import type { 
  GadgetEvent, 
  GadgetOrder, 
  GadgetAggregate, 
  GadgetClick,
  GadgetEventsResponse,
  GadgetOrdersResponse,
  GadgetAggregatesResponse,
  GadgetClicksResponse
} from '../../shared/types/gadget';

// Helper function to build query parameters
function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  return searchParams.toString();
}

// Fetcher functions
async function fetchGadgetData<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  const queryString = buildQueryParams(params);
  const url = `/api/gadget/${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }
  
  return response.json();
}

// Hook for events with infinite scrolling
export function useGadgetEvents(params: {
  first?: number;
  shopDomain?: string;
  eventType?: string | string[];
  from?: string;
  to?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['gadget-events', params],
    queryFn: ({ pageParam }) => 
      fetchGadgetData<GadgetEventsResponse>('events', {
        ...params,
        after: pageParam,
      }),
    getNextPageParam: (lastPage) => 
      lastPage.data.events.pageInfo.hasNextPage 
        ? lastPage.data.events.pageInfo.endCursor 
        : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

// Hook for orders with infinite scrolling
export function useGadgetOrders(params: {
  first?: number;
  shopDomain?: string;
  from?: string;
  to?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['gadget-orders', params],
    queryFn: ({ pageParam }) => 
      fetchGadgetData<GadgetOrdersResponse>('orders', {
        ...params,
        after: pageParam,
      }),
    getNextPageParam: (lastPage) => 
      lastPage.data.orders.pageInfo.hasNextPage 
        ? lastPage.data.orders.pageInfo.endCursor 
        : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

// Hook for aggregates (no infinite scrolling needed for time series data)
export function useGadgetAggregates(params: {
  first?: number;
  shopDomain?: string;
  from?: string;
  to?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['gadget-aggregates', params],
    queryFn: ({ pageParam }) => 
      fetchGadgetData<GadgetAggregatesResponse>('aggregates', {
        ...params,
        after: pageParam,
      }),
    getNextPageParam: (lastPage) => 
      lastPage.data.aggregates.pageInfo.hasNextPage 
        ? lastPage.data.aggregates.pageInfo.endCursor 
        : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

// Hook for clicks with infinite scrolling
export function useGadgetClicks(params: {
  first?: number;
  shopDomain?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['gadget-clicks', params],
    queryFn: ({ pageParam }) => 
      fetchGadgetData<GadgetClicksResponse>('clicks', {
        ...params,
        after: pageParam,
      }),
    getNextPageParam: (lastPage) => 
      lastPage.data.clicks.pageInfo.hasNextPage 
        ? lastPage.data.clicks.pageInfo.endCursor 
        : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

// Helper functions to extract data from infinite query results
export function extractEventsFromPages(data: any): GadgetEvent[] {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => 
    page.data.events.edges.map((edge: any) => edge.node)
  );
}

export function extractOrdersFromPages(data: any): GadgetOrder[] {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => 
    page.data.orders.edges.map((edge: any) => edge.node)
  );
}

export function extractAggregatesFromPages(data: any): GadgetAggregate[] {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => 
    page.data.aggregates.edges.map((edge: any) => edge.node)
  );
}

export function extractClicksFromPages(data: any): GadgetClick[] {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => 
    page.data.clicks.edges.map((edge: any) => edge.node)
  );
}
