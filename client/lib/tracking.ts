// Tracking utilities for affiliate links and GTM events

interface TrackingData {
  productUrl: string;
  productTitle?: string;
  productPrice?: string;
  retailer?: string;
  userId?: string;
  sessionId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}



interface AffiliateConfig {
  amazonTag?: string;
  ebayPartnerId?: string;
  walmartAffiliateId?: string;
  targetAffiliateId?: string;
  bestbuyAffiliateId?: string;
  appleAffiliateId?: string;
  playstationAffiliateId?: string;
  neweggAffiliateId?: string;
  costcoAffiliateId?: string;
}

// Shopify tracking configuration
const SHOPIFY_TRACKING_CONFIG = {
  development: {
    apiUrl: 'https://checkoutdata--development.gadget.app/api/graphql',
  },
  production: {
    apiUrl: 'https://checkoutdata.gadget.app/api/graphql',
  }
};

// Get current environment
const getShopifyApiUrl = () => {
  const isDevelopment = window.location.hostname.includes('localhost') || 
                       window.location.hostname.includes('netlify.app') && 
                       window.location.hostname.includes('--development');
  return isDevelopment ? SHOPIFY_TRACKING_CONFIG.development.apiUrl : SHOPIFY_TRACKING_CONFIG.production.apiUrl;
};

// Default affiliate configuration - replace with your actual affiliate IDs
const AFFILIATE_CONFIG: AffiliateConfig = {
  amazonTag: "your-amazon-tag-20",
  ebayPartnerId: "your-ebay-partner-id",
  walmartAffiliateId: "your-walmart-affiliate-id",
  targetAffiliateId: "your-target-affiliate-id",
  bestbuyAffiliateId: "your-bestbuy-affiliate-id",
  appleAffiliateId: "your-apple-affiliate-id",
  playstationAffiliateId: "your-playstation-affiliate-id",
  neweggAffiliateId: "your-newegg-affiliate-id",
  costcoAffiliateId: "your-costco-affiliate-id",
};

// NEW: Shopify referral tracking function
export const trackReferral = async (businessDomain: string, productUrl: string, productName: string, userId: string | null = null) => {
  // Generate unique referral ID
  const referralId = `aff_${businessDomain.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Build target URL with UTM parameters
  const targetUrl = new URL(productUrl);
  targetUrl.searchParams.set('utm_source', 'pavlo4');
  targetUrl.searchParams.set('utm_medium', 'suggestion');
  targetUrl.searchParams.set('utm_campaign', 'business_tracking');
  targetUrl.searchParams.set('ref_id', referralId);
  
  try {
    const response = await fetch(getShopifyApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation trackReferral($referralId: String!, $businessDomain: String!, $targetUrl: String!, $sourceUrl: String, $productName: String, $userId: String) {
            trackReferral(
              referralId: $referralId, 
              businessDomain: $businessDomain, 
              targetUrl: $targetUrl, 
              sourceUrl: $sourceUrl, 
              productName: $productName, 
              userId: $userId
            ) {
              success
            }
          }
        `,
        variables: {
          referralId: referralId,
          businessDomain: businessDomain, // e.g. "godislove.lt"
          targetUrl: targetUrl.toString(),
          sourceUrl: window.location.href,
          productName: productName,
          userId: userId
        }
      })
    });
    
    const result = await response.json();
    
    if (result.data?.trackReferral?.success) {
      console.log('✅ Referral tracked successfully:', referralId);
      return { success: true, referralId, targetUrl: targetUrl.toString() };
    } else {
      console.error('❌ Referral tracking failed:', result.errors);
      return { success: false, error: result.errors, targetUrl: targetUrl.toString() };
    }
  } catch (error) {
    console.error('❌ Error tracking referral:', error);
    return { success: false, error, targetUrl: targetUrl.toString() };
  }
};

// NEW: Enhanced product click handler that combines existing tracking with Shopify tracking
export const handleProductClick = async (product: any, businessDomain?: string) => {
  // Your existing tracking (keep this)
  const existingEvent = {
    event_type: "product_click",
    business_id: businessDomain ? getBusinessId(businessDomain) : undefined,
    affiliate_id: generateAffiliateId(),
    session_id: getCurrentSessionId(),
    timestamp: Date.now(),
    url: product.url,
    data: {
      product_name: product.title || product.name
    }
  };
  
  // Send to your existing analytics
  await sendToYourAnalytics(existingEvent);
  
  // NEW: Also track in Gadget for Shopify integration if business domain is provided
  if (businessDomain) {
    const shopifyResult = await trackReferral(
      businessDomain, 
      product.url, 
      product.title || product.name, 
      getCurrentUserId()
    );
    
    // Return the result for the calling function to handle
    return shopifyResult;
  }
  
  return { success: true, targetUrl: product.url };
};

