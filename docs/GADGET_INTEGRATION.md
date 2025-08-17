# Gadget Integration for ipick.io

This document outlines the complete integration between ipick.io and Gadget for Shopify analytics and OAuth management.

## Overview

The Gadget integration provides:
- **Shopify OAuth Management**: Secure authentication flow for Shopify merchants
- **Analytics Data Collection**: Real-time event tracking and order attribution
- **Webhook Processing**: Automated data synchronization between Gadget and ipick.io
- **API Endpoints**: Secure access to analytics data for the ipick.io dashboard

## Environment Variables

Add these to your `.env` file:

```bash
# Gadget API Configuration
GADGET_API_URL="https://itrcks.gadget.app"
SHOPIFY_INSTALL_URL="https://itrcks.gadget.app/api/shopify/install-or-render"
SHOPIFY_CALLBACK_URL="https://itrcks.gadget.app/api/connections/auth/shopify/callback"
GADGET_API_KEY="your-gadget-api-key"

# Webhook Security
IPICK_WEBHOOK_SECRET="npg_lLWeCGKpqh2413ygrbrsbr"
```

## API Endpoints

### OAuth Endpoints

#### 1. Start OAuth Flow
```http
GET /api/shopify/oauth/connect?shop=your-store.myshopify.com
Authorization: Bearer <business-token>
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://itrcks.gadget.app/api/shopify/install-or-render?shop=your-store.myshopify.com&state=...",
  "shop": "your-store.myshopify.com",
  "state": "generated-state-token",
  "webhookEndpoint": "https://ipick.io/api/webhooks/gadget",
  "webhookSecret": "configured"
}
```

#### 2. OAuth Callback
```http
GET /api/shopify/oauth/callback?code=...&state=...&shop=...
```

**Redirects to:** `/business/dashboard?shopify_connected=true&shop=your-store.myshopify.com`

#### 3. Check OAuth Status
```http
GET /api/shopify/oauth/status
Authorization: Bearer <business-token>
```

**Response:**
```json
{
  "success": true,
  "isConnected": true,
  "shop": "your-store.myshopify.com",
  "scopes": "read_products,read_orders,...",
  "lastConnected": "2024-01-15T10:30:00Z",
  "status": "connected",
  "webhookConfigured": true
}
```

#### 4. Get Webhook Configuration
```http
GET /api/shopify/oauth/webhook-config
Authorization: Bearer <business-token>
```

**Response:**
```json
{
  "success": true,
  "webhookEndpoint": "https://ipick.io/api/webhooks/gadget",
  "webhookSecret": "configured",
  "shop": "your-store.myshopify.com",
  "events": {
    "SHOPIFY_CONNECTION_CREATED": "shopify_connection_created",
    "SHOPIFY_CONNECTION_UPDATED": "shopify_connection_updated",
    "SHOPIFY_CONNECTION_DELETED": "shopify_connection_deleted",
    "ORDER_CREATED": "order_created",
    "ORDER_UPDATED": "order_updated"
  }
}
```

### Analytics Endpoints

#### 1. Get Events Data
```http
GET /api/gadget/events?shopDomain=your-store.myshopify.com&first=50
Authorization: Bearer <gadget-api-key>
```

#### 2. Get Orders Data
```http
GET /api/gadget/orders?shopDomain=your-store.myshopify.com&first=50
Authorization: Bearer <gadget-api-key>
```

#### 3. Get Aggregates Data
```http
GET /api/gadget/aggregates?shopDomain=your-store.myshopify.com&first=50
Authorization: Bearer <gadget-api-key>
```

#### 4. Get Clicks Data
```http
GET /api/gadget/clicks?shopDomain=your-store.myshopify.com&first=50
Authorization: Bearer <gadget-api-key>
```

### Webhook Endpoint

#### Gadget Webhook
```http
POST /api/webhooks/gadget
Content-Type: application/json
x-gadget-signature: <hmac-sha256-signature>
```

