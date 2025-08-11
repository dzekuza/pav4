# PriceHunt Tracking Implementation Guide

This guide provides comprehensive instructions for implementing the PriceHunt
tracking script on various e-commerce platforms.

## Overview

The PriceHunt tracking script automatically monitors user interactions on your
website and sends tracking data to our API. It tracks:

- **Page Views**: Every page visit
- **Product Views**: When users view product pages
- **Add to Cart**: When users add products to cart
- **Purchase Clicks**: When users click buy/purchase buttons
- **Conversions**: When purchases are completed

## Supported Platforms

### 1. Shopify

#### Installation Steps:

1. Go to your Shopify admin panel
2. Navigate to **Online Store > Themes**
3. Click **"Actions" > "Edit code"** on your active theme
4. Open the `theme.liquid` file (usually in the Layout folder)
5. Find the closing `</head>` tag
6. Paste the tracking script just before the `</head>` tag:

```html
<script
  src="https://paaav.vercel.app/shopify-tracker.js"
  data-business-id="YOUR_BUSINESS_ID"
  data-affiliate-id="YOUR_AFFILIATE_ID"
  data-debug="true"
></script>
```

7. Click **"Save"** to apply the changes
8. Test the tracking by visiting your store and checking the browser console

#### Shopify-Specific Features:

- Automatically detects Shopify theme objects
- Tracks AJAX cart additions
- Monitors checkout completion
- Handles Shopify-specific button selectors

#### Testing:

- Visit: `https://pavlo4.netlify.app/shopify-test.html`
- This page simulates a real Shopify store environment

### 2. WooCommerce

#### Installation Steps:

1. Go to your WordPress admin panel
2. Navigate to **Appearance > Theme Editor**
3. Select your active theme
4. Open the `header.php` file
5. Find the closing `</head>` tag
6. Paste the tracking script just before the `</head>` tag:

```html
<script
  src="https://paaav.vercel.app/woocommerce-tracker.js"
  data-business-id="YOUR_BUSINESS_ID"
  data-affiliate-id="YOUR_AFFILIATE_ID"
  data-debug="true"
></script>
```

7. Click **"Update File"** to save changes
8. Test the tracking by visiting your store

#### WooCommerce-Specific Features:

- Detects WooCommerce product data
- Tracks WooCommerce cart events
- Monitors WooCommerce checkout process

### 3. Magento

#### Installation Steps:

1. Go to your Magento admin panel
2. Navigate to **Content > Design > Configuration**
3. Click **"Edit"** on your active theme
4. Go to the **"HTML Head"** section
5. Add the tracking script to the **"Scripts and Style Sheets"** field:

```html
<script
  src="https://paaav.vercel.app/magento-tracker.js"
  data-business-id="YOUR_BUSINESS_ID"
  data-affiliate-id="YOUR_AFFILIATE_ID"
  data-debug="true"
></script>
```

6. Click **"Save Configuration"**
7. Clear the cache (**System > Cache Management**)
8. Test the tracking by visiting your store

#### Magento-Specific Features:

- Detects Magento product data
- Tracks Magento cart events
- Monitors Magento checkout process

### 4. Universal (Other Platforms)

#### Installation Steps:

1. Add the tracking script to your website's `<head>` section
2. Make sure it loads before any other scripts
3. Test the tracking by visiting your website
4. Check the browser console for any errors

```html
<script
  src="https://paaav.vercel.app/tracker.js"
  data-business-id="YOUR_BUSINESS_ID"
  data-affiliate-id="YOUR_AFFILIATE_ID"
  data-platform="your-platform"
  data-debug="true"
></script>
```

## Configuration Parameters

### Required Parameters:

- `data-business-id`: Your unique business identifier
- `data-affiliate-id`: Your unique affiliate identifier

### Optional Parameters:

- `data-debug`: Set to "true" to enable debug logging
- `data-platform`: Platform identifier (for universal tracker)

## Testing Your Implementation

### 1. Browser Console Testing

1. Open your website in a browser
2. Open developer tools (F12)
3. Go to the Console tab
4. Look for tracking messages starting with "Tracking event:"
5. Test by clicking on products, adding to cart, or completing purchases

### 2. Test Pages

- **Shopify Test**: `https://paaav.vercel.app/shopify-test.html`
- **Universal Test**: `https://paaav.vercel.app/test-tracking.html`

### 3. Manual Testing

Test these scenarios:

- Page views (should track automatically)
- Product clicks
- Add to cart buttons
- Purchase buttons
- Checkout completion

## Debug Mode

Enable debug mode to see detailed tracking logs in the browser console:

```html
<script
  src="https://pavlo4.netlify.app/shopify-tracker.js"
  data-business-id="YOUR_BUSINESS_ID"
  data-affiliate-id="YOUR_AFFILIATE_ID"
  data-debug="true"
></script>
```

Debug mode will show:

- Tracking event details
- Product data extraction
- API request information
- Error messages

## Common Issues and Solutions

### 1. Script Not Loading

**Symptoms**: No tracking events in console **Solutions**:

- Check if the script URL is accessible
- Verify the script is in the `<head>` section
- Check for JavaScript errors in console

### 2. Missing Product Data

**Symptoms**: Events tracked but no product information **Solutions**:

- Ensure product data attributes are present
- Check if the platform-specific tracker is being used
- Verify Shopify theme object is available (for Shopify)

### 3. Events Not Being Sent

**Symptoms**: Console logs but no data in dashboard **Solutions**:

- Check network tab for failed API requests
- Verify business_id and affiliate_id are correct
- Check if the API endpoint is accessible

### 4. Duplicate Events

**Symptoms**: Same event tracked multiple times **Solutions**:

- Ensure script is only loaded once
- Check for multiple script tags
- Verify no duplicate event listeners

## API Endpoints

### Track Event

- **URL**: `https://paaav.vercel.app/api/track-event`
- **Method**: POST
- **Content-Type**: application/json

### Request Body:

```json
{
  "event_type": "page_view|product_view|add_to_cart|purchase_click|conversion",
  "business_id": "YOUR_BUSINESS_ID",
  "affiliate_id": "YOUR_AFFILIATE_ID",
  "platform": "shopify|woocommerce|magento|universal",
  "session_id": "unique_session_id",
  "user_agent": "browser_user_agent",
  "referrer": "referring_url",
  "timestamp": 1234567890,
  "url": "current_page_url",
  "data": {
    "product_id": "product_identifier",
    "product_name": "Product Name",
    "price": "99.99",
    "currency": "USD"
  }
}
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS for production
2. **CORS**: API supports cross-origin requests
3. **Rate Limiting**: API includes rate limiting to prevent abuse
4. **Data Privacy**: Only essential tracking data is collected

## Performance Impact

The tracking script is designed to be lightweight:

- **Size**: ~15KB minified
- **Load Time**: < 100ms typically
- **Memory Usage**: Minimal impact
- **Network**: Only sends data on user interactions

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting Checklist

- [ ] Script is loaded in `<head>` section
- [ ] Business ID and Affiliate ID are correct
- [ ] No JavaScript errors in console
- [ ] Network requests are successful
- [ ] Debug mode shows tracking events
- [ ] Test page works correctly
- [ ] Real user interactions are tracked

## Support

If you encounter issues:

1. Check the browser console for errors
2. Enable debug mode for detailed logs
3. Test with the provided test pages
4. Verify your configuration parameters
5. Contact support with specific error messages

## Updates and Maintenance

The tracking scripts are automatically updated and maintained. New features and
improvements are deployed regularly without requiring changes to your
implementation.
