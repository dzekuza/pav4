# 🎯 Enhanced Button Tracking Guide

## 📋 **Overview**

The enhanced button tracking system now provides two distinct tracking modes for product suggestions:

1. **"View Deal" Button** - Standard affiliate tracking
2. **"Buy Now" Button** - Enhanced tracking with direct sales attribution

## 🔧 **Implementation Details**

### **Updated ProductCard Component**

The `ProductCard` component now supports:

```typescript
interface ProductCardProps {
  product: {
    title: string;
    price: string;
    url: string;
    image?: string;
    retailer?: string;
    savings?: string;
    isLocal?: boolean;
    distance?: string;
    businessId?: number; // NEW: For sales tracking
  };
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
  showBuyNow?: boolean; // NEW: Enable Buy Now button
}
```

### **Button Behavior**

#### **View Deal Button**
- Generates affiliate link with UTM parameters
- Tracks affiliate click
- Opens product page in new tab
- Standard affiliate tracking

#### **Buy Now Button**
- Generates affiliate link with UTM parameters
- Tracks affiliate click with purchase intent
- **NEW**: Tracks sale in our sales tracking system
- Opens product page in new tab
- Enhanced tracking for direct purchases

## 🚀 **Usage Examples**

### **Basic Implementation (View Deal Only)**
```tsx
<ProductCard 
  product={{
    title: "iPhone 15 Pro",
    price: "$999.99",
    url: "https://amazon.com/iphone-15-pro",
    retailer: "Amazon",
    businessId: 1 // Optional: for sales tracking
  }}
/>
```

### **Enhanced Implementation (View + Buy Now)**
```tsx
<ProductCard 
  product={{
    title: "T-SHIRT | REGULAR FIT | WASHED IN GREY",
    price: "€59.00",
    url: "https://godislove.lt/products/t-shirt-grey",
    retailer: "godislove.lt",
    businessId: 1 // Required for sales tracking
  }}
  showBuyNow={true} // Enable Buy Now button
/>
```

## 📊 **Tracking Data Captured**

### **View Deal Tracking**
- Product URL and title
- Retailer information
- Session ID
- UTM parameters
- Referrer information
- GTM events

### **Buy Now Tracking (Enhanced)**
- All View Deal data PLUS:
- **Order ID** (auto-generated)
- **Business ID** (for commission tracking)
- **Sale status** (PENDING → CONFIRMED)
- **Commission calculation**
- **Webhook triggers** (if configured)

## 🎯 **Integration with Sales System**

### **Database Tables Used**
- `sales` - Main sales tracking
- `commissions` - Commission calculations
- `webhooks` - External notifications
- `commission_rates` - Business commission rates

### **API Endpoints**
- `POST /api/sales/track` - Track new sales
- `PUT /api/sales/status/:orderId` - Update sale status
- `GET /api/sales/stats/business/:businessId` - Business analytics

## 🔄 **Workflow**

### **1. User Clicks "Buy Now"**
```typescript
// 1. Generate affiliate link
const affiliateUrl = generateAffiliateLink(product.url, retailer);

// 2. Track affiliate click
trackAffiliateClick({...});

// 3. Track sale in our system
const saleTracked = await trackSale({
  orderId: `ORDER_${Date.now()}_${randomId}`,
  businessId: product.businessId,
  productUrl: product.url,
  productTitle: product.title,
  productPrice: product.price,
  retailer: product.retailer,
  // ... other tracking data
});

// 4. Open affiliate link
window.open(affiliateUrl, '_blank');
```

### **2. Sale Processing**
- Sale recorded as `PENDING` status
- Commission calculated based on business rates
- Webhooks triggered (if configured)
- GTM events fired

### **3. Sale Confirmation**
- External system confirms purchase
- Sale status updated to `CONFIRMED`
- Commission marked for payment
- Final webhooks sent

## 🧪 **Testing**

### **Test Sale Tracking**
```bash
curl -X POST https://pavlo4.netlify.app/api/sales/track \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-ORDER-123",
    "businessId": 1,
    "productUrl": "https://godislove.lt/products/t-shirt-grey",
    "productTitle": "T-SHIRT | REGULAR FIT | WASHED IN GREY",
    "productPrice": 59.00,
    "retailer": "godislove.lt",
    "sessionId": "test-session-123",
    "utmSource": "pricehunt",
    "utmMedium": "buy_now",
    "utmCampaign": "test-campaign"
  }'
```

### **Check Database**
```sql
SELECT id, "orderId", "businessId", "productTitle", 
       "productPrice", "retailer", status, "commissionAmount" 
FROM sales 
ORDER BY id DESC LIMIT 5;
```

## 🎨 **UI Customization**

### **Button Styling**
- **View Deal**: Standard button with outline variant
- **Buy Now**: Green button with shopping cart icon
- **Responsive**: Works on mobile and desktop

### **Icons Used**
- `ExternalLink` - View Deal button
- `ShoppingCart` - Buy Now button
- `Star` - Favorite button

## 🔒 **Security Features**

### **Error Handling**
- Graceful fallback if tracking fails
- Console logging for debugging
- No blocking of user experience

### **Data Validation**
- Business ID required for sales tracking
- Price parsing with error handling
- Session ID generation if missing

## 📈 **Analytics Integration**

### **GTM Events**
- `affiliate_click` - View Deal clicks
- `sale_tracked` - Buy Now sales
- `purchase` - Conversion tracking

### **Custom Parameters**
- Business ID
- Product information
- Session tracking
- UTM attribution

## 🚀 **Next Steps**

1. **Deploy to Production**
   - Update affiliate configuration with real IDs
   - Configure webhook endpoints
   - Set up commission rates

2. **Business Dashboard Integration**
   - Add sales analytics
   - Commission tracking
   - Revenue reporting

3. **Advanced Features**
   - A/B testing for button placement
   - Dynamic commission rates
   - Real-time notifications

## ✅ **Current Status**

- ✅ Enhanced ProductCard component
- ✅ Sales tracking integration
- ✅ GTM event tracking
- ✅ Database schema ready
- ✅ API endpoints working
- ✅ Error handling implemented
- ✅ Testing framework in place

The enhanced button tracking system is now ready for production use! 