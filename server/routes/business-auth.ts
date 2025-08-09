import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import { businessService, prisma } from "../services/database";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to generate JWT token for business
function generateBusinessToken(businessId: number, email: string) {
  return jwt.sign(
    { businessId, email, type: "business" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Helper function to verify business token
function verifyBusinessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

// Business registration with authentication
export const registerBusiness: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      domain,
      website,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      country,
      category,
      commission,
      email,
      password
    } = req.body;

    if (!name || !domain || !website || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, domain, website, email, and password are required"
      });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        success: false,
        error: "Invalid domain format"
      });
    }

    // Check if domain already exists
    const existingBusinessByDomain = await businessService.findBusinessByDomain(domain);
    if (existingBusinessByDomain) {
      return res.status(400).json({
        success: false,
        error: "A business with this domain already exists"
      });
    }

    // Check if email already exists
    const existingBusinessByEmail = await businessService.findBusinessByEmail(email);
    if (existingBusinessByEmail) {
      return res.status(400).json({
        success: false,
        error: "A business with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const business = await businessService.createBusiness({
      name,
      domain,
      website,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      country,
      category,
      commission: commission ? parseFloat(commission) : 0,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = generateBusinessToken(business.id, business.email);

    // Set cookie
    res.cookie("business_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email,
      },
      message: "Business registered successfully"
    });
  } catch (error) {
    console.error("Error registering business:", error);
    res.status(500).json({ success: false, error: "Failed to register business" });
  }
};

// Business login
export const loginBusiness: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const business = await businessService.findBusinessByEmail(email);
    if (!business) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    if (!business.isActive) {
      return res.status(401).json({
        success: false,
        error: "Business account is deactivated"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, business.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Generate token
    const token = generateBusinessToken(business.id, business.email);

    // Set cookie
    res.cookie("business_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email,
      },
      message: "Business login successful"
    });
  } catch (error) {
    console.error("Error logging in business:", error);
    res.status(500).json({ success: false, error: "Failed to login" });
  }
};

// Get current business
export const getCurrentBusiness: RequestHandler = async (req, res) => {
  try {
    // Check for token in cookies or Authorization header
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.json({
        business: null,
        authenticated: false
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.json({
        business: null,
        authenticated: false
      });
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.json({
        business: null,
        authenticated: false
      });
    }

    res.json({
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email,
        affiliateId: business.affiliateId,
        trackingVerified: business.trackingVerified,
      },
      authenticated: true
    });
  } catch (error) {
    console.error("Error getting current business:", error);
    res.json({
      business: null,
      authenticated: false
    });
  }
};

// Business logout
export const logoutBusiness: RequestHandler = async (req, res) => {
  res.clearCookie("business_token");
  res.json({ success: true, message: "Business logged out successfully" });
};

// Get business statistics
export const getBusinessStats: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token"
      });
    }

    const stats = await businessService.getBusinessStatistics(decoded.businessId);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Business not found"
      });
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error getting business stats:", error);
    res.status(500).json({ success: false, error: "Failed to get business statistics" });
  }
};

// Verify business tracking
export const verifyBusinessTracking: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token"
      });
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found"
      });
    }

    // Get the page URL from request body
    const { pageUrl } = req.body;
    if (!pageUrl) {
      return res.status(400).json({
        success: false,
        error: "Page URL is required"
      });
    }

    // Validate URL
    let url;
    try {
      url = new URL(pageUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format"
      });
    }

    // Fetch the page content
    let pageContent;
    try {
      console.log('Fetching page content from:', pageUrl);
      const response = await axios.get(pageUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      pageContent = response.data;
      console.log('Successfully fetched page content, length:', pageContent.length);
    } catch (error) {
      console.error('Error fetching page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(400).json({
        success: false,
        error: `Could not fetch the page: ${errorMessage}. Please check the URL and try again.`
      });
    }

    // Check for tracking script presence
    const trackingScripts = [
      'https://pavlo4.netlify.app/tracker.js',
      'https://pavlo4.netlify.app/shopify-tracker.js',
      'https://pavlo4.netlify.app/shopify-tracker-enhanced.js',
      'https://pavlo4.netlify.app/shopify-tracker-loader.js',
      'https://pavlo4.netlify.app/woocommerce-tracker.js',
      'https://pavlo4.netlify.app/magento-tracker.js',
      'https://pavlo4.netlify.app/event-tracker.js'
    ];

    console.log('Checking for tracking scripts...');
    const foundScripts = trackingScripts.filter(script => {
      const found = pageContent.includes(script);
      console.log(`Script ${script}: ${found ? 'FOUND' : 'NOT FOUND'}`);
      return found;
    });

    console.log('Found scripts:', foundScripts);

    // Check for Google Tag Manager
    const hasGTM = pageContent.includes('googletagmanager.com') ||
      pageContent.includes('GTM-') ||
      pageContent.includes('dataLayer');

    if (foundScripts.length === 0) {
      let errorMessage = "No tracking script found on the page. Please add the tracking script to your website's HTML head section.";
      let instructions = {
        step1: "Add this script to your website's <head> section:",
        script: `<script src="https://pavlo4.netlify.app/shopify-tracker-loader.js" data-business-id="${business.id}" data-affiliate-id="${business.affiliateId}" data-platform="shopify"></script>`,
        step2: "Make sure the script is placed before the closing </head> tag",
        step3: "Refresh the page and try verification again"
      };

      if (hasGTM) {
        errorMessage = "Google Tag Manager detected but no tracking script found. Please add the tracking script via GTM or directly in HTML.";
        instructions = {
          step1: "For Google Tag Manager implementation:",
          script: `<script src="https://pavlo4.netlify.app/shopify-tracker-loader.js" data-business-id="${business.id}" data-affiliate-id="${business.affiliateId}" data-platform="shopify"></script>`,
          step2: "1. Go to your GTM container",
          step3: "2. Create a new Custom HTML tag with this code:"
        } as any;
      }

      return res.status(400).json({
        success: false,
        error: errorMessage,
        instructions: instructions,
        hasGTM: hasGTM
      });
    }

    // Check for business ID in the script
    const businessIdPattern = new RegExp(`data-business-id=["']${business.id}["']`, 'i');
    const affiliateIdPattern = new RegExp(`data-affiliate-id=["']${business.affiliateId}["']`, 'i');

    const hasBusinessId = businessIdPattern.test(pageContent);
    const hasAffiliateId = affiliateIdPattern.test(pageContent);

    console.log('Business ID check:', {
      businessId: business.id,
      affiliateId: business.affiliateId,
      hasBusinessId,
      hasAffiliateId
    });

    if (!hasBusinessId || !hasAffiliateId) {
      return res.status(400).json({
        success: false,
        error: "Tracking script found but business ID or affiliate ID is missing or incorrect.",
        foundScripts,
        hasBusinessId,
        hasAffiliateId,
        expectedBusinessId: business.id,
        expectedAffiliateId: business.affiliateId
      });
    }

    // Mark tracking as verified
    await prisma.business.update({
      where: { id: business.id },
      data: { trackingVerified: true }
    });

    res.json({
      success: true,
      message: "Tracking verified successfully! The script is properly installed on your page.",
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email,
        affiliateId: business.affiliateId,
        trackingVerified: true
      },
      verification: {
        foundScripts,
        hasBusinessId,
        hasAffiliateId,
        pageUrl
      }
    });
  } catch (error) {
    console.error("Error verifying business tracking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify tracking",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}; 