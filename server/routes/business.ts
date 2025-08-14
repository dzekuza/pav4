import { RequestHandler } from "express";
import { businessService, prisma } from "../services/database";
import { requireAdminAuth } from "../middleware/admin-auth";
import { verifyBusinessToken } from "../middleware/business-auth";
import { isAnalyticsAllowed, DOMAIN_VERIFICATION_CONFIG } from "../config/domain-verification";
import bcrypt from "bcryptjs";

// Register a new business
export const registerBusiness: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      domain,
      website,
      email,
      password,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      country,
      category,
      commission,
    } = req.body;

    if (!name || !domain || !website || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, domain, website, email, and password are required",
      });
    }

    // Validate email format
    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    // Validate domain format
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        success: false,
        error: "Invalid domain format",
      });
    }

    // Check if domain already exists
    const existingBusiness = await businessService.findBusinessByDomain(domain);
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        error: "A business with this domain already exists",
      });
    }

    // Check if email already exists
    const existingBusinessByEmail =
      await businessService.findBusinessByEmail(email);
    if (existingBusinessByEmail) {
      return res.status(400).json({
        success: false,
        error: "A business with this email already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    const business = await businessService.createBusiness({
      name,
      domain,
      website,
      email,
      password: hashedPassword,
      description,
      logo,
      contactEmail,
      contactPhone,
      address,
      country,
      category,
      commission: commission ? parseFloat(commission) : 0,
    });

    res.status(201).json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email,
        affiliateId: business.affiliateId,
      },
      message:
        "Business registered successfully. You can now log in with your email and password.",
    });
  } catch (error) {
    console.error("Error registering business:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to register business" });
  }
};

// Get all businesses (admin only)
export const getAllBusinesses: RequestHandler = async (req, res) => {
  try {
    const businesses = await businessService.getAllBusinesses();
    res.json({ success: true, businesses });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch businesses" });
  }
};

// Get active businesses (public)
export const getActiveBusinesses: RequestHandler = async (req, res) => {
  try {
    const businesses = await businessService.getActiveBusinesses();
    res.json({ success: true, businesses });
  } catch (error) {
    console.error("Error fetching active businesses:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch businesses" });
  }
};

// Get business by domain
export const getBusinessByDomain: RequestHandler = async (req, res) => {
  try {
    const { domain } = req.params;
    const business = await businessService.findBusinessByDomain(domain);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    res.json({ success: true, business });
  } catch (error) {
    console.error("Error fetching business:", error);
    res.status(500).json({ success: false, error: "Failed to fetch business" });
  }
};

// Update business (admin only)
export const updateBusiness: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const business = await businessService.updateBusiness(
      parseInt(id),
      updateData,
    );
    res.json({
      success: true,
      business,
      message: "Business updated successfully",
    });
  } catch (error) {
    console.error("Error updating business:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update business" });
  }
};

// Delete business (admin only)
export const deleteBusiness: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await businessService.deleteBusiness(parseInt(id));

    res.json({
      success: true,
      message: "Business deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting business:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete business" });
  }
};

// Verify business (admin only)
export const verifyBusiness: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const business = await businessService.verifyBusiness(parseInt(id));

    res.json({
      success: true,
      business,
      message: "Business verified successfully",
    });
  } catch (error) {
    console.error("Error verifying business:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to verify business" });
  }
};

// Get business statistics (admin only)
export const getBusinessStats: RequestHandler = async (req, res) => {
  try {
    const stats = await businessService.getBusinessStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching business stats:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch business stats" });
  }
};

// Update admin commission rate for a business (admin only)
export const updateBusinessCommission: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminCommissionRate } = req.body;

    if (
      typeof adminCommissionRate !== "number" ||
      adminCommissionRate < 0 ||
      adminCommissionRate > 100
    ) {
      return res.status(400).json({
        success: false,
        error: "Commission rate must be a number between 0 and 100",
      });
    }

    const business = await businessService.updateAdminCommissionRate(
      parseInt(id),
      adminCommissionRate,
    );
    res.json({
      success: true,
      business,
      message: "Commission rate updated successfully",
    });
  } catch (error) {
    console.error("Error updating business commission:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update commission rate" });
  }
};

