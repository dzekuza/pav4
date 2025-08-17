# Shopify OAuth Implementation

## Overview

This document describes the complete Shopify OAuth implementation for business
authentication in the application. The OAuth flow allows businesses to securely
connect their Shopify stores without manually providing access tokens.

## Architecture

### Components

1. **Frontend Component**: `client/components/dashboard/ShopifyOAuthConnect.tsx`
2. **Backend Routes**: `server/routes/shopify-oauth.ts`
3. **Configuration**: `server/config/shopify-oauth.ts`
4. **Database Schema**: Updated Business model with Shopify OAuth fields

### Database Schema

The Business model includes the following Shopify OAuth fields:

```prisma
model Business {
  // ... existing fields ...
  shopifyAccessToken  String?
  shopifyShop         String?
  shopifyScopes       String?
  shopifyConnectedAt  DateTime?
  // ... other fields ...
}
```

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Shopify OAuth
SHOPIFY_API_KEY="your-shopify-api-key"
SHOPIFY_API_SECRET="your-shopify-api-secret"
SHOPIFY_REDIRECT_URI="http://localhost:8084/api/shopify/oauth/callback"
```

## OAuth Flow

### 1. Initiate Connection

**Endpoint**: `GET /api/shopify/oauth/connect?shop=your-store.myshopify.com`

**Process**:

- Validates OAuth configuration
- Validates shop format
- Generates secure state parameter
- Redirects to Shopify OAuth authorization URL

### 2. OAuth Callback

**Endpoint**: `GET /api/shopify/oauth/callback`

**Process**:

- Validates state parameter
- Exchanges authorization code for access token
- Stores credentials in database
- Redirects to dashboard with success/error status

### 3. Status Check

**Endpoint**: `GET /api/shopify/oauth/status`

**Returns**:

```json
{
    "success": true,
    "isConnected": true,
    "shop": "your-store.myshopify.com",
    "scopes": "read_products,read_orders,read_customers",
    "lastConnected": "2024-01-15T10:30:00Z"
}
```

### 4. Disconnect

**Endpoint**: `POST /api/shopify/oauth/disconnect`

**Process**:

- Removes Shopify credentials from database
- Clears all OAuth-related fields

## Security Features

### State Parameter

- Cryptographically secure random state parameter
- Prevents CSRF attacks
- Automatic cleanup of expired states (1 hour TTL)

### Input Validation

- Shop URL format validation
- OAuth configuration validation
- Required parameter validation

### Error Handling

- Comprehensive error responses
- Secure error messages (no sensitive data exposure)
- Graceful fallbacks

## Frontend Features

### UI Components

- **Connection Status**: Shows current connection state
- **Store Information**: Displays connected store details
- **Permissions**: Lists granted scopes in user-friendly format
- **Connection Date**: Shows when the store was last connected
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages with dismiss options

### User Experience

- **One-Click Connection**: Simple store URL input
- **Automatic Redirect**: Seamless OAuth flow
- **Status Persistence**: Remembers connection state
- **Easy Disconnection**: One-click store disconnection

## Shopify App Setup

### 1. Create Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create a new app
3. Configure OAuth settings

### 2. Configure OAuth Settings

- **App URL**: Your application URL
- **Allowed redirection URLs**:
  `http://localhost:8084/api/shopify/oauth/callback`
- **Required scopes**:
  - `read_products`
  - `read_orders`
  - `read_customers`
  - `read_inventory`
  - `read_analytics`
  - `read_marketing_events`
  - `read_sales`
  - `read_reports`

### 3. Get API Credentials

- Copy API Key and API Secret Key
- Add to environment variables

## Usage Examples

### Connect Store

```typescript
// User enters: your-store.myshopify.com
// System redirects to Shopify OAuth
// After authorization, user returns to dashboard
```

### Check Connection Status

```typescript
const response = await fetch("/api/shopify/oauth/status");
const status = await response.json();
console.log(status.isConnected); // true/false
```

### Disconnect Store

```typescript
const response = await fetch("/api/shopify/oauth/disconnect", {
    method: "POST",
});
```

## Error Handling

### Common Errors

- **Invalid shop format**: User must enter valid Shopify store URL
- **OAuth not configured**: System error when environment variables missing
- **Authorization failed**: User denied permissions or other OAuth errors
- **Network errors**: Connection issues during OAuth flow

### Error Recovery

- **Retry mechanism**: Users can retry failed connections
- **Clear error messages**: Specific error descriptions
- **Manual fallback**: Option to manually enter access token (if needed)

## Testing

### Local Development

1. Set up environment variables
2. Create test Shopify app
3. Use test store for development
4. Test OAuth flow end-to-end

### Production Deployment

1. Update redirect URLs for production domain
2. Configure production Shopify app
3. Test with real stores
4. Monitor OAuth success rates

## Monitoring

### Key Metrics

- OAuth success rate
- Connection/disconnection frequency
- Error rates by type
- Average connection time

### Logging

- OAuth initiation events
- Successful connections
- Failed connections with error types
- Disconnection events

## Future Enhancements

### Planned Features

- **Webhook Integration**: Real-time data sync
- **Multiple Stores**: Support for multiple store connections
- **Advanced Permissions**: Granular scope management
- **Token Refresh**: Automatic token renewal
- **Analytics Dashboard**: OAuth usage analytics

### Security Improvements

- **HMAC Validation**: Enhanced request validation
- **Token Encryption**: Encrypt stored access tokens
- **Audit Logging**: Track all OAuth events
- **Rate Limiting**: Prevent abuse

## Troubleshooting

### Common Issues

1. **"OAuth not configured" error**
   - Check environment variables
   - Verify Shopify app credentials

2. **"Invalid shop format" error**
   - Ensure shop URL follows pattern: `store-name.myshopify.com`
   - Remove protocol (https://) if included

3. **"Authorization failed" error**
   - Check Shopify app permissions
   - Verify redirect URL configuration
   - Check network connectivity

4. **"State parameter invalid" error**
   - Usually indicates expired or invalid state
   - Retry the connection process

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=shopify-oauth
```

## Support

For issues with the Shopify OAuth implementation:

1. Check this documentation
2. Review error logs
3. Verify environment configuration
4. Test with Shopify's OAuth testing tools
5. Contact development team with specific error details
