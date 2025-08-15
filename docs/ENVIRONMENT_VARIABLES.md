# Environment Variables Guide

This document outlines all the environment variables required for the project to
function properly.

## Required Environment Variables

### 1. Gadget API Access

```bash
PAVL_APP=gsk-X89z6jDWkTRqgq7htYnZi4wcXQ8L3B9g
```

- **Purpose**: Access to Gadget API for dashboard data and analytics
- **Used by**: Dashboard API endpoints, analytics services
- **Fallback**: `PAVLP_DASHBOARD_ACCESS` (for development)

### 2. Shopify API Access

```bash
SHOPIFY_API_KEY=ba93cb813200396568e0cff132da0256
```

- **Purpose**: Shopify app functionality and API access
- **Used by**: Shopify app configuration, client-side tracking
- **Location**: Set in Shopify app configuration files

### 3. Shopify Webhook Authentication

```bash
SHOPIFY_WEBHOOK_API_KEY=your_webhook_api_key
```

- **Purpose**: Authenticate incoming Shopify webhooks
- **Used by**: Shopify webhook handlers
- **Security**: Validates webhook requests from Shopify

### 4. Database Connection

```bash
NETLIFY_DATABASE_URL=your_database_url
```

- **Purpose**: Database connection for the application
- **Used by**: All database operations
- **Fallback**: `DATABASE_URL` (for local development)

## Optional Environment Variables

### 5. Development Override

```bash
PAVLP_DASHBOARD_ACCESS=gsk-development-key
```

- **Purpose**: Override for development environment
- **Used by**: Development testing
- **Note**: Only used if `PAVL_APP` is not set

### 6. Frontend URL

```bash
FRONTEND_URL=https://ipick.io
```

- **Purpose**: Base URL for the frontend application
- **Used by**: URL generation, redirects
- **Default**: `https://ipick.io`

## Setting Environment Variables

### Netlify Deployment

1. Go to your Netlify dashboard
2. Navigate to Site settings > Environment variables
3. Add each variable with its corresponding value
4. Deploy to apply changes

### Local Development

Create a `.env` file in the root directory:

```bash
PAVL_APP=gsk-X89z6jDWkTRqgq7htYnZi4wcXQ8L3B9g
SHOPIFY_API_KEY=ba93cb813200396568e0cff132da0256
SHOPIFY_WEBHOOK_API_KEY=your_webhook_api_key
NETLIFY_DATABASE_URL=your_database_url
FRONTEND_URL=http://localhost:3000
```

## Security Notes

### API Key Security

- ✅ **Environment Variables**: All API keys are stored in environment variables
- ✅ **No Hardcoding**: No API keys are hardcoded in the source code
- ✅ **Netlify Security**: Environment variables are encrypted in Netlify
- ✅ **Access Control**: Only authorized services can access the keys

### Best Practices

1. **Never commit API keys** to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly** for security
4. **Monitor usage** to detect unauthorized access
5. **Use least privilege** - only grant necessary permissions

## Testing Environment Variables

### Test Endpoint

Visit `/api/business/test-gadget-api` to test:

- Gadget API connectivity
- Environment variable configuration
- Dashboard data generation

### Expected Response

```json
{
    "success": true,
    "message": "Gadget API connectivity test successful",
    "testData": {
        "apiAccessible": true,
        "shopsFound": "Yes",
        "dashboardError": null
    }
}
```

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Check if `PAVL_APP` is set in Netlify
   - Verify the environment variable name is correct

2. **"Failed to fetch dashboard data"**
   - Test the `/api/business/test-gadget-api` endpoint
   - Check Netlify function logs for detailed errors

3. **Shopify webhook failures**
   - Verify `SHOPIFY_WEBHOOK_API_KEY` is set
   - Check webhook authentication in Shopify admin

4. **Database connection errors**
   - Ensure `NETLIFY_DATABASE_URL` is correct
   - Check database accessibility from Netlify

### Debug Steps

1. Check environment variables in Netlify dashboard
2. Test API connectivity using the test endpoint
3. Review Netlify function logs for errors
4. Verify API key permissions and validity
5. Check network connectivity between services
