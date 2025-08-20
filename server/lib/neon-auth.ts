// Simplified Neon Auth server implementation
// This replaces the Stack Auth package dependency

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { businessService } from '../services/database';

// Configuration
export const neonAuthServerConfig = {
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || '',
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY || '',
  jwksUrl: process.env.STACK_JWKS_URL || '',
};

// JWT verification function
async function verifyJWT(token: string): Promise<any> {
  try {
    // For now, we'll use a simple JWT verification
    // In production, you should use the JWKS URL to verify tokens
    const decoded = jwt.verify(token, neonAuthServerConfig.secretServerKey);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Middleware to require Neon Auth authentication
export const requireNeonAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    
    // Add user info to request
    (req as any).user = decoded;
    (req as any).userId = decoded.sub || decoded.userId;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication required' });
  }
};

// Middleware to require business account
export const requireBusinessAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find business account for this user
    const business = await businessService.findBusinessByUserId(userId);
    
    if (!business) {
      return res.status(403).json({ error: 'Business account required' });
    }

    // Add business info to request
    (req as any).business = business;
    (req as any).businessId = business.id;
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Auth routes
export const authRoutes = {
  // Sign in with credentials
  signIn: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // For now, we'll use a simple authentication
      // In production, you should integrate with your actual auth system
      const user = await businessService.findUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          sub: user.id, 
          email: user.email,
          userId: user.id 
        },
        neonAuthServerConfig.secretServerKey,
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: 'Sign in failed' });
    }
  },

  // Sign up with credentials
  signUp: async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      
      // Check if user already exists
      const existingUser = await businessService.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create new user
      const user = await businessService.createUser({
        email,
        password,
        name
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          sub: user.id, 
          email: user.email,
          userId: user.id 
        },
        neonAuthServerConfig.secretServerKey,
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: 'Sign up failed' });
    }
  },

  // Get current user
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await businessService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  },

  // Sign out
  signOut: async (req: Request, res: Response) => {
    // In a stateless JWT system, sign out is handled client-side
    // by removing the token from storage
    res.json({ message: 'Signed out successfully' });
  }
};
