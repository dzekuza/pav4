# Database Setup for Tracking Function

## Issue

The tracking function is returning 500 errors because the `NETLIFY_DATABASE_URL`
environment variable is not set in the Netlify deployment.

## Solution

### 1. Get Your Neon Database URL

1. Go to your Neon dashboard: https://console.neon.tech/
2. Select your project
3. Go to "Connection Details"
4. Copy the connection string that looks like:
   ```
   postgresql://username:password@hostname:port/database
   ```

### 2. Set Environment Variables in Netlify

#### Option A: Via Netlify Dashboard

1. Go to your Netlify dashboard: https://app.netlify.com/
2. Select your site: pavlo4
3. Go to Site settings > Environment variables
4. Add the following variable:
   - `NETLIFY_DATABASE_URL` = `your-neon-connection-string`

#### Option B: Via Netlify CLI

```bash
netlify env:set NETLIFY_DATABASE_URL "your-neon-connection-string"
```

### 3. Test the Database Connection

After setting the environment variable, test the connection:

1. Deploy your changes
2. Visit: https://pavlo4.netlify.app/api/test-db
3. You should see a JSON response indicating if the connection is successful

### 4. Verify Tracking Function

Once the database connection is working:

1. Visit a product page with your tracking script
2. Check the browser console for successful tracking events
3. The 500 errors should be resolved

## Troubleshooting

### If the test-db endpoint returns an error:

1. **Check the connection string format** - Make sure it's a valid PostgreSQL
   connection string
2. **Verify Neon database is running** - Check your Neon dashboard
3. **Check network access** - Ensure Netlify can reach your Neon database
4. **Review logs** - Check Netlify function logs for detailed error messages

### Common Issues:

1. **Missing NETLIFY_DATABASE_URL**: The most common issue - make sure it's set
   in Netlify
2. **Invalid connection string**: Double-check the format from Neon
3. **Database not migrated**: Run `npx prisma db push` to ensure tables exist
4. **Network restrictions**: Ensure Neon allows connections from Netlify's IP
   ranges

## Next Steps

After fixing the database connection:

1. Test the tracking on a product page
2. Verify events are being recorded in the database
3. Check that business statistics are being updated correctly
4. Monitor the function logs for any remaining issues
