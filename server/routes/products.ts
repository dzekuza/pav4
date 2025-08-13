import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyBusinessToken } from "../middleware/business-auth";

const prisma = new PrismaClient();

// Get business products
export const getBusinessProducts: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const products = await prisma.product.findMany({
      where: {
        businessId: decoded.businessId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching business products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    });
  }
};

// Update business products
export const updateBusinessProducts: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: "Products must be an array",
      });
    }

    if (products.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Maximum 10 products allowed",
      });
    }

    // Validate each product
    for (const product of products) {
      if (!product.url || !product.title) {
        return res.status(400).json({
          success: false,
          error: "Each product must have a URL and title",
        });
      }

      try {
        new URL(product.url);
      } catch {
        return res.status(400).json({
          success: false,
          error: "Invalid URL format in products",
        });
      }
    }

    // Delete existing products
    await prisma.product.deleteMany({
      where: {
        businessId: decoded.businessId,
      },
    });

    // Create new products
    const createdProducts = await Promise.all(
      products.map((product) =>
        prisma.product.create({
          data: {
            businessId: decoded.businessId,
            url: product.url,
            title: product.title,
            description: product.description || null,
            imageUrl: product.imageUrl || null,
            price: product.price || null,
            isActive: product.isActive !== false, // Default to true
          },
        })
      )
    );

    res.json({
      success: true,
      message: "Products updated successfully",
      products: createdProducts,
    });
  } catch (error) {
    console.error("Error updating business products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update products",
    });
  }
};

// Get public products by category
export const getPublicProducts: RequestHandler = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: "Category is required",
      });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        business: {
          category: {
            equals: category,
            mode: "insensitive",
          },
          isActive: true,
        },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            domain: true,
            logo: true,
            affiliateId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching public products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    });
  }
};

// Get all available categories
export const getCategories: RequestHandler = async (req, res) => {
  try {
    // Get categories from registered businesses
    const businessCategories = await prisma.business.findMany({
      where: {
        isActive: true,
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    const businessCategoryList = businessCategories
      .map((c) => c.category)
      .filter(Boolean);

    // Define all available categories
    const allCategories = [
      "Electronics",
      "Fashion", 
      "Home & Garden",
      "Sports",
      "Beauty",
      "Books",
      "Toys",
      "Automotive",
      "Health",
      "Food",
      "Baby & Kids",
      "Pet Supplies",
      "Office & Business",
      "Jewelry & Watches",
      "Tools & Hardware",
      "Music & Instruments",
      "Art & Crafts",
      "Garden & Outdoor",
      "Kitchen & Dining",
      "Bath & Personal Care",
      "Other"
    ];

    // Combine business categories with all available categories and remove duplicates
    const uniqueCategories = [...new Set([...businessCategoryList, ...allCategories])].sort();

    res.json({
      success: true,
      categories: uniqueCategories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};
