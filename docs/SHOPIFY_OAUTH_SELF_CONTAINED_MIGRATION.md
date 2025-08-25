# Shopify OAuth Migration: From Gadget to Self-Contained

## Overview

This document outlines the migration from Gadget-based Shopify OAuth to a
self-contained Shopify OAuth implementation.

## Changes Made

### 1. Configuration Updates

#### Before (Gadget-based)

```typescript
// server/config/shopify-oauth.ts
export const SHOPIFY_OAUTH_CONFIG = {
    GADGET_API_URL: process.env.GADGET_API_URL ||
        "https://itrcks--development.gadget.app",
    GADGET_API_KEY: process.env.GADGET_API_KEY || "",
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "https://ipick.io",
    // ...
};
```

#### After (Self-contained)

```typescript
// server/config/shopify-oauth.ts
export const SHOPIFY_OAUTH_CONFIG = {
    SHOPIFY_CLIENT_ID: process.env.SHOPIFY_CLIENT_ID || "",
    SHOPIFY_CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET || "",
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || "https://ipick.io",
    // ...
};
```

### 2. OAuth Flow Changes

#### Before (Gadget Flow)

1. User clicks "Connect Shopify Store"
2. App redirects to Gadget's OAuth URL
3. Gadget handles Shopify OAuth
4. Gadget redirects back to our callback
5. We receive connection info from Gadget

#### After (Direct Flow)

1. User clicks "Connect Shopify Store"
2. App generates direct Shopify OAuth URL
3. User is redirected to Shopify for authorization
4. Shopify redirects back to our callback
5. We exchange authorization code for access token
6. We store the access token directly

### 3. Environment Variables

#### Removed (Gadget-related)

```env
GADGET_API_URL="https://itrcks--development.gadget.app"
GADGET_API_KEY="your-gadget-api-key"
SHOPIFY_INSTALL_URL="https://itrcks--development.gadget.app/api/shopify/install"
SHOPIFY_CALLBACK_URL="https://itrcks--development.gadget.app/api/connections/auth/shopify/callback"
```

#### Added (Shopify OAuth)

```env
SHOPIFY_CLIENT_ID="your-shopify-client-id"
SHOPIFY_CLIENT_SECRET="your-shopify-client-secret"
```

### 4. API Endpoints

#### Removed Endpoints

- `/api/shopify/oauth/test-gadget` - Test Gadget API connectivity
- `/api/shopify/oauth/fetch-token` - Fetch access token from Gadget
- `/api/shopify/oauth/webhook` - Handle Gadget webhooks
- `/api/shopify/oauth/gadget-test` - Test Gadget integration
- `/api/shopify/oauth/fetch-token-graphql` - Fetch token via GraphQL

#### Updated Endpoints

- `/api/shopify/oauth/connect` - Now generates direct Shopify OAuth URL
- `/api/shopify/oauth/callback` - Now handles direct Shopify OAuth callback
- `/api/shopify/oauth/config` - Now shows Shopify OAuth configuration

#### New Endpoints

- None (all existing endpoints updated)

### 5. Database Changes

No database schema changes required. The existing fields are still used:

- `shopifyAccessToken` - Now stores direct Shopify access token
- `shopifyShop` - Stores the shop domain
- `shopifyScopes` - Stores granted scopes
- `shopifyStatus` - Connection status
- `shopifyConnectedAt` - Connection timestamp

## Migration Steps

### 1. Update Environment Variables

1. Remove Gadget-related environment variables:
   ```bash
   # Remove these from your .env file
   GADGET_API_URL
   GADGET_API_KEY
   SHOPIFY_INSTALL_URL
   SHOPIFY_CALLBACK_URL
   ```

2. Add Shopify OAuth environment variables:
   ```bash
   # Add these to your .env file
   SHOPIFY_CLIENT_ID="your-shopify-client-id"
   SHOPIFY_CLIENT_SECRET="your-shopify-client-secret"
   ```

### 2. Update Shopify App Configuration

1. Go to your Shopify Partner Dashboard
2. Update your app's OAuth settings:
   - **App URL**: `https://ipick.io/`
   - **Allowed redirection URL(s)**: Add all the URLs listed in the
     configuration guide
   - **Embed app in Shopify admin**: Set to True

### 3. Test the Migration

1. **Test OAuth Flow**:
   ```bash
   # Test the connect endpoint
   curl -X GET "http://localhost:8083/api/shopify/oauth/connect?shop=your-test-shop.myshopify.com"
   ```

2. **Test Configuration**:
   ```bash
   # Test the config endpoint
   curl -X GET "http://localhost:8083/api/shopify/oauth/config"
   ```

3. **Test Status**:
   ```bash
   # Test the status endpoint
   curl -X GET "http://localhost:8083/api/shopify/oauth/status"
   ```

### 4. Update Documentation

1. Update any internal documentation referencing Gadget
2. Update API documentation to reflect new OAuth flow
3. Update troubleshooting guides

## Benefits of Self-Contained OAuth

### 1. **Reduced Dependencies**

- No dependency on Gadget's infrastructure
- No external API calls for OAuth
- Faster OAuth flow

### 2. **Better Control**

- Direct control over OAuth process
- Custom error handling
- Better debugging capabilities

### 3. **Improved Security**

- Direct token exchange with Shopify
- No third-party token handling
- Secure state parameter validation

### 4. **Simplified Architecture**

- Fewer moving parts
- Easier to maintain
- Better error handling

## Troubleshooting

### Common Issues

#### 1. "OAuth configuration is invalid"

**Cause**: Missing `SHOPIFY_CLIENT_ID` or `SHOPIFY_CLIENT_SECRET` **Solution**:
Set the environment variables with your Shopify app credentials

#### 2. "Invalid redirect URI"

**Cause**: Redirect URLs not configured in Shopify Partner Dashboard
**Solution**: Add all required redirect URLs to your app configuration

#### 3. "Token exchange failed"

**Cause**: Invalid client credentials or authorization code **Solution**: Verify
your Shopify app credentials and ensure the OAuth flow is completed properly

### Debug Commands

```bash
# Check environment variables
node -e "console.log('CLIENT_ID:', process.env.SHOPIFY_CLIENT_ID ? 'Set' : 'Not set')"
node -e "console.log('CLIENT_SECRET:', process.env.SHOPIFY_CLIENT_SECRET ? 'Set' : 'Not set')"

# Test OAuth configuration
curl -X GET "http://localhost:8083/api/shopify/oauth/config"

# Check server logs
tail -f server.log | grep -i "shopify.*oauth"
```

## Rollback Plan

If you need to rollback to the Gadget-based implementation:

1. **Restore Gadget environment variables**
2. **Revert configuration files**
3. **Restore Gadget-dependent routes**
4. **Update documentation**

However, the self-contained approach is recommended for better control and
reliability.

## Support

For issues with the migration:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a development Shopify store first
4. Contact support with specific error messages and logs
