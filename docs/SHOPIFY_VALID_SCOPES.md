# Shopify OAuth Valid Scopes

## Overview

This document lists the valid Shopify OAuth scopes that can be used with our
iPick app integration. Using invalid scopes will result in OAuth errors.

## Current Valid Scopes

Our app uses the following valid Shopify scopes:

### **Product & Inventory Scopes**

- `read_products` - Read product information
- `read_inventory` - Read inventory levels

### **Order & Customer Scopes**

- `read_orders` - Read order information
- `read_customers` - Read customer information

### **Analytics & Marketing Scopes**

- `read_analytics` - Read analytics data
- `read_marketing_events` - Read marketing events
- `read_reports` - Read reports

### **Theme & Script Scopes**

- `write_script_tags` - Install tracking scripts
- `write_themes` - Modify theme files

## Invalid Scopes (Do Not Use)

The following scopes are **NOT valid** and will cause OAuth errors:

- ❌ `read_sales` - This scope doesn't exist in Shopify API
- ❌ `write_products` - Not needed for our use case
- ❌ `write_orders` - Not needed for our use case
- ❌ `write_customers` - Not needed for our use case

## Scope Configuration

### **Server Configuration**

The scopes are configured in `server/config/shopify-oauth.ts`:

```typescript
SHOPIFY_SCOPES: [
  'read_products',
  'read_orders', 
  'read_customers',
  'read_inventory',
  'read_analytics',
  'read_marketing_events',
  'read_reports',
  'write_script_tags',
  'write_themes'
].join(','),
```

### **Shopify App Configuration**

The scopes are also configured in `itrcks/shopify.app.toml` and will be
automatically included when the app is deployed.

## Troubleshooting Scope Errors

### **Common Error: "invalid_scope"**

**Error Message:**

```
OAuth error invalid_scope: The access scope is invalid: [scope_name]
```

**Solution:**

1. Check if the scope exists in the
   [Shopify API documentation](https://shopify.dev/docs/api/usage/access-scopes)
2. Remove any invalid scopes from the configuration
3. Redeploy the app: `shopify app deploy`

### **Testing Scopes**

To test if scopes are valid:

1. **Check OAuth URL**: The scopes are included in the OAuth authorization URL
2. **Monitor OAuth Flow**: Check server logs for scope-related errors
3. **Verify in Partner Dashboard**: Ensure app configuration matches server
   configuration

## Best Practices

### **1. Minimal Scope Principle**

- Only request scopes that are actually needed
- Start with read-only scopes
- Add write scopes only when necessary

### **2. Scope Documentation**

- Keep this document updated with current scopes
- Document why each scope is needed
- Review scopes regularly

### **3. Error Handling**

- Handle OAuth scope errors gracefully
- Provide clear error messages to users
- Log scope errors for debugging

## Updating Scopes

### **Adding New Scopes**

1. Verify the scope is valid in
   [Shopify API documentation](https://shopify.dev/docs/api/usage/access-scopes)
2. Add the scope to `server/config/shopify-oauth.ts`
3. Update this documentation
4. Redeploy the app: `shopify app deploy`
5. Test the OAuth flow

### **Removing Scopes**

1. Remove the scope from `server/config/shopify-oauth.ts`
2. Update this documentation
3. Redeploy the app: `shopify app deploy`
4. Test the OAuth flow

## References

- [Shopify Access Scopes Documentation](https://shopify.dev/docs/api/usage/access-scopes)
- [Shopify OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify API Reference](https://shopify.dev/docs/api)

## Current App Version

- **App Name**: ipickdemo
- **Current Version**: ipickdemo-5
- **Last Updated**: 2025-08-25
- **Valid Scopes**: 9 scopes configured
