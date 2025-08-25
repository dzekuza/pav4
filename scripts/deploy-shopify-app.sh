#!/bin/bash

# Shopify App Deployment Script
# This script builds and deploys the Shopify app

set -e

echo "🚀 Starting Shopify app deployment..."

# Check if Shopify CLI is installed
if ! command -v shopify &> /dev/null; then
    echo "❌ Shopify CLI is not installed. Please install it first:"
    echo "   npm install -g @shopify/cli @shopify/theme"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "itrcks/shopify.app.toml" ]; then
    echo "❌ shopify.app.toml not found. Please run this script from the project root."
    exit 1
fi

# Build the server
echo "📦 Building server..."
npm run build:server

# Build the client
echo "📦 Building client..."
npm run build:client

# Deploy to Shopify
echo "🚀 Deploying to Shopify..."
cd itrcks

# Deploy the app
shopify app deploy

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Shopify Partner Dashboard"
echo "2. Navigate to your app"
echo "3. Update the app configuration with the new URLs"
echo "4. Test the OAuth flow with a development store"
echo ""
echo "🔗 App URLs:"
echo "- App URL: https://ipick.io"
echo "- OAuth Callback: https://ipick.io/api/shopify/oauth/callback"
echo "- Webhook Endpoint: https://ipick.io/api/shopify/webhooks"
