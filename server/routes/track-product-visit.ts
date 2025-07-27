import express from "express";
import { prisma } from "../services/database";

const router = express.Router();

// POST /api/track-product-visit
router.post("/track-product-visit", async (req, res) => {
  const { 
    productUrl, 
    productTitle, 
    productPrice, 
    businessId, 
    source = 'direct',
    userAgent,
    referrer,
    ip 
  } = req.body;

  if (!productUrl) {
    return res.status(400).json({ error: "Product URL is required" });
  }

  try {
    // Extract domain from product URL
    let domain = '';
    try {
      const url = new URL(productUrl);
      domain = url.hostname.toLowerCase().replace(/^www\./, '');
    } catch (error) {
      domain = 'unknown';
    }

    // Find business by domain (if not provided)
    let business = null;
    if (businessId) {
      business = await prisma.business.findUnique({
        where: { affiliateId: businessId }
      });
    } else {
      // Try to find business by domain
      business = await prisma.business.findFirst({
        where: { domain: domain }
      });
    }

    // Log the product visit
    await prisma.clickLog.create({
      data: {
        affiliateId: business?.affiliateId || 'unknown',
        productId: productUrl,
        userId: null, // Will be null for non-authenticated users
        userAgent: userAgent || req.get('User-Agent'),
        referrer: referrer || req.get('Referer'),
        ip: ip || req.ip,
        timestamp: new Date()
      },
    });

    // Update business statistics if business found
    if (business) {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          totalVisits: { increment: 1 }
        }
      });
    }

    res.status(200).json({ 
      success: true, 
      business: business?.name || 'Unknown',
      message: "Product visit tracked successfully" 
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("Failed to track product visit:", errorMsg);
    res.status(500).json({ error: "Failed to track product visit", details: errorMsg });
  }
});

export default router; 