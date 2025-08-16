import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { businessService } from "../services/database";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify business token
export function verifyBusinessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

export const requireBusinessAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check for token in cookies or Authorization header
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
        error: "Authentication required",
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      console.error("Business auth: Invalid token or wrong type", { decoded });
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    console.log("Business auth: Token decoded successfully", {
      businessId: decoded.businessId,
      email: decoded.email,
      type: decoded.type,
    });

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      console.error("Business auth: Business not found", {
        businessId: decoded.businessId,
      });
      return res.status(401).json({
        success: false,
        error: "Business not found",
      });
    }

    console.log("Business auth: Business found", {
      businessId: business.id,
      name: business.name,
      domain: business.domain,
    });

    if (!business.isActive) {
      return res.status(401).json({
        success: false,
        error: "Business account is deactivated",
      });
    }

    // Add business info to request
    (req as any).business = {
      id: business.id,
      name: business.name,
      domain: business.domain,
      email: business.email,
    };

    next();
  } catch (error) {
    console.error("Business auth error:", error);
    res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
};
