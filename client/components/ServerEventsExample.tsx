import React, { useState, useEffect } from 'react';

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

interface EventsResponse {
  events: {
    edges: Array<{
      node: Event;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
}

export function ServerEventsExample() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const shopDomain = "checkoutipick.myshopify.com";

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching events for shop:', shopDomain);

        // Fetch events from the server API
        const response = await fetch(`/api/gadget/events?shopDomain=${encodeURIComponent(shopDomain)}&first=50`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: EventsResponse = await response.json();
        
        console.log('✅ Events fetched successfully:', {
          totalEvents: data.events.edges.length,
          hasNextPage: data.events.pageInfo.hasNextPage
        });

        setEvents(data.events.edges.map(edge => edge.node));

        // Calculate basic stats
        const totalEvents = data.events.edges.length;
        const eventTypeBreakdown = data.events.edges.reduce((acc: Record<string, number>, edge) => {
          const eventType = edge.node.eventType;
          acc[eventType] = (acc[eventType] || 0) + 1;
          return acc;
        }, {});

        const totalValue = data.events.edges.reduce((sum, edge) => {
          return sum + (edge.node.value || 0);
        }, 0);

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const recentEvents = data.events.edges.filter(edge => {
          return new Date(edge.node.occurredAt) > oneDayAgo;
        }).length;

        setStats({
          totalEvents,
          eventTypeBreakdown,
          totalValue,
          recentEvents
        });

      } catch (err) {
        console.error('❌ Error loading events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [shopDomain]);

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

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading events data from server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Make sure the server is running and the API endpoints are accessible.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Server Events Example</h1>
      <p className="text-gray-600 mb-6">
        Fetching events from server API for: <strong>{shopDomain}</strong>
      </p>
      
      {/* Stats */}
      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Event Statistics</h2>
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
        <h2 className="text-xl font-semibold mb-4">Recent Events ({events.length})</h2>
        
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
        <h3 className="font-semibold mb-2">API Information</h3>
        <p className="text-sm text-gray-600">
          This example uses the server API endpoint: <code className="bg-gray-200 px-1 rounded">/api/gadget/events</code>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          The server handles authentication and forwards requests to the Gadget API.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Shop Domain: <code className="bg-gray-200 px-1 rounded">{shopDomain}</code>
        </p>
      </div>
    </div>
  );
}
