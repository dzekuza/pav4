# PriceHunt Enhanced Tracking Solution

## Overview

This is an improved CORS-free tracking solution for PriceHunt that eliminates
the popup-based approach and provides more reliable event tracking.

## Key Improvements

### 1. **Direct API Communication**

- Removed popup window approach that was being blocked by browsers
- Direct communication with Netlify Functions API
- Proper CORS handling with fallback mechanisms

### 2. **Enhanced Product Detection**

- JSON-LD structured data extraction
- Meta tag fallback for product information
- Dynamic content detection via MutationObserver

### 3. **Robust Error Handling**

- Retry logic with configurable attempts
- Image beacon fallback for failed requests
- Graceful degradation when sessionStorage is unavailable

### 4. **Comprehensive Event Tracking**

- Page views
- Product views (with automatic product data extraction)
- Add to cart events
- Checkout start events
- Purchase completion detection

## Files

### Core Tracking Script

- `public/track-via-proxy.js` - Main tracking script

### Backend API

- `netlify/functions/track-event.ts` - Netlify Function for handling tracking
  events
- `server/routes/track-event.ts` - Server-side event processing logic

### Test Files

- `public/test-tracking.html` - Test page for verifying tracking functionality

## Configuration

The tracking script is configured via the `config` object in
`track-via-proxy.js`:

```javascript
const config = {
    businessId: "10", // Your business ID
    affiliateId: "pavlo4", // Your affiliate ID
    apiUrl: "https://pavlo4.netlify.app/.netlify/functions/track-event",
    debug: true, // Enable/disable debug logging
    retryAttempts: 3, // Number of retry attempts
    retryDelay: 1000, // Delay between retries (ms)
};
```

## Installation

1. **Include the tracking script** in your website:
   ```html
   <script src="https://pavlo4.netlify.app/track-via-proxy.js"></script>
   ```

2. **Update the configuration** in the script to match your business:
   - Set `businessId` to your actual business ID
   - Set `affiliateId` to your affiliate identifier
   - Update `apiUrl` if needed

## Event Types

### Automatic Events

- **page_view**: Triggered on every page load
- **product_view**: Triggered when product data is detected on the page

### User Interaction Events

- **add_to_cart**: Triggered when users click add-to-cart buttons or submit cart
  forms
- **checkout_start**: Triggered when users click checkout buttons or navigate to
  checkout pages
- **purchase_complete**: Automatically detected on thank-you/confirmation pages

## Product Data Extraction

The tracker automatically extracts product information from:

1. **JSON-LD structured data** (preferred)
2. **Meta tags** (fallback)
3. **Page content** (final fallback)

### JSON-LD Example

```html
<script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Product Name",
        "sku": "PRODUCT-123",
        "offers": {
            "@type": "Offer",
            "price": "29.99",
            "priceCurrency": "EUR"
        }
    }
</script>
```

## Testing

Use the test page to verify tracking functionality:

1. Open `https://pavlo4.netlify.app/test-tracking.html`
2. Click the test buttons to trigger different events
3. Check the console log for tracking activity
4. Verify events are being recorded in your database

## Debugging

Enable debug mode by setting `config.debug = true`. This will log:

- Event data being sent
- Success/failure responses
- Product data extraction results
- Retry attempts

## Fallback Mechanisms

### 1. SessionStorage Fallback

If sessionStorage is unavailable (e.g., in sandboxed environments), the tracker
uses temporary session IDs.

### 2. Network Request Fallback

If the main fetch request fails, the tracker falls back to an image beacon
approach.

### 3. Product Data Fallback

If JSON-LD data isn't available, the tracker tries meta tags, then basic page
information.

## Browser Compatibility

- **Modern browsers**: Full functionality with all features
- **Older browsers**: Graceful degradation with basic tracking
- **Sandboxed environments**: Limited functionality but still tracks events

## Security Considerations

- CORS is properly configured to allow cross-origin requests
- No sensitive data is exposed in client-side code
- All tracking data is validated server-side
- IP addresses are captured for analytics

## Performance Impact

- Minimal impact on page load time
- Asynchronous event sending
- No blocking operations
- Efficient product data extraction

## Troubleshooting

### Common Issues

1. **Events not being tracked**
   - Check browser console for errors
   - Verify API endpoint is accessible
   - Ensure business ID is correct

2. **CORS errors**
   - Verify Netlify Function is deployed
   - Check CORS headers in function response
   - Ensure proper origin handling

3. **Product data not extracted**
   - Add JSON-LD structured data to your pages
   - Check meta tags for product information
   - Verify page structure matches expected patterns

### Debug Steps

1. Open browser developer tools
2. Check Console tab for tracking logs
3. Check Network tab for API requests
4. Verify function responses in Netlify logs

## API Endpoints

### POST /.netlify/functions/track-event

Accepts tracking events via JSON payload.

### GET /.netlify/functions/track-event

Accepts tracking events via query parameters (image beacon fallback).

Both endpoints return appropriate CORS headers and handle errors gracefully.
