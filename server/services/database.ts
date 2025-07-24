import { PrismaClient } from "@prisma/client";

// Global instance to prevent multiple Prisma Client instances in development
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a single Prisma Client instance
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
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
    return prisma.admin.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || "admin",
      },
    });
  },

  async findAdminByEmail(email: string) {
    return prisma.admin.findUnique({
      where: { email },
    });
  },

  async findAdminById(id: number) {
    return prisma.admin.findUnique({
      where: { id },
    });
  },

  async getAllAdmins() {
    return prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
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
    return prisma.admin.update({
      where: { id },
      data,
    });
  },

  async deleteAdmin(id: number) {
    return prisma.admin.delete({
      where: { id },
    });
  },
};

// Search history operations
export const searchHistoryService = {
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
    return prisma.searchHistory.delete({
      where: {
        id: searchId,
        userId, // Ensure user can only delete their own searches
      },
    });
  },

  async clearUserSearchHistory(userId: number) {
    return prisma.searchHistory.deleteMany({
      where: { userId },
    });
  },

  // Clean up old search history (older than X days)
  async cleanupOldSearches(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return prisma.searchHistory.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });
  },
};

// Legacy search history for non-authenticated users
export const legacySearchHistoryService = {
  async addSearch(userKey: string, url: string) {
    return prisma.legacySearchHistory.create({
      data: {
        userKey,
        url,
      },
    });
  },

  async getUserSearchHistory(userKey: string, limit: number = 10) {
    return prisma.legacySearchHistory.findMany({
      where: { userKey },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  },

  async cleanupOldLegacySearches(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return prisma.legacySearchHistory.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });
  },
};

// Database health check
export const healthCheck = {
  async checkConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "healthy", message: "Database connection successful" };
    } catch (error) {
      return {
        status: "unhealthy",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
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
    return prisma.affiliateUrl.create({
      data: {
        name: data.name,
        url: data.url,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  },

  async getAllAffiliateUrls() {
    return prisma.affiliateUrl.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async getAffiliateUrlById(id: number) {
    return prisma.affiliateUrl.findUnique({
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
    return prisma.affiliateUrl.update({
      where: { id },
      data,
    });
  },

  async deleteAffiliateUrl(id: number) {
    return prisma.affiliateUrl.delete({
      where: { id },
    });
  },

  async incrementClicks(id: number) {
    return prisma.affiliateUrl.update({
      where: { id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  },

  async addConversion(id: number, revenue: number = 0) {
    return prisma.affiliateUrl.update({
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
    const [totalUrls, activeUrls, totalClicks, totalConversions, totalRevenue] = await Promise.all([
      prisma.affiliateUrl.count(),
      prisma.affiliateUrl.count({ where: { isActive: true } }),
      prisma.affiliateUrl.aggregate({
        _sum: { clicks: true },
      }),
      prisma.affiliateUrl.aggregate({
        _sum: { conversions: true },
      }),
      prisma.affiliateUrl.aggregate({
        _sum: { revenue: true },
      }),
    ]);

    return {
      totalUrls,
      activeUrls,
      totalClicks: totalClicks._sum.clicks || 0,
      totalConversions: totalConversions._sum.conversions || 0,
      totalRevenue: totalRevenue._sum.revenue || 0,
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

  async verifyBusiness(id: number) {
    return prisma.business.update({
      where: { id },
      data: { isVerified: true },
    });
  },

  async getBusinessStats() {
    const [totalBusinesses, activeBusinesses, verifiedBusinesses] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count({ where: { isVerified: true } }),
    ]);

    return {
      totalBusinesses,
      activeBusinesses,
      verifiedBusinesses,
    };
  },

  // Business authentication
  async findBusinessByEmail(email: string) {
    return prisma.business.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  async findBusinessById(id: number) {
    return prisma.business.findUnique({
      where: { id },
    });
  },

  // Business statistics
  async updateBusinessStats(businessId: number, data: {
    totalVisits?: number;
    totalPurchases?: number;
    totalRevenue?: number;
  }) {
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
        adminCommissionRate: true,
      },
    });

    if (!business) return null;

    const projectedFee = (business.totalRevenue * business.adminCommissionRate) / 100;
    const averageOrderValue = business.totalPurchases > 0 ? business.totalRevenue / business.totalPurchases : 0;

    return {
      ...business,
      projectedFee,
      averageOrderValue,
      conversionRate: business.totalVisits > 0 ? (business.totalPurchases / business.totalVisits) * 100 : 0,
    };
  },

  async updateAdminCommissionRate(businessId: number, commissionRate: number) {
    return prisma.business.update({
      where: { id: businessId },
      data: { adminCommissionRate: commissionRate },
    });
  },

  async updateBusinessPassword(businessId: number, password: string) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return prisma.business.update({
      where: { id: businessId },
      data: { password: hashedPassword },
    });
  },

  async getBusinessClickLogs(businessId: number) {
    // Get the business and its domain(s)
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || !business.domain) return [];
    const domains = [business.domain.toLowerCase().replace(/^www\./, "")];
    // Find all ClickLog entries where the url domain matches the business domain
    const logs = await prisma.clickLog.findMany();
    return logs.filter(log => {
      if (!log.productId) return false;
      try {
        const url = new URL(log.productId);
        const domain = url.hostname.toLowerCase().replace(/^www\./, "");
        return domains.includes(domain);
      } catch {
        return false;
      }
    });
  },
};

// Click log operations
export const clickLogService = {
  async logClick(data: {
    affiliateId: string;
    productId: string;
    userId?: number;
    userAgent?: string;
    referrer?: string;
    ip?: string;
  }) {
    return prisma.clickLog.create({
      data: {
        affiliateId: data.affiliateId,
        productId: data.productId,
        userId: data.userId,
        userAgent: data.userAgent,
        referrer: data.referrer,
        ip: data.ip,
      },
    });
  },

  // TODO: Implement real product/business lookup
  async getProductUrlByAffiliateAndProductId(affiliateId: string, productId: string): Promise<string | null> {
    // Try to find the affiliate by id (as int) or name
    let affiliate: any = null;
    const idNum = parseInt(affiliateId, 10);
    if (!isNaN(idNum)) {
      affiliate = await prisma.affiliateUrl.findUnique({ where: { id: idNum } });
    }
    if (!affiliate) {
      affiliate = await prisma.affiliateUrl.findFirst({ where: { name: affiliateId } });
    }
    if (!affiliate) return null;
    // If the affiliate url contains a placeholder for productId, replace it
    if (affiliate.url.includes('{productId}')) {
      return affiliate.url.replace('{productId}', productId);
    }
    // Otherwise, append productId as a slug or query param
    if (affiliate.url.endsWith('/')) {
      return affiliate.url + productId;
    }
    if (affiliate.url.includes('?')) {
      return affiliate.url + '&product=' + productId;
    }
    return affiliate.url + '/' + productId;
  },
};

// Settings operations
export const settingsService = {
  async getSuggestionFilterEnabled(): Promise<boolean> {
    const setting = await prisma.settings.findUnique({ where: { key: 'suggestionFilterEnabled' } });
    return setting ? setting.value === 'true' : true; // Default: enabled
  },
  async setSuggestionFilterEnabled(enabled: boolean): Promise<void> {
    await prisma.settings.upsert({
      where: { key: 'suggestionFilterEnabled' },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: 'suggestionFilterEnabled', value: enabled ? 'true' : 'false' },
    });
  },
};

// Graceful shutdown
export const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error during database shutdown:', error);
  }
};

// Health check for database connection
export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', message: 'Database connection successful' };
  } catch (error) {
    return { 
      status: 'error', 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
