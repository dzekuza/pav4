# N8N Product Suggestions Integration

## Overview

This document describes the enhanced integration for handling product
suggestions from N8N webhooks, including improved redirect logic, business
domain detection, and tracking capabilities.

## Key Features

### 1. Enhanced Business Domain Detection

The system now detects a wider range of business domains beyond just Shopify:

- **Shopify Stores**: `myshopify.com`, `shopify.com`
- **E-commerce Platforms**: `amazon.*`, `ebay.*`, `etsy.com`
- **Major Retailers**: `walmart.com`, `target.com`, `bestbuy.com`
- **Tech Retailers**: `newegg.com`
- **Marketplaces**: `aliexpress.com`, `alibaba.com`

### 2. N8N Source Tracking

All redirects from N8N product suggestions are now tracked with:

- **Source Parameter**: `n8n_suggestion`
- **Enhanced UTM Parameters**:
  - `utm_medium: "n8n"`
  - `utm_campaign: "n8n_suggestion"`
- **Timestamp Tracking**: For analytics and debugging

### 3. Improved Redirect Logic

#### Frontend Changes (`client/lib/utils.ts`)

```typescript
// Enhanced redirect URL generation
export function getRedirectUrl(url: string, source: string = "product_suggestion"): string {
  // Enhanced business domain detection
  const isBusinessDomain = 
    hostname.includes("myshopify.com") ||
    hostname.includes("shopify.com") ||
    hostname.includes("amazon.") ||
    // ... more domains

  // Add source parameter to track n8n suggestions
  const params = new URLSearchParams({
    to: url,
    source: source,
    timestamp: Date.now().toString(),
  });

  return `/api/redirect?${params.toString()}`;
}
```

#### Backend Changes (`server/routes/redirect.ts`)

```typescript
// Enhanced redirect route
router.get("/redirect", async (req, res) => {
    const { to, source, user_id, reseller_id } = req.query;

    // Enhanced business domain detection
    const isBusinessDomain = hostname.includes("myshopify.com") ||
        hostname.includes("shopify.com") ||
        // ... more domains

        // Enhanced click logging with source tracking
        await prisma.businessClick.create({
            data: {
                businessId: business.id,
                productUrl: to,
                utmSource: "ipick.io",
                utmMedium: source === "n8n_suggestion" ? "n8n" : "redirect",
                utmCampaign: source || "product_suggestion",
            },
        });
});
```

### 4. Enhanced Product Click Tracking

#### Frontend Product Click Handler (`client/pages/NewSearchResults.tsx`)

```typescript
const handleProductClick = async (suggestion: any) => {
    // Enhanced business domain detection
    const businessDomain = extractBusinessDomain(suggestion.link);

    // Track with n8n source
    await trackCustomEvent("product_click", {
        productId: suggestion.title,
        productName: suggestion.title,
        productPrice: suggestion.standardPrice || suggestion.discountPrice,
        retailer: suggestion.merchant || suggestion.site,
        url: suggestion.link,
        source: "n8n_suggestion", // Mark as coming from n8n
        businessDomain: businessDomain,
    }, businessDomain);

    // Enhanced redirect with n8n source tracking
    const redirectUrl = getRedirectUrl(suggestion.link, "n8n_suggestion");
    window.open(redirectUrl, "_blank");
};
```

## Data Flow

### 1. N8N Webhook Response

```json
{
    "mainProduct": {
        "title": "Product Name",
        "price": "$99.99",
        "url": "https://store.myshopify.com/products/example"
    },
    "suggestions": [
        {
            "title": "Similar Product",
            "link": "https://amazon.com/product/123",
            "site": "Amazon"
        }
    ]
}
```

### 2. Frontend Processing

1. **Business Domain Detection**: Automatically detects if URLs are from
   business domains
2. **Enhanced Tracking**: Logs clicks with `source: "n8n_suggestion"`
3. **Smart Redirects**: Uses appropriate redirect logic based on domain type

### 3. Backend Redirect Processing

1. **Enhanced Logging**: Records clicks with source and UTM parameters
2. **Business Integration**: For registered businesses, uses referral tracking
3. **Fallback Handling**: For non-business domains, uses enhanced UTM tracking

## Analytics Benefits

### 1. Source Attribution

- **N8N vs Direct**: Distinguish between N8N-sourced and direct clicks
- **Business Performance**: Track performance across different business domains
- **Conversion Tracking**: Monitor conversion rates by source

### 2. Enhanced UTM Parameters

```
utm_source=ipick.io
utm_medium=n8n
utm_campaign=n8n_suggestion
ipick_source=n8n_suggestion
```

### 3. Business Intelligence

- **Domain Performance**: Track which business domains perform best
- **Product Affinity**: Understand which products work well with N8N suggestions
- **User Behavior**: Analyze how users interact with N8N-sourced suggestions

## Implementation Details

### Utility Functions

#### `extractBusinessDomain(url: string): string | null`

Extracts business domain from URL if it matches known business patterns.

#### `isBusinessDomain(url: string): boolean`

Checks if a URL is from a known business domain.

#### `getRedirectUrl(url: string, source: string): string`

Generates enhanced redirect URLs with source tracking.

### Database Schema

The `BusinessClick` table now includes:

- `utmMedium`: Distinguishes between "n8n" and "redirect"
- `utmCampaign`: Tracks the specific campaign/source
- Enhanced logging for all business domains

### Error Handling

- **Graceful Fallbacks**: If business domain detection fails, falls back to
  regular redirect
- **Non-blocking Logging**: Click logging failures don't prevent redirects
- **Enhanced Debugging**: Comprehensive logging for troubleshooting

## Testing

### Test Cases

1. **N8N Shopify Suggestions**: Verify proper business tracking
2. **N8N Amazon Suggestions**: Verify enhanced UTM parameters
3. **Non-Business Domains**: Verify fallback redirect logic
4. **Error Scenarios**: Verify graceful error handling

### Monitoring

- **Click Tracking**: Monitor business click creation
- **Redirect Performance**: Track redirect success rates
- **Analytics Data**: Verify source attribution accuracy

## Future Enhancements

1. **Dynamic Business Detection**: Automatically detect new business domains
2. **Performance Optimization**: Cache business domain lookups
3. **Advanced Analytics**: Real-time conversion tracking
4. **A/B Testing**: Test different redirect strategies

## Troubleshooting

### Common Issues

1. **Missing Source Tracking**: Ensure `source: "n8n_suggestion"` is passed
2. **Business Domain Not Detected**: Check domain patterns in utility functions
3. **Redirect Failures**: Verify redirect route is accessible
4. **Analytics Gaps**: Check click logging in database

### Debug Commands

```bash
# Test redirect with n8n source
curl "http://localhost:8083/api/redirect?to=https://store.myshopify.com/product&source=n8n_suggestion"

# Check business click logging
# Query the BusinessClick table for recent n8n-sourced clicks
```
