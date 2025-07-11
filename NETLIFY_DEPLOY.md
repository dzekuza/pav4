# Netlify Deployment Instructions

## Issue Resolution for Search Functionality

The search functionality wasn't working because of incorrect build configuration. Here's what was fixed:

### 1. Build Command Update

- Changed from `npm run build:client` to `npm run build`
- This ensures both client AND server are built for Netlify functions

### 2. Environment Variables Required

Set these in Netlify dashboard (Site settings → Environment variables):

```
GEMINI_API_KEY=your_actual_api_key_here
NODE_ENV=production
```

### 3. Deploy Steps

1. **Push changes to Git**:

   ```bash
   git add .
   git commit -m "Fix Netlify serverless functions"
   git push
   ```

2. **In Netlify Dashboard**:
   - Go to your site settings
   - Build & Deploy → Environment variables
   - Add `GEMINI_API_KEY` with your actual Google AI API key
   - Trigger a new deploy

### 4. Test API Endpoints

After deployment, test these URLs (replace `your-site.netlify.app`):

```
GET https://your-site.netlify.app/api/ping
POST https://your-site.netlify.app/api/scrape
GET https://your-site.netlify.app/api/search-history
```

### 5. Common Issues & Solutions

**If search still doesn't work:**

1. **Check Netlify Function Logs**:

   - Go to Netlify dashboard → Functions
   - Click on "api" function to see logs

2. **Check Environment Variables**:

   - Make sure `GEMINI_API_KEY` is set correctly
   - No extra spaces or quotes around the key

3. **CORS Issues**: The app includes CORS middleware, so this shouldn't be an issue

4. **Build Errors**: Check the deploy log in Netlify dashboard for any build failures

### 6. Production URLs

The app expects these API endpoints to work:

- `/api/scrape` - Main product scraping
- `/api/search-history` - Search history storage
- `/api/ping` - Health check

All should redirect to `/.netlify/functions/api/[endpoint]` automatically.
