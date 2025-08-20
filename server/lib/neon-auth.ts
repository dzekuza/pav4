import { StackServerApp } from '@stackframe/stack';

// Neon Auth server configuration
export const neonAuthServerConfig = {
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || '',
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY || '',
  jwksUrl: process.env.STACK_JWKS_URL || '',
};

// Create Neon Auth server app
export const neonAuthServer = new StackServerApp({
  projectId: neonAuthServerConfig.projectId,
  secretServerKey: neonAuthServerConfig.secretServerKey,
  jwksUrl: neonAuthServerConfig.jwksUrl,
});

// Middleware to verify Neon Auth tokens
export const requireNeonAuth = async (req: any, res: any, next: any) => {
  try {
    // Get token from Authorization header or cookies
    let token = req.cookies.neon_auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verify token with Neon Auth
    const user = await neonAuthServer.verifyToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Add user info to request
    req.user = user;
    req.userId = user.id;
    
    // For business accounts, we'll need to map to business table
    // This will be handled in the business-specific middleware
    next();
  } catch (error) {
    console.error('Neon Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

// Middleware to require business account
export const requireBusinessAccount = async (req: any, res: any, next: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Find or create business account linked to Neon Auth user
    const { businessService } = await import('../services/database');
    
    let business = await businessService.findBusinessByNeonUserId(req.user.id);
    
    if (!business) {
      // Create business account if it doesn't exist
      business = await businessService.createBusinessFromNeonUser(req.user);
    }

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business account not found',
      });
    }

    // Add business info to request
    req.business = business;
    req.businessId = business.id;
    
    next();
  } catch (error) {
    console.error('Business account middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load business account',
    });
  }
};

export default neonAuthServer;
