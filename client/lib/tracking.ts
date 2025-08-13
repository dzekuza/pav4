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

interface SalesTrackingData extends TrackingData {
  orderId?: string;
  businessId?: number;
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

// Track sales through our sales tracking API
export async function trackSale(data: SalesTrackingData): Promise<boolean> {
  try {
    if (!data.businessId) {
      console.warn("No business ID provided for sale tracking");
      return false;
    }

    // Prevent duplicate sale tracking within 10 seconds
    const trackingKey = `sale_track_${data.orderId || data.productUrl}_${data.businessId}`;
    const lastTracked = sessionStorage.getItem(trackingKey);
    const now = Date.now();
    
    if (lastTracked && (now - parseInt(lastTracked)) < 10000) {
      console.log("Preventing duplicate sale tracking");
      return true; // Return true to avoid error handling
    }
    
    sessionStorage.setItem(trackingKey, now.toString());

    const orderId =
      data.orderId ||
      `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = await fetch("/api/sales/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: orderId,
        businessId: data.businessId,
        productUrl: data.productUrl,
        productTitle: data.productTitle,
        productPrice: data.productPrice
          ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
          : 0,
        retailer: data.retailer || "unknown",
        sessionId: data.sessionId,
        referrer: data.referrer,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Sale tracked successfully:", result);

      // Also track as GTM event
      if (typeof window !== "undefined" && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "sale_tracked",
          ecommerce: {
            currency: "USD",
            value: data.productPrice
              ? parseFloat(data.productPrice.replace(/[^0-9.]/g, ""))
              : 0,
            transaction_id: orderId,
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
            business_id: data.businessId,
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

      return true;
    } else {
      console.error(
        "Failed to track sale:",
        response.status,
        response.statusText,
      );
      return false;
    }
  } catch (error) {
    console.error("Error tracking sale:", error);
    return false;
  }
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
