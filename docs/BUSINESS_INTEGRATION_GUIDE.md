# 🏢 Business Integration Guide

## 📋 **Overview**

The Business Integration page (`/business-integrate`) provides businesses with
all the tools they need to integrate sales tracking into their websites.

## 🎯 **Page Features**

### **1. Business Information Configuration**

- **Business ID**: Your unique business identifier
- **Business Name**: Your business name for display
- **Domain**: Your website domain

### **2. Integration Options**

#### **📊 Tracking Script Tab**

- **Universal tracking script** for immediate integration
- **Enhanced Shopify tracking script** with comprehensive debugging
- **WooCommerce tracking script** for WordPress stores
- **Magento tracking script** for enterprise stores
- **Custom event tracking** for specific use cases
- **Copy to clipboard** functionality
- **Auto-generated session IDs** for tracking

#### **🔧 GTM Integration Tab**

- **Google Tag Manager** integration script
- **Combined GTM + PriceHunt** tracking
- **Customizable GTM ID** placeholder

#### **🔗 Webhooks Tab**

- **Webhook URL** generation
- **Webhook secret** management
- **Real-time notifications** setup

#### **📚 API Reference Tab**

- **Track Sale** endpoint documentation
- **Update Sale Status** endpoint
- **Get Business Stats** endpoint
- **Request/Response examples**

## 🚀 **Quick Start**

### **Step 1: Access the Page**

```
https://paaav.vercel.app/business-integrate
```

### **Step 2: Configure Business Info**

- Enter your Business ID (default: 1 for God is Love)
- Update Business Name and Domain
- All scripts will be generated with your specific business ID

### **Step 3: Choose Integration Method**

#### **Option A: Modern One-Line Integration (Recommended for Shopify stores)**

1. Go to "Scripts" tab
2. Find "Shopify" tracking script (one-line loader)
3. Copy the generated script
4. Add to your Shopify theme's `theme.liquid` file in the `<head>` section
5. The loader automatically handles all complex setup and debugging

#### **Option B: Universal Tracking Script**

1. Go to "Scripts" tab
2. Copy the Universal tracking script
3. Add to your website's `<head>` section
4. Test with a purchase

#### **Option C: GTM Integration**

1. Go to "GTM Integration" tab
2. Replace `GTM-XXXXXXX` with your actual GTM ID
3. Copy the combined script
4. Add to your website's `<head>` section

#### **Option D: Webhook Integration**

1. Go to "Webhooks" tab
2. Copy the webhook URL
3. Configure your system to send notifications
4. Set up webhook secret for security

## 📊 **Generated Scripts**

### **Modern Shopify Integration Script**

```html
<!-- PriceHunt Shopify Integration -->
<script
  src="https://paaav.vercel.app/shopify-tracker-loader.js"
  data-business-id="YOUR_BUSINESS_ID"
  data-affiliate-id="YOUR_AFFILIATE_ID"
  data-debug="true"
></script>
<!-- End PriceHunt Shopify Integration -->
```

**That's it!** The loader automatically:

- Fetches the full enhanced tracking script
- Sets up all event listeners
- Handles AJAX cart tracking
- Provides debugging functions
- Works with all Shopify themes

