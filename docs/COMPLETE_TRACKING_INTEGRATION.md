# Complete Tracking Integration: Pavlo4 + Shopify

This document describes the complete integration between Pavlo4's price
comparison platform and Shopify tracking, creating a full customer journey
tracking system.

## 🎯 Overview

The integration provides a complete customer journey tracking system that
combines:

1. **Pavlo4 Tracking**: Product clicks and user interactions on the price
   comparison platform
2. **Shopify Tracking**: Checkout and order data from Shopify stores
3. **Unified Analytics**: Complete view of the customer journey from click to
   purchase

## 🔄 Customer Journey Flow

```
User clicks product on Pavlo4 → Referral tracked in Gadget → 
User visits Shopify store → Checkout tracked via webhooks → 
User completes purchase → Order tracked via webhooks → 
Business sees complete analytics in dashboard
```

## 🏗️ Architecture

### Components

1. **Enhanced Tracking Library** (`client/lib/tracking.ts`)
   - `trackReferral()`: Tracks referrals to Shopify stores
   - `handleProductClick()`: Enhanced click handler with Shopify integration
   - `getCompleteAnalytics()`: Retrieves combined analytics data

2. **Updated ProductCard Component** (`client/components/ProductCard.tsx`)
   - Automatically detects business domains
   - Uses enhanced tracking for business products
   - Falls back to regular affiliate tracking for non-business products

3. **Business Analytics Dashboard**
   (`client/components/BusinessAnalyticsDashboard.tsx`)
   - Shows complete customer journey
   - Displays conversion metrics
   - Timeline of all events

4. **Shopify Integration** (`checkoutdata/`)
   - `trackReferral` action: Records referral clicks
   - `getBusinessAnalytics` action: Provides analytics data
   - Webhook processing: Tracks checkout and order events

## 🚀 Implementation

### Step 1: Enhanced Tracking Library

The tracking library now includes Shopify integration:

```typescript
// Track referral to Shopify store
const result = await trackReferral(
   "godislove.lt", // business domain
   "https://godislove.lt/products/socks", // product URL
   "Cotton Logo Socks", // product name
   "user_123", // user ID
);

// Enhanced product click handler
const result = await handleProductClick(
   { url, title, name: title }, // product object
   "godislove.lt", // business domain
);

// Get complete analytics
const events = await getCompleteAnalytics("godislove.lt");
```

### Step 2: ProductCard Integration

ProductCard components automatically detect business domains and use enhanced
tracking:

```typescript
<ProductCard
   title="Cotton Logo Socks"
   price={29.99}
   currency="USD"
   url="https://godislove.lt/products/socks"
   store="God is Love"
   businessDomain="godislove.lt" // Enables Shopify tracking
   showBuyNow={true}
/>;
```

### Step 3: Business Analytics Dashboard

The dashboard shows the complete customer journey:

```typescript
<BusinessAnalyticsDashboard businessDomain="godislove.lt" />;
```

## 📊 Data Flow

### 1. Referral Tracking (Pavlo4 → Shopify)

When a user clicks a business product:

1. **Generate Referral ID**: `aff_godislove_1234567890_abc123`
2. **Add UTM Parameters**:
   - `utm_source=ipick.io`
   - `utm_medium=suggestion`
   - `utm_campaign=business_tracking`
   - `ref_id=aff_godislove_1234567890_abc123`
3. **Track in Gadget**: Create `businessReferral` record
4. **Redirect User**: Open product URL with tracking parameters

### 2. Checkout Tracking (Shopify Webhooks)

When user starts/completes checkout:

1. **Webhook Received**: Shopify sends checkout event
2. **UTM Detection**: Extract UTM parameters from `sourceUrl`
3. **Referral Matching**: Find matching `businessReferral` record
4. **Status Update**: Update conversion status based on checkout completion

### 3. Order Tracking (Shopify Webhooks)

When order is created:

1. **Webhook Received**: Shopify sends order event
2. **Timing Matching**: Find referrals clicked within 24 hours
3. **Conversion Update**: Mark referral as converted with order value

### 4. Analytics Retrieval

When business views dashboard:

1. **Fetch Shopify Events**: Get checkout and order data
2. **Fetch Existing Events**: Get existing Pavlo4 tracking data
3. **Merge and Sort**: Combine all events by timestamp
4. **Display Journey**: Show complete customer timeline

## 🔧 Configuration

### Environment Detection

The system automatically detects the environment:

