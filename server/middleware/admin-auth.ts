import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { adminService } from "../services/database";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Admin authentication middleware
export const requireAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    // Check if admin exists and is active
    const admin = await adminService.findAdminById(decoded.adminId);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Admin account is deactivated",
      });
    }

    // Add admin info to request
    (req as any).adminId = admin.id;
    (req as any).adminEmail = admin.email;
    (req as any).adminRole = admin.role;

    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Optional admin authentication middleware
export const optionalAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.adminToken;

    if (!token) {
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== "admin") {
      return next();
    }

    // Check if admin exists and is active
    const admin = await adminService.findAdminById(decoded.adminId);

    if (!admin || !admin.isActive) {
      return next();
    }

    // Add admin info to request
    (req as any).adminId = admin.id;
    (req as any).adminEmail = admin.email;
    (req as any).adminRole = admin.role;

    next();
  } catch (error) {
    // If token is invalid, just continue without admin info
    next();
  }
}; 