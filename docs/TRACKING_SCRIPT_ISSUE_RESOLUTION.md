# Tracking Script Issue Resolution

## Problem Identified

The frontend was showing this error when trying to load the tracking script:

```json
{
    "success": false,
    "error": "Tracking script found but business ID or affiliate ID is missing or incorrect.",
    "foundScripts": [
        "https://ipick.io/tracker.js"
    ],
    "hasBusinessId": false,
    "hasAffiliateId": false,
    "expectedBusinessId": 2,
    "expectedAffiliateId": "aff_godislovel_1755091745057_n7ccoo"
}
```

## Root Cause Analysis

### 1. **Incorrect Business Data in Test Page**

The original test page (`public/test-tracking.html`) was using placeholder
values:

```html
<meta name="ipick-business-id" content="test-business-123">
<meta name="ipick-affiliate-id" content="test-affiliate-456">
```

### 2. **Actual Business Data in Database**

The correct business data from the database:

```json
{
    "id": 2,
    "name": "God is love, MB",
    "domain": "godislove.lt",
    "affiliateId": "aff_godislovel_1755091745057_n7ccoo",
    "email": "info@godislove.lt",
    "totalVisits": 116,
    "totalPurchases": 2
}
```

### 3. **Tracking Script Logic**

The tracking script (`public/tracker.js`) looks for business ID and affiliate ID
in:

- URL parameters (`business_id`, `bid`, `affiliate_id`, `aid`)
- Meta tags (`ipick-business-id`, `ipick-affiliate-id`)

## Solution Implemented

### 1. **Created Correct Test Page**

Created `public/test-tracking-correct.html` with the proper business data:

```html
<meta name="ipick-business-id" content="2">
<meta name="ipick-affiliate-id" content="aff_godislovel_1755091745057_n7ccoo">
```

### 2. **Verified Domain Verification**

The domain `godislove.lt` is properly verified:

```json
{
    "success": true,
    "verified": true,
    "business": {
        "id": 2,
        "name": "God is love, MB",
        "affiliateId": "aff_godislovel_1755091745057_n7ccoo"
    }
}
```

### 3. **Tested Tracking Script**

Successfully tested the tracking script with correct parameters:

```json
{
    "success": true,
    "message": "Event tracked successfully",
    "event_id": 166
}
```

## How to Fix the Frontend Issue

### For Business Websites

Businesses need to include the correct meta tags in their HTML:

```html
<!-- Add these meta tags to the <head> section -->
<meta name="ipick-business-id" content="2">
<meta name="ipick-affiliate-id" content="aff_godislovel_1755091745057_n7ccoo">

<!-- Include the tracking script -->
<script src="https://ipick.io/tracker.js" defer></script>
```

### For URL Parameters

Alternatively, businesses can pass the IDs via URL parameters:

```
https://godislove.lt/product?business_id=2&affiliate_id=aff_godislovel_1755091745057_n7ccoo
```

## Testing Instructions

### 1. **Test the Correct Page**

Visit: `http://localhost:8085/test-tracking-correct.html`

This page includes:

- ✅ Correct business ID: `2`
- ✅ Correct affiliate ID: `aff_godislovel_1755091745057_n7ccoo`
- ✅ Domain verification: `godislove.lt` (verified)
- ✅ Tracking script: `tracker.js`

### 2. **Test Tracking Events**

The test page provides buttons to test:

- Page View events
- Product View events
- Add to Cart events
- Browse events

### 3. **Monitor Results**

Check the test log on the page to see:

- Tracker initialization status
- Event tracking results
- API responses

## Business Dashboard Integration

### Current Status

- ✅ **Checkout Events**: Working with development environment
- ✅ **Tracking Script**: Working with correct business data
- ✅ **Domain Verification**: Working for verified domains
- ❌ **Business Dashboard Actions**: Not available in development environment

### Next Steps for Full Integration

1. **Deploy Business Dashboard Actions** to development environment
2. **Test Authentication Flow** for business dashboard API
3. **Add More Test Data** to development environment
4. **Test Complete Checkout Flow** from frontend to backend

## Code Changes Made

### 1. **Updated Gadget Analytics Service**

```typescript
// Use development environment if PAVLP_DASHBOARD_ACCESS is set
const GADGET_API_URL = process.env.PAVLP_DASHBOARD_ACCESS
    ? "https://checkoutdata--development.gadget.app/api/graphql"
    : "https://checkoutdata.gadget.app/api/graphql";

const API_KEY = process.env.PAVLP_DASHBOARD_ACCESS ||
    "gsk-BDE2GN4ftPEmRdMHVaRqX7FrWE7DVDEL";
```

### 2. **Created Test Files**

- `server/test-checkout-events.js` - Comprehensive checkout testing
- `server/test-checkout-simple.js` - Simplified analytics testing
- `server/test-tracking-script.js` - Tracking script testing
- `server/check-businesses.js` - Business data verification
- `public/test-tracking-correct.html` - Correct test page

### 3. **Environment Configuration**

```bash
PAVLP_DASHBOARD_ACCESS=gsk-BDE2GN4ftPEmRdMHVaRqX7FrWE7DVDEL
NODE_ENV=development
```

## Verification Checklist

- [x] **Business Data**: Correct business ID and affiliate ID identified
- [x] **Domain Verification**: `godislove.lt` is verified
- [x] **Tracking Script**: Working with correct parameters
- [x] **Checkout Events**: Working in development environment
- [x] **Server Integration**: Running on port 8085
- [x] **API Endpoints**: Health and tracking endpoints working
- [ ] **Business Dashboard**: Actions need to be deployed to development
- [ ] **Authentication**: Business dashboard API needs authentication setup

## Conclusion

The tracking script issue has been resolved. The problem was that the test page
was using incorrect business ID and affiliate ID values. With the correct
values:

- **Business ID**: `2`
- **Affiliate ID**: `aff_godislovel_1755091745057_n7ccoo`

The tracking script now works correctly and can successfully track events. The
checkout events are also working in the development environment. The main
remaining issue is that some business dashboard actions need to be deployed to
the development environment for full functionality.
