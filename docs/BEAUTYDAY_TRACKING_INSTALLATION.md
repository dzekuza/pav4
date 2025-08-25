# Beautyday.lt iPick Tracking Installation Guide

## Overview

This guide provides instructions for installing and testing the iPick tracking
script on beautyday.lt to track user interactions and conversions.

## Configuration Details

- **Business ID**: `4` (numeric ID for beautyday.lt)
- **Affiliate ID**: `aff_beautydayl_1756154229316_i8kgfy`
- **Platform**: Shopify
- **Endpoint**: `https://ipick.io/api/track-event`

## Installation Steps

### 1. Add Tracking Script to Website

Add the following script tag to the `<head>` section of your Shopify theme:

```html
<script src="https://ipick.io/ipick-tracking.js" async></script>
```

### 2. Script Features

The tracking script automatically tracks:

- **Page Views**: Every product page visit
- **Add to Cart**: When users add products to cart
- **Checkout Initiation**: When users proceed to checkout
- **Purchase Completion**: When orders are completed

### 3. Event Types Tracked

- `page_view` - Product page visits
- `add_to_cart` - Product added to cart
- `checkout` - Checkout process initiated
- `purchase_complete` - Order completed

## Testing the Installation

### Method 1: Browser Console Testing

1. Open beautyday.lt in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Look for iPick tracking messages:
   - `🚀 iPick tracking script initialized`
   - `✅ iPick: page_view event sent successfully`
   - `✅ iPick: add_to_cart event sent successfully`

### Method 2: Local Test Environment

1. Download the test HTML file: `test-beautyday-tracking.html`
2. Open it in a browser
3. Use the test controls to simulate events
4. Check the console output for tracking messages

### Method 3: API Testing

Use the provided test scripts:

```bash
# Test the tracking endpoint
node scripts/test-beautyday-tracking.js

# Test with curl
./scripts/test-tracking-curl.sh

# Check recent tracking events
node scripts/check-tracking-events.js
```

## Verification Steps

### 1. Check Database Events

Run the tracking events check script:

```bash
node scripts/check-tracking-events.js
```

Expected output:

```
📊 Found X recent tracking events:
1. Event ID: XX
   Type: page_view
   Session: session_XXXXXXXX
   URL: https://beautyday.lt/products/...
   Time: [timestamp]
   Data: {...}
```

### 2. Check Business Statistics

The script should show updated statistics:

```
📈 Business Statistics:
   Name: Beautyday
   Total Visits: [number]
   Total Purchases: [number]
   Total Revenue: €[amount]
```

## Troubleshooting

### Common Issues

1. **Script Not Loading**
   - Check if the script URL is accessible: `https://ipick.io/ipick-tracking.js`
   - Verify the script tag is in the `<head>` section
   - Check browser console for network errors

2. **Events Not Sending**
   - Verify the business ID is correct (should be `4`)
   - Check CORS settings (endpoint allows all origins)
   - Look for JavaScript errors in browser console

3. **Wrong Business ID**
   - The script uses business ID `4` for beautyday.lt
   - Do not use string IDs like `'beautydayl'`

### Debug Mode

The tracking script includes console logging:

- ✅ Success messages for successful events
- ⚠️ Warning messages for failed requests
- ❌ Error messages for network issues

## Data Flow

1. **User visits product page** → `page_view` event sent
2. **User adds to cart** → `add_to_cart` event sent
3. **User clicks checkout** → `checkout` event sent
4. **Order completed** → `purchase_complete` event sent

## Event Data Structure

Each event includes:

- Event type and timestamp
- Business and affiliate IDs
- User session information
- Product details (title, price, currency)
- Cart information (when applicable)
- Page URL and referrer

## Security Considerations

- The tracking script only sends non-sensitive data
- No personal information is collected
- All requests use HTTPS
- CORS is properly configured for cross-origin requests

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify the script is loading correctly
3. Test the API endpoint directly
4. Check the database for recorded events

## Recent Updates

- ✅ Fixed business ID from string to numeric (4)
- ✅ Updated event payload structure
- ✅ Added session tracking
- ✅ Improved error handling and logging
- ✅ Added comprehensive testing tools
