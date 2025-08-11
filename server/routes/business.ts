import { RequestHandler } from "express";
import { businessService, prisma } from "../services/database";
import { requireAdminAuth } from "../middleware/admin-auth";
import { verifyBusinessToken } from "../middleware/business-auth";
import bcrypt from "bcryptjs";

// Register a new business
export const registerBusiness: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      domain,
      website,
      email,
      password,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      country,
      category,
      commission,
    } = req.body;

    if (!name || !domain || !website || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, domain, website, email, and password are required",
      });
    }

    // Validate email format
    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    // Validate domain format
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        success: false,
        error: "Invalid domain format",
      });
    }

    // Check if domain already exists
    const existingBusiness = await businessService.findBusinessByDomain(domain);
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        error: "A business with this domain already exists",
      });
    }

    // Check if email already exists
    const existingBusinessByEmail =
      await businessService.findBusinessByEmail(email);
    if (existingBusinessByEmail) {
      return res.status(400).json({
        success: false,
        error: "A business with this email already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    const business = await businessService.createBusiness({
      name,
      domain,
      website,
      email,
      password: hashedPassword,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      country,
      category,
      commission: commission ? parseFloat(commission) : 0,
    });

    res.status(201).json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email,
        affiliateId: business.affiliateId,
      },
      message:
        "Business registered successfully. You can now log in with your email and password.",
    });
  } catch (error) {
    console.error("Error registering business:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to register business" });
  }
};

// Get all businesses (admin only)
export const getAllBusinesses: RequestHandler = async (req, res) => {
  try {
    const businesses = await businessService.getAllBusinesses();
    res.json({ success: true, businesses });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch businesses" });
  }
};

// Get active businesses (public)
export const getActiveBusinesses: RequestHandler = async (req, res) => {
  try {
    const businesses = await businessService.getActiveBusinesses();
    res.json({ success: true, businesses });
  } catch (error) {
    console.error("Error fetching active businesses:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch businesses" });
  }
};

// Get business by domain
export const getBusinessByDomain: RequestHandler = async (req, res) => {
  try {
    const { domain } = req.params;
    const business = await businessService.findBusinessByDomain(domain);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    res.json({ success: true, business });
  } catch (error) {
    console.error("Error fetching business:", error);
    res.status(500).json({ success: false, error: "Failed to fetch business" });
  }
};

// Update business (admin only)
export const updateBusiness: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const business = await businessService.updateBusiness(
      parseInt(id),
      updateData,
    );
    res.json({
      success: true,
      business,
      message: "Business updated successfully",
    });
  } catch (error) {
    console.error("Error updating business:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update business" });
  }
};

// Delete business (admin only)
export const deleteBusiness: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await businessService.deleteBusiness(parseInt(id));

    res.json({
      success: true,
      message: "Business deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting business:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete business" });
  }
};

// Verify business (admin only)
export const verifyBusiness: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const business = await businessService.verifyBusiness(parseInt(id));

    res.json({
      success: true,
      business,
      message: "Business verified successfully",
    });
  } catch (error) {
    console.error("Error verifying business:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to verify business" });
  }
};

// Get business statistics (admin only)
export const getBusinessStats: RequestHandler = async (req, res) => {
  try {
    const stats = await businessService.getBusinessStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching business stats:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch business stats" });
  }
};

// Update admin commission rate for a business (admin only)
export const updateBusinessCommission: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminCommissionRate } = req.body;

    if (
      typeof adminCommissionRate !== "number" ||
      adminCommissionRate < 0 ||
      adminCommissionRate > 100
    ) {
      return res.status(400).json({
        success: false,
        error: "Commission rate must be a number between 0 and 100",
      });
    }

    const business = await businessService.updateAdminCommissionRate(
      parseInt(id),
      adminCommissionRate,
    );
    res.json({
      success: true,
      business,
      message: "Commission rate updated successfully",
    });
  } catch (error) {
    console.error("Error updating business commission:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update commission rate" });
  }
};

// Update business password (admin only)
export const updateBusinessPassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must contain uppercase, lowercase, and number",
      });
    }

    const business = await businessService.updateBusinessPassword(
      parseInt(id),
      password,
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    res.json({
      success: true,
      message: "Business password updated successfully",
    });
  } catch (error) {
    console.error("Error updating business password:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update business password" });
  }
};

// Get detailed business statistics for admin
export const getBusinessDetailedStats: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await businessService.getBusinessStatistics(parseInt(id));

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching business detailed stats:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch business statistics" });
  }
};

// Get business activity - clicks
export const getBusinessClicks: RequestHandler = async (req, res) => {
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

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    // Get click logs for this business
    const clicks = await businessService.getBusinessClickLogs(
      decoded.businessId,
    );

    res.json({ success: true, clicks });
  } catch (error) {
    console.error("Error getting business clicks:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get business clicks" });
  }
};

// Get business activity - conversions
export const getBusinessConversions: RequestHandler = async (req, res) => {
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

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    // Get conversions for this business
    const conversions = await prisma.conversion.findMany({
      where: { businessId: business.affiliateId },
      orderBy: { timestamp: "desc" },
      take: 100, // Limit to last 100 conversions
    });

    res.json({ success: true, conversions });
  } catch (error) {
    console.error("Error getting business conversions:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get business conversions" });
  }
};