<script>
  // Enhanced tracking for your Shopify store
  document.addEventListener("DOMContentLoaded", function () {
    console.log("[PriceHunt] Enhanced integration loaded for your store");

    // Wait for Shopify to be ready
    function waitForShopify() {
      if (window.Shopify && window.Shopify.theme) {
        console.log(
          "[PriceHunt] Shopify theme detected:",
          window.Shopify.theme,
        );

        // Check for product data
        if (window.Shopify.theme.product) {
          console.log(
            "[PriceHunt] Product data found:",
            window.Shopify.theme.product,
          );

          // Track product view with enhanced data
          if (window.PriceHuntTracker) {
            window.PriceHuntTracker.track("product_view", {
              product_id: window.Shopify.theme.product.id,
              product_name: window.Shopify.theme.product.title,
              product_price: window.Shopify.theme.product.price,
              product_variant_id: window.Shopify.theme.product
                .selected_or_first_available_variant?.id,
              product_type: window.Shopify.theme.product.type,
              product_vendor: window.Shopify.theme.product.vendor,
            });
          }
        }

        // Enhanced add to cart tracking
        setupEnhancedCartTracking();
      } else {
        console.log("[PriceHunt] Waiting for Shopify to load...");
        setTimeout(waitForShopify, 500);
      }
    }

    function setupEnhancedCartTracking() {
      console.log("[PriceHunt] Setting up enhanced cart tracking...");

      // Track all form submissions that might be add to cart
      document.addEventListener("submit", function (e) {
        const form = e.target;
        console.log("[PriceHunt] Form submitted:", form.action, form);

        if (
          form.action.includes("/cart/add") || form.action.includes("cart")
        ) {
          console.log("[PriceHunt] Cart form detected");

          // Extract product data from form
          const formData = new FormData(form);
          const productId = formData.get("id");
          const quantity = formData.get("quantity") || 1;

          console.log("[PriceHunt] Form data:", { productId, quantity });

          if (window.PriceHuntTracker && productId) {
            window.PriceHuntTracker.track("add_to_cart", {
              product_id: productId,
              product_name: window.Shopify.theme.product?.title ||
                "Unknown Product",
              product_price: window.Shopify.theme.product?.price || "0",
              quantity: quantity,
              form_action: form.action,
            });
          }
        }
      });

      // Track button clicks more comprehensively
      document.addEventListener("click", function (e) {
        const target = e.target;
        const targetText = target.textContent?.toLowerCase() || "";

        console.log("[PriceHunt] Click detected:", target, targetText);

        // Check for various add to cart button patterns
        const isAddToCartButton =
          target.matches('[data-action*="add"], [data-action*="cart"]') ||
          target.matches(".add-to-cart, .cart-button, .buy-button") ||
          target.matches('button[type="submit"]') ||
          targetText.includes("add to cart") ||
          targetText.includes("buy now") ||
          targetText.includes("add to bag") ||
          targetText.includes("purchase") ||
          target.closest('form[action*="/cart/add"]');

        if (isAddToCartButton) {
          console.log("[PriceHunt] Add to cart button clicked:", target);

          if (window.PriceHuntTracker) {
            // Extract product data
            let productData = {
              product_id: target.getAttribute("data-product-id") ||
                target.getAttribute("data-id") ||
                target.closest("[data-product-id]")?.getAttribute(
                  "data-product-id",
                ),
              product_name: target.getAttribute("data-product-name") ||
                target.getAttribute("data-title") ||
                window.Shopify.theme.product?.title,
              product_price: target.getAttribute("data-price") ||
                window.Shopify.theme.product?.price,
              quantity: target.getAttribute("data-quantity") || 1,
            };

            console.log("[PriceHunt] Extracted product data:", productData);

            window.PriceHuntTracker.track("add_to_cart", productData);
          }
        }

        // Track product link clicks
        if (
          target.matches('a[href*="/products/"]') ||
          target.closest('a[href*="/products/"]')
        ) {
          console.log("[PriceHunt] Product link clicked:", target);

          if (window.PriceHuntTracker) {
            const link = target.href
              ? target
              : target.closest('a[href*="/products/"]');
            window.PriceHuntTracker.track("product_click", {
              product_url: link.href,
              product_name: target.textContent?.trim() || "Product Link",
            });
          }
        }
      });

      // Track AJAX cart updates if available
      if (
        window.Shopify && window.Shopify.theme && window.Shopify.theme.cart
      ) {
        console.log("[PriceHunt] Shopify cart API detected");

        // Override cart.addItem if it exists
        if (window.Shopify.theme.cart.addItem) {
          const originalAddItem = window.Shopify.theme.cart.addItem;
          window.Shopify.theme.cart.addItem = function (...args) {
            console.log("[PriceHunt] Shopify cart.addItem called:", args);

            const result = originalAddItem.apply(this, args);
            if (result && result.then) {
              result.then(function (item) {
                console.log(
                  "[PriceHunt] Cart item added successfully:",
                  item,
                );

                if (window.PriceHuntTracker) {
                  window.PriceHuntTracker.track("add_to_cart", {
                    product_id: item.product_id,
                    product_name: item.product_title,
                    product_price: item.price,
                    product_variant_id: item.variant_id,
                    quantity: item.quantity,
                  });
                }
              }).catch(function (error) {
                console.error("[PriceHunt] Cart add item error:", error);
              });
            }

            return result;
          };
        }
      }

      // Track checkout initiation
      document.addEventListener("click", function (e) {
        const target = e.target;
        const href = target.href || target.getAttribute("href") || "";

        if (
          href.includes("/checkout") ||
          href.includes("/cart") &&
            target.textContent.toLowerCase().includes("checkout")
        ) {
          console.log("[PriceHunt] Checkout initiated:", target);

          if (window.PriceHuntTracker) {
            window.PriceHuntTracker.track("checkout_start", {
              checkout_url: href,
              referrer: window.location.href,
            });
          }
        }
      });
    }

    // Start the enhanced tracking
    waitForShopify();

    // Additional debugging
    console.log("[PriceHunt] Enhanced integration setup complete");
    console.log(
      "[PriceHunt] Available tracker functions:",
      Object.keys(window.PriceHuntTracker || {}),
    );

    // Expose debug functions
    window.PriceHuntDebug = {
      getTrackerStatus: function () {
        return {
          trackerLoaded: !!window.PriceHuntTracker,
          shopifyLoaded: !!(window.Shopify && window.Shopify.theme),
          productData: window.Shopify?.theme?.product || null,
          config: window.PriceHuntTracker?.getConfig?.() || null,
        };
      },

      testEvent: function (eventType, data) {
        if (window.PriceHuntTracker) {
          window.PriceHuntTracker.track(eventType, data);
          console.log("[PriceHunt] Test event sent:", eventType, data);
          return true;
        } else {
          console.error("[PriceHunt] Tracker not available");
          return false;
        }
      },

      getEventsSent: function () {
        return window.PriceHuntTracker?.getEventsSent?.() || [];
      },
    };
  });
