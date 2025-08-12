import { PrismaClient } from "@prisma/client";

// Global instance to prevent multiple Prisma Client instances in development
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a single Prisma Client instance
const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// Function to generate unique affiliate ID
function generateAffiliateId(domain: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const domainPrefix = domain.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10);
  return `aff_${domainPrefix}_${timestamp}_${randomSuffix}`;
}

// Function to set user context for Row Level Security
export async function setUserContext(userId?: number, userEmail?: string) {
  // Skip RLS context setting if not needed
  // The set_user_context function doesn't exist in the current database schema
  return;
}

// Function to clear user context
export async function clearUserContext() {
  // Skip RLS context clearing if not needed
  // The set_user_context function doesn't exist in the current database schema
  return;
}

// User operations
export const userService = {
  async createUser(data: {
    email: string;
    password: string;
    isAdmin?: boolean;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        isAdmin: data.isAdmin || false,
      },
    });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            searchHistory: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async updateUser(
    id: number,
    data: Partial<{
      email: string;
      password: string;
      isAdmin: boolean;
    }>,
  ) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  async deleteUser(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  },
};

// Admin operations
export const adminService = {
  async createAdmin(data: {
    email: string;
    password: string;
    name?: string;
    role?: string;
  }) {
    return prisma.admins.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name || "",
        role: data.role || "admin",
        isActive: true,
        updatedAt: new Date(),
      },
    });
  },

  async findAdminByEmail(email: string) {
    return prisma.admins.findUnique({
      where: { email },
    });
  },

  async findAdminById(id: number) {
    return prisma.admins.findUnique({
      where: { id },
    });
  },

  async getAllAdmins() {
    return prisma.admins.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async updateAdmin(
    id: number,
    data: Partial<{
      email: string;
      password: string;
      name: string;
      role: string;
      isActive: boolean;
    }>,
  ) {
    return prisma.admins.update({
      where: { id },
      data,
    });
  },

  async deleteAdmin(id: number) {
    return prisma.admins.delete({
      where: { id },
    });
  },
};

// Search history operations
export const searchService = {
  async addSearch(
    userId: number,
    data: {
      url: string;
      title: string;
      requestId: string;
    },
  ) {
    return prisma.searchHistory.create({
      data: {
        userId,
        url: data.url,
        title: data.title,
        requestId: data.requestId,
      },
    });
  },

  async getUserSearchHistory(userId: number, limit: number = 20) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  },

  async deleteUserSearch(userId: number, searchId: number) {
    return prisma.searchHistory.deleteMany({
      where: { id: searchId, userId },
    });
  },

  async clearUserSearchHistory(userId: number) {
    return prisma.searchHistory.deleteMany({
      where: { userId },
    });
  },

  async cleanupOldSearches(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.searchHistory.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  },

  // Legacy search history (for backward compatibility)
  async addLegacySearch(userKey: string, url: string) {
    return prisma.legacySearchHistory.create({
      data: {
        userKey,
        url,
      },
    });
  },

  async getLegacyUserSearchHistory(userKey: string, limit: number = 10) {
    return prisma.legacySearchHistory.findMany({
      where: { userKey },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  },

  async cleanupOldLegacySearches(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.legacySearchHistory.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  },
};

// Database utility functions
export const dbService = {
  async checkConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "connected", message: "Database connection successful" };
    } catch (error) {
      return {
        status: "error",
        message: `Database connection failed: ${error}`,
      };
    }
  },

  async getStats() {
    const [userCount, searchCount, legacySearchCount] = await Promise.all([
      prisma.user.count(),
      prisma.searchHistory.count(),
      prisma.legacySearchHistory.count(),
    ]);

    return {
      users: userCount,
      searches: searchCount,
      legacySearches: legacySearchCount,
    };
  },
};

