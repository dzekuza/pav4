import { RequestHandler } from 'express';
import { prisma } from '../services/database';

// Generate a unique verification token for a domain
export const generateVerificationToken: RequestHandler = async (req, res) => {
  try {
    const { businessId, domain } = req.body;
    const authenticatedBusiness = (req as any).business;

    if (!businessId || !domain) {
      return res.status(400).json({
        success: false,
        error: 'Business ID and domain are required'
      });
    }

    // Validate that the authenticated user owns this business
    if (!authenticatedBusiness || authenticatedBusiness.id !== parseInt(businessId)) {
      return res.status(403).json({
        success: false,
        error: 'You can only verify domains for your own business'
      });
    }

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: parseInt(businessId) }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Check if there's already a valid verification token for this business-domain combination
    const existingVerification = await prisma.domainVerification.findFirst({
      where: {
        businessId: parseInt(businessId),
        domain: domain.toLowerCase(),
        status: 'pending',
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let verificationToken: string;
    let verificationRecord: any;

    if (existingVerification) {
      // Use existing token if it's still valid
      verificationToken = existingVerification.verificationToken;
      verificationRecord = existingVerification;
    } else {
      // Generate new token only if no valid one exists
      verificationToken = `pricehunt_verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store new verification attempt
      verificationRecord = await prisma.domainVerification.create({
        data: {
          businessId: parseInt(businessId),
          domain: domain.toLowerCase(),
          verificationToken,
          status: 'pending',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
    }

    res.json({
      success: true,
      verificationToken,
      isExisting: !!existingVerification,
      instructions: {
        method: 'txt',
        record: `pricehunt-verification=${verificationToken}`,
        domain: domain,
        ttl: 300
      }
    });

  } catch (error) {
    console.error('Error generating verification token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate verification token'
    });
  }
};

// Verify domain ownership by checking TXT record
export const verifyDomain: RequestHandler = async (req, res) => {
  try {
    const { businessId, domain, verificationToken } = req.body;
    const authenticatedBusiness = (req as any).business;

    if (!businessId || !domain || !verificationToken) {
      return res.status(400).json({
        success: false,
        error: 'Business ID, domain, and verification token are required'
      });
    }

    // Validate that the authenticated user owns this business
    if (!authenticatedBusiness || authenticatedBusiness.id !== parseInt(businessId)) {
      return res.status(403).json({
        success: false,
        error: 'You can only verify domains for your own business'
      });
    }

    // Check if verification record exists and is valid
    const verification = await prisma.domainVerification.findFirst({
      where: {
        businessId: parseInt(businessId),
        domain: domain.toLowerCase(),
        verificationToken,
        status: 'pending',
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Verification token not found or expired'
      });
    }

    // Verify TXT record
    const dns = require('dns').promises;
    const expectedRecord = `pricehunt-verification=${verificationToken}`;
    
    try {
      const txtRecords = await dns.resolveTxt(domain);
      const found = txtRecords.some(records => 
        records.some(record => record === expectedRecord)
      );

      if (found) {
        // Mark domain as verified
        await prisma.domainVerification.update({
          where: { id: verification.id },
          data: { status: 'verified', verifiedAt: new Date() }
        });

        // Update business domain if it's different
        await prisma.business.update({
          where: { id: parseInt(businessId) },
          data: { 
            domain: domain.toLowerCase()
          }
        });

        res.json({
          success: true,
          message: 'Domain verified successfully!',
          domain: domain.toLowerCase()
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'TXT record not found. Please add the TXT record and try again.',
          expectedRecord
        });
      }
    } catch (dnsError) {
      res.status(400).json({
        success: false,
        error: 'Failed to resolve DNS records. Please check the domain and try again.'
      });
    }

  } catch (error) {
    console.error('Error verifying domain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify domain'
    });
  }
};

// Check if domain is verified for script loading
export const checkDomainVerification: RequestHandler = async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain parameter is required'
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

    if (verification) {
      res.json({
        success: true,
        verified: true,
        business: verification.business
      });
    } else {
      res.json({
        success: true,
        verified: false
      });
    }

  } catch (error) {
    console.error('Error checking domain verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check domain verification'
    });
  }
};

// Get verification status for a business
export const getVerificationStatus: RequestHandler = async (req, res) => {
  try {
    const { businessId } = req.params;

    const verifications = await prisma.domainVerification.findMany({
      where: {
        businessId: parseInt(businessId)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      verifications
    });

  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get verification status'
    });
  }
};
