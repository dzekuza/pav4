# OAuth Error Troubleshooting Guide

## **Current Error: "Failed to start OAuth flow"**

This error occurs when the Shopify OAuth flow cannot be initiated properly. Let's fix this step by step.

## **🔍 Root Cause Analysis**

The error "Failed to start OAuth flow" typically occurs due to:

1. **Server not running** - Development server not started
2. **Environment variables not loaded** - .env file not properly configured
3. **Authentication issues** - Business authentication failing
4. **Database connection issues** - Cannot validate business
5. **OAuth configuration problems** - Missing or invalid OAuth settings

## **🚀 Step-by-Step Solution**

### **Step 1: Start the Development Server**

```bash
# Start the development server
npm run dev
```

**Expected Output:**
```
VITE v5.4.19  ready in 1234 ms

  ➜  Local:   http://localhost:8083/
  ➜  Network: http://[::1]:8083/
  ➜  Network: http://192.168.1.100:8083/
```

### **Step 2: Test Server Health**

```bash
# Test if server is running
node scripts/test-oauth-simple.js
```

**Expected Output:**
```
🔍 Simple OAuth Test

1. Testing Simple OAuth Endpoint...
   Status: 200
   ✅ Simple test endpoint working
   Environment: { nodeEnv: 'development', gadgetApiUrl: 'Set', ... }

2. Testing Server Health...
   Status: 200
   ✅ Server is running
```

### **Step 3: Verify Environment Variables**

Check that your `.env` file contains:

```bash
# Required for Shopify OAuth
GADGET_API_URL="https://itrcks--development.gadget.app"
SHOPIFY_INSTALL_URL="https://itrcks--development.gadget.app/api/shopify/install"
SHOPIFY_CALLBACK_URL="https://itrcks--development.gadget.app/api/connections/auth/shopify/callback"
GADGET_API_KEY="gsk-wXJiwmtZkpHt9tHrfFHEYerLkK3B44Wn"
IPICK_WEBHOOK_SECRET="npg_lLWeCGKpqh2413ygrbrsbr"
```

### **Step 4: Test OAuth Flow**

1. **Start server**: `npm run dev`
2. **Open browser**: Go to `http://localhost:8083`
3. **Log in**: As a business user
4. **Navigate**: To Shopify integration
5. **Enter shop**: `checkoutipick.myshopify.com`
6. **Click Connect**: Monitor server logs

### **Step 5: Monitor Server Logs**

Look for these log messages:

```bash
# Success flow:
Shopify OAuth connect request received: { query: { shop: 'checkoutipick.myshopify.com' }, businessId: 2 }
Validating business exists: 2
Business found: { id: 2, name: 'God is love, MB' }
Disconnecting existing Shopify connection for business 2 before connecting to checkoutipick.myshopify.com
Successfully disconnected existing Shopify connection for business 2
OAuth state generated: { state: 'abc12345...', businessId: 2, timestamp: '2024-01-01T12:00:00.000Z' }
Validating OAuth configuration...
Generated install URL: https://itrcks--development.gadget.app/api/shopify/install?shop=checkoutipick.myshopify.com&state=abc12345...
Redirecting business 2 to Shopify OAuth for shop: checkoutipick.myshopify.com

# Error flow:
Shopify OAuth connect error: [Error details]
Error stack: [Stack trace]
```

## **🔧 Common Issues and Fixes**

### **Issue 1: Server Not Running**
**Symptoms**: `fetch failed` error in test script
**Solution**: 
```bash
npm run dev
```

### **Issue 2: Environment Variables Not Loaded**
**Symptoms**: "OAuth configuration error" in logs
**Solution**: 
1. Check `.env` file exists in root directory
2. Restart server after creating `.env`
3. Verify variables are set correctly

### **Issue 3: Business Authentication Failing**
**Symptoms**: "Business authentication required" error
**Solution**:
1. Log in as business user first
2. Check business account exists in database
3. Verify JWT token is valid

### **Issue 4: Database Connection Issues**
**Symptoms**: "Business not found" error
**Solution**:
1. Check database connection
2. Verify business record exists
3. Check Prisma configuration

### **Issue 5: OAuth Configuration Problems**
**Symptoms**: "SHOPIFY_INSTALL_URL not configured" error
**Solution**:
1. Verify all OAuth environment variables are set
2. Check Gadget app configuration
3. Ensure URLs are correct

## **📋 Testing Checklist**

### **Pre-Test Setup**
- [ ] Development server running (`npm run dev`)
- [ ] `.env` file exists with OAuth variables
- [ ] Database connection working
- [ ] Business user logged in

### **Test Steps**
- [ ] Test simple endpoint: `node scripts/test-oauth-simple.js`
- [ ] Navigate to Shopify integration in UI
- [ ] Enter shop URL: `checkoutipick.myshopify.com`
- [ ] Click Connect button
- [ ] Monitor server logs for OAuth events

### **Success Indicators**
- [ ] Server logs show "Shopify OAuth connect request received"
- [ ] Business validation successful
- [ ] OAuth state generated
- [ ] Redirect to Gadget OAuth URL
- [ ] No error messages in logs

## **🚨 Emergency Fixes**

### **If Nothing Works**:
1. **Restart everything**:
   ```bash
   # Stop server (Ctrl+C)
   # Clear cache
   rm -rf node_modules/.cache
   # Reinstall dependencies
   npm install
   # Start server
   npm run dev
   ```

2. **Reset environment**:
   ```bash
   # Create fresh .env file
   node scripts/setup-env.js
   # Restart server
   npm run dev
   ```

3. **Check database**:
   ```bash
   # Verify database connection
   npx prisma db push
   # Check business records
   npx prisma studio
   ```

## **📞 Next Steps**

1. **Start server**: `npm run dev`
2. **Run test**: `node scripts/test-oauth-simple.js`
3. **Test OAuth flow** through the UI
4. **Monitor logs** for detailed error messages
5. **Follow troubleshooting steps** based on specific errors

## **✅ Expected Success Flow**

1. ✅ Server starts on port 8083
2. ✅ Simple test endpoint returns 200
3. ✅ Business user logs in successfully
4. ✅ Shopify integration page loads
5. ✅ Enter shop URL and click Connect
6. ✅ Server logs show OAuth initiation
7. ✅ Redirect to Gadget OAuth URL
8. ✅ OAuth flow completes successfully

**Status: 🔧 READY FOR TESTING**
