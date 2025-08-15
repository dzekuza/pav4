# Enhanced Business Dashboard Setup

This document explains how to set up the enhanced business dashboard that
integrates with the checkout system to provide comprehensive analytics.

## Overview

The enhanced business dashboard provides:

- Business summary (shop info, total checkouts, total orders, conversion rates)
- Recent checkouts with source tracking (highlighting ipick.io referrals)
- Recent orders with financial status
- Referral statistics (ipick.io vs other sources)
- Revenue metrics
- Time-based trends

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# Checkout System Integration
PAVLP_DASHBOARD_ACCESS="your-checkout-api-key-here"
CHECKOUT_API_URL="https://checkoutdata--development.gadget.app"

# Domain Verification (optional)
DOMAIN_VERIFICATION_REQUIRED=false
ANALYTICS_REQUIRED=false
```

## API Endpoints

### New Endpoint: `/api/business/dashboard`

This endpoint fetches comprehensive business analytics from the checkout system.

**Method:** GET\
**Authentication:** Required (Business token)\
**Query Parameters:**

- `startDate` (optional): Start date for data range (ISO string)
- `endDate` (optional): End date for data range (ISO string)
- `limit` (optional): Number of records to return (default: 100)

**Response:**

```json
{
  "success": true,
  "dashboardData": {
    "summary": {
      "totalBusinesses": 1,
      "businessDomain": "example.com",
      "totalCheckouts": 150,
      "completedCheckouts": 120,
      "totalOrders": 100,
      "conversionRate": 80.0,
      "totalRevenue": 15000.00,
      "currency": "USD"
    },
    "recentCheckouts": [...],
    "recentOrders": [...],
    "referralStatistics": {
      "totalReferrals": 50,
      "ipickReferrals": 30,
      "ipickConversionRate": 85.5,
      "totalConversions": 40,
      "referralRevenue": 8000.00
    },
    "trends": {
      "last30Days": { "checkouts": 45, "orders": 35, "revenue": 5000.00 },
      "last7Days": { "checkouts": 12, "orders": 8, "revenue": 1200.00 }
    }
  }
}
```

## Gadget API Integration

### Action: `getBusinessDashboard`

The enhanced dashboard uses a Gadget action that follows proper API patterns:

**Location:** `checkoutdata/api/actions/getBusinessDashboard.ts`

**Key Features:**

- Proper field selection using Gadget's `select` API
- Relationship filtering using `shopId` instead of nested objects
- Error handling with proper logging
- Type-safe parameter validation

**API Patterns Used:**

```typescript
// Shop filtering
const shops = await api.shopifyShop.findMany({
  filter: {
    OR: [
      { domain: { equals: businessDomain } },
      { myshopifyDomain: { equals: businessDomain } },
    ],
  },
  select: {
    id: true,
    domain: true,
    name: true,
    // ... other fields
  },
});

// Related data filtering
const checkouts = await api.shopifyCheckout.findMany({
  filter: {
    shopId: { in: shopIds },
  },
  select: {
    id: true,
    email: true,
    totalPrice: true,
    // ... other fields
  },
});
```

**Data Models Used:**

- `shopifyShop`: Store information and configuration
- `shopifyCheckout`: Checkout events with source tracking
- `shopifyOrder`: Order data with financial status
- `businessReferral`: Referral tracking with UTM parameters

## Components

### BusinessAnalyticsDashboard

A new React component that displays the enhanced analytics data.

**Features:**

- Date range selection (7d, 30d, 90d)
- Summary cards with key metrics
- Recent activity tables
- Referral source tracking
- Trend analysis
- iPick.io referral highlighting

**Usage:**

```tsx
import BusinessAnalyticsDashboard from "../components/BusinessAnalyticsDashboard";

<BusinessAnalyticsDashboard businessDomain="example.com" />;
```

## Integration with Main Dashboard

The main `BusinessDashboard` component now includes:

- Tab navigation to switch between basic stats and enhanced analytics
- Enhanced analytics dashboard when domain is verified
- Fallback to basic stats when domain verification is not available

## Data Sources

The enhanced dashboard pulls data from:

1. **Shopify Checkouts**: Checkout events with source tracking
2. **Shopify Orders**: Order data with financial status
3. **Business Referrals**: Referral tracking with UTM parameters
4. **Shop Information**: Store details and configuration

## Security

- All endpoints require business authentication
- Domain verification can be required for analytics access
- API key authentication for checkout system integration
- Rate limiting and input validation

## Troubleshooting

### Common Issues

1. **"Dashboard access not configured"**
   - Ensure `PAVLP_DASHBOARD_ACCESS` environment variable is set
   - Verify the API key is valid

2. **"Failed to fetch dashboard data"**
   - Check network connectivity to checkout system
   - Verify `CHECKOUT_API_URL` is correct
   - Ensure business domain exists in checkout system

3. **"Domain verification required"**
   - Set `ANALYTICS_REQUIRED=false` to bypass domain verification
   - Or complete domain verification process

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
DEBUG=true
```

### Gadget-Specific Issues

1. **Field selection errors**
   - Ensure all selected fields exist in the model schema
   - Use proper relationship field names (e.g., `shopId` not `shop.id`)

2. **Filter syntax errors**
   - Use Gadget's filter syntax: `{ field: { operator: value } }`
   - For relationships, use the foreign key field name

3. **Type errors**
   - Check the generated types in `node_modules/@gadget-client`
   - Ensure proper TypeScript types are imported

## Future Enhancements

- Real-time data updates
- Custom date ranges
- Export functionality
- Advanced filtering
- Comparative analytics
- Automated reporting

## Gadget Documentation

For more information on working with the checkout data API, refer to:

- [Gadget API Documentation](https://docs.gadget.dev/api/checkoutdata/development)
- [Model Schemas](https://checkoutdata.gadget.app/edit)
- [Action Development](http://docs.gadget.dev)
