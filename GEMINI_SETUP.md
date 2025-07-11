# Gemini AI Integration Setup

To enable AI-powered product extraction for difficult-to-scrape sites, follow these steps:

## 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## 2. Add to Environment

1. Create or edit the `.env` file in the project root
2. Add your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## 3. Restart Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## How It Works

When normal HTML scraping fails to extract product data, the system will:

1. **Send the raw HTML** to Gemini AI
2. **Ask it to extract** product title, price, and image
3. **Parse the AI response** and use it for price comparison
4. **Fall back to URL-based inference** if AI also fails

This enables extraction from heavily JavaScript-rendered sites like:

- Amazon product pages
- Apple store pages
- PlayStation Direct
- Other modern e-commerce sites

## Benefits

- ✅ **Works with JavaScript-heavy sites**
- ✅ **Handles anti-bot protection**
- ✅ **Extracts accurate product data**
- ✅ **Automatic fallback system**
- ✅ **No browser dependencies**
