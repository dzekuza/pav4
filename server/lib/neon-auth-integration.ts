// Proper Neon Auth Integration using Stack Auth API
import { Request, Response } from 'express';
import { businessService } from '../services/database';

// Neon Auth API configuration
const NEON_AUTH_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || '',
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY || '',
  apiUrl: 'https://api.stack-auth.com/api/v1',
};

// Neon Auth API client
class NeonAuthAPI {
  private projectId: string;
  private secretServerKey: string;
  private apiUrl: string;

  constructor() {
    this.projectId = NEON_AUTH_CONFIG.projectId;
    this.secretServerKey = NEON_AUTH_CONFIG.secretServerKey;
    this.apiUrl = NEON_AUTH_CONFIG.apiUrl;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.secretServerKey}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Neon Auth API request failed:', error);
      throw error;
    }
  }

  // Create a new user in Neon Auth
  async createUser(email: string, password: string, name?: string) {
    return this.makeRequest(`/projects/${this.projectId}/users`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name: name || email.split('@')[0],
      }),
    });
  }

  // Get user by ID
  async getUser(userId: string) {
    return this.makeRequest(`/projects/${this.projectId}/users/${userId}`);
  }

  // Get user by email
  async getUserByEmail(email: string) {
    return this.makeRequest(`/projects/${this.projectId}/users?email=${encodeURIComponent(email)}`);
  }

  // Update user
  async updateUser(userId: string, data: any) {
    return this.makeRequest(`/projects/${this.projectId}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete user
  async deleteUser(userId: string) {
    return this.makeRequest(`/projects/${this.projectId}/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // List all users
  async listUsers() {
    return this.makeRequest(`/projects/${this.projectId}/users`);
  }

  // Authenticate user with credentials
  async authenticateUser(email: string, password: string) {
    return this.makeRequest(`/projects/${this.projectId}/auth/sign-in`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });
  }
}

const neonAuthAPI = new NeonAuthAPI();

// Enhanced auth routes that integrate with Neon Auth and local business table
export const enhancedAuthRoutes = {
  // Sign up - create user in Neon Auth and business in local DB
  signUp: async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      console.log('Creating user in Neon Auth...');
      
      // Create user in Neon Auth
      const neonUser = await neonAuthAPI.createUser(email, password, name);
      
      console.log('Neon Auth user created:', neonUser);

      // Create business in local database
      const business = await businessService.createBusiness({
        name: name || 'New Business',
        domain: email.split('@')[1] || 'example.com',
        website: `https://${email.split('@')[1] || 'example.com'}`,
        email,
        password,
      });

      // Update business with Neon user ID if the field exists
      if (neonUser.id) {
        try {
          await businessService.updateBusiness(business.id, {
            neonUserId: neonUser.id,
          } as any);
        } catch (error) {
          console.log('Note: neonUserId field may not exist in business schema');
        }
      }

      console.log('Business created in local DB:', business);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          id: neonUser.id,
          email: neonUser.email,
          name: neonUser.name,
        },
        business: {
          id: business.id,
          name: business.name,
          domain: business.domain,
        },
      });
    } catch (error) {
      console.error('Sign up error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  // Sign in - authenticate with Neon Auth and find business
  signIn: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      console.log('Authenticating with Neon Auth...');

      // Authenticate with Neon Auth
      const authResult = await neonAuthAPI.authenticateUser(email, password);
      
      console.log('Neon Auth authentication result:', authResult);

      // Find business in local database
      const business = await businessService.findBusinessByEmail(email);
      
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      // Update business with Neon user ID if not set
      if (!business.neonUserId && authResult.user?.id) {
        try {
          await businessService.updateBusiness(business.id, {
            neonUserId: authResult.user.id,
          } as any);
        } catch (error) {
          console.log('Note: neonUserId field may not exist in business schema');
        }
      }

      res.json({
        success: true,
        message: 'Authentication successful',
        user: authResult.user,
        business: {
          id: business.id,
          name: business.name,
          domain: business.domain,
        },
        token: authResult.token, // JWT token from Neon Auth
      });
    } catch (error) {
      console.error('Sign in error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  },

  // Get current user - get from Neon Auth and find business
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId; // Set by middleware
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log('Getting user from Neon Auth:', userId);

      // Get user from Neon Auth
      const neonUser = await neonAuthAPI.getUser(userId);
      
      // Find business in local database
      const business = await businessService.findBusinessById(parseInt(userId));

      res.json({
        success: true,
        user: neonUser,
        business: business ? {
          id: business.id,
          name: business.name,
          domain: business.domain,
        } : null,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  },

  // Sign out
  signOut: async (req: Request, res: Response) => {
    try {
      // Neon Auth handles sign out on the client side
      res.json({ success: true, message: 'Signed out successfully' });
    } catch (error) {
      console.error('Sign out error:', error);
      res.status(500).json({ error: 'Failed to sign out' });
    }
  },

  // List all users (admin only)
  listUsers: async (req: Request, res: Response) => {
    try {
      const users = await neonAuthAPI.listUsers();
      res.json({ success: true, users });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ error: 'Failed to list users' });
    }
  },
};




