import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { adminService } from "../services/database";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Admin login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin by email
    const admin = await adminService.findAdminByEmail(email);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        type: "admin",
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Set HTTP-only cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: "Admin login successful",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin logout
export const adminLogout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("adminToken");
    res.json({
      success: true,
      message: "Admin logout successful",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get current admin
export const getCurrentAdmin = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const admin = await adminService.findAdminById(adminId);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Get current admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create admin (for initial setup)
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if admin already exists
    const existingAdmin = await adminService.findAdminByEmail(email);

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin
    const admin = await adminService.createAdmin({
      email,
      password: hashedPassword,
      name,
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Promote existing user to admin by email
export const promoteUserToAdmin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "email is required" });
    }
    const result = await (adminService as any).promoteUserToAdmin?.(email);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found or service not implemented",
      });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Promote user error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
