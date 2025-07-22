import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { businessService } from "../services/database";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to generate JWT token for business
function generateBusinessToken(businessId: number, email: string) {
  return jwt.sign(
    { businessId, email, type: "business" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Helper function to verify business token
function verifyBusinessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

// Business registration with authentication
export const registerBusiness: RequestHandler = async (req, res) => {
  try {
    const { 
      name, 
      domain, 
      website, 
      description, 
      logo, 
      contactEmail, 
      contactPhone, 
      address, 
      country, 
      category, 
      commission,
      email,
      password
    } = req.body;

    if (!name || !domain || !website || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Name, domain, website, email, and password are required" 
      });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid domain format" 
      });
    }

    // Check if domain already exists
    const existingBusinessByDomain = await businessService.findBusinessByDomain(domain);
    if (existingBusinessByDomain) {
      return res.status(400).json({ 
        success: false, 
        error: "A business with this domain already exists" 
      });
    }

    // Check if email already exists
    const existingBusinessByEmail = await businessService.findBusinessByEmail(email);
    if (existingBusinessByEmail) {
      return res.status(400).json({ 
        success: false, 
        error: "A business with this email already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const business = await businessService.createBusiness({
      name,
      domain,
      website,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      country,
      category,
      commission: commission ? parseFloat(commission) : 0,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = generateBusinessToken(business.id, business.email);

    // Set cookie
    res.cookie("business_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ 
      success: true, 
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email,
      },
      message: "Business registered successfully" 
    });
  } catch (error) {
    console.error("Error registering business:", error);
    res.status(500).json({ success: false, error: "Failed to register business" });
  }
};

// Business login
export const loginBusiness: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and password are required" 
      });
    }

    const business = await businessService.findBusinessByEmail(email);
    if (!business) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid email or password" 
      });
    }

    if (!business.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: "Business account is deactivated" 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, business.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid email or password" 
      });
    }

    // Generate token
    const token = generateBusinessToken(business.id, business.email);

    // Set cookie
    res.cookie("business_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ 
      success: true, 
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email,
      },
      message: "Business login successful" 
    });
  } catch (error) {
    console.error("Error logging in business:", error);
    res.status(500).json({ success: false, error: "Failed to login" });
  }
};

// Get current business
export const getCurrentBusiness: RequestHandler = async (req, res) => {
  try {
    // Check for token in cookies or Authorization header
    let token = req.cookies.business_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.json({ 
        business: null, 
        authenticated: false 
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.json({ 
        business: null, 
        authenticated: false 
      });
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.json({ 
        business: null, 
        authenticated: false 
      });
    }

    res.json({ 
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email,
      },
      authenticated: true 
    });
  } catch (error) {
    console.error("Error getting current business:", error);
    res.json({ 
      business: null, 
      authenticated: false 
    });
  }
};

// Business logout
export const logoutBusiness: RequestHandler = async (req, res) => {
  res.clearCookie("business_token");
  res.json({ success: true, message: "Business logged out successfully" });
};

// Get business statistics
export const getBusinessStats: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: "Not authenticated" 
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid token" 
      });
    }

    const stats = await businessService.getBusinessStatistics(decoded.businessId);
    if (!stats) {
      return res.status(404).json({ 
        success: false, 
        error: "Business not found" 
      });
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error getting business stats:", error);
    res.status(500).json({ success: false, error: "Failed to get business statistics" });
  }
}; 