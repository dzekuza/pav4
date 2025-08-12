import express from "express";
import { prisma } from "../services/database";
import { emailService } from "../services/email";

const router = express.Router();

// POST /api/track-sale
router.post("/track-sale", async (req, res) => {
  const { businessId, orderId, amount, domain, customerId } = req.body;

  if (!businessId || !orderId || !amount || !domain) {
    return res
      .status(400)
      .json({
        error: "Missing required data: businessId, orderId, amount, domain",
      });
  }

  try {
    // Verify the business exists
    const business = await prisma.business.findUnique({
      where: { affiliateId: businessId },
      select: { id: true, name: true, affiliateId: true, email: true, adminCommissionRate: true },
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

    // Calculate commission
    const commission = (parseFloat(amount) * business.adminCommissionRate) / 100;

    // Update business statistics
    await prisma.business.update({
      where: { affiliateId: businessId },
      data: {
        totalPurchases: { increment: 1 },
        totalRevenue: { increment: parseFloat(amount) },
      },
    });

    // Send sales notification email (async, don't wait for it)
    emailService.sendSalesNotificationEmail(
      business.email,
      business.name,
      {
        orderId,
        amount: parseFloat(amount),
        commission,
        productUrl: domain,
      }
    ).then(result => {
      if (result.success) {
        console.log('Sales notification email sent successfully to:', business.email);
      } else {
        console.error('Failed to send sales notification email:', result.error);
      }
    }).catch(error => {
      console.error('Error sending sales notification email:', error);
    });

    res.status(200).json({
      success: true,
      business: business.name,
      message: "Sale tracked successfully",
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("Failed to save conversion:", errorMsg);
    res
      .status(500)
      .json({ error: "Failed to save conversion", details: errorMsg });
  }
});

export default router;
