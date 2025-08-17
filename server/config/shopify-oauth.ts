// Shopify OAuth Configuration
export const SHOPIFY_OAUTH_CONFIG = {
  // These should be set in environment variables
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || '',
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || '',
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
  SHOPIFY_REDIRECT_URI: process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:8084/api/shopify/oauth/callback',
  SHOPIFY_VERSION: '2024-01'
};

// Validate OAuth configuration
export function validateOAuthConfig(): boolean {
  return !!(SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_KEY && 
           SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_SECRET && 
           SHOPIFY_OAUTH_CONFIG.SHOPIFY_REDIRECT_URI);
}

// OAuth URLs
export const SHOPIFY_OAUTH_URLS = {
  authorize: (shop: string) => 
    `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_OAUTH_CONFIG.SHOPIFY_API_KEY}&scope=${SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(SHOPIFY_OAUTH_CONFIG.SHOPIFY_REDIRECT_URI)}`,
  
  accessToken: (shop: string) => 
    `https://${shop}/admin/oauth/access_token`
};

// Helper functions
export function generateShopifyAuthUrl(shop: string, state?: string): string {
  const baseUrl = SHOPIFY_OAUTH_URLS.authorize(shop);
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