// Update business password (admin only)
export const updateBusinessPassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must contain uppercase, lowercase, and number",
      });
    }

    const business = await businessService.updateBusinessPassword(
      parseInt(id),
      password,
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    res.json({
      success: true,
      message: "Business password updated successfully",
    });
  } catch (error) {
    console.error("Error updating business password:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update business password" });
  }
};

// Get detailed business statistics for admin
export const getBusinessDetailedStats: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await businessService.getBusinessStatistics(parseInt(id));

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching business detailed stats:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch business statistics" });
  }
};

// Get business activity - clicks
export const getBusinessClicks: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    // Get click logs for this business
    const clicks = await businessService.getBusinessClickLogs(
      decoded.businessId,
    );

    res.json({ success: true, clicks });
  } catch (error) {
    console.error("Error getting business clicks:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get business clicks" });
  }
};

// Get business activity - conversions
export const getBusinessConversions: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    // Get conversions for this business
    const conversions = await prisma.conversion.findMany({
      where: { businessId: business.affiliateId },
      orderBy: { timestamp: "desc" },
      take: 100, // Limit to last 100 conversions
    });

    res.json({ success: true, conversions });
  } catch (error) {
    console.error("Error getting business conversions:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get business conversions" });
  }
};

// Clear business activity
export const clearBusinessActivity: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    // Clear all activity data for this business
    const result = await businessService.clearBusinessActivity(decoded.businessId);

    res.json({ success: true, message: "Activity data cleared successfully" });
  } catch (error) {
    console.error("Error clearing business activity:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to clear business activity" });
  }
};

// Get real-time business statistics
export const getBusinessRealTimeStats: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    // Get real-time statistics
    const stats = await businessService.getBusinessRealTimeStats(decoded.businessId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Business statistics not found",
      });
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error getting business real-time stats:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get business statistics" });
  }
};

// Update business profile
export const updateBusinessProfile: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    const {
      name,
      domain,
      email,
      phone,
      address,
      country,
      category,
      description,
      logo,
    } = req.body;

    // Validate required fields
    if (!name || !domain || !email) {
      return res.status(400).json({
        success: false,
        error: "Name, domain, and email are required",
      });
    }

    // Validate email format
    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        success: false,
        error: "Invalid domain format",
      });
    }

    // Check if domain is already taken by another business
    const existingBusiness = await businessService.findBusinessByDomain(domain);
    if (existingBusiness && existingBusiness.id !== business.id) {
      return res.status(400).json({
        success: false,
        error: "A business with this domain already exists",
      });
    }

    // Check if email is already taken by another business
    const existingBusinessByEmail = await businessService.findBusinessByEmail(email);
    if (existingBusinessByEmail && existingBusinessByEmail.id !== business.id) {
      return res.status(400).json({
        success: false,
        error: "A business with this email already exists",
      });
    }

    // Update the business profile
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        name: name || business.name,
        domain: domain || business.domain,
        contactEmail: email || business.contactEmail,
        contactPhone: phone || business.contactPhone,
        address: address || business.address,
        country: country || business.country,
        category: category || business.category,
        description: description || business.description,
        logo: logo !== undefined ? logo : business.logo,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Business profile updated successfully",
      business: {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        domain: updatedBusiness.domain,
        contactEmail: updatedBusiness.contactEmail,
        contactPhone: updatedBusiness.contactPhone,
        address: updatedBusiness.address,
        country: updatedBusiness.country,
        category: updatedBusiness.category,
        description: updatedBusiness.description,
        logo: updatedBusiness.logo,
      },
    });
  } catch (error) {
    console.error("Error updating business profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update business profile",
    });
  }
};

