import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database';

// Middleware to check if domain is verified for script loading
export const requireDomainVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    
    // Extract domain from Origin or Referer header
    let domain = '';
    if (origin) {
      domain = new URL(origin).hostname;
    } else if (referer) {
      domain = new URL(referer).hostname;
    }
    
    if (!domain) {
      return res.status(403).json({
        success: false,
        error: 'Domain verification required. Please verify your domain ownership first.'
      });
    }
    
    // Check if domain is verified
    const verification = await prisma.domainVerification.findFirst({
      where: {
        domain: domain.toLowerCase(),
        status: 'verified'
      }
    });
    
    if (!verification) {
      return res.status(403).json({
        success: false,
        error: 'Domain not verified. Please verify your domain ownership to use PriceHunt tracking.',
        verificationUrl: 'https://pavlo4.netlify.app/business-integrate'
      });
    }
    
    // Add business info to request for later use
    req.business = await prisma.business.findUnique({
      where: { id: verification.businessId }
    });
    
    next();
  } catch (error) {
    console.error('Domain verification middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Domain verification check failed'
    });
  }
};

// Middleware to check domain verification for specific endpoints
export const checkDomainForScript = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain parameter required'
      });
    }
    
    // Check if domain is verified
    const verification = await prisma.domainVerification.findFirst({
      where: {
        domain: domain.toString().toLowerCase(),
        status: 'verified'
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            affiliateId: true
          }
        }
      }
    });
    
    if (!verification) {
      return res.status(403).json({
        success: false,
        error: 'Domain not verified',
        message: 'Please verify your domain ownership to use PriceHunt tracking scripts.'
      });
    }
    
    // Add verification info to request
    req.verifiedDomain = verification;
    next();
  } catch (error) {
    console.error('Domain check error:', error);
    res.status(500).json({
      success: false,
      error: 'Domain verification check failed'
    });
  }
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      business?: any;
      verifiedDomain?: any;
    }
  }
}
