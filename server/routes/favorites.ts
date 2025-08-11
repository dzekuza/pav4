import express from "express";
import { prisma } from "../services/database";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

// Get user's favorites
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const favorites = await prisma.favorites.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({
      error: "Failed to fetch favorites",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Add a favorite
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      price,
      currency,
      url,
      image,
      store,
      merchant,
      stock,
      rating,
      reviewsCount,
      deliveryPrice,
      details,
      returnPolicy,
      condition = "New",
    } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: "Title and URL are required" });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorites.findFirst({
      where: {
        userId,
        url,
      },
    });

    if (existingFavorite) {
      return res.status(400).json({ error: "Product already in favorites" });
    }

    const favorite = await prisma.favorites.create({
      data: {
        userId: userId as number,
        title,
        price: price?.toString(),
        currency,
        url,
        image,
        store,
        merchant,
        stock,
        rating: rating ? parseFloat(rating) : null,
        reviewsCount: reviewsCount ? parseInt(reviewsCount) : null,
        deliveryPrice,
        details,
        returnPolicy,
        condition,
      } as any,
    });

    res.json(favorite);
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

// Remove a favorite
router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const favoriteId = parseInt(req.params.id);

    const favorite = await prisma.favorites.findFirst({
      where: {
        id: favoriteId,
        userId,
      },
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    await prisma.favorites.delete({
      where: { id: favoriteId },
    });

    res.json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// Check if a product is favorited
router.get("/check", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const favorite = await prisma.favorites.findFirst({
      where: {
        userId,
        url: url as string,
      },
    });

    res.json({ isFavorited: !!favorite, favoriteId: favorite?.id });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ error: "Failed to check favorite status" });
  }
});

export default router;
