import { PrismaClient } from "@prisma/client";

// Global instance to prevent multiple Prisma Client instances in development
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a single Prisma Client instance
const createPrismaClient = () => {
  // Ensure we're using the Netlify database URL
  const databaseUrl =
    process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      "No database URL found. Please set NETLIFY_DATABASE_URL or DATABASE_URL",
    );
    process.exit(1);
  }

  console.log(
    "Using database URL:",
    databaseUrl.replace(/\/\/.*@/, "//***:***@"),
  ); // Hide credentials in logs

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
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
      shopifyAccessToken: string | null;
      shopifyShop: string | null;
      shopifyScopes: string | null;
      shopifyConnectedAt: Date | null;
      shopifyStatus: string | null;
      updatedAt: Date;
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

  async findBusinessByNeonUserId(neonUserId: string) {
    return prisma.business.findUnique({
      where: { neonUserId },
    });
  },

  async createBusinessFromNeonUser(neonUser: any) {
    // Generate unique affiliate ID
    const affiliateId = generateAffiliateId(neonUser.email || 'neon-user');
    
    return prisma.business.create({
      data: {
        name: neonUser.name || neonUser.email || 'Neon User',
        domain: neonUser.email?.split('@')[1] || 'neon-user.com',
        website: `https://${neonUser.email?.split('@')[1] || 'neon-user.com'}`,
        description: 'Business account created via Neon Auth',
        email: neonUser.email || 'neon-user@example.com',
        password: 'neon-auth-user', // Placeholder, not used for Neon Auth
        affiliateId,
        neonUserId: neonUser.id,
        isActive: true,
        isVerified: true,
        commission: 5.0,
        adminCommissionRate: 5.0
      },
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
        logo: true,
        category: true,
      },
    });

    if (!business) {
      return null;
    }

    // Check if domain is verified by looking at domain verification records
    const domainVerification = await prisma.domainVerification.findFirst({
      where: {
        businessId: businessId,
        status: "verified",
      },
      orderBy: {
        verifiedAt: "desc",
      },
    });

    const domainVerified = !!domainVerification;

    if (!business) {
      return null;
    }

    // Get recent clicks, conversions, and tracking events from local database
    const [clicks, conversions, trackingEvents] = await Promise.all([
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
      prisma.trackingEvent.findMany({
        where: { businessId },
        orderBy: { timestamp: "desc" },
        take: 10,
      }),
    ]);

    // Fetch Gadget API data for consolidated statistics
    let gadgetStats = {
      totalCheckouts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      recentCheckouts: [],
      recentOrders: [],
    };

    try {
      const GADGET_API_URL = process.env.PAVLP_DASHBOARD_ACCESS
        ? "https://ipick.io/api/graphql"
        : "https://ipick.io/api/graphql";
      const API_KEY =
        process.env.PAVL_APP || process.env.PAVLP_DASHBOARD_ACCESS;

      if (!API_KEY) {
        console.error(
          "No API key found. Please set PAVL_APP or PAVLP_DASHBOARD_ACCESS environment variable",
        );
        throw new Error("API key not configured");
      }

      // Get shops for this business domain
      const shopsResponse = await fetch(GADGET_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
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
          variables: { businessDomain: business.domain },
        }),
      });

      const shopsData = await shopsResponse.json();
      const shops =
        shopsData.data?.shopifyShops?.edges?.map((edge) => edge.node) || [];
      const shopIds = shops.map((shop) => shop.id);

      if (shopIds.length > 0) {
        // Get checkouts and orders for these shops
        const [checkoutsResponse, ordersResponse] = await Promise.all([
          fetch(GADGET_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
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
              variables: { limit: 100 },
            }),
          }),
          fetch(GADGET_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
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
              variables: { limit: 100 },
            }),
          }),
        ]);

        const checkoutsData = await checkoutsResponse.json();
        const ordersData = await ordersResponse.json();

        const allCheckouts =
          checkoutsData.data?.shopifyCheckouts?.edges?.map(
            (edge) => edge.node,
          ) || [];
        const allOrders =
          ordersData.data?.shopifyOrders?.edges?.map((edge) => edge.node) || [];

        // Filter by shop IDs
        const filteredCheckouts = allCheckouts.filter(
          (checkout) => checkout.shop && shopIds.includes(checkout.shop.id),
        );
        const filteredOrders = allOrders.filter(
          (order) => order.shop && shopIds.includes(order.shop.id),
        );

        // Calculate Gadget metrics
        gadgetStats = {
          totalCheckouts: filteredCheckouts.length,
          totalOrders: filteredOrders.length,
          totalRevenue: filteredOrders.reduce((sum, order) => {
            const price = parseFloat(order.totalPrice || "0");
            return sum + (isNaN(price) ? 0 : price);
          }, 0),
          recentCheckouts: filteredCheckouts.slice(0, 10),
          recentOrders: filteredOrders.slice(0, 10),
        };
      }
    } catch (error) {
      console.error("Error fetching Gadget stats:", error);
      // Continue with local stats only if Gadget API fails
    }

    // Use Gadget data as primary source, fallback to local data
    const consolidatedStats = {
      ...business,
      domainVerified,
      // Use Gadget data for checkout/order metrics
      totalCheckouts: gadgetStats.totalCheckouts,
      totalOrders: gadgetStats.totalOrders,
      totalRevenue:
        gadgetStats.totalRevenue > 0
          ? gadgetStats.totalRevenue
          : business.totalRevenue,
      // Keep local data for visit tracking
      totalVisits: business.totalVisits,
      totalPurchases: business.totalPurchases,
      // Calculate derived fields using consolidated data
      averageOrderValue:
        gadgetStats.totalOrders > 0
          ? gadgetStats.totalRevenue / gadgetStats.totalOrders
          : business.totalPurchases > 0
            ? business.totalRevenue / business.totalPurchases
            : 0,
      conversionRate:
        business.totalVisits > 0
          ? (gadgetStats.totalOrders / business.totalVisits) * 100
          : 0,
      projectedFee:
        gadgetStats.totalRevenue > 0
          ? gadgetStats.totalRevenue * (business.adminCommissionRate / 100)
          : business.totalRevenue * (business.adminCommissionRate / 100),
      // Local tracking events
      totalAddToCart: trackingEvents.filter(
        (event) => event.eventType === "add_to_cart",
      ).length,
      totalPageViews: trackingEvents.filter(
        (event) => event.eventType === "page_view",
      ).length,
      totalProductViews: trackingEvents.filter(
        (event) => event.eventType === "product_view",
      ).length,
      recentClicks: clicks,
      recentConversions: conversions,
      recentEvents: trackingEvents,
      // Gadget data
      recentCheckouts: gadgetStats.recentCheckouts,
      recentOrders: gadgetStats.recentOrders,
    };

    return consolidatedStats;
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
        logo: true,
        category: true,
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

    // Calculate local tracking statistics
    const totalClicks = clicks.length;
    const totalConversions = conversions.length;

    // Calculate post-redirect event metrics from tracking events
    const addToCartEvents = trackingEvents.filter(
      (event) => event.eventType === "add_to_cart",
    );
    const pageViewEvents = trackingEvents.filter(
      (event) => event.eventType === "page_view",
    );
    const productViewEvents = trackingEvents.filter(
      (event) => event.eventType === "product_view",
    );

    // Calculate revenue from conversions only
    const localRevenue = conversions.reduce((sum, conv) => {
      const price = conv.productPrice ? parseFloat(conv.productPrice) : 0;
      return sum + price;
    }, 0);

    const localPurchases = totalConversions;

    // Calculate unique sessions
    const allSessionIds = new Set([
      ...clicks.map((c) => c.sessionId).filter(Boolean),
      ...conversions.map((c) => c.sessionId).filter(Boolean),
      ...trackingEvents.map((e) => e.sessionId).filter(Boolean),
    ]);
    const totalSessions = allSessionIds.size;

    // Fetch Gadget API data for consolidated statistics
    let gadgetStats = {
      totalCheckouts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      recentCheckouts: [],
      recentOrders: [],
    };

    try {
      const GADGET_API_URL = process.env.PAVLP_DASHBOARD_ACCESS
        ? "https://ipick.io/api/graphql"
        : "https://ipick.io/api/graphql";
      const API_KEY =
        process.env.PAVL_APP || process.env.PAVLP_DASHBOARD_ACCESS;

      if (!API_KEY) {
        console.error(
          "No API key found. Please set PAVL_APP or PAVLP_DASHBOARD_ACCESS environment variable",
        );
        throw new Error("API key not configured");
      }

      // Get shops for this business domain
      const shopsResponse = await fetch(GADGET_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
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
          variables: { businessDomain: business.domain },
        }),
      });

      const shopsData = await shopsResponse.json();
      const shops =
        shopsData.data?.shopifyShops?.edges?.map((edge) => edge.node) || [];
      const shopIds = shops.map((shop) => shop.id);

      if (shopIds.length > 0) {
        // Get checkouts and orders for these shops
        const [checkoutsResponse, ordersResponse] = await Promise.all([
          fetch(GADGET_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
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
              variables: { limit: 100 },
            }),
          }),
          fetch(GADGET_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
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
              variables: { limit: 100 },
            }),
          }),
        ]);

        const checkoutsData = await checkoutsResponse.json();
        const ordersData = await ordersResponse.json();

        const allCheckouts =
          checkoutsData.data?.shopifyCheckouts?.edges?.map(
            (edge) => edge.node,
          ) || [];
        const allOrders =
          ordersData.data?.shopifyOrders?.edges?.map((edge) => edge.node) || [];

        // Filter by shop IDs
        const filteredCheckouts = allCheckouts.filter(
          (checkout) => checkout.shop && shopIds.includes(checkout.shop.id),
        );
        const filteredOrders = allOrders.filter(
          (order) => order.shop && shopIds.includes(order.shop.id),
        );

        // Calculate Gadget metrics
        gadgetStats = {
          totalCheckouts: filteredCheckouts.length,
          totalOrders: filteredOrders.length,
          totalRevenue: filteredOrders.reduce((sum, order) => {
            const price = parseFloat(order.totalPrice || "0");
            return sum + (isNaN(price) ? 0 : price);
          }, 0),
          recentCheckouts: filteredCheckouts.slice(0, 10),
          recentOrders: filteredOrders.slice(0, 10),
        };
      }
    } catch (error) {
      console.error("Error fetching Gadget stats:", error);
      // Continue with local stats only if Gadget API fails
    }

    // Use consolidated data - Gadget data takes priority for orders/revenue
    const totalPurchases =
      gadgetStats.totalOrders > 0 ? gadgetStats.totalOrders : localPurchases;
    const totalRevenue =
      gadgetStats.totalRevenue > 0 ? gadgetStats.totalRevenue : localRevenue;
    const totalVisits = totalClicks; // Keep local visits count

    // Calculate conversion rates using consolidated data
    const conversionRate =
      totalVisits > 0 ? (totalPurchases / totalVisits) * 100 : 0;
    const cartToPurchaseRate =
      addToCartEvents.length > 0
        ? (totalPurchases / addToCartEvents.length) * 100
        : 0;
    const averageOrderValue =
      totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

    // Calculate projected commission
    const projectedFee = totalRevenue * (business.adminCommissionRate / 100);

    return {
      id: business.id,
      name: business.name,
      domain: business.domain,
      adminCommissionRate: business.adminCommissionRate,
      affiliateId: business.affiliateId,
      category: business.category,

      // Consolidated stats - Gadget data takes priority
      totalVisits,
      totalPurchases,
      totalRevenue,
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
      recentCheckouts: gadgetStats.recentCheckouts,
      recentOrders: gadgetStats.recentOrders,
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

  async clearBusinessActivity(businessId: number) {
    try {
      // Clear all activity data for the business
      await prisma.businessClick.deleteMany({
        where: { businessId },
      });

      // Clear conversions (businessId is string in this model)
      await prisma.conversion.deleteMany({
        where: { businessId: businessId.toString() },
      });

      // Clear tracking events
      await prisma.trackingEvent.deleteMany({
        where: { businessId },
      });

      // Clear sales data
      await prisma.sale.deleteMany({
        where: { businessId },
      });

      // Clear commissions (these are linked to sales, so they'll be deleted automatically)
      // But we can also clear them explicitly if needed
      await prisma.commission.deleteMany({
        where: {
          sale: {
            businessId,
          },
        },
      });

      return {
        success: true,
        message: "All activity data cleared successfully",
      };
    } catch (error) {
      console.error("Error clearing business activity:", error);
      throw error;
    }
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

  // Business profile operations
  async updateBusinessProfile(
    businessId: number,
    data: {
      name: string;
      domain: string;
      email: string;
      phone?: string | null;
      address?: string | null;
      country?: string | null;
      category?: string | null;
      description?: string | null;
      logo?: string | null;
    },
  ) {
    return prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name,
        domain: data.domain,
        email: data.email,
        contactPhone: data.phone,
        address: data.address,
        country: data.country,
        category: data.category,
        description: data.description,
        logo: data.logo,
      },
    });
  },

  // My Page statistics with pending checkout handling
  async getMyPageStats(businessId: number, domain: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        domain: true,
        adminCommissionRate: true,
        affiliateId: true,
        totalVisits: true,
        totalPurchases: true,
        totalRevenue: true,
      },
    });

    if (!business) {
      return null;
    }

    // Get tracking events for this business
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
          url: true,
          sessionId: true,
          timestamp: true,
          eventData: true,
        },
      }),
    ]);

    // Calculate tracking metrics
    const totalPageViews = trackingEvents.filter(
      (event) => event.eventType === "page_view",
    ).length;
    const totalProductViews = trackingEvents.filter(
      (event) => event.eventType === "product_view",
    ).length;
    const totalAddToCart = trackingEvents.filter(
      (event) => event.eventType === "add_to_cart",
    ).length;
    const totalSessions = new Set(
      trackingEvents.map((event) => event.sessionId).filter(Boolean),
    ).size;

    // Try to get checkout data from Gadget API
    let checkoutData: any[] = [];
    let pendingCheckouts = 0;
    let pendingRevenue = 0;
    let completedCheckouts = 0;
    let completedRevenue = 0;
    let appRedirectRevenue = 0;
    let totalCheckouts = 0;

    try {
      // Fetch checkout data from Gadget API
      const GADGET_API_URL = process.env.PAVLP_DASHBOARD_ACCESS
        ? "https://ipick.io/api/graphql"
        : "https://ipick.io/api/graphql";
      const API_KEY =
        process.env.PAVL_APP || process.env.PAVLP_DASHBOARD_ACCESS;

      if (!API_KEY) {
        console.error(
          "No API key found. Please set PAVL_APP or PAVLP_DASHBOARD_ACCESS environment variable",
        );
        throw new Error("API key not configured");
      }

      const checkoutsResponse = await fetch(GADGET_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          query: `
            query getCheckouts($limit: Int) {
              shopifyCheckouts(first: $limit) {
                edges {
                  node {
                    id
                    email
                    totalPrice
                    currency
                    checkoutStatus
                    sourceName
                    sourceUrl
                    shopifyCreatedAt
                    completedAt
                    shop {
                      id
                      domain
                    }
                  }
                }
              }
            }
          `,
          variables: { limit: 100 },
        }),
      });

      if (checkoutsResponse.ok) {
        const checkoutsData = await checkoutsResponse.json();
        checkoutData =
          checkoutsData.data?.shopifyCheckouts?.edges?.map(
            (edge: any) => edge.node,
          ) || [];

        // Filter checkouts for this business domain
        const businessCheckouts = checkoutData.filter((checkout: any) => {
          // Check if checkout belongs to this business domain
          return checkout.shop && checkout.shop.domain === domain;
        });

        totalCheckouts = businessCheckouts.length;

        // Separate pending and completed checkouts
        businessCheckouts.forEach((checkout: any) => {
          const price = parseFloat(checkout.totalPrice || "0");
          const isPending =
            checkout.checkoutStatus === "In Progress" || !checkout.completedAt;

          if (isPending) {
            pendingCheckouts++;
            pendingRevenue += price;
          } else {
            completedCheckouts++;
            completedRevenue += price;
          }

          // Check if this is from app redirect
          const isAppRedirect =
            checkout.sourceName === "app" ||
            checkout.sourceUrl?.includes("ipick") ||
            checkout.sourceUrl?.includes("redirect") ||
            checkout.sourceUrl?.includes("utm_source=ipick");

          if (isAppRedirect) {
            appRedirectRevenue += price;
          }
        });
      }
    } catch (error) {
      console.error("Error fetching checkout data from Gadget:", error);
      // Continue with local data only
    }

    // Calculate derived metrics
    const totalRevenue = completedRevenue + pendingRevenue;
    const averageOrderValue =
      totalCheckouts > 0 ? totalRevenue / totalCheckouts : 0;
    const conversionRate =
      totalSessions > 0 ? (completedCheckouts / totalSessions) * 100 : 0;

    // Get recent checkouts for display
    const recentCheckouts = checkoutData
      .filter(
        (checkout: any) => checkout.shop && checkout.shop.domain === domain,
      )
      .slice(0, 10)
      .map((checkout: any) => ({
        id: checkout.id,
        email: checkout.email,
        totalPrice: checkout.totalPrice,
        currency: checkout.currency,
        checkoutStatus: checkout.checkoutStatus,
        sourceName: checkout.sourceName,
        createdAt: checkout.shopifyCreatedAt,
        completedAt: checkout.completedAt,
      }));

    return {
      totalVisits: totalSessions, // Use actual tracked sessions instead of business.totalVisits
      totalPurchases: business.totalPurchases,
      totalRevenue,
      totalCheckouts,
      pendingCheckouts,
      pendingRevenue,
      completedCheckouts,
      completedRevenue,
      appRedirectRevenue,
      conversionRate,
      averageOrderValue,
      recentCheckouts,
      // Add tracking metrics
      totalPageViews,
      totalProductViews,
      totalAddToCart,
      totalSessions,
      // Add cart-to-purchase rate
      cartToPurchaseRate:
        totalAddToCart > 0 ? (completedCheckouts / totalAddToCart) * 100 : 0,
    };
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
