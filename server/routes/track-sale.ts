import express from "express";
import { prisma } from "../services/database";

const router = express.Router();

// POST /api/track-sale
router.post("/track-sale", async (req, res) => {
  const { businessId, orderId, amount, domain, customerId } = req.body;

  if (!businessId || !orderId || !amount || !domain) {
    return res.status(400).json({ error: "Missing required data: businessId, orderId, amount, domain" });
  }

  try {
    // Verify the business exists
    const business = await prisma.business.findUnique({
      where: { affiliateId: businessId },
      select: { id: true, name: true, affiliateId: true }
    });

    if (!business) {
      return res.status(400).json({ error: "Invalid business affiliate ID" });
    }

    // Create the conversion record
    await prisma.conversion.create({
      data: {
        businessId,
        orderId,
        amount: parseFloat(amount),
        domain,
        customerId: customerId || null, // Optional customer ID for authenticated users
      },
    });

    // Update business statistics
    await prisma.business.update({
      where: { affiliateId: businessId },
      data: {
        totalPurchases: { increment: 1 },
        totalRevenue: { increment: parseFloat(amount) },
      },
    });

    res.status(200).json({ 
      success: true, 
      business: business.name,
      message: "Sale tracked successfully" 
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("Failed to save conversion:", errorMsg);
    res.status(500).json({ error: "Failed to save conversion", details: errorMsg });
  }
});

export default router; 