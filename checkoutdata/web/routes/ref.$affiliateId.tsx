import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { affiliateId } = params;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('target_url');

  try {
    // Extract domain from target URL if available
    let businessDomain = "unknown";
    let shop = null;
    
    if (targetUrl) {
      try {
        const targetUrlObj = new URL(targetUrl);
        businessDomain = targetUrlObj.hostname.replace(/^www\./, "");
        
        // Try to find the shop by domain
        shop = await api.shopifyShop.findFirst({
          filter: {
            domain: { equals: businessDomain }
          }
        });
      } catch (error) {
        console.error("Invalid target_url:", targetUrl);
      }
    }

    // Create a business referral record for tracking if shop exists
    if (shop) {
      try {
        await api.businessReferral.create({
          referralId: `ref_${affiliateId}_${Date.now()}`,
          businessDomain: businessDomain,
          targetUrl: targetUrl || request.headers.get("Referer") || "direct",
          sourceUrl: request.headers.get("Referer") || "direct",
          userId: affiliateId,
          clickedAt: new Date(),
          utmSource: "ipick.io",
          utmMedium: "referral",
          utmCampaign: "business_referral",
          conversionStatus: "pending",
          shop: {
            _link: shop.id
          }
        });
      } catch (error) {
        console.error("Failed to create business referral:", error);
      }
    } else {
      // If no shop found, this might be a non-Shopify business
      // We'll still proceed with the redirect but won't create a businessReferral record
      console.log('No Shopify shop found for domain:', businessDomain, '- proceeding with redirect');
    }

    // Build redirect URL
    let redirectUrl: string;
    
    if (targetUrl) {
      // If target_url is provided, redirect to the specific product URL
      try {
        // Decode the target_url parameter (it might be double-encoded)
        let decodedTargetUrl = targetUrl;
        try {
          // Try to decode once
          decodedTargetUrl = decodeURIComponent(targetUrl);
          // If it still contains encoded characters, decode again
          if (decodedTargetUrl.includes('%')) {
            decodedTargetUrl = decodeURIComponent(decodedTargetUrl);
          }
        } catch (decodeError) {
          console.warn("Failed to decode target_url, using as-is:", decodeError);
          decodedTargetUrl = targetUrl;
        }
        
        console.log("Original target_url:", targetUrl);
        console.log("Decoded target_url:", decodedTargetUrl);
        
        const targetUrlObj = new URL(decodedTargetUrl);
        // Add UTM parameters to the target URL
        const utmParams = new URLSearchParams();
        utmParams.set("utm_source", "ipick.io");
        utmParams.set("utm_medium", "referral");
        utmParams.set("utm_campaign", "business_referral");
        utmParams.set("aff_id", affiliateId || "");
        utmParams.set("ref_token", Math.random().toString(36).slice(2, 12));
        
        targetUrlObj.search = targetUrlObj.search 
          ? `${targetUrlObj.search}&${utmParams.toString()}`
          : `?${utmParams.toString()}`;
          
        redirectUrl = targetUrlObj.toString();
        console.log("Final redirect URL:", redirectUrl);
      } catch (error) {
        console.error("Invalid target_url:", targetUrl, error);
        // Fallback to business domain
        const utmParams = new URLSearchParams();
        utmParams.set("utm_source", "ipick.io");
        utmParams.set("utm_medium", "referral");
        utmParams.set("utm_campaign", "business_referral");
        utmParams.set("aff_id", affiliateId || "");
        utmParams.set("ref_token", Math.random().toString(36).slice(2, 12));
        redirectUrl = `https://${businessDomain}?${utmParams.toString()}`;
      }
    } else {
      // Default redirect to business domain
      const utmParams = new URLSearchParams();
      utmParams.set("utm_source", "ipick.io");
      utmParams.set("utm_medium", "referral");
      utmParams.set("utm_campaign", "business_referral");
      utmParams.set("aff_id", affiliateId || "");
      utmParams.set("ref_token", Math.random().toString(36).slice(2, 12));
      redirectUrl = `https://${businessDomain}?${utmParams.toString()}`;
    }

    // Redirect to the target URL
    return redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling referral redirect:", error);
    return new Response("Error processing referral", { status: 500 });
  }
};

export default function ReferralHandler() {
  return null; // This component doesn't render anything
}
