import express from "express";
import { prisma } from "../services/database";
const router = express.Router();

// Test route to verify router is working
router.get("/test", (req, res) => {
  res.json({ message: "Redirect router is working" });
});

// /api/redirect?to=<url>&user_id=<id>&reseller_id=<id>
router.get("/redirect", async (req, res) => {
  console.log("Redirect route hit with query:", req.query);
  const { to, user_id, reseller_id } = req.query;

  if (!to || typeof to !== "string") {
    console.log("Missing or invalid 'to' parameter");
    return res.status(400).json({ error: "Missing destination URL" });
  }

  let url;
  try {
    url = new URL(to);
  } catch {
    console.log("Invalid URL:", to);
    return res.status(400).json({ error: "Invalid destination URL" });
  }

  // Attempt to log a BusinessClick for the matched business domain
  try {
    // Extract bare domain without www.
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    console.log("Looking for business with domain:", hostname);

    const business = await prisma.business.findFirst({
      where: { domain: hostname },
      select: { id: true, affiliateId: true, domain: true },
    });

    if (business) {
      console.log("Found business:", business.id);
      await prisma.businessClick.create({
        data: {
          businessId: business.id,
          productUrl: to,
          userAgent: req.get("User-Agent") || undefined,
          referrer: req.get("Referer") || undefined,
          ipAddress: req.ip,
          utmSource: "ipick.io",
          utmMedium: "redirect",
          utmCampaign: "product_suggestion",
        },
      });

      // Increment total visits counter
      await prisma.business.update({
        where: { id: business.id },
        data: { totalVisits: { increment: 1 } },
      });
      console.log("Business click logged and visits incremented");

      // For business domains, use referral tracking URL instead of direct redirect
      const baseUrl = process.env.FRONTEND_URL || 'https://ipick.io';
      const referralUrl = `${baseUrl}/ref/${business.affiliateId}`;
      
      // Add UTM parameters to the referral URL
      const utmParams = new URLSearchParams({
        utm_source: "ipick.io",
        utm_medium: "redirect",
        utm_campaign: "product_suggestion",
        target_url: to, // Don't double-encode, just pass the URL as-is
        ref_token: Math.random().toString(36).slice(2, 12),
      });

      const finalReferralUrl = `${referralUrl}?${utmParams.toString()}`;
      console.log("Redirecting to business via referral URL:", finalReferralUrl);
      return res.redirect(302, finalReferralUrl);
    } else {
      console.log("No business found for domain:", hostname);
    }
  } catch (e) {
    // Do not block redirect on logging failure
    console.error("Failed to log redirect click:", e);
  }

  // For non-business domains, use the original redirect logic
  if (user_id) url.searchParams.set("track_user", String(user_id));
  if (reseller_id) url.searchParams.set("aff_id", String(reseller_id));
  url.searchParams.set("utm_source", "ipick.io");

  console.log("Redirecting to:", url.toString());
  res.redirect(302, url.toString());
});

export default router;
