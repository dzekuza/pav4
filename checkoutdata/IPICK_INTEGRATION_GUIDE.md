# iPick.io Shopify Integration Guide

## Overview
This guide explains how to integrate the iPick tracking system with your ipick.io application to track referrals and conversions to Shopify stores.

## 🚀 Quick Start

### 1. Include the Tracking Script
Add the tracking script to your ipick.io application:

```html
<script src="https://checkoutdata--development.gadget.app/tracking-script-ipick.js"></script>
```

### 2. Initialize Tracking
Initialize the tracking with your configuration:

```javascript
const tracking = new IpickTracking({
  affiliateId: 'your_affiliate_id',
  apiUrl: 'https://checkoutdata--development.gadget.app/api',
  utmSource: 'ipick',
  utmMedium: 'price_comparison',
  utmCampaign: 'product_referral'
});
```

### 3. Add Data Attributes to Product Links
Add tracking data attributes to your product links:

```html
<a href="https://shopify-store.com/product/123" 
   class="product-link"
   data-product-id="123"
   data-product-name="Wireless Headphones"
   data-price="29.99"
   data-store="Shopify Store">
  Buy Now - $29.99
</a>
```

## 📋 Complete Integration Steps

### Step 1: Setup Tracking Configuration

```javascript
// Configuration object
const ipickConfig = {
  affiliateId: 'ipick_main', // Your unique affiliate ID
  apiUrl: 'https://checkoutdata--development.gadget.app/api',
  utmSource: 'ipick',
  utmMedium: 'price_comparison', 
  utmCampaign: 'product_referral'
};

// Initialize tracking
const tracking = new IpickTracking(ipickConfig);
```

### Step 2: Modify Your Product Links

#### Option A: Automatic Tracking (Recommended)
The tracking script will automatically detect and track product links with the `product-link` class:

```html
<a href="https://shopify-store.com/product/123" 
   class="product-link"
   data-product-id="123"
   data-product-name="Product Name"
   data-price="29.99"
   data-store="Store Name">
  Buy Now
</a>
```

#### Option B: Manual Tracking
For custom implementations, manually track clicks:

```javascript
// Track referral click
async function handleProductClick(storeUrl, productData) {
  const tracked = await tracking.trackReferralClick(storeUrl, {
    name: productData.name,
    price: productData.price,
    id: productData.id
  });
  
  if (tracked) {
    // Create tracking URL with UTM parameters
    const trackingUrl = tracking.createTrackingUrl(storeUrl, {
      product_id: productData.id,
      product_name: productData.name
    });
    
    // Redirect user
    window.open(trackingUrl, '_blank');
  }
}
```

### Step 3: Track User Interactions

```javascript
// Track search queries
tracking.trackCustomEvent('search', {
  query: 'wireless headphones',
  results_count: 15
});

// Track filter changes
tracking.trackCustomEvent('filter_change', {
  filter_type: 'price_range',
  filter_value: '25-50'
});

// Track product views
tracking.trackCustomEvent('product_view', {
  product_id: '123',
  product_name: 'Wireless Headphones',
  price: '29.99'
});
```

## 🔧 Advanced Configuration

### Custom UTM Parameters

```javascript
const tracking = new IpickTracking({
  affiliateId: 'ipick_main',
  utmSource: 'ipick',
  utmMedium: 'price_comparison',
  utmCampaign: 'product_referral',
  // Custom parameters
  customParams: {
    platform: 'web',
    version: '1.0'
  }
});
```

### Multiple Affiliate IDs

```javascript
// Different affiliate IDs for different sections
const mainTracking = new IpickTracking({
  affiliateId: 'ipick_main',
  utmCampaign: 'main_site'
});

const mobileTracking = new IpickTracking({
  affiliateId: 'ipick_mobile',
  utmCampaign: 'mobile_app'
});
```

### Custom Product Link Detection

```javascript
// Override the default product link detection
tracking.isProductLink = function(link) {
  // Custom logic to detect product links
  return link.classList.contains('buy-button') || 
         link.href.includes('/product/') ||
         link.dataset.trackable === 'true';
};
```

## 📊 Tracking Events

### Automatic Events
The tracking script automatically tracks these events:

- **Page Views**: When users visit pages
- **Product Link Clicks**: When users click on product links
- **Search Queries**: When users search for products
- **Filter Changes**: When users apply filters

