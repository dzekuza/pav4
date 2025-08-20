// Shopify OAuth Configuration for direct Shopify API integration
export const SHOPIFY_OAUTH_CONFIG = {
  // Shopify API credentials
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || process.env.GADGET_API_KEY || '',
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || '',
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || process.env.FRONTEND_URL || 'http://localhost:8083',
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
  return !!(SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_KEY && 
           SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_SECRET && 
           SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL);
}

// OAuth URLs for direct Shopify integration
export const SHOPIFY_OAUTH_URLS = {
  // Direct Shopify OAuth authorization URL
  authorize: (shop: string, clientId: string, scopes: string, redirectUri: string, state: string) => {
    return `https://${shop}/admin/oauth/authorize?` +
           `client_id=${clientId}&` +
           `scope=${encodeURIComponent(scopes)}&` +
           `redirect_uri=${encodeURIComponent(redirectUri)}&` +
           `state=${state}`;
  },
  
  // Access token exchange endpoint
  accessToken: (shop: string) => `https://${shop}/admin/oauth/access_token`
};

// Helper functions
export function generateShopifyAuthUrl(shop: string, state?: string): string {
  const redirectUri = `${SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL}/api/shopify/oauth/callback`;
  return SHOPIFY_OAUTH_URLS.authorize(
    shop,
    SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_KEY,
    SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES,
    redirectUri,
    state || ''
  );
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

// Webhook configuration for Shopify integration
export const SHOPIFY_WEBHOOK_CONFIG = {
  SECRET: process.env.IPICK_WEBHOOK_SECRET || '',
  ENDPOINT: '/api/shopify/webhooks',
  EVENTS: {
    APP_UNINSTALLED: 'app/uninstalled',
    ORDER_CREATED: 'orders/create',
    ORDER_UPDATED: 'orders/updated',
    PRODUCT_CREATED: 'products/create',
    PRODUCT_UPDATED: 'products/update'
  }
};
