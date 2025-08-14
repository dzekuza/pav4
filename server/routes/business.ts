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

    const { startDate, endDate } = req.query;

    // Debug: Log the business domain being used
    console.log('Checkout analytics - business domain:', business.domain);
    console.log('Checkout analytics - business object:', JSON.stringify(business, null, 2));

    // Use the working dashboard data service
    const { gadgetAnalytics } = await import('../services/gadget-analytics');
    
    // Use the same logic as the test endpoint that works
    const dashboardData = await gadgetAnalytics.generateDashboardData(
      business.domain, // Use the actual business domain
      startDate as string || null,
      endDate as string || null
    );

    if (!dashboardData.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch checkout analytics"
      });
    }

    const data = (dashboardData as any).data;
    
    // Calculate analytics from the dashboard data
    const totalCheckouts = data.summary.totalCheckouts;
    const completedCheckouts = data.summary.completedCheckouts;
    const totalOrders = data.summary.totalOrders;
    const totalRevenue = data.summary.totalRevenue;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const checkoutConversionRate = data.summary.conversionRate;

    // Group by date for charts
    const dailyCheckouts = new Map<string, number>();
    const dailyRevenue = new Map<string, number>();
    
    // Process recent checkouts for daily data
    data.recentCheckouts.forEach((checkout: any) => {
      const date = new Date(checkout.createdAt).toISOString().split('T')[0];
      dailyCheckouts.set(date, (dailyCheckouts.get(date) || 0) + 1);
    });
    
    // Process recent orders for daily revenue
    data.recentOrders.forEach((order: any) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      const revenue = parseFloat(order.totalPrice) || 0;
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + revenue);
    });

    res.json({
      success: true,
      dashboardData: {
        summary: {
          totalCheckouts,
          completedCheckouts,
          totalOrders,
          totalRevenue,
          averageOrderValue,
          conversionRate: checkoutConversionRate,
        },
        dailyCheckouts: Array.from(dailyCheckouts.entries()).map(([date, count]) => ({
          date,
          count,
        })),
        dailyRevenue: Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
          date,
          revenue,
        })),
        recentCheckouts: data.recentCheckouts.slice(-10).map((checkout: any) => ({
          id: checkout.id,
          eventType: 'checkout',
          timestamp: checkout.createdAt,
          email: checkout.email,
          totalPrice: checkout.totalPrice,
          currency: checkout.currency,
          status: checkout.completedAt ? 'completed' : 'started',
        })),
        recentOrders: data.recentOrders.slice(-10).map((order: any) => ({
          id: order.id,
          eventType: 'order',
          timestamp: order.createdAt,
          email: order.email,
          totalPrice: order.totalPrice,
          currency: order.currency,
          status: order.financialStatus,
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
    
    // Direct API call to CheckoutData
    const GADGET_API_URL = process.env.PAVLP_DASHBOARD_ACCESS 
      ? 'https://checkoutdata--development.gadget.app/api/graphql'
      : 'https://checkoutdata.gadget.app/api/graphql';
    const API_KEY = process.env.PAVLP_DASHBOARD_ACCESS || 'gsk-BDE2GN4ftPEmRdMHVaRqX7FrWE7DVDEL';
    
    console.log('=== NEW CODE PATH ===');
    console.log('Direct API call for domain:', business.domain);
    
    // Get shops
    const shopsResponse = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query getShops($businessDomain: String) {
            shopifyShops(first: 100, filter: {
              OR: [
                { domain: { equals: $businessDomain } },
                { myshopifyDomain: { equals: $businessDomain } }
              ]
            }) {
              edges {
                node {
                  id
                  domain
                  myshopifyDomain
                  name
                  email
                  currency
                  planName
                  createdAt
                }
              }
            }
          }
        `,
        variables: { businessDomain: business.domain }
      })
    });

    const shopsData = await shopsResponse.json();
    console.log('Shops response:', JSON.stringify(shopsData, null, 2));
    
    const shops = shopsData.data.shopifyShops.edges.map((edge) => edge.node);
    const shopIds = shops.map(shop => shop.id);
    
    console.log('Shop IDs found:', shopIds);
    
    if (shopIds.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No shops found for the specified domain"
      });
    }
    
    // Get checkouts
    const checkoutsResponse = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query getCheckouts($limit: Int) {
            shopifyCheckouts(
              first: $limit,
              sort: { createdAt: Descending }
            ) {
              edges {
                node {
                  id
                  email
                  totalPrice
                  currency
                  createdAt
                  completedAt
                  sourceUrl
                  sourceName
                  name
                  token
                  processingStatus
                  shop {
                    id
                    domain
                    name
                  }
                }
              }
            }
          }
        `,
        variables: { limit: 100 }
      })
    });

    const checkoutsData = await checkoutsResponse.json();
    console.log('Checkouts response:', JSON.stringify(checkoutsData, null, 2));
    
    const allCheckouts = checkoutsData.data.shopifyCheckouts.edges.map((edge) => edge.node);
    console.log('Total checkouts found:', allCheckouts.length);
    
    // Filter by shop IDs
    const filteredCheckouts = allCheckouts.filter((checkout) => 
      checkout.shop && shopIds.includes(checkout.shop.id)
    );
    
    console.log('Filtered checkouts:', filteredCheckouts.length);

    // Get orders
    const ordersResponse = await fetch(GADGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query getOrders($limit: Int) {
            shopifyOrders(
              first: $limit,
              sort: { createdAt: Descending }
            ) {
              edges {
                node {
                  id
                  name
                  email
                  totalPrice
                  currency
                  financialStatus
                  fulfillmentStatus
                  createdAt
                  shop {
                    id
                    domain
                    name
                  }
                }
              }
            }
          }
        `,
        variables: { limit: 100 }
      })
    });

    const ordersData = await ordersResponse.json();
    console.log('Orders response:', JSON.stringify(ordersData, null, 2));
    
    const allOrders = ordersData.data.shopifyOrders.edges.map((edge) => edge.node);
    console.log('Total orders found:', allOrders.length);
    
    // Filter by shop IDs
    const filteredOrders = allOrders.filter((order) => 
      order.shop && shopIds.includes(order.shop.id)
    );
    
    console.log('Filtered orders:', filteredOrders.length);
    
    // Calculate metrics
    const totalCheckouts = filteredCheckouts.length;
    const completedCheckouts = filteredCheckouts.filter(c => c.completedAt).length;
    const totalOrders = filteredOrders.length;
    const conversionRate = totalCheckouts > 0 ? (completedCheckouts / totalCheckouts) * 100 : 0;
    
    // Calculate revenue from orders
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      const price = parseFloat(order.totalPrice || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    const response = {
      success: true,
      summary: {
        totalBusinesses: shops.length,
        businessDomain: business.domain,
        totalCheckouts,
        completedCheckouts,
        totalOrders,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue,
        currency: shops[0]?.currency || 'EUR'
      },
      businesses: shops.map(shop => ({
        id: shop.id,
        domain: shop.domain,
        myshopifyDomain: shop.myshopifyDomain,
        name: shop.name,
        email: shop.email,
        currency: shop.currency,
        plan: shop.planName,
        createdAt: shop.createdAt
      })),
      recentCheckouts: filteredCheckouts.slice(0, 20).map(checkout => ({
        id: checkout.id,
        email: checkout.email,
        totalPrice: checkout.totalPrice,
        currency: checkout.currency,
        createdAt: checkout.createdAt,
        completedAt: checkout.completedAt,
        sourceUrl: checkout.sourceUrl,
        sourceName: checkout.sourceName,
        name: checkout.name,
        token: checkout.token,
        processingStatus: checkout.processingStatus,
        isPavlo4Referral: checkout.sourceUrl?.toLowerCase().includes('pavlo4') || 
                         checkout.sourceName?.toLowerCase().includes('pavlo4'),
        shop: checkout.shop
      })),
      recentOrders: filteredOrders.slice(0, 20).map(order => ({
        id: order.id,
        name: order.name,
        email: order.email,
        totalPrice: order.totalPrice,
        currency: order.currency,
        financialStatus: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        createdAt: order.createdAt,
        shop: order.shop
      })),
      referralStatistics: {
        totalReferrals: 0,
        pavlo4Referrals: 0,
        pavlo4ConversionRate: 0,
        totalConversions: 0,
        referralRevenue: 0,
        topSources: {}
      },
      trends: {
        last30Days: {
          checkouts: totalCheckouts,
          orders: totalOrders,
          revenue: totalRevenue
        },
        last7Days: {
          checkouts: totalCheckouts,
          orders: totalOrders,
          revenue: totalRevenue
        }
      },
      orderStatuses: filteredOrders.reduce((acc, order) => {
        const status = order.financialStatus || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      recentReferrals: []
    };

    console.log('Sending response with checkouts:', totalCheckouts);
    res.json(response);
  } catch (error) {
    console.error("Error fetching business dashboard data:", error);
    res.status(500).json({ success: false, error: "Failed to fetch business dashboard data" });
  }
};

// Debug endpoint to check available shops
export const debugShops: RequestHandler = async (req, res) => {
  try {
    const { gadgetAnalytics } = await import('../services/gadget-analytics');
    
    // Get all shops without domain filter
    const allShops = await gadgetAnalytics.getShops(null);
    
    // Get shops filtered by godislove.lt
    const filteredShops = await gadgetAnalytics.getShops('godislove.lt');
    
    // Get all checkouts without filtering
    const allCheckouts = await gadgetAnalytics.getCheckouts([], null, null, 20);
    
    res.json({
      success: true,
      debug: {
        allShops: allShops.map(shop => ({
          id: shop.id,
          domain: shop.domain,
          myshopifyDomain: shop.myshopifyDomain,
          name: shop.name,
          email: shop.email
        })),
        filteredShops: filteredShops.map(shop => ({
          id: shop.id,
          domain: shop.domain,
          myshopifyDomain: shop.myshopifyDomain,
          name: shop.name,
          email: shop.email
        })),
        recentCheckouts: allCheckouts.slice(0, 5).map(checkout => ({
          id: checkout.id,
          email: checkout.email,
          totalPrice: checkout.totalPrice,
          currency: checkout.currency,
          createdAt: checkout.createdAt,
          shopDomain: checkout.shop?.domain,
          shopName: checkout.shop?.name
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug shops:', error);
    res.status(500).json({
      success: false,
      error: "Failed to debug shops",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Debug endpoint to check local database
export const debugLocalDatabase: RequestHandler = async (req, res) => {
  try {
    const { prisma } = await import('../services/database');
    
    // Get all tracking events
    const trackingEvents = await prisma.trackingEvent.findMany({
      where: {
        eventType: 'checkout'
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    // Get all Shopify events
    const shopifyEvents = await prisma.shopifyEvent.findMany({
      where: {
        topic: {
          contains: 'checkout'
        }
      },
      orderBy: {
        triggered_at: 'desc'
      },
      take: 10
    });

    // Get all track events
    const trackEvents = await prisma.trackingEvent.findMany({
      where: {
        eventType: 'shopify_cart'
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    res.json({
      success: true,
      debug: {
        trackingEvents: trackingEvents.map(event => ({
          id: event.id,
          eventType: event.eventType,
          businessId: event.businessId,
          timestamp: event.timestamp,
          data: event.eventData
        })),
        shopifyEvents: shopifyEvents.map(event => ({
          id: event.id,
          topic: event.topic,
          shopDomain: event.shop_domain,
          triggeredAt: event.triggered_at,
          metadata: event.metadata
        })),
        trackEvents: trackEvents.map(event => ({
          id: event.id,
          eventType: event.eventType,
          timestamp: event.timestamp,
          data: event.eventData
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug local database:', error);
    res.status(500).json({
      success: false,
      error: "Failed to debug local database",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Test dashboard data endpoint (no auth required)
export const testDashboardData: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const { gadgetAnalytics } = await import('../services/gadget-analytics');
    
    const dashboardData = await gadgetAnalytics.generateDashboardData(
      'godislove.lt',
      startDate as string || null,
      endDate as string || null
    );

    res.json({
      success: true,
      dashboardData
    });
  } catch (error) {
    console.error('Error testing dashboard data:', error);
    res.status(500).json({
      success: false,
      error: "Failed to test dashboard data",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Test checkout analytics endpoint (no auth required)
export const testCheckoutAnalytics: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const { gadgetAnalytics } = await import('../services/gadget-analytics');
    
    const dashboardData = await gadgetAnalytics.generateDashboardData(
      'godislove.lt',
      startDate as string || null,
      endDate as string || null
    );

    if (!dashboardData.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch checkout analytics"
      });
    }

    const data = (dashboardData as any).data;
    
    // Debug logging
    console.log('Test checkout analytics - dashboardData:', JSON.stringify(dashboardData, null, 2));
    console.log('Test checkout analytics - data:', JSON.stringify(data, null, 2));
    
    // Calculate analytics from the dashboard data
    const totalCheckouts = data.summary.totalCheckouts;
    const completedCheckouts = data.summary.completedCheckouts;
    const totalOrders = data.summary.totalOrders;
    const totalRevenue = data.summary.totalRevenue;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const checkoutConversionRate = data.summary.conversionRate;

    // Group by date for charts
    const dailyCheckouts = new Map<string, number>();
    const dailyRevenue = new Map<string, number>();
    
    // Process recent checkouts for daily data
    data.recentCheckouts.forEach((checkout: any) => {
      const date = new Date(checkout.createdAt).toISOString().split('T')[0];
      dailyCheckouts.set(date, (dailyCheckouts.get(date) || 0) + 1);
    });
    
    // Process recent orders for daily revenue
    data.recentOrders.forEach((order: any) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      const revenue = parseFloat(order.totalPrice) || 0;
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + revenue);
    });

    res.json({
      success: true,
      dashboardData: {
        summary: {
          totalCheckouts,
          completedCheckouts,
          totalOrders,
          totalRevenue,
          averageOrderValue,
          conversionRate: checkoutConversionRate,
        },
        dailyCheckouts: Array.from(dailyCheckouts.entries()).map(([date, count]) => ({
          date,
          count,
        })),
        dailyRevenue: Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
          date,
          revenue,
        })),
        recentCheckouts: data.recentCheckouts.slice(-10).map((checkout: any) => ({
          id: checkout.id,
          eventType: 'checkout',
          timestamp: checkout.createdAt,
          email: checkout.email,
          totalPrice: checkout.totalPrice,
          currency: checkout.currency,
          status: checkout.completedAt ? 'completed' : 'started',
        })),
        recentOrders: data.recentOrders.slice(-10).map((order: any) => ({
          id: order.id,
          eventType: 'order',
          timestamp: order.createdAt,
          email: order.email,
          totalPrice: order.totalPrice,
          currency: order.currency,
          status: order.financialStatus,
        })),
      },
    });
  } catch (error) {
    console.error('Error testing checkout analytics:', error);
    res.status(500).json({
      success: false,
      error: "Failed to test checkout analytics",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};
