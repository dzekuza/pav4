import React, { useState, useEffect } from 'react';
import { fetchEvents, fetchEventStats, fetchShop } from '../lib/gadget-api';

export function SimpleEventsExample() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shopId = "91283456333"; // checkoutipick.myshopify.com

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching data for shop:', shopId);

        // Fetch all data in parallel
        const [eventsData, statsData, shopData] = await Promise.all([
          fetchEvents(shopId, { first: 20 }),
          fetchEventStats(shopId),
          fetchShop(shopId)
        ]);

        console.log('✅ Data fetched successfully:', {
          events: eventsData.events.edges.length,
          stats: statsData,
          shop: shopData
        });

        setEvents(eventsData.events.edges.map((edge: any) => edge.node));
        setStats(statsData);
        setShop(shopData);
      } catch (err) {
        console.error('❌ Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [shopId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading events data...</p>
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
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Simple Events Example</h1>
      
      {/* Shop Info */}
      {shop && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Shop Information</h2>
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
                  {type}: {count}
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
                        ${event.value.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(event.occurredAt).toLocaleString()}
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
          This example demonstrates fetching events from the Gadget API for shop ID: <code className="bg-gray-200 px-1 rounded">{shopId}</code>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          The data is fetched using the <code className="bg-gray-200 px-1 rounded">fetchEvents</code>, <code className="bg-gray-200 px-1 rounded">fetchEventStats</code>, and <code className="bg-gray-200 px-1 rounded">fetchShop</code> functions from the Gadget API client.
        </p>
      </div>
    </div>
  );
}
