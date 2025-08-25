import { RequestHandler, Request, Response } from "express";
import { businessService, prisma } from "../services/database";
import { requireAdminAuth } from "../middleware/admin-auth";
import { verifyBusinessToken } from "../middleware/business-auth";

import bcrypt from "bcryptjs";

// Utility functions
const extractToken = (req: Request): string | null => {
  let token = req.cookies.business_token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  return token;
};

const authenticateBusiness = async (req: Request, res: Response): Promise<{ businessId: number; business: any } | null> => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: "Not authenticated",
    });
    return null;
  }

  try {
    const decoded = verifyBusinessToken(token);
    if (!decoded || decoded.type !== "business") {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
      return null;
    }

    const business = await businessService.findBusinessById(decoded.businessId);
    if (!business) {
      res.status(404).json({
        success: false,
        error: "Business not found",
      });
      return null;
    }

    return { businessId: decoded.businessId, business };
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
    return null;
  }
};

const validateEmail = (email: string): boolean => {
  return email.includes("@");
};

const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters long" };
  }
  return { isValid: true };
};

const validateStrongPassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" };
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    return { isValid: false, error: "Password must contain uppercase, lowercase, and number" };
  }
  return { isValid: true };
};

const validateDomain = (domain: string): { isValid: boolean; error?: string } => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return { isValid: false, error: "Invalid domain format" };
  }
  return { isValid: true };
};

const handleError = (res: Response, error: any, operation: string) => {
  console.error(`Error ${operation}:`, error);
  res.status(500).json({ 
    success: false, 
    error: `Failed to ${operation}`,
    details: error instanceof Error ? error.message : String(error)
  });
};

// Business Registration
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

    // Validate required fields
    if (!name || !domain || !website || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, domain, website, email, and password are required",
      });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error,
      });
    }

    // Validate domain
    const domainValidation = validateDomain(domain);
    if (!domainValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: domainValidation.error,
      });
    }

    // Check for existing business
    const existingBusiness = await businessService.findBusinessByDomain(domain);
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        error: "A business with this domain already exists",
      });
    }

    const existingBusinessByEmail = await businessService.findBusinessByEmail(email);
    if (existingBusinessByEmail) {
      return res.status(400).json({
        success: false,
        error: "A business with this email already exists",
      });
    }

    // Hash password and create business
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
      message: "Business registered successfully. You can now log in with your email and password.",
    });
  } catch (error) {
    handleError(res, error, "register business");
  }
};

// Admin-only endpoints
export const getAllBusinesses: RequestHandler = async (req, res) => {
  try {
    const businesses = await businessService.getAllBusinesses();
    res.json({ success: true, businesses });
  } catch (error) {
    handleError(res, error, "fetch businesses");
  }
};

export const updateBusiness: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const business = await businessService.updateBusiness(parseInt(id), updateData);
    res.json({
      success: true,
      business,
      message: "Business updated successfully",
    });
  } catch (error) {
    handleError(res, error, "update business");
  }
};

export const deleteBusiness: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await businessService.deleteBusiness(parseInt(id));
    res.json({
      success: true,
      message: "Business deleted successfully",
    });
  } catch (error) {
    handleError(res, error, "delete business");
  }
};

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
    handleError(res, error, "verify business");
  }
};

export const getBusinessStats: RequestHandler = async (req, res) => {
  try {
    const stats = await businessService.getBusinessStats();
    res.json({ success: true, stats });
  } catch (error) {
    handleError(res, error, "fetch business stats");
  }
};

export const updateBusinessCommission: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminCommissionRate } = req.body;

    if (typeof adminCommissionRate !== "number" || adminCommissionRate < 0 || adminCommissionRate > 100) {
      return res.status(400).json({
        success: false,
        error: "Commission rate must be a number between 0 and 100",
      });
    }

    const business = await businessService.updateAdminCommissionRate(parseInt(id), adminCommissionRate);
    res.json({
      success: true,
      business,
      message: "Commission rate updated successfully",
    });
  } catch (error) {
    handleError(res, error, "update commission rate");
  }
};

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

    const passwordValidation = validateStrongPassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error,
      });
    }

    const business = await businessService.updateBusinessPassword(parseInt(id), password);
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
    handleError(res, error, "update business password");
  }
};

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
    handleError(res, error, "fetch business statistics");
  }
};

// Public endpoints
export const getActiveBusinesses: RequestHandler = async (req, res) => {
  try {
    const businesses = await businessService.getActiveBusinesses();
    res.json({ success: true, businesses });
  } catch (error) {
    handleError(res, error, "fetch businesses");
  }
};

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
    handleError(res, error, "fetch business");
  }
};