</script>
<!-- End PriceHunt Enhanced Shopify Integration -->

````
### **Universal Tracking Script**

```html
<!-- PriceHunt Sales Tracking Script -->
<script src="https://paaav.vercel.app/tracker.js"></script>
<script>
  // Generate a unique session ID automatically
  const sessionId = "session_" + Date.now() + "_" +
    Math.random().toString(36).substr(2, 9);

  window.trackerInit({
    storeId: 1, // God is Love business ID
    userSessionId: sessionId, // Auto-generated session ID
    productId: window.location.pathname, // Use current page path as product ID
    debug: false, // Set to true for testing, false for production
  });
</script>
````

### **GTM Integration Script**

```html
<!-- Google Tag Manager -->
<script>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-XXXXXXX"); // Replace with your GTM ID
</script>
<!-- End Google Tag Manager -->

<!-- PriceHunt Sales Tracking Script -->
<script src="https://paaav.vercel.app/tracker.js"></script>
<script>
  const sessionId = "session_" + Date.now() + "_" +
    Math.random().toString(36).substr(2, 9);

  window.trackerInit({
    storeId: 1,
    userSessionId: sessionId,
    productId: window.location.pathname,
    debug: false,
  });
</script>
```

## 🔧 **API Endpoints**

### **Track Sale**

```bash
POST /api/sales/track
Content-Type: application/json

{
  "orderId": "ORDER-123",
  "businessId": 1,
  "productUrl": "https://yourstore.com/product",
  "productTitle": "Product Name",
  "productPrice": 99.99,
  "retailer": "yourstore.com"
}
```

### **Update Sale Status**

```bash
PUT /api/sales/status/{orderId}
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

### **Get Business Stats**

```bash
GET /api/sales/stats/business/{businessId}
```

## 🧪 **Testing Integration**

### **1. Test Enhanced Shopify Tracking**

1. **Add the script to your Shopify theme.liquid**
2. **Open browser console** (F12 → Console tab)
3. **Check for initialization logs**:
   ```
   [PriceHunt] Enhanced integration loaded for your store
   [PriceHunt] Shopify theme detected: {...}
   [PriceHunt] Enhanced integration setup complete
   ```
4. **Test add to cart** and look for:
   ```
   [PriceHunt] Add to cart button clicked: <button>
   [PriceHunt] Extracted product data: {...}
   [PriceHunt] Event sent successfully: add_to_cart
   ```
