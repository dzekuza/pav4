# Shopify App Configuration Guide

## Overview

This guide explains how to configure your Shopify app URLs and settings for the
iPick platform using our self-contained Shopify OAuth implementation.

## Current App Configuration

### App Details

- **App Name**: iPick Price Tracking
- **App URL**: `https://ipick.io/`
- **Embedded**: True (recommended)
- **OAuth Type**: Direct Shopify OAuth (self-contained)

## Required URL Configuration

### 1. App URL

```
https://ipick.io/
```

This is the base URL where your app is hosted.

### 2. Preferences URL (Optional)

```
https://ipick.io/business/settings
```

URL for app-specific settings or preferences page.

### 3. Allowed Redirection URL(s)

Add these URLs to your Shopify app configuration:

```
https://ipick.io/api/auth
https://ipick.io/api/shopify/oauth/callback
https://ipick.io/business/dashboard
https://ipick.io/business/integrate
https://ipick.io/api/shopify/oauth/connect
```

### 4. Embedded in Shopify Admin

- **Keep as: True** (selected)

## Shopify Partner Dashboard Configuration

### Step 1: Access App Settings

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com)
2. Navigate to your app
3. Go to "App setup" section

### Step 2: Configure URLs

1. **App URL**: `https://ipick.io/`
2. **Preferences URL**: `https://ipick.io/business/settings` (optional)
3. **Allowed redirection URL(s)**: Add all the URLs listed above

### Step 3: App Embedding

- **Embed app in Shopify admin**: Set to **True**
- This enables your app to load within the Shopify admin interface

## Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
# Shopify OAuth Configuration
SHOPIFY_CLIENT_ID=your_shopify_client_id_here
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret_here
SHOPIFY_APP_URL=https://ipick.io
SHOPIFY_API_VERSION=2024-10

# ipick.io Webhook Secret for Shopify Integration
IPICK_WEBHOOK_SECRET=54e7fd9b170add3cf80dcc482f8b894a5
```

## Webhook Configuration

### Webhook Endpoint

```
https://ipick.io/api/shopify/webhooks
```

### Webhook Secret

```
54e7fd9b170add3cf80dcc482f8b894a5
```

### Required Webhooks

- **Order creation**: `orders/create`
- **Order updates**: `orders/updated`
- **Product updates**: `products/update`
- **Customer updates**: `customers/update`

## OAuth Scopes

Your app requires these Shopify OAuth scopes:

```
read_products
read_orders
read_customers
read_inventory
read_analytics
read_marketing_events
read_sales
read_reports
write_script_tags
write_themes
```

## OAuth Flow

### Direct Shopify OAuth Process

1. **User initiates connection** → Clicks "Connect Shopify Store"
2. **Generate OAuth URL** → App creates direct Shopify OAuth URL
3. **Redirect to Shopify** → User is redirected to Shopify for authorization
4. **User authorizes** → User grants permissions in Shopify
5. **Callback to app** → Shopify redirects back to our callback URL
6. **Token exchange** → App exchanges authorization code for access token
7. **Store connection** → Access token and shop info stored in database

### OAuth Endpoints

- **Connect**: `GET /api/shopify/oauth/connect`
- **Callback**: `GET /api/shopify/oauth/callback`
- **Status**: `GET /api/shopify/oauth/status`
- **Disconnect**: `POST /api/shopify/oauth/disconnect`
- **Config**: `GET /api/shopify/oauth/config`

## Testing Your Configuration

### 1. Test OAuth Flow

1. Go to your app's integration page
2. Click "Connect Shopify Store"
3. Enter a test shop domain (e.g., `your-test-shop.myshopify.com`)
4. Complete the OAuth flow

### 2. Test Webhooks

1. Create a test order in your Shopify store
2. Check the webhook logs in your server
3. Verify the order data is received

### 3. Test App Embedding

1. Install your app in a test store
2. Navigate to the app from the Shopify admin
3. Verify the app loads properly within the admin interface

## Troubleshooting

### Common Issues

#### 1. OAuth Redirect Error

**Problem**: "Invalid redirect URI" error during OAuth **Solution**: Ensure all
redirect URLs are added to your Shopify app configuration

#### 2. Webhook Not Receiving Data

**Problem**: Webhooks not firing **Solution**:

- Verify webhook endpoint is accessible
- Check webhook secret matches
- Ensure webhook is registered with correct topic

#### 3. App Not Loading in Admin

**Problem**: App doesn't appear in Shopify admin **Solution**:

- Verify "Embed app in Shopify admin" is set to True
- Check App URL is correct and accessible
- Ensure app is properly installed

#### 4. OAuth Configuration Error

**Problem**: "OAuth configuration is invalid" error **Solution**:

- Check `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` are set
- Verify the values match your Shopify app credentials
- Ensure `SHOPIFY_APP_URL` is correct

### Debug Steps

1. **Check Server Logs**

   ```bash
   # Monitor server logs for OAuth and webhook events
   tail -f server.log
   ```

2. **Test API Endpoints**

   ```bash
   # Test OAuth callback
   curl -X GET "https://ipick.io/api/shopify/oauth/callback"

   # Test webhook endpoint
   curl -X POST "https://ipick.io/api/shopify/webhooks"

   # Test OAuth config
   curl -X GET "https://ipick.io/api/shopify/oauth/config"
   ```

3. **Verify Environment Variables**

   ```bash
   # Check if all required env vars are set
   node -e "console.log(process.env.SHOPIFY_CLIENT_ID)"
   node -e "console.log(process.env.SHOPIFY_CLIENT_SECRET)"
   ```

## Security Considerations

1. **Webhook Secret**: Keep your webhook secret secure and never expose it in
   client-side code
2. **OAuth State**: Always validate OAuth state parameters to prevent CSRF
   attacks
3. **HTTPS**: Ensure all URLs use HTTPS in production
4. **API Keys**: Store API keys securely and rotate them regularly
5. **Access Tokens**: Store access tokens securely in the database

## Production Checklist

- [ ] All URLs configured in Shopify Partner Dashboard
- [ ] Environment variables set correctly
- [ ] Webhooks registered and tested
- [ ] OAuth flow tested with real Shopify store
- [ ] App embedding working in Shopify admin
- [ ] SSL certificates valid for all domains
- [ ] Error handling implemented for all endpoints
- [ ] Logging configured for debugging

## Support

If you encounter issues with your Shopify app configuration:

1. Check the server logs for error messages
2. Verify all URLs are correctly configured
3. Test with a development store first
4. Contact support with specific error messages and logs
