import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { affiliateId, domain } = params;

  try {
    // Create a business referral record for tracking
    await api.businessReferral.create({
      businessDomain: domain?.replace(/^www\./, "") || "unknown",
      referralId: `track_${affiliateId}_${domain}_${Date.now()}`,
      targetUrl: request.headers.get("Referer") || "direct",
      sourceUrl: request.headers.get("Referer") || "direct",
      userId: affiliateId,
      clickedAt: new Date(),
      utmSource: "pavlo4",
      utmMedium: "tracking",
      utmCampaign: "domain_tracking",
      conversionStatus: "pending"
    });

    // Redirect to the business domain with UTM parameters
    const utmParams = new URLSearchParams();
    utmParams.set("utm_source", "pavlo4");
    utmParams.set("utm_medium", "tracking");
    utmParams.set("utm_campaign", "domain_tracking");
    utmParams.set("aff_id", affiliateId || "");
    utmParams.set("track_token", Math.random().toString(36).slice(2, 12));

    const redirectUrl = `https://${domain}?${utmParams.toString()}`;
    return redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling tracking redirect:", error);
    return new Response("Error processing tracking link", { status: 500 });
  }
};

export default function TrackingHandler() {
  return null; // This component doesn't render anything
}
