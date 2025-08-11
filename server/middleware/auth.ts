import { RequestHandler } from "express";
import { verifyToken, userService } from "../routes/auth";
import { setUserContext, clearUserContext } from "../services/database";

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

// Middleware to check if user is authenticated
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    // Check for token in cookies or Authorization header
    let token = req.cookies.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    try {
      // Handle both string and number user IDs
      const userId =
        typeof decoded.userId === "string"
          ? parseInt(decoded.userId, 10)
          : decoded.userId;

      if (isNaN(userId)) {
        return res.status(401).json({ error: "Invalid user ID in token" });
      }

      const user = await userService.findUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      };

      // Set RLS context for this request
      await setUserContext(user.id, user.email);

      next();
    } catch (dbError) {
      console.error("Database error in requireAuth:", dbError);
      return res
        .status(500)
        .json({ error: "Database error during authentication" });
    }
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
    // Check for token in cookies or Authorization header
    let token = req.cookies.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        try {
          // Handle both string and number user IDs
          const userId =
            typeof decoded.userId === "string"
              ? parseInt(decoded.userId, 10)
              : decoded.userId;

          if (!isNaN(userId)) {
            const user = await userService.findUserById(userId);
            if (user) {
              req.user = {
                id: user.id,
                email: user.email,
                isAdmin: user.isAdmin,
              };

              // Set RLS context for this request
              await setUserContext(user.id, user.email);
            }
          }
        } catch (dbError) {
          // Log the error but don't break the request
          console.warn("Database error in optionalAuth:", dbError);
          // Continue without setting user
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

// Middleware to clear RLS context after request
export const clearRLSContext: RequestHandler = async (req, res, next) => {
  // Clear RLS context after the request is complete
  res.on("finish", async () => {
    try {
      await clearUserContext();
    } catch (error) {
      console.warn("Error clearing RLS context:", error);
    }
  });

  next();
};
