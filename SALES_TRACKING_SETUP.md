# Complete Sales Tracking System

## 🎯 Overview

Your price comparison app now has a **complete sales tracking system** that can
track all sales customers make on sellers' websites coming from your app. This
includes commission calculation, webhook notifications, and comprehensive
analytics.

## 🔧 What Was Missing & Now Implemented

### **Previously Missing:**

1. ❌ **Post-Purchase Tracking** - No way to track actual purchases
2. ❌ **Commission Calculation** - No automatic commission tracking
3. ❌ **Webhook System** - No seller notifications
4. ❌ **Order ID Tracking** - No way to link sales to orders
5. ❌ **Revenue Attribution** - No campaign/user attribution
6. ❌ **Real-time Notifications** - No sale completion alerts

### **Now Implemented:**

1. ✅ **Complete Sales Tracking** - Track every sale with order IDs
2. ✅ **Automatic Commission Calculation** - Based on business/retailer rates
3. ✅ **Webhook System** - Real-time notifications to sellers
4. ✅ **Order Status Management** - PENDING → CONFIRMED → PAID
5. ✅ **Revenue Attribution** - Link sales to users, campaigns, UTM parameters
6. ✅ **Comprehensive Analytics** - Business and user commission stats

## 🗄️ Database Schema

### **New Tables Added:**

#### **`sales`** - Main sales tracking

- `orderId` - Unique order identifier
- `businessId` - Which business the sale belongs to
- `userId` - Which user made the sale (optional)
- `productUrl` - The product URL
- `productPrice` - Sale amount
- `retailer` - Which retailer (Amazon, Walmart, etc.)
- `status` - PENDING, CONFIRMED, CANCELLED, REFUNDED
- `commissionAmount` - Calculated commission
- `commissionRate` - Commission percentage used
- `commissionPaid` - Whether commission was paid
- UTM parameters for attribution

#### **`commissions`** - Commission tracking

- Links sales to users who earn commissions
- Tracks commission status (PENDING, APPROVED, PAID, CANCELLED)
- Records payment dates

#### **`commission_rates`** - Business commission rates

- Per-business, per-retailer commission rates
- Allows different rates for different retailers

#### **`webhooks`** - Webhook configuration

- Business webhook URLs and secrets
- Event types to listen for
- Active/inactive status

#### **`webhook_events`** - Webhook delivery tracking

- Records all webhook attempts
- Retry logic with exponential backoff
- Success/failure tracking

## 🚀 API Endpoints

### **Sales Tracking**

```http
POST /api/sales/track
```

Track a new sale from external systems (e.g., seller websites)

**Request Body:**

```json
{
  "orderId": "ORD-12345",
  "businessId": 1,
  "userId": 123,
  "productUrl": "https://amazon.com/product/123",
  "productTitle": "iPhone 15 Pro",
  "productPrice": 999.99,
  "currency": "USD",
  "retailer": "amazon",
  "sessionId": "sess_abc123",
  "utmSource": "pricehunt",
  "utmMedium": "affiliate",
  "utmCampaign": "summer2024"
}
```

### **Update Sale Status**

```http
PUT /api/sales/status/:orderId
```

Update sale status (PENDING → CONFIRMED → PAID)

**Request Body:**

```json
{
  "status": "CONFIRMED"
}
```

### **Business Analytics**

```http
GET /api/sales/stats/business/:businessId
```

Get comprehensive sales statistics for a business

### **User Commission Stats**

```http
GET /api/sales/stats/commissions
```

Get user's commission earnings and statistics

### **Webhook Management**

```http
POST /api/sales/webhooks
GET /api/sales/webhooks
PUT /api/sales/webhooks/:id
DELETE /api/sales/webhooks/:id
```

Manage webhook configurations for real-time notifications

### **Commission Rate Management**

```http
POST /api/sales/commission-rates
GET /api/sales/commission-rates
```

Set and view commission rates per retailer

## 🔗 Webhook Integration

### **Webhook Events**

When sales are tracked, webhooks are automatically triggered:

1. **`sale.created`** - New sale tracked
2. **`sale.status_updated`** - Sale status changed
3. **`commission.paid`** - Commission marked as paid