// Business-authenticated endpoints
export const getBusinessClicks: RequestHandler = async (req, res) => {
  try {
    const authResult = await authenticateBusiness(req, res);
    if (!authResult) return;

    const clicks = await businessService.getBusinessClickLogs(authResult.businessId);
    res.json({ success: true, clicks });
  } catch (error) {
    handleError(res, error, "get business clicks");
  }
};

export const getBusinessConversions: RequestHandler = async (req, res) => {
  try {
    const authResult = await authenticateBusiness(req, res);
    if (!authResult) return;

    const conversions = await prisma.conversion.findMany({
      where: { businessId: authResult.business.affiliateId },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    res.json({ success: true, conversions });
  } catch (error) {
    handleError(res, error, "get business conversions");
  }
};

export const clearBusinessActivity: RequestHandler = async (req, res) => {
  try {
    const authResult = await authenticateBusiness(req, res);
    if (!authResult) return;

    await businessService.clearBusinessActivity(authResult.businessId);
    res.json({ success: true, message: "Activity data cleared successfully" });
  } catch (error) {
    handleError(res, error, "clear business activity");
  }
};

export const getBusinessRealTimeStats: RequestHandler = async (req, res) => {
  try {
    const authResult = await authenticateBusiness(req, res);
    if (!authResult) return;

    const stats = await businessService.getBusinessRealTimeStats(authResult.businessId);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Business statistics not found",
      });
    }

    res.json({ success: true, stats });
  } catch (error) {
    handleError(res, error, "get business statistics");
  }
};

