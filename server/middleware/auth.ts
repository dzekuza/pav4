import { RequestHandler } from "express";
import { verifyToken, userService } from "../routes/auth";

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

// Middleware to check if user is authenticated
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    const user = await userService.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
};

// Middleware to check if user is admin
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin privileges required" });
  }

  next();
};

// Optional auth middleware - sets user if authenticated but doesn't require it
export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await userService.findUserById(decoded.userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if there's an error
    console.warn("Optional auth error:", error);
    next();
  }
};
