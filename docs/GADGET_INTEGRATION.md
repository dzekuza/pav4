# Gadget Analytics Integration

This document describes the integration with the ipick Tracker Gadget app for
analytics data.

## Overview

The Gadget integration provides real-time analytics data from the ipick Tracker
app, including:

- User events (page views, product views, add to cart, etc.)
- Orders and revenue data
- Click tracking and attribution
- Session and aggregate analytics

## Environment Setup

Add the following environment variables to your `.env.local` file:

```bash
GADGET_GRAPHQL_ENDPOINT=https://itrcks--development.gadget.app/api/graphql
GADGET_API_KEY=gak-your-api-key-here
```

For production, set these in your Netlify environment variables.

## Architecture

### Server-Side Components

1. **Gadget Client** (`server/gadgetClient.ts`)
   - Handles GraphQL requests to Gadget API
   - Includes rate limiting and retry logic
   - Server-only to keep API key secure

2. **GraphQL Queries** (`server/gadgetQueries.ts`)
   - Predefined queries for events, orders, aggregates, and clicks
   - Supports filtering and pagination

3. **API Routes** (`server/routes/gadget.ts`)
   - RESTful endpoints that proxy to Gadget GraphQL
   - Handles authentication and parameter validation
   - Supports filtering by shop domain, date range, event types

### Client-Side Components

1. **React Query Hooks** (`client/hooks/useGadget.ts`)
   - Data fetching hooks with infinite scrolling
   - Automatic caching and background updates
   - Error handling and loading states

2. **Dashboard Components**
   - `KPICards`: Displays key performance indicators
   - `FiltersBar`: Filter controls for date range, shop domain, event types
   - `EventsTable`: Table view of events with pagination

3. **TypeScript Types** (`shared/types/gadget.ts`)
   - Type-safe interfaces for all Gadget data structures
   - Ensures consistency between client and server

## API Endpoints

### GET /api/gadget/events

Fetches user events with optional filtering.

**Query Parameters:**

- `first`: Number of events to fetch (default: 50)
- `after`: Cursor for pagination
- `shopDomain`: Filter by shop domain
- `eventType`: Filter by event type(s)
- `from`: Start date (ISO format)
- `to`: End date (ISO format)

### GET /api/gadget/orders

Fetches order data with optional filtering.

**Query Parameters:**

- `first`: Number of orders to fetch (default: 50)
- `after`: Cursor for pagination
- `shopDomain`: Filter by shop domain
- `from`: Start date (ISO format)
- `to`: End date (ISO format)

### GET /api/gadget/aggregates

Fetches daily aggregated data.

**Query Parameters:**

- `first`: Number of days to fetch (default: 30)
- `after`: Cursor for pagination
- `shopDomain`: Filter by shop domain
- `from`: Start date (ISO format)
- `to`: End date (ISO format)

### GET /api/gadget/clicks

Fetches click tracking data.

**Query Parameters:**

- `first`: Number of clicks to fetch (default: 50)
- `after`: Cursor for pagination
- `shopDomain`: Filter by shop domain

## Usage Examples

### Basic Dashboard Setup

```tsx
import {
    useGadgetAggregates,
    useGadgetEvents,
    useGadgetOrders,
} from "@/hooks/useGadget";

function Dashboard() {
    const { data: eventsData, isLoading: eventsLoading } = useGadgetEvents({
        first: 100,
        from: "2024-01-01",
        to: "2024-01-31",
    });

    const { data: ordersData, isLoading: ordersLoading } = useGadgetOrders({
        first: 100,
        from: "2024-01-01",
        to: "2024-01-31",
    });

    const { data: aggregatesData, isLoading: aggregatesLoading } =
        useGadgetAggregates({
            first: 30,
            from: "2024-01-01",
            to: "2024-01-31",
        });

    // Extract data from infinite query results
    const events = extractEventsFromPages(eventsData);
    const orders = extractOrdersFromPages(ordersData);
    const aggregates = extractAggregatesFromPages(aggregatesData);

    return (
        <div>
            <KPICards
                aggregates={aggregates}
                events={events}
                orders={orders}
                isLoading={eventsLoading || ordersLoading || aggregatesLoading}
            />
        </div>
    );
}
```

### Filtering Data

```tsx
function FilteredDashboard() {
    const [shopDomain, setShopDomain] = useState("");
    const [dateRange, setDateRange] = useState({
        from: "2024-01-01",
        to: "2024-01-31",
    });

    const { data: eventsData } = useGadgetEvents({
        first: 100,
        shopDomain: shopDomain || undefined,
        from: dateRange.from,
        to: dateRange.to,
    });

    return (
        <div>
            <FiltersBar
                shopDomain={shopDomain}
                onShopDomainChange={setShopDomain}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                selectedEventTypes={[]}
                onEventTypesChange={() => {}}
                onClearFilters={() => {}}
            />
            {/* Dashboard content */}
        </div>
    );
}
```

## Testing

Use the provided test script to verify the API integration:

```bash
# Test the Gadget API directly
curl -X POST https://your-app--development.gadget.app/api/graphql \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query":"query{events(first:10){edges{node{id eventType occurredAt}}}}"}'

# Test the proxy endpoints
curl -H "Authorization: Bearer your-api-key" \
  "http://localhost:3000/api/gadget/events?first=10"
```

## Security Considerations

1. **API Key Protection**: The Gadget API key is never exposed to the client
2. **Authentication**: All endpoints require business authentication
3. **Rate Limiting**: Built-in retry logic with exponential backoff
4. **Input Validation**: All parameters are validated server-side

## Error Handling

The integration includes comprehensive error handling:

- Network errors with automatic retries
- GraphQL errors with detailed error messages
- Loading states and skeleton components
- Graceful fallbacks for missing data

## Performance Optimization

- React Query caching for efficient data fetching
- Infinite scrolling for large datasets
- Debounced filter updates
- Optimistic updates where appropriate

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that the Gadget API key is correct and has proper
   permissions
2. **GraphQL Errors**: Verify that the query structure matches the Gadget schema
3. **No Data**: Ensure that the date range and filters are appropriate
4. **Rate Limiting**: The client includes automatic retry logic, but check
   Gadget rate limits

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=gadget:*
```

This will log all GraphQL requests and responses for debugging purposes.
