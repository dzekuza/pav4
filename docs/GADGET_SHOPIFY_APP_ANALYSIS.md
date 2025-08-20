# Gadget Shopify App Analysis

## **🔍 Current App Structure**

### **1. App Configuration**
- **Development App**: `itrcks-development` (client_id: `5cbc642d54a23089dc146a0a60904c1e`)
- **Production App**: `itrcks` (client_id: `58b025fff34dbe266ed5be6cccf85487`)
- **Application URL**: `https://itrcks--development.gadget.app/api/shopify/install-or-render`
- **Callback URL**: `https://itrcks--development.gadget.app/api/connections/auth/shopify/callback`

### **2. Database Schema**
The Gadget app has comprehensive Shopify models:

#### **shopifyShop Model** (Main OAuth Model)
- **Storage Key**: `DataModel-Shopify-Shop`
- **Fields**: 70+ Shopify fields including:
  - `domain`, `myshopifyDomain`, `name`, `email`
  - `shopifyCreatedAt`, `shopifyUpdatedAt`
  - `state` (installation state)
  - All standard Shopify shop fields

#### **Other Shopify Models**
- `shopifyOrder` - Order data
- `shopifyProduct` - Product data  
- `shopifyCustomer` - Customer data
- `shopifyCheckout` - Checkout data
- `shopifyGdprRequest` - GDPR requests
- `shopifySync` - Sync status

### **3. OAuth Configuration**
```typescript
// settings.gadget.ts
shopify: {
  apiVersion: "2025-07",
  enabledModels: [
    "shopifyCheckout",
    "shopifyCustomer", 
    "shopifyOrder",
    "shopifyProduct",
  ],
  type: "partner",
  scopes: [
    "read_customer_events",
    "read_customers",
    "read_products", 
    "write_app_proxy",
    "write_checkouts",
    "write_orders",
    "write_pixels",
  ],
  customerAuthenticationEnabled: false,
}
```

## **🚨 Issues Identified**

### **1. Missing Callback Route**
- **Problem**: The OAuth flow expects a callback at `/api/auth/shopify/callback` but it's not implemented
- **Impact**: OAuth flow cannot complete
- **Solution**: Need to implement the callback route

### **2. OAuth Flow Mismatch**
- **Problem**: Our backend is trying to handle OAuth, but Gadget should handle it
- **Impact**: Conflicting OAuth implementations
- **Solution**: Use Gadget's managed OAuth flow

### **3. Database Schema Mismatch**
- **Problem**: Our backend expects different fields than Gadget provides
- **Impact**: Data synchronization issues
- **Solution**: Align with Gadget's schema

## **✅ Correct OAuth Flow**

### **Gadget Managed OAuth Flow**
1. **Initiate**: `POST /api/auth/shopify/initiate` (already implemented)
2. **Install**: `GET /api/shopify/install` (already implemented)
3. **Callback**: `GET /api/auth/shopify/callback` (❌ MISSING)
4. **Webhooks**: Handle Shopify events (❌ MISSING)

### **Expected Flow**
```
User → Backend → Gadget Initiate → Gadget Install → Shopify OAuth → Gadget Callback → Success
```

## **🔧 Required Fixes**

### **1. Implement Callback Route**
Create `itrcks/api/routes/api/auth/shopify/GET-callback.ts`:

```typescript
import { RouteHandler } from "gadget-server";

const route: RouteHandler = async ({ request, reply, api, logger }) => {
  try {
    const { code, state, shop, hmac } = request.query;
    
    // Validate parameters
    if (!code || !shop) {
      await reply.code(400).send({ error: 'Missing required parameters' });
      return;
    }

    // Gadget handles the token exchange automatically
    // We just need to redirect to success page
    const successUrl = `https://ipick.io/business/dashboard?shopify_connected=true&shop=${shop}`;
    
    await reply.redirect(302, successUrl);
    
  } catch (error) {
    logger.error({ error }, 'OAuth callback error');
    const errorUrl = `https://ipick.io/business/dashboard?shopify_error=true`;
    await reply.redirect(302, errorUrl);
  }
};

export default route;
```

### **2. Update Backend OAuth Flow**
Modify our backend to use Gadget's OAuth:

```typescript
// Instead of direct Shopify OAuth, use Gadget's initiate endpoint
const response = await fetch('https://itrcks--development.gadget.app/api/auth/shopify/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ shop: shopDomain })
});

const { installUrl } = await response.json();
window.location.href = installUrl;
```

### **3. Database Integration**
Use Gadget's API to access Shopify data:

```typescript
// Query Shopify shops from Gadget
const shops = await gadgetClient.shopifyShop.findMany({
  select: {
    id: true,
    domain: true,
    name: true,
    email: true,
    state: true
  }
});
```

## **📋 Implementation Plan**

### **Phase 1: Fix OAuth Flow**
1. ✅ Analyze current Gadget app structure
2. 🔧 Implement missing callback route
3. 🔧 Update backend to use Gadget OAuth
4. 🔧 Test OAuth flow end-to-end

### **Phase 2: Database Integration**
1. 🔧 Update backend to use Gadget API
2. 🔧 Sync business records with Gadget shops
3. 🔧 Implement webhook handlers
4. 🔧 Test data synchronization

### **Phase 3: Production Deployment**
1. 🔧 Deploy Gadget app to production
2. 🔧 Update environment variables
3. 🔧 Test production OAuth flow
4. 🔧 Monitor webhooks and data sync

## **🎯 Key Insights**

### **1. Gadget Handles OAuth**
- Gadget manages the entire OAuth flow
- No need for manual token exchange
- Automatic shop creation in Gadget database

### **2. Database Schema**
- `shopifyShop` model contains all shop data
- `state` field tracks installation status
- Automatic sync with Shopify

### **3. Webhook Integration**
- Gadget handles Shopify webhooks automatically
- Events are stored in respective models
- Real-time data synchronization

## **🚀 Next Steps**

1. **Implement callback route** in Gadget app
2. **Update backend OAuth flow** to use Gadget
3. **Test OAuth flow** end-to-end
4. **Deploy to production** when ready

**Status: 🔧 READY FOR IMPLEMENTATION**
