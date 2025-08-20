// Shopify OAuth Configuration for external app using Gadget
export const SHOPIFY_OAUTH_CONFIG = {
  // Gadget API configuration for external app
  GADGET_API_URL: process.env.GADGET_API_URL || 'https://itrcks--development.gadget.app',
  GADGET_API_KEY: process.env.GADGET_API_KEY || '',
  // Use production URL for ipick.io, fallback to localhost for development
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || 
                   (process.env.NODE_ENV === 'production' ? 'https://ipick.io' : 'http://localhost:8083'),
  IPICK_WEBHOOK_SECRET: process.env.IPICK_WEBHOOK_SECRET || '',
  SHOPIFY_SCOPES: [
    'read_products',
    'read_orders', 
    'read_customers',
    'read_inventory',
    'read_analytics',
    'read_marketing_events',
    'read_sales',
    'read_reports',
    'write_script_tags',
    'write_themes'
  ].join(','),
  SHOPIFY_VERSION: '2024-01'
};

// Validate OAuth configuration
export function validateOAuthConfig(): boolean {
  return !!(SHOPIFY_OAUTH_CONFIG.GADGET_API_URL && 
           SHOPIFY_OAUTH_CONFIG.GADGET_API_KEY && 
           SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL);
}

// OAuth URLs for Gadget integration
export const SHOPIFY_OAUTH_URLS = {
  // Gadget OAuth authorization URL for external app
  gadgetAuth: (shop: string, businessId: string) => {
    // Use Gadget's own callback URL as the redirect URI
    const gadgetCallbackUrl = `${SHOPIFY_OAUTH_CONFIG.GADGET_API_URL}/api/connections/auth/shopify/callback`;
    console.log('Using Gadget callback URL:', gadgetCallbackUrl);
    return `${SHOPIFY_OAUTH_CONFIG.GADGET_API_URL}/api/auth/shopify/install?shop=${encodeURIComponent(shop)}&businessId=${businessId}&redirectUri=${encodeURIComponent(gadgetCallbackUrl)}`;
  },
  
  // Gadget's callback URL
  gadgetCallback: `${SHOPIFY_OAUTH_CONFIG.GADGET_API_URL}/api/connections/auth/shopify/callback`,
  
  // Our app's callback URL (for webhook handling)
  callback: `${SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL}/api/shopify/oauth/callback`
};

// Helper functions
export function generateShopifyAuthUrl(shop: string, businessId: string): string {
  return SHOPIFY_OAUTH_URLS.gadgetAuth(shop, businessId);
}

export function validateShopifyShop(shop: string): boolean {
  // Basic validation for Shopify shop URLs
  const shopifyPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopifyPattern.test(shop);
}

export function extractShopFromUrl(url: string): string | null {
  // Extract shop domain from various Shopify URL formats
  const patterns = [
    /https?:\/\/([a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com)/,
    /([a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Webhook configuration for Gadget integration
export const SHOPIFY_WEBHOOK_CONFIG = {
  SECRET: process.env.IPICK_WEBHOOK_SECRET || '',
  ENDPOINT: '/api/shopify/oauth/webhook',
  EVENTS: {
    SHOPIFY_CONNECTION_CREATED: 'shopify_connection_created',
    SHOPIFY_CONNECTION_UPDATED: 'shopify_connection_updated',
    SHOPIFY_CONNECTION_DELETED: 'shopify_connection_deleted',
    ORDER_CREATED: 'order_created',
    ORDER_UPDATED: 'order_updated'
  }
};