### Custom Events
Track custom events for better analytics:

```javascript
// Track user registration
tracking.trackCustomEvent('user_signup', {
  method: 'email',
  source: 'product_page'
});

// Track comparison views
tracking.trackCustomEvent('comparison_view', {
  product_count: 3,
  stores: ['amazon', 'walmart', 'target']
});

// Track price alerts
tracking.trackCustomEvent('price_alert', {
  product_id: '123',
  target_price: '25.00',
  current_price: '29.99'
});
```

## 🔍 Testing Your Integration

### 1. Test Referral Tracking

```javascript
// Test referral click tracking
const testUrl = 'https://your-shopify-store.com/product/123';
const testProduct = {
  name: 'Test Product',
  price: '29.99',
  id: 'test_123'
};

tracking.trackReferralClick(testUrl, testProduct)
  .then(success => {
    console.log('Tracking test:', success ? 'SUCCESS' : 'FAILED');
  });
```

### 2. Test UTM Parameter Generation

```javascript
const originalUrl = 'https://shopify-store.com/product/123';
const trackingUrl = tracking.createTrackingUrl(originalUrl, {
  product_id: '123',
  product_name: 'Test Product'
});

console.log('Tracking URL:', trackingUrl);
// Should output: https://shopify-store.com/product/123?utm_source=ipick&utm_medium=price_comparison&utm_campaign=product_referral&ref=ipick_main&product_id=123&product_name=Test%20Product
```

### 3. Verify Webhook Data
After making a test purchase:

1. Check your Gadget app logs at `/checkouts`
2. Verify the order appears with correct UTM parameters
3. Confirm the referral is marked as converted

## 📈 Analytics Dashboard

### View Tracking Data
Access your tracking data through the Gadget app:

- **Checkouts**: `/checkouts` - View all checkout data
- **Orders**: `/checkouts` - View all order data  
- **Referrals**: Business dashboard - View referral conversions

### Key Metrics to Monitor

1. **Referral Clicks**: Number of clicks from ipick.io
2. **Conversion Rate**: Percentage of clicks that result in purchases
3. **Revenue**: Total revenue from ipick.io referrals
4. **Top Products**: Most clicked products
5. **Store Performance**: Which stores convert best

## 🛠 Troubleshooting

### Common Issues

#### 1. Tracking Script Not Loading
```javascript
// Check if script loaded
if (typeof IpickTracking === 'undefined') {
  console.error('Tracking script not loaded');
}
```

#### 2. API Calls Failing
```javascript
// Check network requests in browser dev tools
// Verify API URL is correct
// Check CORS settings
```

#### 3. UTM Parameters Not Appearing
```javascript
// Verify URL generation
const testUrl = tracking.createTrackingUrl('https://example.com');
console.log('Generated URL:', testUrl);
```

#### 4. Webhooks Not Receiving Data
- Check Shopify app webhook configuration
- Verify webhook endpoints are accessible
- Check Gadget app logs for errors

### Debug Mode

```javascript
// Enable debug logging
const tracking = new IpickTracking({
  ...config,
  debug: true
});
```

## 🔒 Security Considerations

### Data Privacy
- Only track necessary data
- Respect user privacy preferences
- Comply with GDPR requirements

### API Security
- Use HTTPS for all API calls
- Validate input data
- Implement rate limiting

## 📞 Support

For technical support or questions:

1. Check the Gadget app logs for errors
2. Verify webhook configuration in Shopify
3. Test with the provided example files
4. Review this integration guide

## 🎯 Best Practices

### 1. Performance
- Load tracking script asynchronously
- Minimize API calls
- Use efficient event listeners

### 2. User Experience
- Don't block page navigation
- Provide fallback behavior
- Handle errors gracefully

### 3. Analytics
- Track meaningful events
- Use consistent naming conventions
- Monitor conversion rates

### 4. Maintenance
- Keep tracking script updated
- Monitor API endpoints
- Review analytics regularly

## 📝 Example Implementation

See `ipick-integration-example.html` for a complete working example of the integration.

## 🔄 Updates and Maintenance

The tracking system is designed to be backward compatible. When updating:

1. Test in development environment
2. Verify all tracking events work
3. Monitor conversion rates
4. Update documentation

---

**Need Help?** Check the example files and test your integration step by step. The system is designed to be robust and handle edge cases gracefully.