**Webhook Events:**
- `shopify_connection_created`
- `shopify_connection_updated`
- `shopify_connection_deleted`
- `order_created`
- `order_updated`

## Webhook Security

The webhook endpoint validates requests using HMAC-SHA256 signatures:

```javascript
// Signature generation (on Gadget side)
const signature = crypto
  .createHmac('sha256', IPICK_WEBHOOK_SECRET)
  .update(JSON.stringify(payload), 'utf8')
  .digest('hex');

// Signature verification (on ipick.io side)
const expectedSignature = crypto
  .createHmac('sha256', IPICK_WEBHOOK_SECRET)
  .update(payload, 'utf8')
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(signature, 'hex'),
  Buffer.from(expectedSignature, 'hex')
);
```

## Database Schema Updates

The integration requires these fields in the `business` table:

```sql
ALTER TABLE business ADD COLUMN IF NOT EXISTS shopify_status VARCHAR(20) DEFAULT 'disconnected';
ALTER TABLE business ADD COLUMN IF NOT EXISTS shopify_connected_at TIMESTAMP;
```

## Testing

### Test Webhook Integration
```bash
# Set environment variables
export IPICK_WEBHOOK_SECRET="npg_lLWeCGKpqh2413ygrbrsbr"
export WEBHOOK_URL="http://localhost:3000/api/webhooks/gadget"

# Run test script
node scripts/test-gadget-webhook.js
```

### Test OAuth Flow
1. Start the development server
2. Navigate to `/business/dashboard`
3. Click "Connect Shopify Store"
4. Enter a test shop domain
5. Verify the OAuth flow completes successfully

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "Invalid signature"
}
```

#### 400 Bad Request
```json
{
  "error": "Missing required OAuth parameters"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Shopify OAuth is not properly configured. Please contact support.",
  "missing": {
    "gadgetApiUrl": false,
    "installUrl": false,
    "callbackUrl": false,
    "webhookSecret": true
  }
}
```

## Security Considerations

1. **Webhook Signatures**: All webhook requests must include valid HMAC signatures
2. **State Parameters**: OAuth flows use cryptographically secure state tokens
3. **Rate Limiting**: API endpoints are protected by rate limiting
4. **Input Validation**: All inputs are validated and sanitized
5. **HTTPS Only**: Production endpoints require HTTPS

## Monitoring

### Logs to Monitor
- Webhook signature verification failures
- OAuth state validation errors
- Database connection issues
- API rate limit violations

### Health Checks
```http
GET /api/health
```

## Troubleshooting

### Webhook Not Receiving Data
1. Verify `IPICK_WEBHOOK_SECRET` is set correctly
2. Check webhook endpoint URL is accessible
3. Ensure signature headers are being sent
4. Review server logs for errors

### OAuth Flow Failing
1. Verify all environment variables are set
2. Check Gadget API connectivity
3. Ensure callback URL is correct
4. Review OAuth state validation

### Analytics Data Missing
1. Verify Gadget API key is valid
2. Check shop domain format
3. Ensure proper authentication headers
4. Review GraphQL query syntax

## Deployment

### Production Checklist
- [ ] Set all required environment variables
- [ ] Configure webhook endpoint URL
- [ ] Test webhook signature verification
- [ ] Verify OAuth flow end-to-end
- [ ] Test analytics API endpoints
- [ ] Monitor error logs
- [ ] Set up health checks

### Environment Variables for Production
```bash
# Required
GADGET_API_URL="https://itrcks.gadget.app"
SHOPIFY_INSTALL_URL="https://itrcks.gadget.app/api/shopify/install-or-render"
SHOPIFY_CALLBACK_URL="https://itrcks.gadget.app/api/connections/auth/shopify/callback"
GADGET_API_KEY="your-production-gadget-api-key"
IPICK_WEBHOOK_SECRET="your-production-webhook-secret"

# Optional
FRONTEND_URL="https://ipick.io"
NODE_ENV="production"
```

## Support

For issues with the Gadget integration:
1. Check the server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test the webhook endpoint using the provided test script
4. Contact the development team with specific error details
