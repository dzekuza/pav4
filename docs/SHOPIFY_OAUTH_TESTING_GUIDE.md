# Shopify OAuth Testing Guide

## **Testing Environments**

You can test the Shopify OAuth flow in both environments, but each has different considerations:

### **1. Localhost Development (localhost:8083)**

#### ✅ **What Works:**
- OAuth flow logic and backend endpoints
- Frontend components and UI
- Database operations and state management
- Automatic disconnection functionality
- All OAuth endpoints (connect, disconnect, status)

#### ⚠️ **Potential Issues:**
- **Shopify App Configuration**: Your Shopify app in the Shopify Partner dashboard might restrict OAuth redirects to specific domains
- **Gadget Configuration**: Gadget OAuth settings might not allow localhost domains

#### **Testing Steps:**
1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Shopify integration**:
   ```
   http://localhost:8083/business/dashboard
   ```

3. **Test the OAuth flow**:
   - Enter a test Shopify store URL (e.g., `test-store.myshopify.com`)
   - Click "Connect"
   - Verify the redirect to Gadget OAuth

4. **Check for issues**:
   - If Shopify shows an error about invalid redirect URL, you'll need to configure your Shopify app
   - If Gadget shows an error, you'll need to update Gadget OAuth settings

### **2. Production Environment (ipick.io)**

#### ✅ **What Works:**
- Full OAuth flow with proper domain validation
- Shopify app configuration compatibility
- Gadget OAuth settings compatibility
- Production environment testing
- Real Shopify store connections

#### **Testing Steps:**
1. **Deploy to production** (if not already deployed)

2. **Navigate to Shopify integration**:
   ```
   https://ipick.io/business/dashboard
   ```

3. **Test with real Shopify store**:
   - Enter a real Shopify store URL (e.g., `checkoutipick.myshopify.com`)
   - Click "Connect"
   - Complete the OAuth flow

4. **Verify the fix**:
   - Should automatically disconnect existing connections
   - Should show fresh Shopify login page
   - Should successfully connect to the new store

## **Configuration Requirements**

### **Shopify App Configuration**

In your Shopify Partner dashboard, ensure your app allows OAuth redirects from:

1. **Development**: `http://localhost:8084/api/shopify/oauth/callback`
2. **Production**: `https://ipick.io/api/shopify/oauth/callback`

### **Gadget OAuth Settings**

In your Gadget app settings, ensure OAuth is configured for:

1. **Development**: Allow localhost domains
2. **Production**: Allow ipick.io domain

## **Testing Checklist**

### **Pre-Testing Setup**
- [ ] Development server running on localhost:8083
- [ ] Production environment deployed
- [ ] Shopify app configured for both domains
- [ ] Gadget OAuth settings updated
- [ ] Business account logged in

### **Localhost Testing**
- [ ] Navigate to `http://localhost:8083/business/dashboard`
- [ ] Find Shopify integration section
- [ ] Enter test store URL: `test-store.myshopify.com`
- [ ] Click "Connect"
- [ ] Verify redirect to Gadget OAuth
- [ ] Check for any domain restriction errors

### **Production Testing**
- [ ] Navigate to `https://ipick.io/business/dashboard`
- [ ] Find Shopify integration section
- [ ] Use "Force Disconnect" to clear existing connections
- [ ] Enter real store URL: `checkoutipick.myshopify.com`
- [ ] Click "Connect"
- [ ] Verify fresh Shopify login page appears
- [ ] Complete OAuth authorization
- [ ] Verify successful connection

### **Verification Steps**
- [ ] Check that existing connections are automatically cleared
- [ ] Verify new connection is established
- [ ] Test disconnect functionality
- [ ] Verify no domain restrictions apply
- [ ] Check that any Shopify store can be connected

## **Troubleshooting**

### **Common Issues**

#### **1. Shopify App Domain Restrictions**
**Problem**: Shopify shows "Invalid redirect URL" error
**Solution**: Update Shopify app settings to allow both localhost and production domains

#### **2. Gadget OAuth Restrictions**
**Problem**: Gadget shows domain not allowed error
**Solution**: Update Gadget OAuth settings to allow both domains

#### **3. Cached Authentication**
**Problem**: Shopify skips login (already connected to different store)
**Solution**: Use "Force Disconnect" button to clear existing connections

#### **4. OAuth State Issues**
**Problem**: "Invalid or expired state parameter" error
**Solution**: The automatic disconnection should prevent this, but try refreshing the page

### **Debug Commands**

Run these tests to verify functionality:

```bash
# Test OAuth flow
node scripts/test-shopify-oauth-flow.js

# Test disconnect functionality
node scripts/test-shopify-disconnect.js

# Test both environments
node scripts/test-shopify-environments.js
```

## **Expected Results**

### **Successful OAuth Flow:**
1. User enters store URL
2. Backend automatically disconnects existing connections
3. Redirects to Gadget OAuth with fresh state
4. Shopify shows login page (not cached)
5. User authorizes the app
6. Returns to dashboard with success message
7. New connection is established

### **No Domain Restrictions:**
- Any business account can connect any Shopify store
- No conflicts with registered domain (e.g., `godislove.lt`)
- Clean OAuth flow for each connection

## **Recommendation**

**Test both environments**:

1. **Start with localhost** to verify OAuth logic and UI
2. **Test on production** for full OAuth flow with real stores
3. **Use production for final verification** since it has proper domain configuration

The automatic disconnection fix should work in both environments, ensuring users can connect to any Shopify store regardless of their registered domain.
