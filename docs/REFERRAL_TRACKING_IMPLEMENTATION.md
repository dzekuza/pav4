# Referral Tracking Implementation

## Overview

This document describes the implementation of proper referral tracking when
redirecting from search suggestions to business pages. The system ensures that
all clicks from the price comparison platform are properly tracked and
attributed to the correct business partners.

## Key Changes Made

### 1. Server-Side Routes

#### New Referral Routes

- **`/ref/:affiliateId`** - Handles business referral links
- **`/track/:affiliateId/:domain`** - Handles domain-specific tracking links

These routes:

- Log business clicks in the database
- Increment visit counters
- Add proper UTM parameters for tracking
- Redirect to the appropriate business domain or product URL

#### Updated Redirect API

- **`/api/redirect?to=<url>`** - Enhanced to detect business domains
- Automatically uses referral tracking for business domains
- Falls back to direct redirect for non-business domains

### 2. Client-Side Updates

#### Shared Utility Function

- Added `getRedirectUrl()` function in `client/lib/utils.ts`
- Ensures consistent redirect handling across all pages
- Automatically uses the redirect API for proper tracking

#### Updated Pages

- **NewSearchResults.tsx** - Uses redirect system for all external links
- **SearchResults.tsx** - Uses redirect system for all external links
- **Favorites.tsx** - Uses redirect system for all external links
- **History.tsx** - Uses redirect system for all external links

### 3. Database Integration

#### Business Click Tracking

- All clicks are logged in the `businessClick` table
- Includes UTM parameters, user agent, referrer, and IP address
- Tracks visit counts for business analytics

#### Referral Attribution

- Links clicks to specific business domains
- Enables conversion tracking and revenue attribution
- Supports business dashboard analytics

## How It Works

### 1. User Clicks Product Link

When a user clicks on a product link from search results:

```javascript
// Before: Direct link
href = "https://business.com/product";

// After: Redirect through tracking system
href = "/api/redirect?to=https://business.com/product";
```

### 2. Redirect API Processing

The redirect API:

1. Checks if the destination is a business domain
2. If yes, redirects through `/ref/{affiliateId}` with proper tracking
3. If no, redirects directly with UTM parameters

### 3. Referral Route Handling

The referral route:

1. Logs the click in the database
2. Increments business visit counter
3. Adds UTM parameters for tracking
4. Redirects to the final destination

### 4. Business Analytics

Businesses can see:

- Total clicks from the platform
- Conversion rates
- Revenue attribution
- Traffic sources

## URL Structure

### Referral URLs

```
https://ipick.io/ref/{affiliateId}?target_url={productUrl}&utm_source=pavlo4&utm_medium=referral&utm_campaign=business_referral&aff_id={affiliateId}&ref_token={uniqueToken}
```

### Tracking URLs

```
https://ipick.io/track/{affiliateId}/{domain}?utm_source=pavlo4&utm_medium=tracking&utm_campaign=domain_tracking&aff_id={affiliateId}&track_token={uniqueToken}
```

## Benefits

### For Users

- Seamless experience - no visible difference
- Proper attribution for businesses they support

### For Businesses

- Complete tracking of platform traffic
- Revenue attribution and conversion data
- Analytics dashboard with detailed insights

### For Platform

- Proper referral tracking
- Business relationship management
- Revenue sharing capabilities

## Testing

Use the test script to verify the implementation:

```bash
node test-referral-system.js
```

This will test:

1. Redirect API with business domains
2. Referral route functionality
3. Tracking route functionality

## Future Enhancements

1. **Caching** - Cache business domain lookups for better performance
2. **Analytics** - Enhanced conversion tracking and attribution
3. **A/B Testing** - Test different referral strategies
4. **Revenue Sharing** - Implement commission tracking and payouts

## Security Considerations

- All redirects use proper validation
- UTM parameters are sanitized
- Click logging respects privacy settings
- Rate limiting prevents abuse

## Monitoring

Monitor these metrics:

- Click-through rates
- Conversion rates by business
- Revenue attribution accuracy
- System performance and reliability