// Get checkout analytics for business dashboard
export const getCheckoutAnalytics: RequestHandler = async (req, res) => {
  try {
    const businessId = req.business?.id;
    if (!businessId) {
      return res.status(401).json({
        success: false,
        error: "Business authentication required",
      });
    }

    const { startDate, endDate } = req.query;
    
    // Get business domain
    const business = await businessService.findBusinessById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    // Fetch checkout analytics from Gadget app
    const gadgetResponse = await fetch('https://checkoutdata.gadget.app/api/actions/getBusinessAnalytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GADGET_API_KEY || ''}`,
      },
      body: JSON.stringify({
        businessDomain: business.domain,
        startDate: startDate || null,
        endDate: endDate || null,
      }),
    });

    if (!gadgetResponse.ok) {
      console.error('Gadget API error:', await gadgetResponse.text());
      return res.status(500).json({
        success: false,
        error: "Failed to fetch checkout analytics",
      });
    }

    const checkoutData = await gadgetResponse.json();
    
    // Process checkout events
    const checkouts = checkoutData.filter((event: any) => 
      event.event_type === 'checkout_start' || event.event_type === 'checkout_complete'
    );
    
    const orders = checkoutData.filter((event: any) => 
      event.event_type === 'order_created'
    );

    // Calculate analytics
    const totalCheckouts = checkouts.filter((c: any) => c.event_type === 'checkout_start').length;
    const completedCheckouts = checkouts.filter((c: any) => c.event_type === 'checkout_complete').length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum: number, order: any) => {
      return sum + (parseFloat(order.data?.totalPrice) || 0);
    }, 0);
    
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const checkoutConversionRate = totalCheckouts > 0 ? (completedCheckouts / totalCheckouts) * 100 : 0;

    // Group by date for charts
    const dailyCheckouts = new Map<string, number>();
    const dailyRevenue = new Map<string, number>();
    
    checkouts.forEach((checkout: any) => {
      const date = new Date(checkout.timestamp).toISOString().split('T')[0];
      dailyCheckouts.set(date, (dailyCheckouts.get(date) || 0) + 1);
    });
    
    orders.forEach((order: any) => {
      const date = new Date(order.timestamp).toISOString().split('T')[0];
      const revenue = parseFloat(order.data?.totalPrice) || 0;
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + revenue);
    });

    res.json({
      success: true,
      analytics: {
        summary: {
          totalCheckouts,
          completedCheckouts,
          totalOrders,
          totalRevenue,
          averageOrderValue,
          checkoutConversionRate,
        },
        dailyCheckouts: Array.from(dailyCheckouts.entries()).map(([date, count]) => ({
          date,
          count,
        })),
        dailyRevenue: Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
          date,
          revenue,
        })),
        recentCheckouts: checkouts.slice(-10).map((checkout: any) => ({
          id: checkout.data?.checkout_id || checkout.data?.order_id,
          eventType: checkout.event_type,
          timestamp: checkout.timestamp,
          email: checkout.data?.email,
          totalPrice: checkout.data?.totalPrice,
          currency: checkout.data?.currency,
          status: checkout.event_type === 'checkout_complete' ? 'completed' : 'started',
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching checkout analytics:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch checkout analytics",
    });
  }
};

