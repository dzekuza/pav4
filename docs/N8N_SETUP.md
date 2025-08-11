# N8N Integration Setup

This document explains how to set up the N8N workflow for advanced product scraping.

## Overview

The `/new` page uses an N8N workflow to scrape product data instead of the traditional Puppeteer-based scraping. This provides more reliable extraction and better handling of different website structures.

## N8N Workflow

The workflow consists of the following nodes:

1. **Webhook** - Receives the product URL
2. **HTTP Request** - Fetches the webpage content
3. **HTML Extract** - Extracts product data using CSS selectors
4. **Code** - Cleans and processes the title
5. **HTTP Request** - Calls SearchAPI.io for similar products
6. **Code** - Processes search results
7. **Merge** - Combines main product and suggestions
8. **Code** - Formats final response
9. **Respond to Webhook** - Returns the data

## Workflow Configuration

### HTML Extract Node
Extracts the following data using CSS selectors:
- **Title**: `meta[property="og:title"]` (content attribute)
- **Price**: `[itemprop="price"], .price, .product-price, [class*="price"]`
- **Image**: `meta[property="og:image"]` (content attribute)

### Search API Integration
Uses SearchAPI.io to find similar products:
- **API Key**: `DzqyetWqB73LnNL7v96cWb7i`
- **Engine**: Google
- **Query**: Shortened product title (first 6 words)

## Environment Setup

1. **Set N8N Webhook URL**:
   ```bash
   echo 'N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/start-scrape"' >> .env
   ```

2. **Replace the placeholder URL** with your actual N8N webhook URL.

## Testing

### With Mock Data (Default)
When the N8N webhook URL is not configured, the system uses mock data for testing:

```bash
curl -X POST http://localhost:8080/api/n8n-scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.apple.com/iphone-16-pro/"}'
```

### With Real N8N Workflow
1. Deploy the N8N workflow to your instance
2. Update the `N8N_WEBHOOK_URL` in your `.env` file
3. Test with a real product URL

## Workflow JSON

The complete workflow JSON is provided in the user's request. To import:

1. Copy the workflow JSON
2. Open your N8N instance
3. Import the workflow
4. Activate the workflow
5. Copy the webhook URL and update your `.env` file

## Features

- **HTML Extraction**: Uses CSS selectors for reliable data extraction
- **Search Integration**: Finds similar products using Google Search API
- **Fallback System**: Falls back to original scraping if N8N fails
- **Mock Data**: Provides test data when N8N is not configured

## Access

Visit `/new` to use the N8N-powered scraping system.

## Troubleshooting

1. **Webhook Not Found**: Ensure the N8N workflow is active
2. **Extraction Fails**: Check CSS selectors for the target website
3. **Search API Errors**: Verify the API key is valid
4. **Network Issues**: Check firewall and network connectivity

## Benefits

- **More Reliable**: Better handling of different website structures
- **Faster**: Optimized extraction process
- **Extensible**: Easy to modify and extend the workflow
- **Search Integration**: Automatic discovery of similar products 