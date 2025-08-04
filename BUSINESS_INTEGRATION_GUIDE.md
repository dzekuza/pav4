# 🏢 Business Integration Guide

## 📋 **Overview**

The Business Integration page (`/business-integrate`) provides businesses with all the tools they need to integrate sales tracking into their websites.

## 🎯 **Page Features**

### **1. Business Information Configuration**
- **Business ID**: Your unique business identifier
- **Business Name**: Your business name for display
- **Domain**: Your website domain

### **2. Integration Options**

#### **📊 Tracking Script Tab**
- **Basic tracking script** for immediate integration
- **Copy to clipboard** functionality
- **Download script** as a file
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
http://localhost:8083/business-integrate
```

### **Step 2: Configure Business Info**
- Enter your Business ID (default: 1 for God is Love)
- Update Business Name and Domain
- All scripts will be generated with your specific business ID

### **Step 3: Choose Integration Method**

#### **Option A: Basic Tracking Script**
1. Go to "Tracking Script" tab
2. Copy the generated script
3. Add to your website's `<head>` section
4. Test with a purchase

#### **Option B: GTM Integration**
1. Go to "GTM Integration" tab
2. Replace `GTM-XXXXXXX` with your actual GTM ID
3. Copy the combined script
4. Add to your website's `<head>` section

#### **Option C: Webhook Integration**
1. Go to "Webhooks" tab
2. Copy the webhook URL
3. Configure your system to send notifications
4. Set up webhook secret for security

## 📊 **Generated Scripts**

### **Basic Tracking Script**
```html
<!-- PriceHunt Sales Tracking Script -->
<script src="https://pavlo4.netlify.app/tracker.js"></script>
<script>
// Generate a unique session ID automatically
const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

window.trackerInit({
    storeId: 1, // God is Love business ID
    userSessionId: sessionId, // Auto-generated session ID
    productId: window.location.pathname, // Use current page path as product ID
    debug: false // Set to true for testing, false for production
});
</script>
```

### **GTM Integration Script**
```html
<!-- Google Tag Manager -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX'); // Replace with your GTM ID
</script>
<!-- End Google Tag Manager -->

<!-- PriceHunt Sales Tracking Script -->
<script src="https://pavlo4.netlify.app/tracker.js"></script>
<script>
const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

window.trackerInit({
    storeId: 1,
    userSessionId: sessionId,
    productId: window.location.pathname,
    debug: false
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

### **1. Test Sale Tracking**
```bash
curl -X POST http://localhost:8083/api/sales/track \
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

### **2. Check Database**
```sql
SELECT id, "orderId", "businessId", "productTitle", 
       "productPrice", "retailer", status, "commissionAmount" 
FROM sales 
ORDER BY id DESC LIMIT 5;
```

### **3. Verify in Dashboard**
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
- ✅ Route properly configured
- ✅ Script generation working
- ✅ Copy/Download functionality
- ✅ API documentation included
- ✅ Testing framework ready
- ✅ Security features implemented

The Business Integration page is now fully functional and ready for businesses to integrate sales tracking! 