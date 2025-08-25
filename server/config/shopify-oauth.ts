// Shopify OAuth Configuration - Self-contained implementation
export const SHOPIFY_OAUTH_CONFIG = {
  // Shopify App configuration
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || 
                   (process.env.NODE_ENV === 'production' ? 'https://ipick.io' : 'http://localhost:8083'),
  SHOPIFY_CLIENT_ID: process.env.SHOPIFY_CLIENT_ID || '',
  SHOPIFY_CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET || '',
  IPICK_WEBHOOK_SECRET: process.env.IPICK_WEBHOOK_SECRET || '54e7fd9b170add3cf80dcc482f8b894a5',
  SHOPIFY_SCOPES: [
    'read_products',
    'read_orders', 
    'read_customers',
    'read_inventory',
    'read_analytics',
    'read_marketing_events',
    'read_reports',
    'write_script_tags',
    'write_themes'
  ].join(','),
  SHOPIFY_VERSION: '2024-10'
};

// Validate OAuth configuration
export function validateOAuthConfig(): boolean {
  return !!(SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_ID && 
           SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_SECRET && 
           SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL);
}

// OAuth URLs for direct Shopify integration
export const SHOPIFY_OAUTH_URLS = {
  // Direct Shopify OAuth authorization URL
  auth: (shop: string, state: string) => {
    const scopes = SHOPIFY_OAUTH_CONFIG.SHOPIFY_SCOPES;
    const clientId = SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_ID;
    const redirectUri = `${SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL}/api/shopify/oauth/callback`;
    
    return `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  },
  
  // Our app's callback URL
  callback: `${SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL}/api/shopify/oauth/callback`,
  
  // Additional redirect URLs for Shopify app configuration
  redirectUrls: [
    `${SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL}/api/auth`,
    `${SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL}/api/shopify/oauth/callback`,
    `${SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL}/business/dashboard`,
    `${SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL}/business/integrate`,
    `${SHOPIFY_OAUTH_CONFIG.SHOPIFY_APP_URL}/api/shopify/oauth/connect`
  ]
};

// Helper functions
export function generateShopifyAuthUrl(shop: string, businessId: string): string {
  const state = generateOAuthState(businessId);
  return SHOPIFY_OAUTH_URLS.auth(shop, state);
}

export function generateOAuthState(businessId: string): string {
  // Create a secure state parameter that includes businessId and timestamp
  const timestamp = Date.now();
  const stateData = { businessId, timestamp };
  return Buffer.from(JSON.stringify(stateData)).toString('base64');
}

export function parseOAuthState(state: string): { businessId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(state, 'base64').toString();
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse OAuth state:', error);
    return null;
  }
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

// Webhook configuration for direct Shopify integration
export const SHOPIFY_WEBHOOK_CONFIG = {
  SECRET: process.env.IPICK_WEBHOOK_SECRET || '54e7fd9b170add3cf80dcc482f8b894a5',
  ENDPOINT: '/api/shopify/webhooks',
  EVENTS: {
    SHOPIFY_CONNECTION_CREATED: 'shopify_connection_created',
    SHOPIFY_CONNECTION_UPDATED: 'shopify_connection_updated',
    SHOPIFY_CONNECTION_DELETED: 'shopify_connection_deleted',
    ORDER_CREATED: 'order_created',
    ORDER_UPDATED: 'order_updated'
  }
};

// Token exchange function
export async function exchangeCodeForToken(shop: string, code: string): Promise<{ accessToken: string; scopes: string }> {
  const clientId = SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_ID;
  const clientSecret = SHOPIFY_OAUTH_CONFIG.SHOPIFY_CLIENT_SECRET;
  const redirectUri = SHOPIFY_OAUTH_URLS.callback;
  
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    scopes: data.scope
  };
}