```typescript
const getShopifyApiUrl = () => {
   const isDevelopment = window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("--development");
   return isDevelopment
      ? "https://checkoutdata--development.gadget.app/api/graphql"
      : "https://checkoutdata.gadget.app/api/graphql";
};
```

### UTM Parameters

Standard UTM parameters for tracking:

- **Source**: `ipick.io`
- **Medium**: `suggestion`
- **Campaign**: `business_tracking`
- **Ref ID**: Unique referral identifier

## 📈 Analytics Data

### Event Types

1. **product_click**: User clicked product on Pavlo4
2. **checkout_start**: User started checkout on Shopify
3. **checkout_complete**: User completed checkout on Shopify
4. **order_created**: Order was created on Shopify

### Metrics Calculated

- **Total Clicks**: Number of product clicks
- **Total Checkouts**: Number of checkout starts
- **Total Orders**: Number of completed orders
- **Total Revenue**: Sum of all order values
- **Conversion Rate**: (Orders / Clicks) × 100
- **Average Order Value**: Revenue / Orders

## 🧪 Testing

### Test Script

Use the test script to verify integration:

```typescript
// Test referral tracking
await testIntegration.testReferralTracking();

// Test analytics retrieval
await testIntegration.testAnalyticsRetrieval();

// Test complete flow
await testIntegration.testCompleteFlow();

// Run all tests
await testIntegration.runAllTests();
```

### Manual Testing

1. **Click Product**: Click a business product on Pavlo4
2. **Check Gadget**: Verify referral appears in Gadget dashboard
3. **Complete Purchase**: Go through checkout on Shopify store
4. **Verify Analytics**: Check that events appear in business dashboard

## 🚨 Error Handling

### Fallback Mechanisms

1. **Shopify Tracking Fails**: Falls back to regular affiliate tracking
2. **Analytics Unavailable**: Shows existing Pavlo4 data only
3. **Network Errors**: Graceful degradation with user-friendly messages

### Error Logging

All errors are logged with context:

```typescript
logger.error("Error processing ipick.io referral checkout", {
   error: error instanceof Error ? error.message : String(error),
   checkoutId: record.id,
});
```

## 🔒 Security

### Data Protection

1. **Row-Level Security**: Each shop only sees its own data
2. **Cross-Shop Prevention**: Prevents access to other shops' data
3. **Input Validation**: All inputs are validated and sanitized

### Access Control

1. **Shopify App Users**: Can only access their own shop data
2. **Unauthenticated**: Can only access public analytics
3. **Business Owners**: Full access to their analytics

## 📋 Deployment Checklist

### Development

- [ ] Shopify app deployed to development environment
- [ ] Gadget development environment configured
- [ ] Test referrals working
- [ ] Analytics retrieval working
- [ ] Complete flow tested

### Production

- [ ] Shopify app deployed to production environment
- [ ] Gadget production environment configured
- [ ] Business owners have installed Shopify app
- [ ] Webhooks configured and working
- [ ] Analytics dashboard accessible
- [ ] Error monitoring configured

## 🎯 Business Value

### For Users

- Seamless experience from price comparison to purchase
- No additional tracking or setup required

### For Businesses

- Complete visibility into customer journey
- Accurate attribution of sales to Pavlo4
- Real-time analytics and conversion tracking
- ROI measurement for price comparison platform

### For Platform

- Monetization through commission-based model
- Data-driven insights for platform optimization
- Competitive advantage with complete tracking

## 🔄 Future Enhancements

### Planned Features

1. **Real-time Notifications**: Instant alerts for conversions
2. **Advanced Analytics**: Cohort analysis and customer segmentation
3. **A/B Testing**: Test different referral strategies
4. **Multi-store Support**: Track multiple stores per business
5. **Mobile App Integration**: Native mobile tracking

### Technical Improvements

1. **Performance Optimization**: Caching and query optimization
2. **Scalability**: Handle high-volume tracking
3. **Data Retention**: Configurable data retention policies
4. **API Rate Limiting**: Prevent abuse and ensure stability

## 📞 Support

For technical support or questions about the integration:

1. Check the test script for common issues
2. Review error logs in Gadget dashboard
3. Verify Shopify app installation and webhook configuration
4. Test with the provided test functions

## 📄 Related Documentation

- [Shopify App Setup Guide](./SHOPIFY_APP_SETUP.md)
- [Business Dashboard Guide](./BUSINESS_DASHBOARD_GUIDE.md)
- [Webhook Configuration](./WEBHOOK_CONFIGURATION.md)
- [Analytics API Reference](./ANALYTICS_API_REFERENCE.md)
