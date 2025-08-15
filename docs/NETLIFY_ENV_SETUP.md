# Netlify Environment Variables Setup Guide

## Complete Environment Variables List

### **Required Variables (Must be set)**

| Variable                  | Value                                  | Purpose                              | Scope                                       |
| ------------------------- | -------------------------------------- | ------------------------------------ | ------------------------------------------- |
| `PAVL_APP`                | `gsk-X89z6jDWkTRqgq7htYnZi4wcXQ8L3B9g` | Gadget API access for dashboard data | Production, Deploy Previews, Branch Deploys |
| `SHOPIFY_API_KEY`         | `ba93cb813200396568e0cff132da0256`     | Shopify app functionality            | Production                                  |
| `SHOPIFY_WEBHOOK_API_KEY` | `your_webhook_api_key`                 | Shopify webhook authentication       | Production                                  |
| `NETLIFY_DATABASE_URL`    | `your_database_url`                    | Database connection                  | Production, Deploy Previews, Branch Deploys |
| `FRONTEND_URL`            | `https://ipick.io`                     | Frontend URL for emails/redirects    | Production, Deploy Previews, Branch Deploys |

### **Optional Variables (Development/Testing)**

| Variable                 | Value                 | Purpose                         | Scope               |
| ------------------------ | --------------------- | ------------------------------- | ------------------- |
| `PAVLP_DASHBOARD_ACCESS` | `gsk-development-key` | Development Gadget API override | Development only    |
| `NODE_ENV`               | `production`          | Node environment                | Auto-set by Netlify |

## Step-by-Step Setup Instructions

### **1. Access Netlify Environment Variables**

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings** > **Environment variables**
4. Click **"Add variable"**

### **2. Add Required Variables**

#### **PAVL_APP (Gadget API Access)**

- **Key**: `PAVL_APP`
- **Value**: `gsk-X89z6jDWkTRqgq7htYnZi4wcXQ8L3B9g`
- **Scopes**: ✅ Production, ✅ Deploy previews, ✅ Branch deploys
- **Description**: Primary API key for accessing Gadget API dashboard data

#### **SHOPIFY_API_KEY (Shopify Integration)**

- **Key**: `SHOPIFY_API_KEY`
- **Value**: `ba93cb813200396568e0cff132da0256`
- **Scopes**: ✅ Production
- **Description**: API key for Shopify app functionality

#### **SHOPIFY_WEBHOOK_API_KEY (Webhook Security)**

- **Key**: `SHOPIFY_WEBHOOK_API_KEY`
- **Value**: `your_webhook_api_key` (generate this)
- **Scopes**: ✅ Production
- **Description**: Authentication key for Shopify webhooks

#### **NETLIFY_DATABASE_URL (Database Connection)**

- **Key**: `NETLIFY_DATABASE_URL`
- **Value**: `your_actual_database_connection_string`
- **Scopes**: ✅ Production, ✅ Deploy previews, ✅ Branch deploys
- **Description**: Database connection string for the application

#### **FRONTEND_URL (Application URL)**

- **Key**: `FRONTEND_URL`
- **Value**: `https://ipick.io`
- **Scopes**: ✅ Production, ✅ Deploy previews, ✅ Branch deploys
- **Description**: Base URL for email templates and redirects

### **3. Variable Scopes Explanation**

- **Production**: Variables available in production environment
- **Deploy previews**: Variables available in preview deployments
- **Branch deploys**: Variables available in branch-specific deployments

## Security Best Practices

### **✅ Do's:**

- Use different API keys for development and production
- Set appropriate scopes for each variable
- Rotate API keys regularly
- Use strong, unique values for webhook keys

### **❌ Don'ts:**

- Never commit environment variables to version control
- Don't share API keys in public repositories
- Don't use the same keys across different environments
- Don't set sensitive variables for all scopes unless necessary

## Testing Your Setup

### **1. Test Dashboard Access**

After deployment, test the dashboard:

- Visit your business dashboard
- Check if data loads correctly
- Look for any "API key not configured" errors

### **2. Test API Connectivity**

Use the test endpoint:

- Visit: `https://your-site.netlify.app/api/business/test-gadget-api`
- Should return success response

### **3. Check Netlify Logs**

Monitor function logs for:

- Environment variable access
- API connectivity issues
- Database connection problems

## Troubleshooting

### **Common Issues:**

1. **"API key not configured"**
   - Check if `PAVL_APP` is set correctly
   - Verify the variable name matches exactly

2. **"Failed to fetch dashboard data"**
   - Test the `/api/business/test-gadget-api` endpoint
   - Check Netlify function logs for detailed errors

3. **Database connection errors**
   - Verify `NETLIFY_DATABASE_URL` is correct
   - Check database accessibility from Netlify

4. **Shopify webhook failures**
   - Ensure `SHOPIFY_WEBHOOK_API_KEY` is set
   - Verify webhook authentication in Shopify admin

### **Debug Steps:**

1. Check environment variables in Netlify dashboard
2. Test API connectivity using the test endpoint
3. Review Netlify function logs for errors
4. Verify API key permissions and validity
5. Check network connectivity between services

## Deployment Checklist

Before deploying, ensure:

- [ ] All required environment variables are set
- [ ] API keys have correct permissions
- [ ] Database URL is accessible from Netlify
- [ ] CORS configuration includes necessary domains
- [ ] Test endpoint returns success response

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Netlify function logs
3. Test individual API endpoints
4. Verify environment variable configuration