// NEW: Get complete analytics combining existing data with Shopify data
export const getCompleteAnalytics = async (businessDomain: string, startDate: string | null = null, endDate: string | null = null) => {
  try {
    // Get Shopify events (checkout + order data)
    const shopifyResponse = await fetch(getShopifyApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query getBusinessAnalytics($businessDomain: String!, $startDate: String, $endDate: String) {
            getBusinessAnalytics(
              businessDomain: $businessDomain, 
              startDate: $startDate, 
              endDate: $endDate
            )
          }
        `,
        variables: {
          businessDomain: businessDomain,
          startDate: startDate,
          endDate: endDate
        }
      })
    });
    
    const shopifyResult = await shopifyResponse.json();
    const shopifyEvents = shopifyResult.data?.getBusinessAnalytics || [];
    
    // Get your existing analytics data
    const yourExistingEvents = await getYourExistingAnalytics(businessDomain, startDate, endDate);
    
    // Merge all events
    const allEvents = [...yourExistingEvents, ...shopifyEvents];
    
    // Sort by timestamp
    allEvents.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
    
    return allEvents;
    
  } catch (error) {
    console.error('Error fetching complete analytics:', error);
    return [];
  }
};

// Helper functions (you'll need to implement these based on your existing system)
function getBusinessId(businessDomain: string): number | undefined {
  // Implement based on your business mapping system
  // This should return the business ID for the given domain
  return undefined; // Placeholder
}

function generateAffiliateId(): string {
  return `aff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentSessionId(): string {
  return sessionStorage.getItem("pricehunt_session_id") || 
         `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentUserId(): string | null {
  // Implement based on your user authentication system
  return null; // Placeholder
}

async function sendToYourAnalytics(event: any): Promise<void> {
  // Your existing analytics tracking logic
  console.log('Sending to existing analytics:', event);
}

async function getYourExistingAnalytics(businessDomain: string, startDate: string | null, endDate: string | null): Promise<any[]> {
  // Implement based on your existing analytics system
  return []; // Placeholder
}

// Generate affiliate links for different retailers
export function generateAffiliateLink(
  originalUrl: string,
  retailer: string,
): string {
  try {
    const url = new URL(originalUrl);
    const hostname = url.hostname.toLowerCase();

    // Add tracking parameters
    const trackingParams = new URLSearchParams(url.search);
    trackingParams.set("ref", "pricehunt");
    trackingParams.set("utm_source", "pricehunt");
    trackingParams.set("utm_medium", "price_comparison");
    trackingParams.set("utm_campaign", "product_search");
    trackingParams.set("session_id", getSessionId());

    // Add retailer-specific affiliate parameters
    if (hostname.includes("amazon") && AFFILIATE_CONFIG.amazonTag) {
      trackingParams.set("tag", AFFILIATE_CONFIG.amazonTag);
    } else if (hostname.includes("ebay") && AFFILIATE_CONFIG.ebayPartnerId) {
      trackingParams.set("partner", AFFILIATE_CONFIG.ebayPartnerId);
    } else if (
      hostname.includes("walmart") &&
      AFFILIATE_CONFIG.walmartAffiliateId
    ) {
      trackingParams.set("affiliate", AFFILIATE_CONFIG.walmartAffiliateId);
    } else if (
      hostname.includes("target") &&
      AFFILIATE_CONFIG.targetAffiliateId
    ) {
      trackingParams.set("affiliate", AFFILIATE_CONFIG.targetAffiliateId);
    } else if (
      hostname.includes("bestbuy") &&
      AFFILIATE_CONFIG.bestbuyAffiliateId
    ) {
      trackingParams.set("affiliate", AFFILIATE_CONFIG.bestbuyAffiliateId);
    } else if (
      hostname.includes("apple") &&
      AFFILIATE_CONFIG.appleAffiliateId
    ) {
      trackingParams.set("affiliate", AFFILIATE_CONFIG.appleAffiliateId);
    } else if (
      hostname.includes("playstation") &&
      AFFILIATE_CONFIG.playstationAffiliateId
    ) {
      trackingParams.set("affiliate", AFFILIATE_CONFIG.playstationAffiliateId);
    } else if (
      hostname.includes("newegg") &&
      AFFILIATE_CONFIG.neweggAffiliateId
    ) {
      trackingParams.set("affiliate", AFFILIATE_CONFIG.neweggAffiliateId);
    } else if (
      hostname.includes("costco") &&
      AFFILIATE_CONFIG.costcoAffiliateId
    ) {
      trackingParams.set("affiliate", AFFILIATE_CONFIG.costcoAffiliateId);
    }

    url.search = trackingParams.toString();
    return url.toString();
  } catch (error) {
    console.error("Error generating affiliate link:", error);
    return originalUrl;
  }
}

// Track affiliate link clicks
export function trackAffiliateClick(data: TrackingData): void {
  // Prevent duplicate tracking within 5 seconds
  const trackingKey = `affiliate_click_${data.productUrl}_${data.sessionId}`;
  const lastTracked = sessionStorage.getItem(trackingKey);
  const now = Date.now();
  
  if (lastTracked && (now - parseInt(lastTracked)) < 5000) {
    console.log("Preventing duplicate affiliate click tracking");
    return;
  }
  
  sessionStorage.setItem(trackingKey, now.toString());

  // GTM event tracking
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: "affiliate_click",
      ecommerce: {
        currency: "USD",
        value: data.productPrice
          ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
          : 0,
        items: [
          {
            item_id: data.productUrl,
            item_name: data.productTitle || "Unknown Product",
            item_category: "Product",
            price: data.productPrice
              ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
              : 0,
            quantity: 1,
          },
        ],
      },
      custom_parameters: {
        retailer: data.retailer,
        product_url: data.productUrl,
        session_id: data.sessionId,
        referrer: data.referrer,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
      },
    });
  }

  // Send to your backend for tracking
  fetch("/api/affiliate/click", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).catch((error) => {
    console.error("Error tracking affiliate click:", error);
  });
}



// Track product searches
export function trackProductSearch(data: TrackingData): void {
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: "product_search",
      ecommerce: {
        currency: "USD",
        value: data.productPrice
          ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
          : 0,
        items: [
          {
            item_id: data.productUrl,
            item_name: data.productTitle || "Unknown Product",
            item_category: "Product",
            price: data.productPrice
              ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
              : 0,
            quantity: 1,
          },
        ],
      },
      custom_parameters: {
        product_url: data.productUrl,
        session_id: data.sessionId,
        referrer: data.referrer,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
      },
    });
  }
}

// Track price comparisons
export function trackPriceComparison(
  data: TrackingData & { alternatives: any[] },
): void {
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: "price_comparison",
      ecommerce: {
        currency: "USD",
        value: data.productPrice
          ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
          : 0,
        items: [
          {
            item_id: data.productUrl,
            item_name: data.productTitle || "Unknown Product",
            item_category: "Product",
            price: data.productPrice
              ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
              : 0,
            quantity: 1,
          },
        ],
      },
      custom_parameters: {
        product_url: data.productUrl,
        alternatives_count: data.alternatives.length,
        session_id: data.sessionId,
        referrer: data.referrer,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
      },
    });
  }
}

// Track conversions (purchases)
export function trackConversion(data: TrackingData): void {
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: "purchase",
      ecommerce: {
        currency: "USD",
        value: data.productPrice
          ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
          : 0,
        transaction_id: generateTransactionId(),
        items: [
          {
            item_id: data.productUrl,
            item_name: data.productTitle || "Unknown Product",
            item_category: "Product",
            price: data.productPrice
              ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
              : 0,
            quantity: 1,
          },
        ],
      },
      custom_parameters: {
        retailer: data.retailer,
        product_url: data.productUrl,
        session_id: data.sessionId,
        referrer: data.referrer,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
      },
    });
  }

  // Send to your backend for conversion tracking
  fetch("/api/affiliate/conversion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).catch((error) => {
    console.error("Error tracking conversion:", error);
  });
}

// Generate session ID for tracking
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("pricehunt_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("pricehunt_session_id", sessionId);
  }
  return sessionId;
}

// Generate transaction ID
function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract UTM parameters from URL
export function extractUtmParameters(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
} {
  if (typeof window === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get("utm_source") || undefined,
    utm_medium: urlParams.get("utm_medium") || undefined,
    utm_campaign: urlParams.get("utm_campaign") || undefined,
    utm_term: urlParams.get("utm_term") || undefined,
    utm_content: urlParams.get("utm_content") || undefined,
  };
}

// Initialize tracking with UTM parameters
export function initializeTracking(): void {
  const utmParams = extractUtmParameters();
  if (Object.keys(utmParams).length > 0) {
    sessionStorage.setItem("pricehunt_utm_params", JSON.stringify(utmParams));
  }
}

// Get stored UTM parameters
export function getStoredUtmParameters(): any {
  const stored = sessionStorage.getItem("pricehunt_utm_params");
  return stored ? JSON.parse(stored) : {};
}
