# Shopify OAuth Integration via Gadget API

## Overview

This document describes the updated Shopify OAuth implementation that integrates
with Shopify through the Gadget API instead of direct Shopify OAuth. This
approach leverages Gadget's existing Shopify integration infrastructure and
provides a more robust and maintainable solution.

## Architecture

### Integration Flow

1. **User initiates connection** → Enters Shopify store URL
2. **Redirect to Gadget** → Uses Gadget's install URL:
   `https://itrcks.gadget.app/api/shopify/install-or-render`
3. **Gadget handles OAuth** → Gadget manages the Shopify OAuth flow
4. **Callback to Gadget** → Gadget processes the OAuth callback:
   `https://itrcks.gadget.app/api/connections/auth/shopify/callback`
5. **Store connection** → Our system stores the shop information

### Key Benefits

- **🔧 Simplified Setup**: No need to create and manage Shopify apps
- **🛡️ Enhanced Security**: Gadget handles sensitive OAuth tokens
- **📊 Better Integration**: Leverages Gadget's existing Shopify infrastructure
- **🔄 Automatic Updates**: Gadget manages API versioning and updates
- **📈 Scalability**: Gadget's infrastructure handles scaling

## Configuration

### Environment Variables

```env
# Shopify OAuth via Gadget API
GADGET_API_URL="https://itrcks.gadget.app"
SHOPIFY_INSTALL_URL="https://itrcks.gadget.app/api/shopify/install-or-render"
SHOPIFY_CALLBACK_URL="https://itrcks.gadget.app/api/connections/auth/shopify/callback"
GADGET_API_KEY="your-gadget-api-key"
```

### Gadget API Endpoints

- **Install URL**: `https://itrcks.gadget.app/api/shopify/install-or-render`
  - Used to initiate the Shopify OAuth flow
  - Accepts `shop` parameter for the store URL
  - Handles the OAuth authorization process

- **Callback URL**:
  `https://itrcks.gadget.app/api/connections/auth/shopify/callback`
  - Processes OAuth callbacks from Shopify
  - Handles token exchange and storage
  - Manages connection state

## Implementation Details

### Updated Configuration

The `server/config/shopify-oauth.ts` file has been updated to use Gadget API
endpoints:

```typescript
export const SHOPIFY_OAUTH_CONFIG = {
    GADGET_API_URL: process.env.GADGET_API_URL || "https://itrcks.gadget.app",
    SHOPIFY_INSTALL_URL: process.env.SHOPIFY_INSTALL_URL ||
        "https://itrcks.gadget.app/api/shopify/install-or-render",
    SHOPIFY_CALLBACK_URL: process.env.SHOPIFY_CALLBACK_URL ||
        "https://itrcks.gadget.app/api/connections/auth/shopify/callback",
    GADGET_API_KEY: process.env.GADGET_API_KEY || "",
    // ... other configuration
};
```

### OAuth Flow Changes

1. **Installation URL**: Now uses Gadget's install URL instead of direct Shopify
   OAuth
2. **Token Management**: Gadget handles token exchange and storage
3. **Connection Storage**: Our system only stores shop information, not access
   tokens
4. **Callback Processing**: Simplified callback handling

### Database Schema

The Business model remains the same, but the `shopifyAccessToken` field is no
longer used:

```prisma
model Business {
  // ... existing fields ...
  shopifyShop         String?    // Store domain
  shopifyScopes       String?    // Granted permissions
  shopifyConnectedAt  DateTime?  // Connection timestamp
  // shopifyAccessToken is no longer used
}
```

## User Experience

### Connection Process

1. **Business User** navigates to `/business/integrate`
2. **Enters Store URL** (e.g., `my-store.myshopify.com`)
3. **Clicks Connect** → Redirected to Gadget's install URL
4. **Authorizes on Shopify** → Standard Shopify OAuth flow
5. **Returns to Dashboard** → Connection complete

