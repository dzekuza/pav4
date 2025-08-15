import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { api } from "../api";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const { searchParams } = url;
  
  const to = searchParams.get('to');
  const userId = searchParams.get('user_id');
  const resellerId = searchParams.get('reseller_id');

  if (!to) {
    return json({ error: "Missing destination URL" }, { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(to);
  } catch {
    return json({ error: "Invalid destination URL" }, { status: 400 });
  }

  // Attempt to log a BusinessReferral for the matched business domain
  try {
    // Extract bare domain without www.
    const hostname = targetUrl.hostname.toLowerCase().replace(/^www\./, "");
    console.log("Looking for business with domain:", hostname);

    // Create a business referral record for tracking
    await api.businessReferral.create({
      businessDomain: hostname,
      referralId: `redirect_${resellerId || 'unknown'}_${Date.now()}`,
      targetUrl: to,
      sourceUrl: request.headers.get("Referer") || "direct",
      userId: userId || resellerId || "unknown",
      clickedAt: new Date(),
      utmSource: "pavlo4",
      utmMedium: "redirect",
      utmCampaign: "product_suggestion",
      conversionStatus: "pending"
    });

    console.log("Business referral logged");

    // For business domains, use referral tracking URL instead of direct redirect
    const baseUrl = process.env.FRONTEND_URL || 'https://checkoutdata.gadget.app';
    const referralUrl = `${baseUrl}/ref/${resellerId || 'unknown'}`;
    
    // Add UTM parameters to the referral URL
    const utmParams = new URLSearchParams();
    utmParams.set("utm_source", "pavlo4");
    utmParams.set("utm_medium", "redirect");
    utmParams.set("utm_campaign", "product_suggestion");
    utmParams.set("target_url", encodeURIComponent(to));
    utmParams.set("ref_token", Math.random().toString(36).slice(2, 12));

    const finalReferralUrl = `${referralUrl}?${utmParams.toString()}`;
    console.log("Redirecting to business via referral URL:", finalReferralUrl);
    return redirect(finalReferralUrl);
  } catch (e) {
    // Do not block redirect on logging failure
    console.error("Failed to log redirect click:", e);
  }

  // For non-business domains, use the original redirect logic
  if (userId) targetUrl.searchParams.set("track_user", String(userId));
  if (resellerId) targetUrl.searchParams.set("aff_id", String(resellerId));
  targetUrl.searchParams.set("utm_source", "pavlo4");

  console.log("Redirecting to:", targetUrl.toString());
  return redirect(targetUrl.toString());
};

export default function RedirectAPI() {
  return null; // This component doesn't render anything
}
