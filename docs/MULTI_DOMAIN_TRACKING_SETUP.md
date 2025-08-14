# Multi-Domain Tracking Setup

## Overview

Updated the tracking system to support events from both
`https://pavlo4.netlify.app` and `https://ipick.io` domains, ensuring seamless
tracking regardless of which domain users enter from.

## Changes Made

### 1. Server-Side Updates

#### CORS Configuration (`server/index.ts`)

- Added `https://ipick.io` to allowed origins
- Updated Content Security Policy to allow connections from both domains
- Ensures API endpoints accept requests from both domains

```typescript
const allowedOrigins = [
    // ... existing origins
    "https://pavlo4.netlify.app",
    "https://ipick.io", // ← Added
    // ... other origins
];
```

### 2. Client-Side Tracking Scripts

#### Dynamic Endpoint Detection

Both `public/tracker.js` and `public/shopify-tracker.js` now include:

```javascript
function getTrackingEndpoint() {
    const currentHost = window.location.hostname;

    // If we're on the main app domain, use the production endpoint
    if (currentHost === "ipick.io" || currentHost === "pavlo4.netlify.app") {
        return "https://ipick.io/api/track-event";
    }

    // For local development
    if (currentHost === "localhost" || currentHost === "127.0.0.1") {
        return "http://localhost:8084/api/track-event";
    }

    // Default to production endpoint
    return "https://ipick.io/api/track-event";
}
```

#### Enhanced Features

- **Automatic domain detection**: Scripts automatically detect which domain
  they're running on
- **Fallback support**: Defaults to production endpoint for unknown domains
- **Development support**: Uses localhost endpoint for development
- **Debug logging**: Shows which endpoint is being used during initialization

### 3. Test Page Updates

#### Enhanced Test Tracking (`public/test-tracking.html`)

- Shows current domain being used
- Displays which tracking endpoint will be used
- Provides better debugging information

## Supported Event Types

### Post-Redirect Events (Only)

- `page_view` - Page view tracking
- `product_view` - Product page views
- `add_to_cart` - Add to cart actions
- `browse` - Category/browse page views
- `search` - Search queries

### Removed Events

- `checkout_start` - Removed (handled by @checkoutdata/)
- `checkout_complete` - Removed (handled by @checkoutdata/)
- `purchase` - Removed (handled by @checkoutdata/)

## Deployment Status

✅ **Successfully Deployed**

- **Production URL**: https://ipick.io
- **Deploy URL**: https://689e49e4526da830c2bc0b49--pavlo4.netlify.app
- **Functions**: 2 deployed (server.ts, track-event.ts)

## Testing

### Test URLs

1. **Production**: https://ipick.io/test-tracking.html
2. **Netlify**: https://pavlo4.netlify.app/test-tracking.html
3. **Local**: http://localhost:8084/test-tracking.html

### Manual Testing

```javascript
// Test tracking from any domain
window.PriceHuntTracker.track("page_view");
window.PriceHuntTracker.track("product_view");
window.PriceHuntTracker.track("add_to_cart");
window.PriceHuntTracker.track("browse");
```

## Configuration

### Environment Variables

No additional environment variables required. The system automatically detects
the appropriate endpoint based on the current domain.

### Business Integration

Businesses can now use the same tracking scripts regardless of which domain
their users come from:

- `https://ipick.io/tracker.js`
- `https://ipick.io/shopify-tracker.js`

## Benefits

1. **Seamless User Experience**: Users can enter from either domain and tracking
   works consistently
2. **Simplified Integration**: Businesses only need one set of tracking scripts
3. **Automatic Fallback**: System defaults to production endpoint for
   reliability
4. **Development Friendly**: Local development works with localhost endpoints
5. **Debug Support**: Enhanced logging for troubleshooting

## Next Steps

1. **Monitor**: Watch for tracking events from both domains
2. **Test**: Verify tracking works on both pavlo4.netlify.app and ipick.io
3. **Optimize**: Consider performance optimizations if needed
4. **Document**: Update business integration guides to reflect multi-domain
   support
