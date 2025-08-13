# Checkout Events Guide

## Overview

The business activity dashboard now includes a new "Checkout" tab that displays
all checkout-related events for your business. This allows you to track when
users enter the checkout process and when they complete their purchases.

## Checkout Event Types

### 1. checkout_start

- **Triggered when**: Users click checkout buttons or navigate to checkout pages
- **Status**: "Checkout Started"
- **Icon**: Blue dollar sign
- **Badge**: Blue "Checkout Started" badge
- **Display Name**: "Checkout Started"
- **Product Name**: Extracted from URL or event data

### 2. checkout_complete

- **Triggered when**: Users successfully complete the checkout process
- **Status**: "Checkout Completed"
- **Icon**: Green dollar sign
- **Badge**: Green "Checkout Completed" badge
- **Display Name**: "Checkout Completed"
- **Product Name**: Extracted from URL or event data
- **Includes**: Order amount and order ID

## Implementation

### Frontend Changes

The `BusinessActivityDashboard.tsx` component has been updated to include:

1. **New Filter Tab**: "Checkout" button in the filter controls
2. **Event Processing**: Handles `checkout_start` and `checkout_complete` events
3. **Status Badges**: Custom badges for checkout events
4. **Statistics Card**: Shows total checkout events count
5. **Filtering Logic**: Filters activities to show only checkout events
6. **Improved Product Names**: Better extraction of product names from URLs
7. **User-Friendly Type Labels**: Displays "Checkout Started" instead of
   "checkout_start", "Viewed Page" instead of "page_view", etc.

### Backend Support

The backend already supports checkout events through:

1. **Database Schema**: `TrackingEvent` model stores all event types
2. **API Endpoints**: `/api/track-event` accepts checkout events
3. **Event Processing**: Business statistics are updated for checkout events

## Usage

### For Businesses

1. Navigate to your business dashboard
2. Go to the Activity section
3. Click the "Checkout" tab to view checkout events
4. See checkout started and completed events with details

### For Developers

To track checkout events, send POST requests to `/api/track-event`:

```javascript
// Checkout start event
await fetch("/api/track-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        event_type: "checkout_start",
        business_id: YOUR_BUSINESS_ID,
        affiliate_id: YOUR_AFFILIATE_ID,
        platform: "shopify",
        session_id: "unique-session-id",
        url: "https://yourstore.com/checkout",
        data: {
            product_name: "Product Name",
            total: 99.99,
        },
    }),
});

// Checkout complete event
await fetch("/api/track-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        event_type: "checkout_complete",
        business_id: YOUR_BUSINESS_ID,
        affiliate_id: YOUR_AFFILIATE_ID,
        platform: "shopify",
        session_id: "unique-session-id",
        url: "https://yourstore.com/checkout/complete",
        data: {
            product_name: "Product Name",
            total: 99.99,
            order_id: "ORDER-12345",
        },
    }),
});
```

## Integration Examples

### Shopify Integration

```javascript
// Track checkout start when user enters checkout
window.PriceHuntTracker.track("checkout_start", {
    product_name: product.title,
    total: cart.total_price / 100,
});

// Track checkout complete after successful purchase
window.PriceHuntTracker.track("checkout_complete", {
    product_name: product.title,
    total: order.total_price / 100,
    order_id: order.order_number,
});
```

### WooCommerce Integration

```javascript
// Track checkout start
window.PriceHuntTracker.track("checkout_start", {
    product_name: product.name,
    total: cart.total,
});

// Track checkout complete
window.PriceHuntTracker.track("checkout_complete", {
    product_name: product.name,
    total: order.total,
    order_id: order.id,
});
```

## Testing

Use the provided test script to verify checkout events are working:

```bash
node test-checkout-events.js
```

This script will:

1. Track test checkout_start and checkout_complete events
2. Verify events are stored in the database
3. Test the API endpoints
4. Confirm events appear in the business activity dashboard

## Benefits

1. **Better Conversion Tracking**: See where users drop off in the checkout
   process
2. **Revenue Attribution**: Track revenue from checkout events
3. **User Journey Analysis**: Understand the complete purchase funnel
4. **Performance Monitoring**: Monitor checkout completion rates
5. **Improved User Experience**: Clear, readable event types and product names
6. **Better Data Visualization**: Meaningful product names instead of generic
   labels

## Troubleshooting

### Events Not Appearing

1. Check that the business_id and affiliate_id are correct
2. Verify the event_type is exactly "checkout_start" or "checkout_complete"
3. Ensure the API endpoint is accessible

### Dashboard Not Updating

1. Refresh the page to fetch latest data
2. Check browser console for API errors
3. Verify authentication is working

### Missing Data

1. Check that events are being sent with required fields
2. Verify the database connection is working
3. Check server logs for errors
