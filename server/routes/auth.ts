import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userService, searchHistoryService } from "../services/database";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Helper function to generate JWT token
function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// Helper function to verify JWT token
export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
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
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = await userService.createUser({
      email,
      password: hashedPassword,
      isAdmin: false, // First user can be made admin manually
    });

    // Generate token
    const token = generateToken(user.id);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      token: token,
      accessToken: token,
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
    const user = await userService.findUserByEmail(email);
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
      token: token,
      accessToken: token,
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
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    // Check for token in cookies or Authorization header
    let token = req.cookies.auth_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      // Return null user instead of 401 for unauthenticated requests
      return res.json({
        user: null,
        authenticated: false
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.json({
        user: null,
        authenticated: false
      });
    }

    // Handle both string and number user IDs
    const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;
    
    if (isNaN(userId)) {
      return res.json({
        user: null,
        authenticated: false
      });
    }

    const user = await userService.findUserById(userId);
    if (!user) {
      return res.json({
        user: null,
        authenticated: false
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      authenticated: true
    });
  } catch (error) {
    console.error("Get current user error:", error);
    // Return null user instead of 500 error
    res.json({
      user: null,
      authenticated: false
    });
  }
};

// Add search to user history
export const addToSearchHistory: RequestHandler = async (req, res) => {
  try {
    // Check for token in cookies or Authorization header
    let token = req.cookies.auth_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Handle both string and number user IDs
    const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;
    
    if (isNaN(userId)) {
      return res.status(401).json({ error: "Invalid user ID in token" });
    }

    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const { url, title, requestId } = req.body;

    if (!url || !title || !requestId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Add to search history
    await searchHistoryService.addSearch(user.id, {
      url,
      title,
      requestId,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error adding to search history:", error);
    res.status(500).json({ error: "Failed to add to search history" });
  }
};

// Get user search history
export const getUserSearchHistory: RequestHandler = async (req, res) => {
  try {
    // Check for token in cookies or Authorization header
    let token = req.cookies.auth_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Handle both string and number user IDs
    const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;
    
    if (isNaN(userId)) {
      return res.status(401).json({ error: "Invalid user ID in token" });
    }

    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const history = await searchHistoryService.getUserSearchHistory(
      user.id,
      20,
    );

    res.json({
      history: history.map((h) => ({
        url: h.url,
        title: h.title,
        requestId: h.requestId,
        timestamp: h.timestamp,
      })),
    });
  } catch (error) {
    console.error("Error getting search history:", error);
    res.status(500).json({ error: "Failed to get search history" });
  }
};

// Get all users (admin only)
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    // This function is now called with admin authentication middleware
    // The admin authentication is handled by requireAdminAuth middleware
    const users = await userService.getAllUsers();

    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        searchCount: u._count.searchHistory,
      })),
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.json({ 
      users: [],
      error: "Failed to get users"
    });
  }
};

// Export database services for other modules to access
export { userService, searchHistoryService };
