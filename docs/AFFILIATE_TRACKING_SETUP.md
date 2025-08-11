# Affiliate Tracking & GTM Setup Guide

This guide explains how to set up affiliate tracking and Google Tag Manager (GTM) for cross-domain tracking of user interactions and conversions.

## 🎯 Overview

The implementation includes:

- **Google Tag Manager (GTM)** integration for analytics
- **Affiliate link generation** for major retailers
- **Cross-domain tracking** with UTM parameters
- **Conversion tracking** for purchases
- **Session-based tracking** for user journeys

## 📋 Prerequisites

1. **Google Tag Manager Account**

   - Create a GTM account at [tagmanager.google.com](https://tagmanager.google.com)
   - Get your GTM container ID (format: `GTM-XXXXXXX`)

2. **Affiliate Program Accounts**
   - Amazon Associates
   - eBay Partner Network
   - Walmart Affiliate Program
   - Target Affiliate Program
   - Best Buy Affiliate Program
   - Apple Affiliate Program
   - PlayStation Affiliate Program
   - Newegg Affiliate Program
   - Costco Affiliate Program

## 🔧 Setup Instructions

### 1. Configure Google Tag Manager

#### Update GTM Container ID

Replace `GTM-XXXXXXX` in `index.html` with your actual GTM container ID:

```html
<!-- Google Tag Manager -->
<script>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "YOUR-GTM-CONTAINER-ID");
</script>
<!-- End Google Tag Manager -->
```

#### Create GTM Triggers

In your GTM container, create the following triggers:

1. **Affiliate Click Trigger**

   - Event name: `affiliate_click`
   - Fires on: Custom Event

2. **Product Search Trigger**

   - Event name: `product_search`
   - Fires on: Custom Event

3. **Price Comparison Trigger**

   - Event name: `price_comparison`
   - Fires on: Custom Event

4. **Purchase Trigger**
   - Event name: `purchase`
   - Fires on: Custom Event

### 2. Configure Affiliate IDs

Update the affiliate configuration in `client/lib/tracking.ts`:

```typescript
const AFFILIATE_CONFIG: AffiliateConfig = {
  amazonTag: "your-amazon-tag-20",
  ebayPartnerId: "your-ebay-partner-id",
  walmartAffiliateId: "your-walmart-affiliate-id",
  targetAffiliateId: "your-target-affiliate-id",
  bestbuyAffiliateId: "your-bestbuy-affiliate-id",
  appleAffiliateId: "your-apple-affiliate-id",
  playstationAffiliateId: "your-playstation-affiliate-id",
  neweggAffiliateId: "your-newegg-affiliate-id",
  costcoAffiliateId: "your-costco-affiliate-id",
};
```

### 3. Database Setup

The database schema has been updated with new tables:

- `AffiliateClick` - Tracks affiliate link clicks
- `AffiliateConversion` - Tracks conversions/purchases
- `BusinessClick` - Tracks business-specific clicks
- `BusinessConversion` - Tracks business-specific conversions

Run the database migration:

```bash
npx prisma db push
```

## 📊 Tracking Events

### 1. Product Search Tracking

```typescript
trackProductSearch({
  productUrl: "https://amazon.com/product",
  productTitle: "Product Name",
  productPrice: "$99.99",
  sessionId: "session_123",
  referrer: "google.com",
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "summer_sale",
});
```

### 2. Affiliate Click Tracking

```typescript
trackAffiliateClick({
  productUrl: "https://amazon.com/product",
  productTitle: "Product Name",
  productPrice: "$99.99",
  retailer: "Amazon",
  sessionId: "session_123",
  referrer: "pricehunt.com",
  utmSource: "pricehunt",
  utmMedium: "price_comparison",
  utmCampaign: "product_search",
});
```

### 3. Price Comparison Tracking

```typescript
trackPriceComparison({
  productUrl: "https://amazon.com/product",
  productTitle: "Product Name",
  productPrice: "$99.99",
  alternatives: [...],
  sessionId: "session_123",
  referrer: "pricehunt.com",
  utmSource: "pricehunt",
  utmMedium: "price_comparison",
  utmCampaign: "product_search"
});
```

### 4. Conversion Tracking

```typescript
trackConversion({
  productUrl: "https://amazon.com/product",
  productTitle: "Product Name",
  productPrice: "$99.99",
  retailer: "Amazon",
  sessionId: "session_123",
  referrer: "pricehunt.com",
  utmSource: "pricehunt",
  utmMedium: "price_comparison",
  utmCampaign: "product_search",
});
```

## 🔗 Affiliate Link Generation

The system automatically generates affiliate links for supported retailers:

### Amazon

- Adds `tag` parameter with your Amazon Associates tag
- Example: `https://amazon.com/product?tag=your-tag-20&ref=pricehunt`

### eBay

- Adds `partner` parameter with your eBay Partner Network ID
- Example: `https://ebay.com/product?partner=your-partner-id&ref=pricehunt`

### Other Retailers

- Adds `affiliate` parameter with your affiliate ID
- Example: `https://walmart.com/product?affiliate=your-affiliate-id&ref=pricehunt`

## 📈 Analytics Dashboard

### API Endpoints

1. **Get Affiliate Statistics**

   ```
   GET /api/affiliate/stats?startDate=2024-01-01&endDate=2024-12-31&retailer=amazon
   ```

2. **Get UTM Campaign Performance**
   ```
   GET /api/affiliate/utm-stats?startDate=2024-01-01&endDate=2024-12-31
   ```

### Sample Response

```json
{
  "success": true,
  "stats": [
    {
      "retailer": "Amazon",
      "clicks": 150,
      "conversions": 12,
      "conversionRate": 8.0,
      "totalRevenue": 1199.88
    }
  ]
}
```

## 🎯 UTM Parameter Tracking

The system automatically captures and stores UTM parameters:

- `utm_source` - Traffic source (e.g., "google", "facebook")
- `utm_medium` - Marketing medium (e.g., "cpc", "email")
- `utm_campaign` - Campaign name (e.g., "summer_sale")
- `utm_term` - Keywords (for paid search)
- `utm_content` - Ad content (for A/B testing)

## 🔒 Privacy & Compliance

### Data Collection

- Session IDs for user journey tracking
- IP addresses for fraud prevention
- User agents for analytics
- Referrer information for attribution

### GDPR Compliance

- Session data is stored in sessionStorage
- No persistent user tracking without consent
- Data can be anonymized or deleted on request

## 🚀 Testing

### 1. Test GTM Integration

1. Open browser developer tools
2. Go to the Network tab
3. Click on a product link
4. Verify GTM events are firing

### 2. Test Affiliate Links

1. Click "View Deal" on any product
2. Verify affiliate parameters are added to URL
3. Check that tracking data is sent to backend

### 3. Test Conversion Tracking

1. Simulate a purchase on retailer site
2. Verify conversion event is tracked
3. Check database for conversion record

## 📝 Environment Variables

Add these to your `.env` file:

```env
DATABASE_URL="file:./prisma/dev.db"
GTM_CONTAINER_ID="GTM-XXXXXXX"
AMAZON_AFFILIATE_TAG="your-amazon-tag-20"
EBAY_PARTNER_ID="your-ebay-partner-id"
WALMART_AFFILIATE_ID="your-walmart-affiliate-id"
TARGET_AFFILIATE_ID="your-target-affiliate-id"
BESTBUY_AFFILIATE_ID="your-bestbuy-affiliate-id"
APPLE_AFFILIATE_ID="your-apple-affiliate-id"
PLAYSTATION_AFFILIATE_ID="your-playstation-affiliate-id"
NEWEGG_AFFILIATE_ID="your-newegg-affiliate-id"
COSTCO_AFFILIATE_ID="your-costco-affiliate-id"
```

## 🔧 Troubleshooting

### Common Issues

1. **GTM not loading**

   - Check CSP settings in `index.html`
   - Verify GTM container ID is correct
   - Check browser console for errors

2. **Affiliate links not working**

   - Verify affiliate IDs are correct
   - Check that retailer domains are supported
   - Test with a simple product URL

3. **Tracking events not firing**

   - Check browser console for JavaScript errors
   - Verify dataLayer is available
   - Test with GTM preview mode

4. **Database errors**
   - Run `npx prisma generate`
   - Run `npx prisma db push`
   - Check database connection

## 📞 Support

For issues or questions:

1. Check browser console for errors
2. Verify all configuration steps are complete
3. Test with GTM preview mode
4. Review database logs for tracking data

---

**Note**: This implementation provides comprehensive tracking for affiliate marketing and user behavior analysis. Make sure to comply with all applicable privacy laws and affiliate program terms of service.
