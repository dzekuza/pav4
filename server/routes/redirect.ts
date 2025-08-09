import express from "express";
import { prisma } from "../services/database";
const router = express.Router();

// /api/redirect?to=<url>&user_id=<id>&reseller_id=<id>
router.get("/redirect", async (req, res) => {
  const { to, user_id, reseller_id } = req.query;

  if (!to || typeof to !== "string") {
    return res.status(400).json({ error: "Missing destination URL" });
  }

  let url;
  try {
    url = new URL(to);
  } catch {
    return res.status(400).json({ error: "Invalid destination URL" });
  }

  if (user_id) url.searchParams.set("track_user", String(user_id));
  if (reseller_id) url.searchParams.set("aff_id", String(reseller_id));
  url.searchParams.set("utm_source", "pavlo4");

  // Attempt to log a BusinessClick for the matched business domain
  try {
    // Extract bare domain without www.
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    const business = await prisma.business.findFirst({
      where: { domain: hostname },
      select: { id: true },
    });

    if (business) {
      await prisma.businessClick.create({
        data: {
          businessId: business.id,
          productUrl: to,
          userAgent: req.get("User-Agent") || undefined,
          referrer: req.get("Referer") || undefined,
          ipAddress: req.ip,
          utmSource: "pavlo4",
          utmMedium: "redirect",
          utmCampaign: "product_suggestion",
        },
      });

      // Increment total visits counter
      await prisma.business.update({
        where: { id: business.id },
        data: { totalVisits: { increment: 1 } },
      });
    }
  } catch (e) {
    // Do not block redirect on logging failure
    console.error("Failed to log redirect click:", e);
  }

  res.redirect(302, url.toString());
});

export default router; 