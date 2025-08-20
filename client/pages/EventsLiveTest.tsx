import React, { useState, useEffect } from 'react';
import { fetchEvents, fetchEventStats, fetchShop } from '../lib/gadget-api';

interface Event {
  id: string;
  eventType: string;
  occurredAt: string;
  sessionId: string;
  path: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
  value?: number;
  currency?: string;
  orderId?: string;
  cartToken?: string;
  checkoutId?: string;
  ipAddress?: string;
  userAgent?: string;
  shop: {
    id: string;
    name: string;
    myshopifyDomain: string;
  };
}

export default function EventsLiveTest() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const shopId = "91283456333"; // checkoutipick.myshopify.com

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching live data for shop:', shopId);

      // Fetch all data in parallel
      const [eventsData, statsData, shopData] = await Promise.all([
        fetchEvents(shopId, { first: 50 }),
        fetchEventStats(shopId),
        fetchShop(shopId)
      ]);

      console.log('✅ Live data fetched successfully:', {
        events: eventsData.events.edges.length,
        stats: statsData,
        shop: shopData
      });

      setEvents(eventsData.events.edges.map((edge: any) => edge.node));
      setStats(statsData);
      setShop(shopData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ Error loading live data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [shopId]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return '👁️';
      case 'product_view':
        return '📦';
      case 'add_to_cart':
        return '🛒';
      case 'begin_checkout':
      case 'checkout_completed':
        return '💳';
      case 'purchase':
        return '💰';
      default:
        return '📊';
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && events.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading live events data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={loadData} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎯 Live Events Test</h1>
        <p className="text-muted-foreground">
          Real-time events from: <strong>{shop?.name || shop?.myshopifyDomain || 'checkoutipick.myshopify.com'}</strong>
        </p>
        {lastUpdated && (
          <p className="text-sm text-green-600">
            ✅ Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
      
      {/* Shop Info */}
      {shop && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🏪 Shop Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> {shop.name || 'N/A'}</p>
              <p><strong>Domain:</strong> {shop.myshopifyDomain}</p>
            </div>
            <div>
              <p><strong>ID:</strong> {shop.id}</p>
              <p><strong>Active:</strong> {shop.isActive ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Live Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${stats.totalValue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.recentEvents}</div>
              <div className="text-sm text-gray-600">Recent (24h)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.keys(stats.eventTypeBreakdown).length}
              </div>
              <div className="text-sm text-gray-600">Event Types</div>
            </div>
          </div>
          
          {/* Event Type Breakdown */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Event Type Breakdown:</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.eventTypeBreakdown).map(([type, count]) => (
                <span 
                  key={type}
                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                >
                  {getEventIcon(type)} {type}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📋 Live Events ({events.length})</h2>
          <button 
            onClick={loadData}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
        
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events found for this shop.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getEventIcon(event.eventType)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      event.eventType === 'purchase' ? 'bg-green-100 text-green-800' :
                      event.eventType === 'add_to_cart' ? 'bg-blue-100 text-blue-800' :
                      event.eventType === 'page_view' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.eventType.replace('_', ' ').toUpperCase()}
                    </span>
                    {event.value && (
                      <span className="text-green-600 font-semibold">
                        {formatCurrency(event.value, event.currency)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(event.occurredAt)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Path:</strong> {event.path}</p>
                  {event.productId && (
                    <p><strong>Product ID:</strong> {event.productId}</p>
                  )}
                  {event.quantity && (
                    <p><strong>Quantity:</strong> {event.quantity}</p>
                  )}
                  <p><strong>Session:</strong> {event.sessionId.substring(0, 8)}...</p>
                  {event.shop && (
                    <p><strong>Shop:</strong> {event.shop.name || event.shop.myshopifyDomain}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">🔧 API Information</h3>
        <p className="text-sm text-gray-600">
          This page uses the <strong>Direct Gadget API</strong> with real-time data.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Shop ID: <code className="bg-gray-200 px-1 rounded">{shopId}</code>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Auto-refresh: Every 30 seconds
        </p>
      </div>
    </div>
  );
}