### UI Components

The `ShopifyOAuthConnect` component remains the same, providing:

- Store URL input with validation
- Connection status display
- Loading states and error handling
- Disconnect functionality

## Security Features

### OAuth Security

- **Gadget-Managed**: Gadget handles all OAuth security
- **Token Storage**: Sensitive tokens stored by Gadget
- **Scope Management**: Gadget manages permission scopes
- **State Validation**: Gadget validates OAuth state

### Data Protection

- **No Token Storage**: We don't store access tokens
- **Shop Information Only**: Only store shop domain and metadata
- **Secure Communication**: All communication via HTTPS
- **API Key Protection**: Gadget API key stored securely

## Testing

### Configuration Test

```bash
node scripts/test-shopify-config.js
```

Expected output:

```
✅ Configuration Validation:
   Valid: ✅ YES
```

### OAuth Flow Test

1. Navigate to `/business/integrate`
2. Enter a test Shopify store URL
3. Verify redirect to Gadget install URL
4. Test the complete OAuth flow

## Setup Instructions

### 1. Environment Variables

Add the required environment variables to your `.env` file:

```env
# Shopify OAuth via Gadget API
GADGET_API_URL="https://itrcks.gadget.app"
SHOPIFY_INSTALL_URL="https://itrcks.gadget.app/api/shopify/install-or-render"
SHOPIFY_CALLBACK_URL="https://itrcks.gadget.app/api/connections/auth/shopify/callback"
GADGET_API_KEY="your-gadget-api-key"
```

### 2. Test Configuration

```bash
node scripts/test-shopify-config.js
```

### 3. Restart Server

```bash
npm run dev
```

### 4. Test OAuth Flow

Navigate to `/business/integrate` and test the connection.

## Troubleshooting

### Common Issues

1. **"Configuration not valid"**
   - Check environment variables are set correctly
   - Verify Gadget API URLs are accessible

2. **"Install URL not found"**
   - Verify `SHOPIFY_INSTALL_URL` is correct
   - Check Gadget API is running

3. **"Callback failed"**
   - Verify `SHOPIFY_CALLBACK_URL` is correct
   - Check network connectivity to Gadget

### Debug Steps

1. **Check Configuration**:
   ```bash
   node scripts/test-shopify-config.js
   ```

2. **Verify Gadget API**:
   - Test Gadget API endpoints directly
   - Check Gadget API documentation

3. **Check Network**:
   - Verify connectivity to `https://itrcks.gadget.app`
   - Check for any firewall or proxy issues

## Migration from Direct OAuth

### Changes Required

1. **Environment Variables**: Update from Shopify API keys to Gadget URLs
2. **OAuth Flow**: Change from direct Shopify OAuth to Gadget API
3. **Token Management**: Remove access token storage
4. **Callback Handling**: Simplify callback processing

### Benefits of Migration

- **Reduced Complexity**: No need to manage Shopify app credentials
- **Better Security**: Gadget handles sensitive OAuth data
- **Improved Reliability**: Gadget's infrastructure is more robust
- **Easier Maintenance**: Gadget manages API updates and changes

## Future Enhancements

### Planned Features

- **Multiple Store Support**: Connect multiple Shopify stores
- **Advanced Analytics**: OAuth usage analytics via Gadget
- **Webhook Integration**: Real-time data sync through Gadget
- **Enhanced Permissions**: Granular scope management

### Integration Improvements

- **Gadget SDK**: Use official Gadget SDK for better integration
- **Real-time Updates**: WebSocket connections for live updates
- **Advanced Error Handling**: Better error recovery and retry logic

## Summary

The Shopify OAuth integration via Gadget API provides a more robust, secure, and
maintainable solution compared to direct Shopify OAuth. By leveraging Gadget's
existing infrastructure, we reduce complexity, improve security, and provide a
better user experience.

The implementation is production-ready and provides significant advantages over
the previous direct OAuth approach.