5. **Use debug functions** in console:
   ```javascript
   // Check tracker status
   PriceHuntDebug.getTrackerStatus();

   // Test manual event
   PriceHuntDebug.testEvent("add_to_cart", {
     product_id: "test-123",
     product_name: "Test Product",
     product_price: "29.99",
   });

   // See all events sent
   PriceHuntDebug.getEventsSent();
   ```

### **2. Test Sale Tracking**

```bash
curl -X POST https://paaav.vercel.app/api/sales/track \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-ORDER-123",
    "businessId": 1,
    "productUrl": "https://godislove.lt/products/t-shirt-grey",
    "productTitle": "T-SHIRT | REGULAR FIT | WASHED IN GREY",
    "productPrice": 59.00,
    "retailer": "godislove.lt"
  }'
```

### **3. Check Database**

```sql
SELECT id, "orderId", "businessId", "productTitle", 
       "productPrice", "retailer", status, "commissionAmount" 
FROM sales 
ORDER BY id DESC LIMIT 5;
```

### **4. Verify in Dashboard**

- Visit `/business-dashboard` to see tracked sales
- Check commission calculations
- Monitor webhook notifications

## 🎨 **UI Features**

### **Copy to Clipboard**

- One-click copying of scripts
- Visual feedback with checkmark icon
- Timeout after 2 seconds

### **Download Scripts**

- Download scripts as `.js` files
- Useful for offline integration
- Proper MIME type handling

### **Responsive Design**

- Works on mobile and desktop
- Tabbed interface for organization
- Clean, professional design

## 🔒 **Security Features**

### **Webhook Security**

- HMAC-SHA256 signatures
- Secret key management
- Retry logic with exponential backoff

### **Session Management**

- Auto-generated session IDs
- Unique identifiers per visit
- No sensitive data exposure

## 📈 **Analytics Integration**

### **GTM Events**

- `affiliate_click` - View Deal clicks
- `sale_tracked` - Buy Now sales
- `purchase` - Conversion tracking

### **Custom Parameters**

- Business ID tracking
- Product information
- Session attribution
- UTM parameters

## 🐛 **Debugging Enhanced Shopify Tracker**

### **Console Logs**

The enhanced tracker provides detailed console logs for debugging:

- **Initialization**: Shows when the tracker loads and detects Shopify
- **Product Detection**: Logs when product data is found
- **Event Tracking**: Shows each click, form submission, and cart update
- **Data Extraction**: Displays extracted product information
- **API Calls**: Logs successful and failed API requests

### **Debug Functions**

Use these functions in the browser console:

```javascript
// Check if tracker is working
PriceHuntDebug.getTrackerStatus();

// Manually test an event
PriceHuntDebug.testEvent("add_to_cart", {
  product_id: "test-123",
  product_name: "Test Product",
  product_price: "29.99",
});

// See all events sent in this session
PriceHuntDebug.getEventsSent();
```

### **Common Issues**

1. **No console logs**: Check if script is loaded in theme.liquid
2. **Shopify not detected**: Wait for page to fully load
3. **Events not sending**: Check network tab for API errors
4. **Wrong product data**: Verify Shopify.theme.product exists

## 🚀 **Next Steps**

1. **Deploy to Production**
   - Update affiliate configuration
   - Configure real GTM IDs
   - Set up production webhooks

2. **Business Dashboard**
   - Monitor sales analytics
   - Track commission payments
   - View performance metrics

3. **Advanced Features**
   - A/B testing for scripts
   - Dynamic commission rates
   - Real-time notifications

## ✅ **Current Status**

- ✅ Business Integration page created
- ✅ Enhanced Shopify tracker with debugging
- ✅ Route properly configured
- ✅ Script generation working
- ✅ Copy/Download functionality
- ✅ API documentation included
- ✅ Testing framework ready
- ✅ Security features implemented
- ✅ Debug functions available

The Business Integration page is now fully functional with enhanced Shopify
tracking and comprehensive debugging capabilities!

## 📞 **Support**

If you encounter issues with the enhanced Shopify tracker:

1. **Check browser console** for detailed error messages
2. **Use debug functions** to test the tracker
3. **Verify script placement** in theme.liquid
4. **Test on a product page** to ensure Shopify data is available

The enhanced tracker provides much better visibility into what's happening and
should resolve most integration issues.
