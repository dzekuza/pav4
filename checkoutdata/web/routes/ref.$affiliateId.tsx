import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { affiliateId } = params;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('target_url');
  const userAgent = request.headers.get("User-Agent") || "unknown";
  const referer = request.headers.get("Referer") || "direct";
  const clientIp = request.headers.get("X-Forwarded-For") || request.headers.get("X-Real-IP") || "unknown";

  // Enhanced logging for debugging
  console.log("=== REFERRAL FLOW START ===");
  console.log("Affiliate ID:", affiliateId);
  console.log("Target URL:", targetUrl);
  console.log("Referer:", referer);
  console.log("User Agent:", userAgent);
  console.log("Client IP:", clientIp);

  try {
    // Validate affiliateId parameter
    if (!affiliateId || typeof affiliateId !== 'string' || affiliateId.trim().length === 0) {
      console.error("Invalid or missing affiliateId:", affiliateId);
      return new Response("Invalid affiliate ID", { 
        status: 400,
        statusText: "Bad Request - Invalid Affiliate ID"
      });
    }

    // Validate affiliateId format (basic validation)
    if (affiliateId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(affiliateId)) {
      console.error("AffiliateId format validation failed:", affiliateId);
      return new Response("Invalid affiliate ID format", { 
        status: 400,
        statusText: "Bad Request - Invalid Affiliate ID Format"
      });
    }

    // Extract domain from target URL if available
    let businessDomain = "unknown";
    let shop = null;
    let decodedTargetUrl = null;
    
    if (targetUrl) {
      // Enhanced URL decoding with multiple attempts and validation
      decodedTargetUrl = decodeTargetUrl(targetUrl);
      console.log("URL decoding result:");
      console.log("  Original:", targetUrl);
      console.log("  Decoded:", decodedTargetUrl);

      if (decodedTargetUrl) {
        try {
          const targetUrlObj = new URL(decodedTargetUrl);
          businessDomain = targetUrlObj.hostname.replace(/^www\./, "");
          console.log("Extracted business domain:", businessDomain);
          
          // Try to find the shop by domain
          console.log("Searching for Shopify shop with domain:", businessDomain);
          shop = await api.shopifyShop.findFirst({
            filter: {
              domain: { equals: businessDomain }
            }
          });
          console.log("Shop found:", shop ? `Yes (ID: ${shop.id})` : "No");
        } catch (error) {
          console.error("Failed to parse decoded target URL:", decodedTargetUrl, error);
          businessDomain = "invalid_url";
        }
      } else {
        console.error("Failed to decode target URL, cannot extract domain");
        businessDomain = "decode_failed";
      }
    }

    // Generate a unique reference token for this click
    const refToken = `ref_${affiliateId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log("Generated reference token:", refToken);

    // Create tracking records
    await createTrackingRecords({
      shop,
      affiliateId,
      businessDomain,
      targetUrl,
      decodedTargetUrl,
      referer,
      userAgent,
      clientIp,
      refToken
    });

    // Build redirect URL with enhanced UTM parameters
    const redirectUrl = buildRedirectUrl({
      targetUrl: decodedTargetUrl,
      businessDomain,
      affiliateId,
      refToken
    });

    console.log("Final redirect URL:", redirectUrl);
    console.log("=== REFERRAL FLOW SUCCESS ===");

    // Add cache headers to prevent caching of referral redirects
    return redirect(redirectUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

     } catch (error: unknown) {
     console.error("=== REFERRAL FLOW ERROR ===");
     console.error("Error details:", {
       message: error instanceof Error ? error.message : String(error),
       stack: error instanceof Error ? error.stack : undefined,
       affiliateId,
       targetUrl,
       referer
     });

     // Return appropriate error response based on error type
     if (error instanceof Error && error.name === 'ValidationError') {
       return new Response("Invalid request parameters", { 
         status: 400,
         statusText: "Bad Request - Validation Error"
       });
     }

     if (error instanceof Error && error.name === 'DatabaseError') {
       return new Response("Tracking service temporarily unavailable", { 
         status: 503,
         statusText: "Service Unavailable - Database Error"
       });
     }

     return new Response("Error processing referral", { 
       status: 500,
       statusText: "Internal Server Error"
     });
   }
};

// Enhanced URL decoding function with multiple strategies
function decodeTargetUrl(targetUrl: string): string | null {
  if (!targetUrl || typeof targetUrl !== 'string') {
    console.warn("Invalid target URL provided:", targetUrl);
    return null;
  }

  let decodedUrl = targetUrl;
  let attempts = 0;
  const maxAttempts = 3;

  try {
    // Strategy 1: Progressive decoding until no more %XX patterns
    while (decodedUrl.includes('%') && attempts < maxAttempts) {
      attempts++;
      const previousUrl = decodedUrl;
      
      try {
        decodedUrl = decodeURIComponent(decodedUrl);
        console.log(`Decode attempt ${attempts}:`, decodedUrl);
        
        // If no change occurred, we're done
        if (previousUrl === decodedUrl) {
          break;
        }
      } catch (decodeError) {
        console.warn(`Decode attempt ${attempts} failed:`, decodeError);
        // Try manual percentage decoding as fallback
        decodedUrl = decodedUrl.replace(/%([0-9A-F]{2})/g, (match, hex) => {
          try {
            return String.fromCharCode(parseInt(hex, 16));
          } catch {
            return match; // Keep original if conversion fails
          }
        });
        break;
      }
    }

    // Validate the final URL
    try {
      new URL(decodedUrl);
      console.log("URL validation successful for:", decodedUrl);
      return decodedUrl;
    } catch (validationError) {
      console.error("Final URL validation failed:", decodedUrl, validationError);
      
      // Strategy 2: Try to fix common URL issues
      if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
        const fixedUrl = 'https://' + decodedUrl;
        try {
          new URL(fixedUrl);
          console.log("URL fixed by adding https://:", fixedUrl);
          return fixedUrl;
        } catch {
          console.error("Could not fix URL by adding protocol");
        }
      }
      
      return null;
    }

  } catch (error) {
    console.error("URL decoding failed completely:", error);
    return null;
  }
}

// Enhanced tracking record creation with fallback for non-Shopify businesses
async function createTrackingRecords({
  shop,
  affiliateId,
  businessDomain,
  targetUrl,
  decodedTargetUrl,
  referer,
  userAgent,
  clientIp,
  refToken
}: {
  shop: any;
  affiliateId: string;
  businessDomain: string;
  targetUrl: string | null;
  decodedTargetUrl: string | null;
  referer: string;
  userAgent: string;
  clientIp: string;
  refToken: string;
}) {
  const timestamp = new Date();
  
  if (shop) {
    // Create business referral record for Shopify shops
    try {
             console.log("Creating business referral record for Shopify shop...");
       const businessReferral = await api.businessReferral.create({
         businessDomain: businessDomain,
         targetUrl: decodedTargetUrl || targetUrl || referer,
         sourceUrl: referer,
         userId: affiliateId,
         clickedAt: timestamp,
         utmSource: "ipick.io",
         utmMedium: "referral",
         utmCampaign: "business_referral",
         conversionStatus: "pending",
         shop: {
           _link: shop.id
         }
       });
      console.log("Business referral created successfully:", businessReferral.id);
         } catch (error: unknown) {
       console.error("Failed to create business referral for Shopify shop:", {
         error: error instanceof Error ? error.message : String(error),
         businessDomain,
         affiliateId,
         shopId: shop.id
       });
       
       // Don't fail the entire flow if tracking fails
       // Log the error but continue with redirect
       console.warn("Tracking failed but continuing with redirect");
     }
  } else {
    // Create fallback tracking for non-Shopify businesses
    console.log("Creating fallback referral record for non-Shopify business...");
    await createFallbackReferralRecord({
      affiliateId,
      businessDomain,
      targetUrl: decodedTargetUrl || targetUrl,
      referer,
      userAgent,
      clientIp,
      refToken,
      timestamp,
      errorReason: "non_shopify_business"
    });
  }
}

 // Fallback referral tracking for non-Shopify businesses and error cases
 async function createFallbackReferralRecord({
   affiliateId,
   businessDomain,
   targetUrl,
   referer,
   userAgent,
   clientIp,
   refToken,
   timestamp,
   errorReason
 }: {
   affiliateId: string;
   businessDomain: string;
   targetUrl: string | null;
   referer: string;
   userAgent: string;
   clientIp: string;
   refToken: string;
   timestamp: Date;
   errorReason: string;
 }) {
   try {
     // Log the referral attempt for non-Shopify businesses
     console.log("=== NON-SHOPIFY REFERRAL TRACKING ===");
     console.log(JSON.stringify({
       timestamp: timestamp.toISOString(),
       refToken,
       affiliateId,
       businessDomain,
       targetUrl,
       referer,
       userAgent,
       clientIp,
       errorReason,
       message: "Non-Shopify business referral - logging for manual analysis"
     }));
     
     // For now, just log the attempt since we don't have a general tracking table
     // In the future, you could create a general referral tracking model
     console.log("Referral tracking logged for non-Shopify business");
     
   } catch (error: unknown) {
     console.error("Fallback referral tracking failed:", {
       error: error instanceof Error ? error.message : String(error),
       affiliateId,
       businessDomain,
       errorReason
     });
   }
 }

// Enhanced redirect URL building with better UTM parameter handling
function buildRedirectUrl({
  targetUrl,
  businessDomain,
  affiliateId,
  refToken
}: {
  targetUrl: string | null;
  businessDomain: string;
  affiliateId: string;
  refToken: string;
}): string {
  const utmParams = new URLSearchParams();
  utmParams.set("utm_source", "ipick.io");
  utmParams.set("utm_medium", "referral");
  utmParams.set("utm_campaign", "business_referral");
  utmParams.set("aff_id", affiliateId);
  utmParams.set("ref_token", refToken);
  utmParams.set("timestamp", Date.now().toString());

  if (targetUrl) {
    try {
      const targetUrlObj = new URL(targetUrl);
      
      // Preserve existing parameters and add UTM parameters
      const existingParams = new URLSearchParams(targetUrlObj.search);
      
      // Add our UTM parameters, but don't override existing ones
      for (const [key, value] of utmParams.entries()) {
        if (!existingParams.has(key)) {
          existingParams.set(key, value);
        } else {
          console.log(`Parameter ${key} already exists, not overriding`);
        }
      }
      
      targetUrlObj.search = existingParams.toString();
      return targetUrlObj.toString();
      
    } catch (error) {
      console.error("Failed to build redirect URL from target URL:", error);
      // Fallback to business domain
      return buildFallbackRedirectUrl(businessDomain, utmParams);
    }
  } else {
    // Default redirect to business domain
    return buildFallbackRedirectUrl(businessDomain, utmParams);
  }
}

function buildFallbackRedirectUrl(businessDomain: string, utmParams: URLSearchParams): string {
     if (businessDomain === "unknown" || businessDomain === "invalid_url" || businessDomain === "decode_failed") {
     // Last resort fallback
     console.warn("Using last resort fallback URL");
     return `https://checkoutdata.gadget.app/referral-error?${utmParams.toString()}`;
   }
  
  // Ensure domain has protocol
  const domainWithProtocol = businessDomain.startsWith('http') 
    ? businessDomain 
    : `https://${businessDomain}`;
    
  return `${domainWithProtocol}?${utmParams.toString()}`;
}

export default function ReferralHandler() {
  return null; // This component doesn't render anything
}
