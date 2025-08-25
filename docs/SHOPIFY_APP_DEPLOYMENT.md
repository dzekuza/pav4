# Shopify App Deployment Guide

## Overview

This guide covers deploying your iPick Shopify app to production using the
Shopify CLI and platform.

## Prerequisites

### 1. Install Shopify CLI

```bash
npm install -g @shopify/cli @shopify/theme
```

### 2. Verify Installation

```bash
shopify version
```

### 3. Login to Shopify Partners

```bash
shopify auth login
```

## Deployment Options

Based on the
[Shopify app extensions documentation](https://shopify.dev/docs/apps/build/app-extensions/list-of-app-extensions),
you have several deployment options:

### **Option 1: Shopify CLI Deployment (Recommended)**

This is the standard approach for deploying Shopify apps.

#### Step 1: Build the Application

```bash
# Build both client and server
npm run build:shopify
```

#### Step 2: Deploy to Shopify

```bash
# Deploy using the deployment script
npm run deploy:shopify

# Or manually
cd itrcks
shopify app deploy
```

### **Option 2: Manual Deployment**

If you prefer manual control over the deployment process:

#### Step 1: Build the Application

```bash
# Build client
npm run build:client

# Build server
npm run build:server
```

#### Step 2: Deploy to Your Hosting Platform

Deploy the built application to your hosting platform (Netlify, Vercel, etc.):

```bash
# For Netlify
npm run build:netlify
netlify deploy --prod
```

#### Step 3: Update Shopify App Configuration

1. Go to your [Shopify Partners Dashboard](https://partners.shopify.com)
2. Navigate to your app
3. Update the app configuration:
   - **App URL**: `https://ipick.io`
   - **Allowed redirection URL(s)**: Add all required URLs
   - **Webhook endpoints**: Configure webhook URLs

## App Extensions

Based on the
[Shopify app extensions list](https://shopify.dev/docs/apps/build/app-extensions/list-of-app-extensions),
consider implementing these extensions:

### **1. Theme App Extensions** (Recommended)

- **Purpose**: Integrate with Online Store 2.0 themes
- **Requires Review**: No
- **Create using**: Shopify CLI
- **Use case**: Add tracking scripts to customer-facing pages

### **2. Web Pixel Extensions**

- **Purpose**: Collect behavioral data for analytics
- **Requires Review**: No
- **Create using**: Shopify CLI
- **Use case**: Track user behavior and conversions

### **3. Admin Extensions**

- **Purpose**: Add custom functionality to Shopify admin
- **Requires Review**: No
- **Create using**: Shopify CLI
- **Use case**: Display analytics data in admin dashboard

## Deployment Configuration

### **Environment Variables**

Ensure these are set in your production environment:

```env
# Shopify OAuth Configuration
SHOPIFY_CLIENT_ID="your-production-client-id"
SHOPIFY_CLIENT_SECRET="your-production-client-secret"
SHOPIFY_APP_URL="https://ipick.io"
SHOPIFY_API_VERSION="2024-10"

# Database
DATABASE_URL="your-production-database-url"

# Webhook Secret
IPICK_WEBHOOK_SECRET="54e7fd9b170add3cf80dcc482f8b894a5"

# Other Services
RESEND_API_KEY="your-resend-api-key"
GEMINI_API_KEY="your-gemini-api-key"
```

### **Shopify App Configuration**

Your `itrcks/shopify.app.toml` file should contain:

```toml
client_id = "your-production-client-id"
name = "iPick Price Tracking"
application_url = "https://ipick.io"
embedded = true

[build]
include_config_on_deploy = true

[auth]
redirect_urls = [
  "https://ipick.io/api/auth",
  "https://ipick.io/api/shopify/oauth/callback",
  "https://ipick.io/business/dashboard",
  "https://ipick.io/business/integrate",
  "https://ipick.io/api/shopify/oauth/connect"
]

[webhooks]
api_version = "2024-10"

[[webhooks.handlers]]
api_version = "2024-10"
topics = ["orders/create", "orders/updated", "products/update", "customers/update"]
address = "https://ipick.io/api/shopify/webhooks"
```

## Post-Deployment Steps

### **1. Verify Deployment**

```bash
# Check app status
shopify app info

# Test OAuth flow
curl -X GET "https://ipick.io/api/shopify/oauth/config"
```

### **2. Update Partner Dashboard**

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com)
2. Navigate to your app
3. Update configuration:
   - **App URL**: `https://ipick.io`
   - **Preferences URL**: `https://ipick.io/business/settings`
   - **Allowed redirection URL(s)**: Add all required URLs
   - **Embed app in Shopify admin**: Set to True

### **3. Test with Development Store**

1. Create a development store in Shopify Partners
2. Install your app on the development store
3. Test the OAuth flow
4. Test webhook functionality
5. Test embedded app functionality

### **4. Submit for Review** (If Required)

If your app requires review:

1. Complete all testing
2. Ensure all functionality works correctly
3. Submit for review in the Partner Dashboard
4. Wait for approval before publishing

## Monitoring and Maintenance

### **1. Logs and Monitoring**

```bash
# Check app logs
shopify app logs

# Monitor webhook delivery
curl -X GET "https://ipick.io/api/shopify/oauth/status"
```

### **2. Updates and Maintenance**

```bash
# Update app
shopify app deploy

# Check for updates
shopify app update
```

### **3. Troubleshooting**

Common issues and solutions:

#### **OAuth Errors**

- Verify redirect URLs are correct
- Check client ID and secret
- Ensure app is properly configured

#### **Webhook Failures**

- Verify webhook endpoint is accessible
- Check webhook secret
- Monitor webhook delivery logs

#### **App Not Loading**

- Check app URL configuration
- Verify embedded app settings
- Check for JavaScript errors

## Security Considerations

### **1. Environment Variables**

- Store sensitive data securely
- Use environment-specific configurations
- Rotate secrets regularly

### **2. OAuth Security**

- Validate OAuth state parameters
- Use HTTPS for all URLs
- Implement proper error handling

### **3. Webhook Security**

- Verify webhook signatures
- Use secure webhook secrets
- Monitor webhook delivery

## Support and Resources

### **Documentation**

- [Shopify App Development](https://shopify.dev/docs/apps)
- [App Extensions](https://shopify.dev/docs/apps/build/app-extensions)
- [OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)

### **Tools**

- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Partner Dashboard](https://partners.shopify.com)
- [App Store](https://apps.shopify.com)

### **Community**

- [Shopify Community](https://community.shopify.com)
- [Developer Forums](https://community.shopify.com/c/shopify-apis-and-sdks/bd-p/shopify-apis-and-technology)
- [GitHub Discussions](https://github.com/Shopify/shopify-cli/discussions)