// Get business dashboard data from checkout system
export const getBusinessDashboardData: RequestHandler = async (req, res) => {
  try {
    // Check for business authentication
    let token = req.cookies.business_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found",
      });
    }

    // Check domain verification status
    const domainVerification = await prisma.domainVerification.findFirst({
      where: {
        businessId: business.id,
        status: "verified",
      },
      orderBy: {
        verifiedAt: "desc",
      },
    });
    const domainVerified = !!domainVerification;

    if (!isAnalyticsAllowed(domainVerified)) {
      return res.status(403).json({
        success: false,
        error: "Domain verification required for analytics access",
        message: DOMAIN_VERIFICATION_CONFIG.WARNING_MESSAGE,
      });
    }

    const { startDate, endDate, limit } = req.query;
    
    // For now, return mock data to test the dashboard
    const mockDashboardData = {
      summary: {
        totalBusinesses: 1,
        businessDomain: business.domain,
        totalCheckouts: 15,
        completedCheckouts: 8,
        totalOrders: 8,
        conversionRate: 53.33,
        totalRevenue: 1250.50,
        currency: 'USD'
      },
      businesses: [{
        id: '1',
        domain: business.domain,
        myshopifyDomain: `${business.domain}.myshopify.com`,
        name: `${business.domain} Store`,
        email: business.email,
        currency: 'USD',
        plan: 'Basic',
        createdAt: '2024-01-01T00:00:00Z'
      }],
      recentCheckouts: [
        {
          id: '1',
          email: 'customer1@example.com',
          totalPrice: '150.00',
          currency: 'USD',
          createdAt: '2024-08-14T10:00:00Z',
          completedAt: '2024-08-14T10:05:00Z',
          sourceUrl: 'https://pavlo4.netlify.app/product/123',
          sourceName: 'Pavlo4 Price Comparison',
          name: '#1001',
          token: 'token1',
          processingStatus: 'complete',
          isPavlo4Referral: true
        },
        {
          id: '2',
          email: 'customer2@example.com',
          totalPrice: '75.50',
          currency: 'USD',
          createdAt: '2024-08-14T09:30:00Z',
          completedAt: null,
          sourceUrl: 'https://google.com',
          sourceName: 'Google Search',
          name: '#1002',
          token: 'token2',
          processingStatus: 'processing',
          isPavlo4Referral: false
        }
      ],
      recentOrders: [
        {
          id: '1',
          name: '#1001',
          email: 'customer1@example.com',
          totalPrice: '150.00',
          currency: 'USD',
          financialStatus: 'paid',
          fulfillmentStatus: 'fulfilled',
          createdAt: '2024-08-14T10:05:00Z'
        },
        {
          id: '2',
          name: '#1000',
          email: 'customer3@example.com',
          totalPrice: '200.00',
          currency: 'USD',
          financialStatus: 'pending',
          fulfillmentStatus: 'unfulfilled',
          createdAt: '2024-08-14T08:00:00Z'
        }
      ],
      referralStatistics: {
        totalReferrals: 25,
        pavlo4Referrals: 12,
        pavlo4ConversionRate: 66.67,
        totalConversions: 8,
        referralRevenue: 850.00,
        topSources: {
          'pavlo4': 12,
          'google': 8,
          'facebook': 3,
          'direct': 2
        }
      },
      trends: {
        last30Days: {
          checkouts: 15,
          orders: 8,
          revenue: 1250.50
        },
        last7Days: {
          checkouts: 5,
          orders: 3,
          revenue: 450.00
        }
      },
      orderStatuses: {
        'paid': 6,
        'pending': 2,
        'refunded': 0
      },
      recentReferrals: [
        {
          id: '1',
          referralId: 'ref1',
          businessDomain: business.domain,
          source: 'pavlo4',
          medium: 'referral',
          campaign: 'price-comparison',
          conversionStatus: 'converted',
          conversionValue: 150.00,
          clickedAt: '2024-08-14T09:45:00Z',
          isPavlo4: true
        },
        {
          id: '2',
          referralId: 'ref2',
          businessDomain: business.domain,
          source: 'google',
          medium: 'organic',
          campaign: 'search',
          conversionStatus: 'clicked',
          conversionValue: 0,
          clickedAt: '2024-08-14T09:30:00Z',
          isPavlo4: false
        }
      ]
    };

    res.json({ 
      success: true, 
      dashboardData: mockDashboardData, 
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: { 
          businessDomain: business.domain, 
          startDate: startDate as string, 
          endDate: endDate as string, 
          limit: limit ? parseInt(limit as string) : 100 
        }
      }
    });
  } catch (error) {
    console.error("Error fetching business dashboard data:", error);
    res.status(500).json({ success: false, error: "Failed to fetch business dashboard data" });
  }
};
