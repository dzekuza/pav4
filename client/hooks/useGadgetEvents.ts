import { useState, useEffect, useCallback } from 'react';
import { gadgetAPI, fetchEvents, fetchEventStats, fetchShop, type Event, type EventStats, type Shop } from '../lib/gadget-api';

export interface UseEventsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  first?: number;
  eventType?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface UseEventsReturn {
  events: Event[];
  stats: EventStats | null;
  shop: Shop | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function useGadgetEvents(
  shopId: string, 
  options: UseEventsOptions = {}
): UseEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState({
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: '',
    endCursor: ''
  });

  const loadData = useCallback(async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch data in parallel
      const [eventsData, statsData, shopData] = await Promise.all([
        fetchEvents(shopId, {
          first: options.first || 50,
          eventType: options.eventType,
          dateFrom: options.dateFrom,
          dateTo: options.dateTo
        }),
        fetchEventStats(shopId, options.dateFrom, options.dateTo),
        fetchShop(shopId)
      ]);

      setEvents(eventsData.events.edges.map(edge => edge.node));
      setStats(statsData);
      setShop(shopData);
      setPageInfo(eventsData.events.pageInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }, [shopId, options.first, options.eventType, options.dateFrom, options.dateTo]);

  const loadMore = useCallback(async () => {
    if (!shopId || !pageInfo.hasNextPage || loading) return;

    try {
      setLoading(true);
      
      const eventsData = await fetchEvents(shopId, {
        first: options.first || 50,
        after: pageInfo.endCursor,
        eventType: options.eventType,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo
      });

      setEvents(prev => [...prev, ...eventsData.events.edges.map(edge => edge.node)]);
      setPageInfo(eventsData.events.pageInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more events');
      console.error('Error loading more events:', err);
    } finally {
      setLoading(false);
    }
  }, [shopId, pageInfo.hasNextPage, pageInfo.endCursor, loading, options.first, options.eventType, options.dateFrom, options.dateTo]);

  useEffect(() => {
    if (shopId) {
      loadData();

      // Auto-refresh if enabled
      if (options.autoRefresh) {
        const interval = setInterval(loadData, options.refreshInterval || 30000); // 30s default
        return () => clearInterval(interval);
      }
    }
  }, [shopId, loadData, options.autoRefresh, options.refreshInterval]);

  return {
    events,
    stats,
    shop,
    loading,
    error,
    refetch: loadData,
    loadMore,
    hasNextPage: pageInfo.hasNextPage,
    hasPreviousPage: pageInfo.hasPreviousPage
  };
}

// Hook for fetching multiple shops
export function useGadgetShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShops = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const shopsData = await gadgetAPI.fetchShops();
      setShops(shopsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shops');
      console.error('Error loading shops:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  return {
    shops,
    loading,
    error,
    refetch: loadShops
  };
}

// Hook for fetching orders
export function useGadgetOrders(
  shopId: string,
  options: {
    first?: number;
    dateFrom?: string;
    dateTo?: string;
  } = {}
) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      setError(null);
      
      const ordersData = await gadgetAPI.fetchOrders(shopId, options);
      setOrders(ordersData.shopifyOrders.edges.map((edge: any) => edge.node));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, [shopId, options.first, options.dateFrom, options.dateTo]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    refetch: loadOrders
  };
}
