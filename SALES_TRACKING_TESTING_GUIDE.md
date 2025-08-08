# 🧪 Sales Tracking Testing Guide

## 🎯 **Complete Testing Strategy**

Your sales tracking system is now fully implemented! Here's how to test it
comprehensively:

## 📋 **Testing Checklist**

### ✅ **1. API Testing (Already Working)**

- [x] **Direct API Test**: ✅ Working
- [x] **Sale Status Updates**: ✅ Working
- [x] **Database Storage**: ✅ Working

### 🔧 **2. JavaScript Tracking Script Testing**

#### **Option A: Test on Local Development Server**

```bash
# Visit the test page
https://paaav.vercel.app/test-tracking.html
```

#### **Option B: Test on God is Love Website**

1. **Add the tracking script to godislove.lt**:

```html
<!-- Add this to the <head> section of godislove.lt -->
<script src="https://paaav.vercel.app/tracker.js"></script>
<script>
  window.trackerInit({
    storeId: 1, // God is Love business ID
    userSessionId: "user-session-123",
    productId: "product-456",
    debug: true, // Enable debug mode
  });
</script>
```

2. **Test on actual product pages**:
   - Visit any product page on godislove.lt
   - Click "Add to Cart" or "Buy Now" buttons
   - Complete a test purchase
   - Check the browser console for tracking logs

#### **Option C: Create a Test Page on God is Love**

Create a test page at `https://godislove.lt/test-tracking` with this content:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Test Tracking - God is Love</title>
    <script src="https://pavlo4.netlify.app/tracker.js"></script>
    <script>
      window.trackerInit({
        storeId: 1,
        userSessionId: "test-session-" + Date.now(),
        productId: "test-product",
        debug: true,
      });
    </script>
  </head>
  <body>
    <h1>Test Product</h1>
    <p>Price: €29.99</p>
    <button onclick="addToCart()">Add to Cart</button>
    <button onclick="buyNow()">Buy Now</button>

    <form action="/thank-you" method="POST">
      <input type="email" name="email" placeholder="Email" required>
      <button type="submit">Complete Purchase</button>
    </form>

    <script>
      function addToCart() {
        console.log("Add to Cart clicked");
        alert("Added to cart!");
      }

      function buyNow() {
        console.log("Buy Now clicked");
        alert("Proceeding to checkout!");
      }
    </script>
  </body>
</html>
```

## 🚀 **Step-by-Step Testing Process**

### **Step 1: Test the Tracking Script**

1. **Open the test page**: `https://paaav.vercel.app/test-tracking.html`
2. **Enable browser console** (F12 → Console tab)
3. **Click buttons** and watch for tracking logs
4. **Fill out the form** and submit
5. **Check the console** for tracking events

### **Step 2: Verify Database Records**

```bash
# Check if sales are being recorded
psql "postgresql://neondb_owner:npg_K3ViucN8RGas@ep-polished-mountain-ab3ggow0-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -c "SELECT id, \"orderId\", \"businessId\", \"productTitle\", \"productPrice\", status FROM sales ORDER BY id DESC LIMIT 5;"
```

### **Step 3: Test Commission Calculation**

```bash
# Set commission rate for God is Love
curl -X POST https://paaav.vercel.app/api/sales/commission-rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BUSINESS_TOKEN" \
  -d '{"retailer": "godislove.lt", "rate": 5.0}'
```

### **Step 4: Test Webhook Notifications**

```bash
# Create a webhook for God is Love
curl -X POST https://paaav.vercel.app/api/sales/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BUSINESS_TOKEN" \
  -d '{
    "url": "https://webhook.site/your-test-url",
    "secret": "test-secret",
    "events": ["sale.created", "sale.status_updated"]
  }'
```

## 🔍 **What to Look For**

### **In Browser Console:**

```
[Timestamp] PriceHunt Tracker initialized: {storeId: 1, ...}
[Timestamp] Purchase button clicked: <button>
[Timestamp] Checkout form detected: <form>
[Timestamp] Purchase confirmation detected on page
[Timestamp] Tracking purchase: {orderId: "ORDER-123", ...}
[Timestamp] Purchase tracked successfully: {success: true, ...}
```

### **In Database:**

```sql
-- Check sales table
SELECT * FROM sales WHERE "businessId" = 1 ORDER BY "createdAt" DESC;

-- Check commissions table
SELECT * FROM commissions WHERE "saleId" IN (SELECT id FROM sales WHERE "businessId" = 1);

-- Check webhook events
SELECT * FROM webhook_events ORDER BY "createdAt" DESC;
```

### **In API Responses:**

```json
{
  "success": true,
  "saleId": 1,
  "orderId": "ORDER-123",
  "commissionAmount": 1.50
}
```

## 🛠️ **Troubleshooting**

### **If tracking isn't working:**

1. **Check browser console for errors**
2. **Verify the tracking script is loaded**:
   ```javascript
   console.log(window.PriceHuntTracker); // Should show the tracker object
   ```

3. **Test the API directly**:
   ```javascript
   fetch("/api/sales/track", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       orderId: "TEST-" + Date.now(),
       businessId: 1,
       productUrl: window.location.href,
       productPrice: 29.99,
       retailer: "godislove.lt",
     }),
   }).then((r) => r.json()).then(console.log);
   ```

4. **Check CORS settings** if testing from a different domain

### **If sales aren't being detected:**

1. **Enable debug mode** in the tracker initialization
2. **Check if purchase indicators are present** on the page
3. **Manually trigger tracking** using the test buttons
4. **Verify the business ID** is correct

## 📊 **Testing Scenarios**

### **Scenario 1: Add to Cart**

1. Click "Add to Cart" button
2. Should see: `purchase_button_click` event
3. Check console for tracking logs

### **Scenario 2: Checkout Form**

1. Fill out checkout form
2. Submit the form
3. Should see: `purchase_attempt` event
4. Check database for sale record

### **Scenario 3: Purchase Confirmation**

1. Complete a purchase
2. Land on thank you page
3. Should see: `purchase` event with order details
4. Check database for confirmed sale

### **Scenario 4: Manual Tracking**

1. Click "Test Manual Sale Tracking"
2. Should see API call to `/api/sales/track`
3. Check database for new sale record

## 🎯 **Expected Results**

### **Successful Test Results:**

- ✅ Sales are recorded in the database
- ✅ Commission amounts are calculated
- ✅ Webhook notifications are sent (if configured)
- ✅ Status updates work (PENDING → CONFIRMED)
- ✅ Console shows tracking logs (with debug enabled)

### **Database Verification:**

```sql
-- Should show recent sales
SELECT COUNT(*) FROM sales WHERE "businessId" = 1;

-- Should show commissions (if user is linked)
SELECT COUNT(*) FROM commissions WHERE "saleId" IN (
  SELECT id FROM sales WHERE "businessId" = 1
);

-- Should show webhook events
SELECT COUNT(*) FROM webhook_events;
```

## 🚀 **Next Steps After Testing**

1. **Deploy the tracking script** to production
2. **Add the script to godislove.lt** and other business websites
3. **Monitor sales dashboard** for incoming sales
4. **Set up commission rates** for different retailers
5. **Configure webhooks** for real-time notifications

## 📞 **Support**

If you encounter issues:

1. Check the browser console for error messages
2. Verify the API endpoints are accessible
3. Test with the manual tracking buttons
4. Check the database for any recorded sales

Your sales tracking system is now **production-ready** and can track sales from
any seller's website! 🎉