// Affiliate URL operations
export const affiliateService = {
  async createAffiliateUrl(data: {
    name: string;
    url: string;
    description?: string;
    isActive?: boolean;
  }) {
    return prisma.affiliate_urls.create({
      data: {
        name: data.name,
        url: data.url,
        description: data.description || "",
        isActive: data.isActive !== false,
        updatedAt: new Date(),
      },
    });
  },

  async getAllAffiliateUrls() {
    return prisma.affiliate_urls.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async getAffiliateUrlById(id: number) {
    return prisma.affiliate_urls.findUnique({
      where: { id },
    });
  },

  async updateAffiliateUrl(
    id: number,
    data: Partial<{
      name: string;
      url: string;
      description: string;
      isActive: boolean;
    }>,
  ) {
    return prisma.affiliate_urls.update({
      where: { id },
      data,
    });
  },

  async deleteAffiliateUrl(id: number) {
    return prisma.affiliate_urls.delete({
      where: { id },
    });
  },

  async incrementClicks(id: number) {
    return prisma.affiliate_urls.update({
      where: { id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  },

  async addConversion(id: number, revenue: number = 0) {
    return prisma.affiliate_urls.update({
      where: { id },
      data: {
        conversions: {
          increment: 1,
        },
        revenue: {
          increment: revenue,
        },
      },
    });
  },

  async getAffiliateStats() {
    const stats = await prisma.affiliate_urls.aggregate({
      _sum: {
        clicks: true,
        conversions: true,
        revenue: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalUrls: stats._count.id,
      totalClicks: stats._sum.clicks || 0,
      totalConversions: stats._sum.conversions || 0,
      totalRevenue: stats._sum.revenue || 0,
    };
  },
};

// Business operations
export const businessService = {
  async createBusiness(data: {
    name: string;
    domain: string;
    website: string;
    description?: string;
    logo?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    country?: string;
    category?: string;
    commission?: number;
    email: string;
    password: string;
  }) {
    // Generate unique affiliate ID
    let affiliateId = generateAffiliateId(data.domain);

    // Check if affiliate ID already exists and generate a new one if needed
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existingBusiness = await prisma.business.findUnique({
        where: { affiliateId },
      });

      if (!existingBusiness) {
        break; // Affiliate ID is unique
      }

      // Generate new affiliate ID with different random suffix
      affiliateId = generateAffiliateId(data.domain);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error(
        "Failed to generate unique affiliate ID after multiple attempts",
      );
    }

    return prisma.business.create({
      data: {
        name: data.name,
        domain: data.domain.toLowerCase(),
        website: data.website,
        description: data.description,
        logo: data.logo,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        country: data.country,
        category: data.category,
        commission: data.commission || 0,
        email: data.email,
        password: data.password,
        affiliateId: affiliateId,
      },
    });
  },

  async findBusinessByDomain(domain: string) {
    return prisma.business.findUnique({
      where: { domain: domain.toLowerCase() },
    });
  },

  async getAllBusinesses() {
    return prisma.business.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async getActiveBusinesses() {
    return prisma.business.findMany({
      where: { isActive: true },
      orderBy: {
        name: "asc",
      },
    });
  },

  async updateBusiness(
    id: number,
    data: Partial<{
      name: string;
      domain: string;
      website: string;
      description: string;
      logo: string;
      isActive: boolean;
      isVerified: boolean;
      contactEmail: string;
      contactPhone: string;
      address: string;
      country: string;
      category: string;
      commission: number;
    }>,
  ) {
    return prisma.business.update({
      where: { id },
      data,
    });
  },

  async deleteBusiness(id: number) {
    return prisma.business.delete({
      where: { id },
    });
  },

  async deleteBusinessWithAllData(id: number) {
    // Delete all associated data in the correct order to avoid foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete domain verifications
      await tx.domainVerification.deleteMany({
        where: { businessId: id },
      });

      // Delete webhooks
      await tx.webhook.deleteMany({
        where: { businessId: id },
      });

      // Delete tracking events
      await tx.trackingEvent.deleteMany({
        where: { businessId: id },
      });

      // Delete commission rates
      await tx.commissionRate.deleteMany({
        where: { businessId: id },
      });

      // Delete business conversions
      await tx.businessConversion.deleteMany({
        where: { businessId: id },
      });

      // Delete business clicks
      await tx.businessClick.deleteMany({
        where: { businessId: id },
      });

      // Delete sales associated with this business
      await tx.sale.deleteMany({
        where: { businessId: id },
      });

      // Finally delete the business
      await tx.business.delete({
        where: { id },
      });
    });
  },

  async verifyBusiness(id: number) {
    return prisma.business.update({
      where: { id },
      data: { isVerified: true },
    });
  },

  async getBusinessStats() {
    const [totalBusinesses, activeBusinesses, verifiedBusinesses] =
      await Promise.all([
        prisma.business.count(),
        prisma.business.count({ where: { isActive: true } }),
        prisma.business.count({ where: { isVerified: true } }),
      ]);

    return {
      total: totalBusinesses,
      active: activeBusinesses,
      verified: verifiedBusinesses,
    };
  },

  async findBusinessByEmail(email: string) {
    return prisma.business.findUnique({
      where: { email },
    });
  },

  async findBusinessById(id: number) {
    return prisma.business.findUnique({
      where: { id },
    });
  },

  async updateBusinessStats(
    businessId: number,
    data: {
      totalVisits?: number;
      totalPurchases?: number;
      totalRevenue?: number;
    },
  ) {
    return prisma.business.update({
      where: { id: businessId },
      data,
    });
  },

  async incrementBusinessVisits(businessId: number) {
    return prisma.business.update({
      where: { id: businessId },
      data: {
        totalVisits: {
          increment: 1,
        },
      },
    });
  },

  async incrementBusinessPurchases(businessId: number, revenue: number) {
    return prisma.business.update({
      where: { id: businessId },
      data: {
        totalPurchases: {
          increment: 1,
        },
        totalRevenue: {
          increment: revenue,
        },
      },
    });
  },

  async getBusinessStatistics(businessId: number) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        domain: true,
        totalVisits: true,
        totalPurchases: true,
        totalRevenue: true,
        commission: true,
        adminCommissionRate: true,
        affiliateId: true,
        trackingVerified: true,
      },
    });

    if (!business) {
      return null;
    }

    // Get recent clicks and conversions
    const [clicks, conversions] = await Promise.all([
      prisma.businessClick.findMany({
        where: { businessId },
        orderBy: { timestamp: "desc" },
        take: 10,
      }),
      prisma.businessConversion.findMany({
        where: { businessId },
        orderBy: { timestamp: "desc" },
        take: 10,
      }),
    ]);

    // Calculate derived fields
    const averageOrderValue =
      business.totalPurchases > 0
        ? business.totalRevenue / business.totalPurchases
        : 0;
    const conversionRate =
      business.totalVisits > 0
        ? (business.totalPurchases / business.totalVisits) * 100
        : 0;
    const projectedFee =
      business.totalRevenue * (business.adminCommissionRate / 100);

    return {
      ...business,
      averageOrderValue,
      conversionRate,
      projectedFee,
      recentClicks: clicks,
      recentConversions: conversions,
    };
  },

  // New function to calculate real-time statistics from tracking data
  async getBusinessRealTimeStats(businessId: number) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        domain: true,
        adminCommissionRate: true,
        affiliateId: true,
      },
    });

    if (!business) {
      return null;
    }

    // Get all tracking data for this business
    const [clicks, conversions, trackingEvents] = await Promise.all([
      prisma.businessClick.findMany({
        where: { businessId },
        select: {
          id: true,
          productUrl: true,
          productTitle: true,
          productPrice: true,
          sessionId: true,
          timestamp: true,
        },
      }),
      prisma.businessConversion.findMany({
        where: { businessId },
        select: {
          id: true,
          productUrl: true,
          productTitle: true,
          productPrice: true,
          sessionId: true,
          timestamp: true,
        },
      }),
      prisma.trackingEvent.findMany({
        where: { businessId },
        select: {
          id: true,
          eventType: true,
          sessionId: true,
          timestamp: true,
          eventData: true,
          url: true,
        },
      }),
    ]);

    // Calculate real-time statistics
    const totalClicks = clicks.length;
    const totalConversions = conversions.length;
    
    // Calculate revenue from conversions
    const totalRevenue = conversions.reduce((sum, conv) => {
      const price = conv.productPrice ? parseFloat(conv.productPrice) : 0;
      return sum + price;
    }, 0);

    // Calculate revenue from tracking events (purchases)
    const purchaseEvents = trackingEvents.filter(event => event.eventType === 'purchase');
    const trackingRevenue = purchaseEvents.reduce((sum, event) => {
      const eventData = typeof event.eventData === 'string' 
        ? JSON.parse(event.eventData) 
        : event.eventData;
      return sum + (eventData.total || 0);
    }, 0);

    const totalRevenueCombined = totalRevenue + trackingRevenue;
    const totalPurchases = totalConversions + purchaseEvents.length;

    // Calculate other metrics from tracking events
    const addToCartEvents = trackingEvents.filter(event => event.eventType === 'add_to_cart');
    const pageViewEvents = trackingEvents.filter(event => event.eventType === 'page_view');
    const productViewEvents = trackingEvents.filter(event => event.eventType === 'product_view');

    // Calculate unique sessions
    const allSessionIds = new Set([
      ...clicks.map(c => c.sessionId).filter(Boolean),
      ...conversions.map(c => c.sessionId).filter(Boolean),
      ...trackingEvents.map(e => e.sessionId).filter(Boolean),
    ]);
    const totalSessions = allSessionIds.size;

    // Calculate conversion rates
    const conversionRate = totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;
    const cartToPurchaseRate = addToCartEvents.length > 0 ? (totalPurchases / addToCartEvents.length) * 100 : 0;
    const averageOrderValue = totalPurchases > 0 ? totalRevenueCombined / totalPurchases : 0;

    // Calculate projected commission
    const projectedFee = totalRevenueCombined * (business.adminCommissionRate / 100);

    return {
      id: business.id,
      name: business.name,
      domain: business.domain,
      adminCommissionRate: business.adminCommissionRate,
      affiliateId: business.affiliateId,
      
      // Real-time calculated stats
      totalVisits: totalClicks,
      totalPurchases,
      totalRevenue: totalRevenueCombined,
      averageOrderValue,
      conversionRate,
      projectedFee,
      
      // Additional metrics
      totalClicks,
      totalConversions,
      totalAddToCart: addToCartEvents.length,
      totalPageViews: pageViewEvents.length,
      totalProductViews: productViewEvents.length,
      totalSessions,
      cartToPurchaseRate,
      
      // Recent activity
      recentClicks: clicks.slice(0, 10),
      recentConversions: conversions.slice(0, 10),
      recentEvents: trackingEvents.slice(0, 10),
    };
  },

  async updateAdminCommissionRate(businessId: number, commissionRate: number) {
    return prisma.business.update({
      where: { id: businessId },
      data: { adminCommissionRate: commissionRate },
    });
  },

  async updateBusinessPassword(businessId: number, password: string) {
    return prisma.business.update({
      where: { id: businessId },
      data: { password },
    });
  },

  async getBusinessClickLogs(businessId: number) {
    return prisma.businessClick.findMany({
      where: { businessId },
      orderBy: { timestamp: "desc" },
      take: 100,
    });
  },

  // Click tracking operations
  async logClick(data: {
    affiliateId: string;
    productId: string;
    userId?: number;
    userAgent?: string;
    referrer?: string;
    ip?: string;
  }) {
    // Find business by affiliate ID
    const business = await prisma.business.findUnique({
      where: { affiliateId: data.affiliateId },
    });

    if (!business) {
      throw new Error("Business not found for affiliate ID");
    }

    // Log the click
    const click = await prisma.businessClick.create({
      data: {
        businessId: business.id,
        productUrl: data.productId, // Using productId as productUrl
        userAgent: data.userAgent,
        referrer: data.referrer,
        ipAddress: data.ip,
      },
    });

    // Increment business visit count
    await this.incrementBusinessVisits(business.id);

    return click;
  },

  async getProductUrlByAffiliateAndProductId(
    affiliateId: string,
    productId: string,
  ): Promise<string | null> {
    // This is a placeholder implementation
    // In a real implementation, you would store product URLs in a separate table
    // or have a way to map affiliate IDs and product IDs to URLs

    // For now, we'll return a generic URL based on the affiliate ID
    const business = await prisma.business.findUnique({
      where: { affiliateId },
    });

    if (!business) {
      return null;
    }

    // Construct a URL based on the business domain and product ID
    // This is a simplified approach - in reality, you'd want to store actual product URLs
    return `https://${business.domain}/products/${productId}`;
  },

  // Settings operations
  async getSuggestionFilterEnabled(): Promise<boolean> {
    const setting = await prisma.settings.findUnique({
      where: { key: "suggestion_filter_enabled" },
    });
    return setting?.value === "true";
  },

  async setSuggestionFilterEnabled(enabled: boolean): Promise<void> {
    await prisma.settings.upsert({
      where: { key: "suggestion_filter_enabled" },
      update: { value: enabled.toString() },
      create: { key: "suggestion_filter_enabled", value: enabled.toString() },
    });
  },
};

// Graceful shutdown
export const gracefulShutdown = async () => {
  console.log("Shutting down database connection...");
  await prisma.$disconnect();
  console.log("Database connection closed.");
};

// Database connection check
export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "connected", message: "Database connection successful" };
  } catch (error) {
    return { status: "error", message: `Database connection failed: ${error}` };
  }
};