export const updateBusinessProfile: RequestHandler = async (req, res) => {
  try {
    const authResult = await authenticateBusiness(req, res);
    if (!authResult) return;

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

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate domain
    const domainValidation = validateDomain(domain);
    if (!domainValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: domainValidation.error,
      });
    }

    // Check for conflicts
    const existingBusiness = await businessService.findBusinessByDomain(domain);
    if (existingBusiness && existingBusiness.id !== authResult.business.id) {
      return res.status(400).json({
        success: false,
        error: "A business with this domain already exists",
      });
    }

    const existingBusinessByEmail = await businessService.findBusinessByEmail(email);
    if (existingBusinessByEmail && existingBusinessByEmail.id !== authResult.business.id) {
      return res.status(400).json({
        success: false,
        error: "A business with this email already exists",
      });
    }

    // Update business profile
    const updatedBusiness = await prisma.business.update({
      where: { id: authResult.business.id },
      data: {
        name: name || authResult.business.name,
        domain: domain || authResult.business.domain,
        contactEmail: email || authResult.business.contactEmail,
        contactPhone: phone || authResult.business.contactPhone,
        address: address || authResult.business.address,
        country: country || authResult.business.country,
        category: category || authResult.business.category,
        description: description || authResult.business.description,
        logo: logo !== undefined ? logo : authResult.business.logo,
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
    handleError(res, error, "update business profile");
  }
};

export const getCheckoutAnalytics: RequestHandler = async (req, res) => {
  try {
    const authResult = await authenticateBusiness(req, res);
    if (!authResult) return;

    const { startDate, endDate } = req.query;

    // REMOVED: Domain verification check - no longer required

    const { gadgetAnalytics } = await import('../services/gadget-analytics');
    
    const dashboardData = await gadgetAnalytics.generateDashboardData(
      authResult.business.domain,
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
    handleError(res, error, "fetch checkout analytics");
  }
};

export const getBusinessDashboardData: RequestHandler = async (req, res) => {
  try {
    console.log('=== getBusinessDashboardData called ===');
    console.log('Environment:', process.env.NODE_ENV);
    
    const authResult = await authenticateBusiness(req, res);
    if (!authResult) return;

    console.log('Business authenticated:', authResult.business.domain);

    // REMOVED: Domain verification check - no longer required
    console.log('Domain verification: SKIPPED (removed requirement)');

    const { startDate, endDate, testMode } = req.query;
    console.log('Query params:', { startDate, endDate, testMode });
    
    // If test mode is enabled, return zero data
    if (testMode === 'true') {
      console.log('Test mode enabled - returning zero data');
      const testData = {
        success: true,
        data: {
          summary: {
            totalBusinesses: 1,
            businessDomain: authResult.business.domain,
            totalCheckouts: 0,
            completedCheckouts: 0,
            totalOrders: 0,
            conversionRate: 0,
            totalRevenue: 0,
            currency: 'EUR'
          },
          businesses: [{
            id: 'test-mode',
            domain: authResult.business.domain,
            myshopifyDomain: authResult.business.domain,
            name: authResult.business.name || 'Business',
            email: authResult.business.email || '',
            currency: 'EUR',
            plan: 'Basic',
            createdAt: new Date().toISOString()
          }],
          recentCheckouts: [],
          recentOrders: [],
          referralStatistics: {
            totalReferrals: 0,
            ipickReferrals: 0,
            ipickConversionRate: 0,
            totalConversions: 0,
            referralRevenue: 0,
            topSources: {}
          },
          trends: {
            last30Days: {
              checkouts: 0,
              orders: 0,
              revenue: 0
            },
            last7Days: {
              checkouts: 0,
              orders: 0,
              revenue: 0
            }
          },
          orderStatuses: {},
          recentReferrals: []
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          filters: {
            businessDomain: authResult.business.domain,
            startDate: startDate,
            endDate: endDate
          },
          note: 'Test mode - zero data for testing'
        }
      };
      
      return res.json(testData);
    }
    
    // Get webhook data from our own database
    console.log('Fetching webhook data from database...');
    
    // Parse date range
    const endDateObj = endDate ? new Date(endDate as string) : new Date();
    const startDateObj = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Get Shopify webhook events
    const webhookEvents = await prisma.shopifyEvent.findMany({
      where: {
        shop_domain: authResult.business.shopifyShop || authResult.business.domain,
        processed_at: {
          gte: startDateObj,
          lte: endDateObj
        }
      },
      orderBy: {
        processed_at: 'desc'
      },
      take: 100
    });
    
    console.log(`Found ${webhookEvents.length} webhook events`);
    
    // Get tracking events
    const trackingEvents = await prisma.trackingEvent.findMany({
      where: {
        businessId: authResult.business.id,
        timestamp: {
          gte: startDateObj,
          lte: endDateObj
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    });
    
    console.log(`Found ${trackingEvents.length} tracking events`);
    
    // Process webhook events into orders and checkouts
    const orders = webhookEvents
      .filter(event => event.topic === 'orders/create' || event.topic === 'orders/paid')
      .map(event => {
        const payload = event.payload as any;
        return {
          id: event.event_id,
          orderNumber: payload?.order_number || payload?.id,
          totalPrice: payload?.total_price || '0',
          currency: payload?.currency || 'EUR',
          customerEmail: payload?.customer?.email,
          createdAt: event.processed_at,
          status: event.topic === 'orders/paid' ? 'paid' : 'created',
          shopDomain: event.shop_domain
        };
      });
    
    const checkouts = webhookEvents
      .filter(event => event.topic === 'checkouts/create' || event.topic === 'checkouts/update')
      .map(event => {
        const payload = event.payload as any;
        return {
          id: event.event_id,
          totalPrice: payload?.total_price || '0',
          currency: payload?.currency || 'EUR',
          customerEmail: payload?.email,
          createdAt: event.processed_at,
          status: 'checkout',
          shopDomain: event.shop_domain
        };
      });
    
    // Calculate statistics
    const totalOrders = orders.length;
    const totalCheckouts = checkouts.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const price = parseFloat(order.totalPrice) || 0;
      return sum + price;
    }, 0);
    const conversionRate = totalCheckouts > 0 ? (totalOrders / totalCheckouts) * 100 : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const dashboardData = {
      success: true,
      data: {
        summary: {
          totalBusinesses: 1,
          businessDomain: authResult.business.domain,
          totalCheckouts: totalCheckouts,
          completedCheckouts: totalCheckouts,
          totalOrders: totalOrders,
          conversionRate: conversionRate,
          totalRevenue: totalRevenue,
          currency: 'EUR'
        },
        businesses: [{
          id: authResult.business.id.toString(),
          domain: authResult.business.domain,
          myshopifyDomain: authResult.business.shopifyShop || authResult.business.domain,
          name: authResult.business.name || 'Business',
          email: authResult.business.email || '',
          currency: 'EUR',
          plan: 'Basic',
          createdAt: authResult.business.createdAt?.toISOString() || new Date().toISOString()
        }],
        recentCheckouts: checkouts,
        recentOrders: orders,
                  referralStatistics: {
            totalReferrals: trackingEvents.length,
            ipickReferrals: trackingEvents.filter(e => {
              const eventData = e.eventData as any;
              return eventData?.utmSource === 'ipick.io';
            }).length,
            ipickConversionRate: 0,
            totalConversions: totalOrders,
            referralRevenue: totalRevenue,
            topSources: {}
          },
        trends: {
          last30Days: {
            checkouts: totalCheckouts,
            orders: totalOrders,
            revenue: totalRevenue
          },
          last7Days: {
            checkouts: checkouts.filter(c => c.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            orders: orders.filter(o => o.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            revenue: orders.filter(o => o.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
              .reduce((sum, order) => sum + (parseFloat(order.totalPrice) || 0), 0)
          }
        },
        orderStatuses: {
          paid: orders.filter(o => o.status === 'paid').length,
          created: orders.filter(o => o.status === 'created').length
        },
        recentReferrals: trackingEvents.slice(0, 10)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: {
          businessDomain: authResult.business.domain,
          startDate: startDateObj.toISOString(),
          endDate: endDateObj.toISOString()
        },
        note: 'Data from webhook events and tracking events'
      }
    };

    console.log('Dashboard data generated successfully:', {
      orders: totalOrders,
      checkouts: totalCheckouts,
      revenue: totalRevenue
    });

    res.json(dashboardData);

  } catch (error) {
    console.error('Error in getBusinessDashboardData:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// Generate unique referral URL for business
export const generateReferralUrl: RequestHandler = async (req, res) => {
  try {
    const auth = await authenticateBusiness(req, res);
    if (!auth) return;

    const { businessId, business } = auth;
    
    // Generate unique referral URL with business affiliate ID
    const baseUrl = process.env.FRONTEND_URL || 'https://ipick.io';
    const referralUrl = `${baseUrl}/ref/${business.affiliateId}`;
    
    // Also generate a tracking URL for the business domain
    const trackingUrl = `${baseUrl}/track/${business.affiliateId}/${business.domain}`;
    
    res.json({
      success: true,
      data: {
        businessId: business.id,
        businessName: business.name,
        domain: business.domain,
        affiliateId: business.affiliateId,
        referralUrl: referralUrl,
        trackingUrl: trackingUrl,
        instructions: {
          referralUrl: "Use this URL to track customers coming from your affiliate links",
          trackingUrl: "Use this URL to track customers coming to your specific domain"
        }
      }
    });
  } catch (error) {
    handleError(res, error, "generating referral URL");
  }
};

// Test endpoint to debug Gadget API connectivity
export const testGadgetApi: RequestHandler = async (req, res) => {
  try {
    console.log('=== testGadgetApi called ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Has PAVL_APP:', !!process.env.PAVL_APP);
    console.log('Has PAVLP_DASHBOARD_ACCESS:', !!process.env.PAVLP_DASHBOARD_ACCESS);
    console.log('Has SHOPIFY_API_KEY:', !!process.env.SHOPIFY_API_KEY);
    
    const apiKey = process.env.PAVL_APP || process.env.PAVLP_DASHBOARD_ACCESS;
    if (!apiKey) {
      return res.json({
        success: false,
        error: 'API key not configured. Please set PAVL_APP or PAVLP_DASHBOARD_ACCESS environment variable'
      });
    }
    
    const { gadgetAnalytics } = await import('../services/gadget-analytics');
    
    console.log('Testing Gadget API connectivity...');
    
    // Test basic connectivity
    const testResponse = await fetch('https://checkoutdata.gadget.app/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `
          query {
            shopifyShops(first: 1) {
              edges {
                node {
                  id
                  domain
                }
              }
            }
          }
        `
      })
    });
    
    console.log('Test response status:', testResponse.status);
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('Test API error:', errorText);
      return res.json({
        success: false,
        error: 'Gadget API connectivity test failed',
        status: testResponse.status,
        details: errorText
      });
    }
    
    const testResult = await testResponse.json();
    console.log('Test API response:', testResult);
    
    if (testResult.errors) {
      return res.json({
        success: false,
        error: 'Gadget API returned errors',
        details: testResult.errors
      });
    }
    
    // Test the actual dashboard data generation
    console.log('Testing dashboard data generation...');
    const dashboardData = await gadgetAnalytics.generateDashboardData(null, null, null);
    
    res.json({
      success: true,
      message: 'Gadget API connectivity test successful',
      testData: {
        apiAccessible: true,
        shopsFound: dashboardData.success ? 'Yes' : 'No',
        dashboardError: !dashboardData.success ? (dashboardData as any).error : null
      },
      dashboardData: dashboardData
    });
    
  } catch (error) {
    console.error('Error in testGadgetApi:', error);
    res.json({
      success: false,
      error: 'Gadget API test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};
