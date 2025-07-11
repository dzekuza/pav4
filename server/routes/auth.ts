import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Simple in-memory user storage (in production, use a database)
interface User {
  id: string;
  email: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  searchHistory: Array<{
    url: string;
    title: string;
    timestamp: Date;
    requestId: string;
  }>;
}

const users = new Map<string, User>();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Helper function to generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// Helper function to verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Register new user
export const register: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      (u) => u.email === email,
    );
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const userId = crypto.randomUUID();
    const user: User = {
      id: userId,
      email,
      password: hashedPassword,
      isAdmin: false, // First user can be made admin manually
      createdAt: new Date(),
      searchHistory: [],
    };

    users.set(userId, user);

    // Generate token
    const token = generateToken(userId);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};

// Login user
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = Array.from(users.values()).find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user.id);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

// Logout user
export const logout: RequestHandler = (req, res) => {
  res.clearCookie("auth_token");
  res.json({ success: true });
};

// Get current user info
export const getCurrentUser: RequestHandler = (req, res) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = users.get(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  });
};

// Add search to user history
export const addToSearchHistory: RequestHandler = (req, res) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = users.get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const { url, title, requestId } = req.body;

    if (!url || !title || !requestId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Add to beginning of search history
    user.searchHistory.unshift({
      url,
      title,
      requestId,
      timestamp: new Date(),
    });

    // Keep only last 50 searches
    if (user.searchHistory.length > 50) {
      user.searchHistory = user.searchHistory.slice(0, 50);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding to search history:", error);
    res.status(500).json({ error: "Failed to add to search history" });
  }
};

// Get user search history
export const getUserSearchHistory: RequestHandler = (req, res) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = users.get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      history: user.searchHistory.slice(0, 20), // Return last 20 searches
    });
  } catch (error) {
    console.error("Error getting search history:", error);
    res.status(500).json({ error: "Failed to get search history" });
  }
};

// Get all users (admin only)
export const getAllUsers: RequestHandler = (req, res) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = users.get(decoded.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const allUsers = Array.from(users.values()).map((u) => ({
      id: u.id,
      email: u.email,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      searchCount: u.searchHistory.length,
    }));

    res.json({ users: allUsers });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
};

// Export users map for other modules to access
export { users };
