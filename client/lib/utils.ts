import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Enhanced helper function to get the appropriate redirect URL for business domains
export function getRedirectUrl(url: string, source: string = "product_suggestion"): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, "");

    // Enhanced business domain detection
    const isBusinessDomain = 
      hostname.includes("myshopify.com") ||
      hostname.includes("shopify.com") ||
      hostname.includes("amazon.") ||
      hostname.includes("ebay.") ||
      hostname.includes("etsy.com") ||
      hostname.includes("walmart.com") ||
      hostname.includes("target.com") ||
      hostname.includes("bestbuy.com") ||
      hostname.includes("newegg.com") ||
      hostname.includes("aliexpress.com") ||
      hostname.includes("alibaba.com");

    // Add source parameter to track n8n suggestions
    const params = new URLSearchParams({
      to: url,
      source: source,
      timestamp: Date.now().toString(),
    });

    // Use the redirect API which will handle business domains automatically
    return `/api/redirect?${params.toString()}`;
  } catch {
    // If URL parsing fails, fall back to the redirect API
    const params = new URLSearchParams({
      to: url,
      source: source,
      timestamp: Date.now().toString(),
    });
    return `/api/redirect?${params.toString()}`;
  }
}

// Helper function to detect if a URL is from a business domain
export function isBusinessDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, "");
    
    return (
      hostname.includes("myshopify.com") ||
      hostname.includes("shopify.com") ||
      hostname.includes("amazon.") ||
      hostname.includes("ebay.") ||
      hostname.includes("etsy.com") ||
      hostname.includes("walmart.com") ||
      hostname.includes("target.com") ||
      hostname.includes("bestbuy.com") ||
      hostname.includes("newegg.com") ||
      hostname.includes("aliexpress.com") ||
      hostname.includes("alibaba.com")
    );
  } catch {
    return false;
  }
}

// Helper function to extract business domain from URL
export function extractBusinessDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, "");
    
    if (isBusinessDomain(url)) {
      return hostname;
    }
    
    return null;
  } catch {
    return null;
  }
}
