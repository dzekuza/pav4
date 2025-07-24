import express from "express";
import { prisma } from "../services/database";

const router = express.Router();

// POST /api/track-sale
router.post("/track-sale", async (req, res) => {
  const { user, orderId, amount, domain } = req.body;

  if (!user || !orderId || !amount || !domain) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    await prisma.conversion.create({
      data: {
        user,
        orderId,
        amount: parseFloat(amount),
        domain,
      },
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to save conversion:", err);
    res.status(500).json({ error: "Failed to save conversion" });
  }
});

export default router; 