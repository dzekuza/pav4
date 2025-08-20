# Gadget API Usage Guide

This guide explains how to use the Gadget API to fetch events and analytics data for your Shopify stores.

## 🏪 Target Shop

- **Shop Domain**: `checkoutipick.myshopify.com`
- **Shop ID**: `91283456333`

## 🔧 Setup

### 1. Environment Variables

Add these environment variables to your `.env` file:

```bash
# Gadget API Configuration
VITE_GADGET_GRAPHQL_ENDPOINT="https://itrcks--development.gadget.app/api/graphql"
VITE_GADGET_API_KEY="your-gadget-api-key-here"
```

### 2. Get Your API Key

1. Go to your Gadget app dashboard
2. Navigate to Settings → API Keys
3. Find the API key named `ipick-analytics-api`
4. Copy the actual key value (starts with `gak_`)
5. Add it to your environment variables

## 📚 API Client Usage

### Basic Usage

```typescript
import { fetchEvents, fetchEventStats, fetchShop } from '../lib/gadget-api';

// Fetch events for a specific shop
const events = await fetchEvents("91283456333", {
  first: 50,
  eventType: ['page_view', 'add_to_cart'],
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-12-31T23:59:59Z'
});

// Fetch event statistics
const stats = await fetchEventStats("91283456333");

// Fetch shop information
const shop = await fetchShop("91283456333");
```

### React Hook Usage

```typescript
import { useGadgetEvents } from '../hooks/useGadgetEvents';

function MyComponent() {
  const { 
    events, 
    stats, 
    shop, 
    loading, 
    error, 
    refetch 
  } = useGadgetEvents("91283456333", {
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    first: 100,
    eventType: ['purchase', 'add_to_cart']
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{shop?.name}</h1>
      <p>Total Events: {stats?.totalEvents}</p>
      <p>Total Value: ${stats?.totalValue}</p>
      
      {events.map(event => (
        <div key={event.id}>
          {event.eventType} - {event.path}
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Available Functions

### Core API Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `fetchEvents(shopId, options)` | Fetch events for a shop | `shopId: string`, `options?: EventOptions` |
| `fetchEventStats(shopId, dateFrom?, dateTo?)` | Get event statistics | `shopId: string`, `dateFrom?: string`, `dateTo?: string` |
| `fetchShop(shopId)` | Get shop information | `shopId: string` |
| `fetchShops()` | Get all shops | None |
| `fetchOrders(shopId, options?)` | Fetch orders for a shop | `shopId: string`, `options?: OrderOptions` |

### React Hooks

| Hook | Description | Parameters |
|------|-------------|------------|
| `useGadgetEvents(shopId, options)` | Hook for events data | `shopId: string`, `options?: UseEventsOptions` |
| `useGadgetShops()` | Hook for shops list | None |
| `useGadgetOrders(shopId, options)` | Hook for orders data | `shopId: string`, `options?: OrderOptions` |

## 📊 Event Types

The API tracks these event types:

- `page_view` - Page view events
- `product_view` - Product view events
- `add_to_cart` - Add to cart events
- `begin_checkout` - Checkout initiation
- `checkout_completed` - Checkout completion
- `purchase` - Purchase events

## 🔍 Filtering Options

### Event Filtering

```typescript
const events = await fetchEvents("91283456333", {
  first: 50,                    // Number of events to fetch
  after: "cursor-string",       // Pagination cursor
  eventType: ['purchase'],      // Filter by event type
  dateFrom: '2024-01-01T00:00:00Z', // Start date
  dateTo: '2024-12-31T23:59:59Z'    // End date
});
```

### Date Ranges

```typescript
// Last 24 hours
const oneDayAgo = new Date();
oneDayAgo.setDate(oneDayAgo.getDate() - 1);

// Last 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

// Last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
```

## 📈 Statistics

The `fetchEventStats` function returns:

```typescript
interface EventStats {
  totalEvents: number;           // Total number of events
  eventTypeBreakdown: Record<string, number>; // Count by event type
  totalValue: number;           // Total monetary value
  recentEvents: number;         // Events in last 24 hours
  rawEvents: Event[];           // Raw event data
}
```

## 🧪 Testing

### Run the Test Script

```bash
# Make sure you have the API key set
export GADGET_API_KEY="your-api-key-here"

# Run the test script
node scripts/test-gadget-events.js
```

### Test in Browser

1. Start your development server
2. Navigate to `/events-test` to see the EventsDashboard
3. Or use the SimpleEventsExample component

## 🎨 Components

### EventsDashboard

A comprehensive dashboard component with:
- Real-time data refresh
- Event filtering
- Statistics cards
- Event type breakdown
- Table and list views
- Pagination

```typescript
import { EventsDashboard } from '../components/EventsDashboard';

<EventsDashboard 
  shopId="91283456333"
  shopDomain="checkoutipick.myshopify.com"
/>
```

### SimpleEventsExample

A simple example component showing basic usage:

```typescript
import { SimpleEventsExample } from '../components/SimpleEventsExample';

<SimpleEventsExample />
```

## 🔐 Authentication

The API uses Bearer token authentication:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${GADGET_API_KEY}`,
}
```

## 🌐 API Endpoints

- **GraphQL Endpoint**: `https://itrcks--development.gadget.app/api/graphql`
- **Authentication**: Bearer token with API key
- **Rate Limits**: Check Gadget documentation for current limits

## 📝 Error Handling

The API client includes comprehensive error handling:

```typescript
try {
  const events = await fetchEvents(shopId);
  // Handle success
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle authentication error
  } else if (error.message.includes('HTTP error')) {
    // Handle network error
  } else {
    // Handle other errors
  }
}
```

## 🔄 Real-time Updates

For real-time updates, use the `autoRefresh` option:

```typescript
const { events, refetch } = useGadgetEvents(shopId, {
  autoRefresh: true,
  refreshInterval: 30000 // Refresh every 30 seconds
});
```

## 📱 Mobile Responsive

All components are built with mobile-first responsive design using Tailwind CSS.

## 🚀 Performance Tips

1. **Use pagination**: Limit results with `first` parameter
2. **Filter by date**: Use `dateFrom` and `dateTo` to reduce data
3. **Filter by event type**: Only fetch relevant events
4. **Use auto-refresh sparingly**: Set appropriate refresh intervals
5. **Implement caching**: Consider caching frequently accessed data

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**: Make sure your API key is correct and has proper permissions
2. **CORS Error**: Ensure your domain is allowed in Gadget settings
3. **No Data**: Check if the shop ID is correct and has events
4. **Rate Limiting**: Implement exponential backoff for retries

### Debug Mode

Enable debug logging:

```typescript
// Add to your component
useEffect(() => {
  console.log('Gadget API Debug:', {
    shopId: "91283456333",
    apiUrl: import.meta.env.VITE_GADGET_GRAPHQL_ENDPOINT,
    hasApiKey: !!import.meta.env.VITE_GADGET_API_KEY
  });
}, []);
```

## 📞 Support

For issues with the Gadget API:
1. Check the Gadget documentation
2. Verify your API key permissions
3. Test with the provided test script
4. Check the browser console for detailed error messages