### **Webhook Payload Example**

```json
{
  "event": "sale.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": 123,
    "orderId": "ORD-12345",
    "businessId": 1,
    "productUrl": "https://amazon.com/product/123",
    "productPrice": 999.99,
    "retailer": "amazon",
    "commissionAmount": 49.99,
    "commissionRate": 5.0,
    "status": "PENDING"
  }
}
```

### **Webhook Security**

- HMAC-SHA256 signatures for verification
- Retry logic with exponential backoff
- Failed webhook tracking and retry system

## 💰 Commission System

### **Commission Calculation**

```typescript
// Commission is calculated automatically
const rate = commissionRate?.rate || 0;
const commissionAmount = (productPrice * rate) / 100;
```

### **Commission Flow**

1. **Sale Created** → Commission status: `PENDING`
2. **Sale Confirmed** → Commission status: `APPROVED`
3. **Commission Paid** → Commission status: `PAID`

### **Commission Rates by Retailer**

Businesses can set different commission rates:

- Amazon: 5%
- Walmart: 3%
- Target: 4%
- etc.

## 📊 Analytics & Reporting

### **Business Dashboard**

- Total sales and revenue
- Commission earned
- Conversion rates
- Sales by retailer
- Sales by status

### **User Commission Dashboard**

- Total commissions earned
- Pending vs paid commissions
- Average commission per sale
- Commission history

### **Admin Overview**

- All sales across all businesses
- Global commission statistics
- Webhook delivery monitoring
- Failed webhook retry management

## 🔧 Integration Guide

### **For Sellers (Businesses)**

1. **Set Commission Rates:**

```http
POST /api/sales/commission-rates
{
  "retailer": "amazon",
  "rate": 5.0
}
```

2. **Configure Webhooks:**

```http
POST /api/sales/webhooks
{
  "url": "https://your-site.com/webhooks/sales",
  "secret": "your-webhook-secret",
  "events": ["sale.created", "sale.status_updated"]
}
```

3. **Track Sales from Your Website:**

```javascript
// On your e-commerce site when a sale is completed
fetch("/api/sales/track", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    orderId: "ORD-12345",
    businessId: 1,
    productUrl: "https://amazon.com/product/123",
    productPrice: 999.99,
    retailer: "amazon",
    // ... other fields
  }),
});
```

### **For Users (Affiliates)**

1. **View Commission Stats:**

```http
GET /api/sales/stats/commissions
```

2. **View Commission History:**

```http
GET /api/sales/commissions?page=1&limit=20
```

## 🛡️ Security Features

### **RLS Policies**

All new tables have Row Level Security:

- Users can only see their own commissions
- Businesses can only see their own sales
- Admins can see everything

### **Webhook Security**

- HMAC signatures prevent tampering
- Retry logic handles failures
- Failed webhook tracking

### **Data Validation**

- Required field validation
- Status enum validation
- Business ownership verification

## 📈 Benefits

1. **Complete Sales Tracking** - Track every sale from your app
2. **Automatic Commission Calculation** - No manual calculations needed
3. **Real-time Notifications** - Instant webhook notifications
4. **Comprehensive Analytics** - Detailed reporting and insights
5. **Revenue Attribution** - Link sales to specific users and campaigns
6. **Scalable Architecture** - Handles high-volume sales tracking

## 🚀 Next Steps

1. **Set up commission rates** for your businesses
2. **Configure webhooks** for real-time notifications
3. **Integrate with seller websites** to track sales
4. **Monitor analytics** to optimize performance
5. **Set up automated commission payments** (future enhancement)

## 🔍 Testing

### **Test Sale Tracking**

```bash
curl -X POST https://paaav.vercel.app/api/sales/track \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-123",
    "businessId": 1,
    "productUrl": "https://amazon.com/test",
    "productPrice": 100.00,
    "retailer": "amazon"
  }'
```

### **Test Webhook**

```bash
curl -X POST https://pavlo4.netlify.app/api/sales/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://webhook.site/your-url",
    "secret": "test-secret",
    "events": ["sale.created"]
  }'
```

Your sales tracking system is now **complete and production-ready**! 🎉
