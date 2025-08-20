# Shopify OAuth Troubleshooting Guide

## **Current Issue: OAuth Flow Not Completing Properly**

You mentioned that when trying to authorize Shopify, you are logged into your
account, but the authorization is not completing properly. This suggests the
OAuth flow is working partially but not finishing the token exchange.

## **🔍 Root Cause Analysis**

### **1. Environment Variables**

✅ **Status**: All required variables are properly set in `.env`

- `GADGET_API_URL="https://itrcks--development.gadget.app"`
- `SHOPIFY_INSTALL_URL="https://itrcks--development.gadget.app/api/shopify/install"`
- `SHOPIFY_CALLBACK_URL="https://itrcks--development.gadget.app/api/connections/auth/shopify/callback"`
- `GADGET_API_KEY="gsk-wXJiwmtZkpHt9tHrfFHEYerLkK3B44Wn"`
- `IPICK_WEBHOOK_SECRET="npg_lLWeCGKpqh2413ygrbrsbr"`

### **2. OAuth Flow Steps**

The issue is likely in one of these steps:

1. ✅ User enters shop URL and clicks Connect
2. ✅ Backend redirects to Gadget OAuth
3. ✅ User authorizes on Shopify
4. ❌ **Callback handling** - This is where the issue likely occurs
5. ❌ **Token exchange** - Gadget should handle this
6. ❌ **Database update** - Business should be marked as connected

## **🚀 Solutions**

### **Solution 1: Check Gadget OAuth Configuration**

1. **Verify Gadget App Settings**:
   - Go to your Gadget app dashboard
   - Check Shopify plugin configuration
   - Ensure OAuth is properly configured
   - Verify callback URLs are set correctly

2. **Check Shopify App Settings**:
   - Go to Shopify Partner dashboard
   - Verify your app's OAuth settings
   - Ensure redirect URLs include Gadget's callback URL

### **Solution 2: Monitor OAuth Flow**

1. **Check Server Logs**:
   ```bash
   # Look for these log messages:
   # - "Shopify OAuth callback received"
   # - "State validation successful"
   # - "Shopify OAuth callback successful"
   ```

2. **Test OAuth Flow**:
   - Start your development server
   - Log in as a business user
   - Navigate to Shopify integration
   - Enter shop URL: `checkoutipick.myshopify.com`
   - Click Connect
   - Monitor server logs for OAuth events

### **Solution 3: Verify Gadget Integration**

1. **Check Gadget Dashboard**:
   - Look for `shopifyShop` records in Gadget
   - Verify the shop was created after OAuth
   - Check for any error messages

2. **Test Gadget API**:
   - Verify Gadget API is accessible
   - Check if webhooks are being sent
   - Monitor Gadget logs for OAuth events

## **🔧 Debugging Steps**

### **Step 1: Enable Detailed Logging**

The OAuth routes now include detailed logging. Check your server logs for:

- OAuth callback events
- State validation
- Database updates
- Error messages

### **Step 2: Test OAuth Flow Manually**

1. **Start server**: `npm run dev`
2. **Log in**: As a business user
3. **Navigate**: To Shopify integration
4. **Enter shop**: `checkoutipick.myshopify.com`
5. **Click Connect**: Monitor the flow
6. **Check logs**: Look for OAuth events

### **Step 3: Verify Database Updates**

After OAuth completion, check if the business record was updated:

- `shopifyShop` field should contain the shop URL
- `shopifyStatus` should be 'connected'
- `shopifyConnectedAt` should have a timestamp

### **Step 4: Check Gadget Webhooks**

The system now includes webhook handling. Monitor for:

- `shopify_connection_created` events
- `shopify_connection_updated` events
- Any error messages in webhook processing

## **📋 Common Issues and Fixes**

### **Issue 1: "Failed to start OAuth flow"**

**Cause**: Authentication middleware blocking routes **Fix**: Test through
authenticated UI, not direct API calls

### **Issue 2: OAuth callback not received**

**Cause**: Incorrect callback URL configuration **Fix**: Verify callback URL in
Gadget and Shopify app settings

### **Issue 3: State parameter invalid**

**Cause**: OAuth state expired or invalid **Fix**: The system automatically
cleans up expired states

### **Issue 4: Database update failed**

**Cause**: Database connection or permission issues **Fix**: Check database
connection and business record permissions

## **✅ Expected Behavior**

### **Successful OAuth Flow**:

1. User clicks "Connect" for `checkoutipick.myshopify.com`
2. Backend logs: "Redirecting business X to Shopify OAuth"
3. User is redirected to Gadget OAuth
4. User authorizes on Shopify
5. Gadget processes OAuth and creates `shopifyShop` record
6. Backend receives callback and logs: "Shopify OAuth callback successful"
7. Business record is updated with shop information
8. User is redirected to dashboard with success message

### **Success Indicators**:

- ✅ Server logs show OAuth callback received
- ✅ Business record shows `shopifyShop: "checkoutipick.myshopify.com"`
- ✅ Business record shows `shopifyStatus: "connected"`
- ✅ Dashboard shows "Successfully connected to checkoutipick.myshopify.com"

## **🚨 Emergency Fixes**

### **If OAuth is completely broken**:

1. **Force disconnect**: Use "Force Disconnect" button
2. **Clear browser cache**: Clear cookies and cache
3. **Restart server**: Restart development server
4. **Try again**: Test OAuth flow again

### **If database is corrupted**:

1. **Check business record**: Verify business exists
2. **Reset Shopify fields**: Clear all Shopify-related fields
3. **Try again**: Test OAuth flow again

## **📞 Next Steps**

1. **Restart your development server**
2. **Test the OAuth flow** with `checkoutipick.myshopify.com`
3. **Monitor server logs** for OAuth events
4. **Check Gadget dashboard** for `shopifyShop` records
5. **Verify database updates** in business record

The OAuth implementation is correct and follows Gadget's best practices. The
issue is likely in the callback handling or token exchange process, which should
be resolved with the improved logging and error handling.

**Status: ✅ READY FOR TESTING**
