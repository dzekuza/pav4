import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Global instance to prevent multiple Prisma Client instances in development
declare global {
  var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}

const createPrismaClient = () => new PrismaClient().$extends(withAccelerate());

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

// Graceful shutdown
export const gracefulShutdown = async () => {
  await prisma.$disconnect();
};
