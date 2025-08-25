import express from "express";
import { prisma } from "../services/database";
const router = express.Router();

// Test route to verify router is working
router.get("/test", (req, res) => {
  res.json({ message: "Redirect router is working" });
});

// Enhanced redirect route for n8n product suggestions and business tracking
// /api/redirect?to=<url>&source=<source>&user_id=<id>&reseller_id=<id>
router.get("/redirect", async (req, res) => {
  console.log("Redirect route hit with query:", req.query);
  const { to, source, user_id, reseller_id } = req.query;

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

  // Enhanced business domain detection
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
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

  console.log("Detected business domain:", hostname, "isBusinessDomain:", isBusinessDomain);

  // Attempt to log a BusinessClick for the matched business domain
  try {
    console.log("Looking for business with domain:", hostname);

    const business = await prisma.business.findFirst({
      where: { domain: hostname },
      select: { id: true, affiliateId: true, domain: true },
    });

    if (business) {
      console.log("Found business:", business.id);
      
      // Enhanced click logging with source tracking
      await prisma.businessClick.create({
        data: {
          businessId: business.id,
          productUrl: to,
          userAgent: req.get("User-Agent") || undefined,
          referrer: req.get("Referer") || undefined,
          ipAddress: req.ip,
          utmSource: "ipick.io",
          utmMedium: source === "n8n_suggestion" ? "n8n" : "redirect",
          utmCampaign: source || "product_suggestion",
        },
      });

      // Increment total visits counter
      await prisma.business.update({
        where: { id: business.id },
        data: { totalVisits: { increment: 1 } },
      });
      console.log("Business click logged and visits incremented");

      // For business domains, use referral tracking URL instead of direct redirect
      const baseUrl = process.env.FRONTEND_URL || "https://ipick.io";
      const referralUrl = `${baseUrl}/ref/${business.affiliateId}`;

      // Enhanced UTM parameters for n8n tracking
      const utmParams = new URLSearchParams({
        utm_source: "ipick.io",
        utm_medium: source === "n8n_suggestion" ? "n8n" : "redirect",
        utm_campaign: source || "product_suggestion",
        target_url: to,
        ref_token: Math.random().toString(36).slice(2, 12),
        source: source || "product_suggestion",
        timestamp: Date.now().toString(),
      });

      const finalReferralUrl = `${referralUrl}?${utmParams.toString()}`;
      console.log("Redirecting to business via referral URL:", finalReferralUrl);
      return res.redirect(302, finalReferralUrl);
    } else {
      console.log("No business found for domain:", hostname);
      
      // Even if no business is found, log the click for analytics
      if (isBusinessDomain) {
        console.log("Logging click for business domain without registered business:", hostname);
        // You could create a general analytics table here if needed
      }
    }
  } catch (e) {
    // Do not block redirect on logging failure
    console.error("Failed to log redirect click:", e);
  }

  // For non-business domains or when no business is found, use enhanced redirect logic
  if (user_id) url.searchParams.set("track_user", String(user_id));
  if (reseller_id) url.searchParams.set("aff_id", String(reseller_id));
  
  // Enhanced UTM parameters
  url.searchParams.set("utm_source", "ipick.io");
  url.searchParams.set("utm_medium", source === "n8n_suggestion" ? "n8n" : "redirect");
  url.searchParams.set("utm_campaign", source || "product_suggestion");
  
  // Add source tracking
  if (source) {
    url.searchParams.set("ipick_source", String(source));
  }

  console.log("Redirecting to:", url.toString());
  res.redirect(302, url.toString());
});

export default router;
