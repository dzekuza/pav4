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
