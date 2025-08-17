// Shopify OAuth Configuration via Gadget API
export const SHOPIFY_OAUTH_CONFIG = {
  // Gadget API endpoints for Shopify OAuth
  GADGET_API_URL: process.env.GADGET_API_URL || 'https://itrcks.gadget.app',
  SHOPIFY_INSTALL_URL: process.env.SHOPIFY_INSTALL_URL || 'https://itrcks.gadget.app/api/shopify/install-or-render',
  SHOPIFY_CALLBACK_URL: process.env.SHOPIFY_CALLBACK_URL || 'https://itrcks.gadget.app/api/connections/auth/shopify/callback',
  GADGET_API_KEY: process.env.GADGET_API_KEY || '',
  SHOPIFY_SCOPES: [
    'read_products',
    'read_orders', 
    'read_customers',
    'read_inventory',
    'read_analytics',
    'read_marketing_events',
    'read_sales',
    'read_reports'
  ].join(','),
  SHOPIFY_VERSION: '2024-01'
};

// Validate OAuth configuration
export function validateOAuthConfig(): boolean {
  return !!(SHOPIFY_OAUTH_CONFIG.GADGET_API_URL && 
           SHOPIFY_OAUTH_CONFIG.SHOPIFY_INSTALL_URL && 
           SHOPIFY_OAUTH_CONFIG.SHOPIFY_CALLBACK_URL);
}

// OAuth URLs via Gadget API
export const SHOPIFY_OAUTH_URLS = {
  // Use Gadget's Shopify install URL
  install: (shop?: string) => {
    const baseUrl = SHOPIFY_OAUTH_CONFIG.SHOPIFY_INSTALL_URL;
    return shop ? `${baseUrl}?shop=${encodeURIComponent(shop)}` : baseUrl;
  },
  
  // Gadget callback URL
  callback: SHOPIFY_OAUTH_CONFIG.SHOPIFY_CALLBACK_URL,
  
  // Legacy support for direct Shopify OAuth (if needed)
  authorize: (shop: string) => 
    `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_KEY}&scope=${SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(SHOPIFY_OAUTH_CONFIG.SHOPIFY_CALLBACK_URL)}`,
  
  accessToken: (shop: string) => 
    `https://${shop}/admin/oauth/access_token`
};

// Helper functions
export function generateShopifyAuthUrl(shop: string, state?: string): string {
  // Use Gadget's install URL instead of direct Shopify OAuth
  const baseUrl = SHOPIFY_OAUTH_URLS.install(shop);
  return state ? `${baseUrl}&state=${encodeURIComponent(state)}` : baseUrl;
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
