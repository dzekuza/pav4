# Shopify Script Integration

## Overview

The Shopify Script Integration is a new tracking solution that allows businesses
to track successful orders and session attribution without requiring a Shopify
app installation. This integration uses Google Tag Manager to place a tracking
script on the Shopify thank you page, which captures order data and UTM
parameters for session attribution.

## How It Works

### 1. UTM Parameter Tracking

When users click on product links from your iPick integration, UTM parameters
are automatically added to track the source:

- `utm_source`: Set to "ipick"
- `utm_medium`: Set to "price_comparison"
- `utm_campaign`: Set to "product_referral"
- `session_id`: Unique session identifier
- `business_domain`: Your business domain for attribution

### 2. Thank You Page Script

The Google Tag Manager script on your Shopify thank you page:

- Extracts order data from the page
- Captures UTM parameters from the URL
- Sends tracking data to the iPick API
- Creates session attribution records

### 3. Session Attribution Dashboard

The business dashboard shows:

- Which campaigns drove successful purchases
- Revenue attribution by UTM source/medium/campaign
- Conversion rates and order values
- Detailed session attribution data

## Setup Instructions

### Step 1: Choose Integration Type

1. Go to your business dashboard
2. Navigate to the **Integrate** tab
3. Select **"Shopify (Script)"** from the platform options
4. Copy the provided Google Tag Manager script

### Step 2: Install in Google Tag Manager

1. Log into your Google Tag Manager account
2. Create a new **Custom HTML** tag
3. Paste the script from Step 1
4. Set the trigger to **"Thank You Page"** (order confirmation page)
5. Save and publish the tag

### Step 3: Verify Installation

1. Complete a test purchase on your Shopify store
2. Check the browser console for iPick tracking messages
3. Verify the tracking data appears in your business dashboard

## Script Configuration

The tracking script includes the following configuration:

```javascript
const config = {
    businessId: "YOUR_BUSINESS_ID",
    affiliateId: "YOUR_AFFILIATE_ID",
    apiUrl: "https://ipick.io/.netlify/functions/track-shopify-script",
    debug: false,
};
```

### Features

- **Automatic Order Detection**: Extracts order data from Shopify's global
  objects
- **Fallback Extraction**: Parses order information from page content if needed
- **UTM Parameter Capture**: Automatically captures all UTM parameters
- **Product Data Extraction**: Extracts product information from order items
- **Error Handling**: Graceful error handling with debug logging
- **Session Tracking**: Maintains session continuity across the purchase funnel

## Data Captured

### Order Information

- Order ID
- Total price and currency
- Customer email and ID
- Order timestamp

### Product Information

- Product IDs and names
- Product prices
- Quantities purchased

### UTM Parameters

- utm_source
- utm_medium
- utm_campaign
- utm_term
- utm_content
- ref (referral ID)
- business_domain
- session_id

### Technical Data

- User agent
- Referrer URL
- Page URL and title
- IP address

## Dashboard Features

### Session Attribution Dashboard

- **Revenue by Source**: Bar chart showing revenue by UTM source
- **Revenue by Medium**: Pie chart showing revenue by UTM medium
- **Revenue Over Time**: Line chart showing daily revenue trends
- **Detailed Table**: Complete attribution data with filtering options

### Filtering Options

- Date range (1d, 7d, 30d, 90d)
- UTM source
- UTM medium
- UTM campaign

### Export Features

- CSV export of attribution data
- Filtered data export
- Date range selection

## API Endpoints

### Track Shopify Script

```
POST /api/track-shopify-script
```

**Request Body:**

```json
{
  "event_type": "purchase_complete",
  "business_id": "123",
  "affiliate_id": "aff_123",
  "platform": "shopify-script",
  "session_id": "session_123",
  "data": {
    "order_id": "1001",
    "total_price": "99.99",
    "currency": "USD",
    "email": "customer@example.com",
    "products": [...],
    "utm_source": "ipick",
    "utm_medium": "price_comparison",
    "utm_campaign": "product_referral"
  }
}
```

### Session Attributions

```
GET /api/business/session-attributions?business_id=123&date_range=7d
```

**Response:**

```json
{
  "success": true,
  "attributions": [...],
  "stats": {
    "totalSessions": 150,
    "totalOrders": 25,
    "totalRevenue": 2499.75,
    "averageOrderValue": 99.99,
    "conversionRate": 16.67
  }
}
```

## Database Schema

### SessionAttribution Table

```sql
CREATE TABLE session_attributions (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  session_id VARCHAR NOT NULL,
  order_id VARCHAR,
  utm_source VARCHAR,
  utm_medium VARCHAR,
  utm_campaign VARCHAR,
  business_domain VARCHAR,
  shop_domain VARCHAR,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  customer_email VARCHAR,
  customer_id VARCHAR,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### Common Issues

**1. Script Not Loading**

- Verify the GTM tag is published
- Check the trigger is set to "Thank You Page"
- Ensure the script is not blocked by ad blockers

**2. No Data in Dashboard**

- Complete a test purchase to generate data
- Check browser console for error messages
- Verify business ID and affiliate ID are correct

**3. Missing UTM Parameters**

- Ensure users are clicking links from your iPick integration
- Check that UTM parameters are being added to URLs
- Verify session tracking is working

### Debug Mode

Enable debug mode by setting `debug: true` in the script configuration:

```javascript
const config = {
    // ... other config
    debug: true,
};
```

This will log detailed information to the browser console.

## Best Practices

### 1. Testing

- Always test with a real purchase
- Use debug mode during setup
- Verify data appears in dashboard within minutes

### 2. URL Structure

- Ensure UTM parameters are preserved through checkout
- Test with different product URLs
- Verify session continuity

### 3. Data Quality

- Monitor for missing order data
- Check for duplicate tracking
- Validate UTM parameter accuracy

### 4. Performance

- Script is lightweight and non-blocking
- Minimal impact on page load time
- Graceful error handling

## Comparison with Other Integrations

| Feature             | Shopify Script | Shopify App | Simple Script |
| ------------------- | -------------- | ----------- | ------------- |
| Setup Complexity    | Medium         | High        | Low           |
| Data Accuracy       | High           | Very High   | Medium        |
| Order Tracking      | Yes            | Yes         | Limited       |
| Session Attribution | Yes            | Yes         | No            |
| Real-time Data      | Yes            | Yes         | Limited       |
| No App Required     | Yes            | No          | Yes           |

## Support

For technical support or questions about the Shopify Script Integration:

1. Check the browser console for error messages
2. Verify your GTM setup
3. Test with a real purchase
4. Contact support with specific error details

## Future Enhancements

- Enhanced product data extraction
- Advanced attribution modeling
- Real-time dashboard updates
- Custom attribution rules
- Multi-touch attribution
- A/B testing integration
