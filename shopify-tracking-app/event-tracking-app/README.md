# Shopify Event Tracking App

A comprehensive Shopify app that tracks all store events and forwards them to
your main application via webhooks. This app acts as a bridge between Shopify
and your main application, providing real-time event tracking and data
enrichment.

## Features

- **Comprehensive Event Tracking**: Monitors orders, products, customers, carts,
  checkouts, collections, inventory, fulfillments, and refunds
- **Webhook Forwarding**: Automatically forwards all Shopify events to your main
  application
- **Data Enrichment**: Adds metadata and metrics to webhook payloads before
  forwarding
- **Dashboard Monitoring**: Built-in dashboard to monitor webhook status and
  event statistics
- **Error Handling**: Robust error handling with logging and retry mechanisms
- **Security**: HMAC validation and secure webhook processing

## Supported Events

### Orders

- `orders/create` - New order created
- `orders/updated` - Order updated
- `orders/paid` - Order payment received
- `orders/fulfilled` - Order fulfilled
- `orders/cancelled` - Order cancelled

### Products

- `products/create` - New product created
- `products/update` - Product updated
- `products/delete` - Product deleted

### Customers

- `customers/create` - New customer created
- `customers/update` - Customer updated
- `customers/delete` - Customer deleted

### Carts & Checkouts

- `carts/create` - Cart created
- `carts/update` - Cart updated
- `checkouts/create` - Checkout created
- `checkouts/update` - Checkout updated
- `checkouts/delete` - Checkout deleted

### Collections

- `collections/create` - Collection created
- `collections/update` - Collection updated
- `collections/delete` - Collection deleted

### Inventory

- `inventory_items/create` - Inventory item created
- `inventory_items/update` - Inventory item updated
- `inventory_items/delete` - Inventory item deleted

### Fulfillments

- `fulfillments/create` - Fulfillment created
- `fulfillments/update` - Fulfillment updated

### Refunds

- `refunds/create` - Refund created

## Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd event-tracking-app
   ```

2. **Install dependencies**:
   ```bash
   ```

npm install

````
3. **Configure environment variables**:
   Create a `.env` file with the following variables:
   ```env
   # Shopify App Configuration
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory,read_fulfillments,write_fulfillments,read_shipping,write_shipping,read_analytics,write_analytics,read_marketing_events,write_marketing_events,read_price_rules,write_price_rules,read_discounts,write_discounts,read_marketing_events,write_marketing_events,read_locales,write_locales,read_currencies,write_currencies,read_gift_cards,write_gift_cards,read_users,write_users,read_user_emails,write_user_emails,read_themes,write_themes,read_script_tags,write_script_tags,read_content,write_content,read_tender_transactions,write_tender_transactions,read_product_listings,write_product_listings,read_collections,write_collections,read_cart_transforms,write_cart_transforms,read_merchant_managed_fulfillment_orders,write_merchant_managed_fulfillment_orders,read_shopify_payments_payouts,write_shopify_payments_payouts,read_shopify_payments_disputes,write_shopify_payments_disputes
   SHOPIFY_APP_URL=https://your-app-url.com

   # Main Application Configuration
   MAIN_APP_WEBHOOK_URL=https://your-main-app.com/api/shopify-webhooks
   MAIN_APP_API_KEY=your-main-app-api-key

   # Database Configuration (if using Prisma)
   DATABASE_URL=your_database_url

   # Environment
   NODE_ENV=development
````

4. **Deploy the app**:
   ```bash
   npm run deploy
   ```

## Configuration

### Main Application Setup

Your main application needs to have an endpoint to receive webhooks from this
Shopify app. The webhook payload will include:

```json
{
   "topic": "orders/create",
   "shop_domain": "your-store.myshopify.com",
   "event_id": "webhook-event-id",
   "triggered_at": "2024-01-01T00:00:00Z",
   "payload": {
      // Original Shopify webhook payload
      "id": 123456789,
      "order_number": "#1001",
      "total_price": "99.99",
      // ... other order data
      "_metadata": {
         "processed_at": "2024-01-01T00:00:00Z",
         "shop_domain": "your-store.myshopify.com",
         "topic": "orders/create",
         "version": "1.0"
      },
      "_order_metrics": {
         "total_price": "99.99",
         "currency": "USD",
         "line_items_count": 2,
         "customer_id": 123,
         "financial_status": "paid",
         "fulfillment_status": "fulfilled"
      }
   },
   "timestamp": "2024-01-01T00:00:00Z",
   "source": "shopify-tracking-app"
}
```

### Webhook Headers

The webhook request will include the following headers:

- `Authorization: Bearer your-api-key`
- `X-Webhook-Source: shopify-tracking-app`
- `X-Webhook-Topic: orders/create`
- `X-Shop-Domain: your-store.myshopify.com`
- `X-Event-ID: webhook-event-id`

## Usage

### Dashboard

Access the webhook dashboard at `/app/webhooks-dashboard` to:

- View all webhook subscriptions
- Monitor webhook status
- Check configuration
- View event statistics

### Development

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Test webhooks locally**:
   ```bash
   shopify app webhook trigger --topic=orders/create
   ```

### Production Deployment

1. **Deploy to production**:
   ```bash
   npm run deploy
   ```

2. **Monitor webhook delivery**:
   - Check the Partner Dashboard for webhook delivery metrics
   - Monitor your application logs for webhook processing
   - Use the built-in dashboard for real-time status

## Architecture

### Components

1. **Webhook Handlers** (`app/routes/webhooks.*.jsx`):
   - Process incoming Shopify webhooks
   - Validate webhook data
   - Forward to main application

2. **Webhook Forwarder Service** (`app/services/webhook-forwarder.server.js`):
   - Handles webhook forwarding logic
   - Data enrichment and validation
   - Error handling and retry logic

3. **Dashboard** (`app/routes/app.webhooks-dashboard.jsx`):
   - Monitor webhook status
   - View configuration
   - Display statistics

### Data Flow

1. Shopify event occurs (e.g., order created)
2. Shopify sends webhook to this app
3. App validates and processes the webhook
4. App enriches data with metadata and metrics
5. App forwards enriched data to main application
6. Main application processes the event

## Error Handling

The app includes comprehensive error handling:

- **Webhook Validation**: Validates all incoming webhooks using HMAC
- **Forwarding Errors**: Logs errors but doesn't fail Shopify webhook delivery
- **Retry Logic**: Built-in retry mechanism for failed forwards
- **Monitoring**: Dashboard shows webhook status and error rates

## Security

- **HMAC Validation**: All webhooks are validated using Shopify's HMAC signature
- **API Key Authentication**: Secure communication with main application
- **Environment Variables**: Sensitive data stored in environment variables
- **HTTPS Only**: All webhook endpoints require HTTPS

## Troubleshooting

### Common Issues

1. **Webhook not forwarding**:
   - Check `MAIN_APP_WEBHOOK_URL` configuration
   - Verify `MAIN_APP_API_KEY` is correct
   - Check main application logs

2. **Webhook validation errors**:
   - Ensure Shopify app secret is correct
   - Check webhook endpoint URLs

3. **Missing events**:
   - Verify webhook subscriptions in app configuration
   - Check Partner Dashboard for delivery failures
   - Monitor app logs for errors

### Logs

The app logs all webhook processing activities:

- Webhook reception
- Forwarding attempts
- Success/failure status
- Error details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Check the Shopify documentation
- Review the app logs
- Monitor the webhook dashboard
- Contact the development team
