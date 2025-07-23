import path from "path";
import dotenv from "dotenv";
import * as express from "express";
import express__default from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import mcache from "memory-cache";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const createPrismaClient = () => {
  return new PrismaClient({
    log: ["error"]
  });
};
const prisma = globalThis.__prisma || createPrismaClient();
const userService = {
  async createUser(data) {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        isAdmin: data.isAdmin || false
      }
    });
  },
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  },
  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id }
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
            searchHistory: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  },
  async updateUser(id, data) {
    return prisma.user.update({
      where: { id },
      data
    });
  },
  async deleteUser(id) {
    return prisma.user.delete({
      where: { id }
    });
  }
};
const searchHistoryService = {
  async addSearch(userId, data) {
    return prisma.searchHistory.create({
      data: {
        userId,
        url: data.url,
        title: data.title,
        requestId: data.requestId
      }
    });
  },
  async getUserSearchHistory(userId, limit = 20) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit
    });
  },
  async deleteUserSearch(userId, searchId) {
    return prisma.searchHistory.delete({
      where: {
        id: searchId,
        userId
        // Ensure user can only delete their own searches
      }
    });
  },
  async clearUserSearchHistory(userId) {
    return prisma.searchHistory.deleteMany({
      where: { userId }
    });
  },
  // Clean up old search history (older than X days)
  async cleanupOldSearches(daysToKeep = 90) {
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return prisma.searchHistory.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });
  }
};
const legacySearchHistoryService = {
  async addSearch(userKey, url) {
    return prisma.legacySearchHistory.create({
      data: {
        userKey,
        url
      }
    });
  },
  async getUserSearchHistory(userKey, limit = 10) {
    return prisma.legacySearchHistory.findMany({
      where: { userKey },
      orderBy: { timestamp: "desc" },
      take: limit
    });
  },
  async cleanupOldLegacySearches(daysToKeep = 30) {
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return prisma.legacySearchHistory.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });
  }
};
const healthCheck = {
  async checkConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "healthy", message: "Database connection successful" };
    } catch (error) {
      return {
        status: "unhealthy",
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  async getStats() {
    const [userCount, searchCount, legacySearchCount] = await Promise.all([
      prisma.user.count(),
      prisma.searchHistory.count(),
      prisma.legacySearchHistory.count()
    ]);
    return {
      users: userCount,
      searches: searchCount,
      legacySearches: legacySearchCount
    };
  }
};
const affiliateService = {
  async createAffiliateUrl(data) {
    return prisma.affiliateUrl.create({
      data: {
        name: data.name,
        url: data.url,
        description: data.description,
        isActive: data.isActive ?? true
      }
    });
  },
  async getAllAffiliateUrls() {
    return prisma.affiliateUrl.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
  },
  async getAffiliateUrlById(id) {
    return prisma.affiliateUrl.findUnique({
      where: { id }
    });
  },
  async updateAffiliateUrl(id, data) {
    return prisma.affiliateUrl.update({
      where: { id },
      data
    });
  },
  async deleteAffiliateUrl(id) {
    return prisma.affiliateUrl.delete({
      where: { id }
    });
  },
  async incrementClicks(id) {
    return prisma.affiliateUrl.update({
      where: { id },
      data: {
        clicks: {
          increment: 1
        }
      }
    });
  },
  async addConversion(id, revenue = 0) {
    return prisma.affiliateUrl.update({
      where: { id },
      data: {
        conversions: {
          increment: 1
        },
        revenue: {
          increment: revenue
        }
      }
    });
  },
  async getAffiliateStats() {
    const [totalUrls, activeUrls, totalClicks, totalConversions, totalRevenue] = await Promise.all([
      prisma.affiliateUrl.count(),
      prisma.affiliateUrl.count({ where: { isActive: true } }),
      prisma.affiliateUrl.aggregate({
        _sum: { clicks: true }
      }),
      prisma.affiliateUrl.aggregate({
        _sum: { conversions: true }
      }),
      prisma.affiliateUrl.aggregate({
        _sum: { revenue: true }
      })
    ]);
    return {
      totalUrls,
      activeUrls,
      totalClicks: totalClicks._sum.clicks || 0,
      totalConversions: totalConversions._sum.conversions || 0,
      totalRevenue: totalRevenue._sum.revenue || 0
    };
  }
};
const businessService = {
  async createBusiness(data) {
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
        password: data.password
      }
    });
  },
  async findBusinessByDomain(domain) {
    return prisma.business.findUnique({
      where: { domain: domain.toLowerCase() }
    });
  },
  async getAllBusinesses() {
    return prisma.business.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
  },
  async getActiveBusinesses() {
    return prisma.business.findMany({
      where: { isActive: true },
      orderBy: {
        name: "asc"
      }
    });
  },
  async updateBusiness(id, data) {
    return prisma.business.update({
      where: { id },
      data
    });
  },
  async deleteBusiness(id) {
    return prisma.business.delete({
      where: { id }
    });
  },
  async verifyBusiness(id) {
    return prisma.business.update({
      where: { id },
      data: { isVerified: true }
    });
  },
  async getBusinessStats() {
    const [totalBusinesses, activeBusinesses, verifiedBusinesses] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count({ where: { isVerified: true } })
    ]);
    return {
      totalBusinesses,
      activeBusinesses,
      verifiedBusinesses
    };
  },
  // Business authentication
  async findBusinessByEmail(email) {
    return prisma.business.findUnique({
      where: { email: email.toLowerCase() }
    });
  },
  async findBusinessById(id) {
    return prisma.business.findUnique({
      where: { id }
    });
  },
  // Business statistics
  async updateBusinessStats(businessId, data) {
    return prisma.business.update({
      where: { id: businessId },
      data
    });
  },
  async incrementBusinessVisits(businessId) {
    return prisma.business.update({
      where: { id: businessId },
      data: {
        totalVisits: {
          increment: 1
        }
      }
    });
  },
  async incrementBusinessPurchases(businessId, revenue) {
    return prisma.business.update({
      where: { id: businessId },
      data: {
        totalPurchases: {
          increment: 1
        },
        totalRevenue: {
          increment: revenue
        }
      }
    });
  },
  async getBusinessStatistics(businessId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        domain: true,
        totalVisits: true,
        totalPurchases: true,
        totalRevenue: true,
        adminCommissionRate: true
      }
    });
    if (!business) return null;
    const projectedFee = business.totalRevenue * business.adminCommissionRate / 100;
    const averageOrderValue = business.totalPurchases > 0 ? business.totalRevenue / business.totalPurchases : 0;
    return {
      ...business,
      projectedFee,
      averageOrderValue,
      conversionRate: business.totalVisits > 0 ? business.totalPurchases / business.totalVisits * 100 : 0
    };
  },
  async updateAdminCommissionRate(businessId, commissionRate) {
    return prisma.business.update({
      where: { id: businessId },
      data: { adminCommissionRate: commissionRate }
    });
  },
  async updateBusinessPassword(businessId, password) {
    const bcrypt2 = require("bcryptjs");
    const hashedPassword = await bcrypt2.hash(password, 10);
    return prisma.business.update({
      where: { id: businessId },
      data: { password: hashedPassword }
    });
  }
};
const clickLogService = {
  async logClick(data) {
    return prisma.clickLog.create({
      data: {
        affiliateId: data.affiliateId,
        productId: data.productId,
        userId: data.userId,
        userAgent: data.userAgent,
        referrer: data.referrer,
        ip: data.ip
      }
    });
  },
  // TODO: Implement real product/business lookup
  async getProductUrlByAffiliateAndProductId(affiliateId, productId) {
    return `https://example.com/product/${productId}`;
  }
};
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
    console.log("Database connection closed gracefully");
  } catch (error) {
    console.error("Error during database shutdown:", error);
  }
};
const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "connected", message: "Database connection successful" };
  } catch (error) {
    return {
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
function extractPrice(text) {
  const match = text.match(/(\d{1,4}[.,]?\d{2})/);
  return match ? parseFloat(match[1].replace(",", ".")) : null;
}
function extractDirectRetailerUrl(link) {
  if (!link) return "";
  if (link.includes("google.com/shopping/product/")) {
    return link;
  }
  try {
    const url = new URL(link);
    return `${url.origin}${url.pathname}`;
  } catch {
    return link;
  }
}
function extractStoreName(link) {
  if (!link) return "unknown";
  if (link.includes("google.com/shopping/product/")) {
    return "Google Shopping";
  }
  try {
    return new URL(link).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}
const router$1 = express__default.Router();
const SEARCH_API_KEY = process.env.SEARCH_API_KEY || process.env.SERP_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("SearchAPI Key loaded:", SEARCH_API_KEY ? "Yes" : "No");
async function testGeminiAPIKey() {
  if (!GEMINI_API_KEY) return false;
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent",
      {
        contents: [{ parts: [{ text: "Hello" }] }]
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: { "Content-Type": "application/json" },
        timeout: 1e4
      }
    );
    if (response.status === 200) {
      console.log("✅ Gemini API key is valid");
      return true;
    } else {
      console.error("❌ Gemini API test failed with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Gemini API test failed:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    return false;
  }
}
testGeminiAPIKey().then((isValid) => {
  if (!isValid) {
    console.warn("⚠️ Gemini API key appears to be invalid, will use fallback methods");
    geminiFailureCount = MAX_GEMINI_FAILURES;
  }
});
let geminiFailureCount = 0;
const MAX_GEMINI_FAILURES = 3;
function safeParseGeminiJSON(text, fallback) {
  try {
    let jsonText = text;
    if (text.includes("```json")) {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
    } else if (text.includes("```")) {
      const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonText = codeMatch[1].trim();
      }
    }
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      console.error("Gemini returned non-array response:", parsed);
      return fallback;
    }
  } catch (parseError) {
    console.error("Failed to parse Gemini response as JSON:", parseError);
    console.error("Raw response text:", text);
    return fallback;
  }
}
async function cleanProductTitleWithGemini(productTitle) {
  if (!GEMINI_API_KEY || geminiFailureCount >= MAX_GEMINI_FAILURES) {
    console.log("Gemini API key not available or too many failures, using fallback title cleaning");
    return cleanProductTitleFallback(productTitle);
  }
  try {
    const prompt = `Clean this product title for better search results. Remove SEO words, marketing terms, and keep only the essential product information (brand, model, type). Return only the cleaned title, nothing else.

Original title: "${productTitle}"

Examples:
- "Sonos Ace: Wireless Over Ear Headphones with Noise Cancellation" → "Sonos Ace Wireless Headphones"
- "Samsung BESPOKE Jet Bot AI+ Robot Vacuum Cleaner with Clean Station" → "Samsung BESPOKE Jet Bot Vacuum"
- "Apple iPhone 15 Pro Max 256GB Titanium - Latest Model with Advanced Camera" → "Apple iPhone 15 Pro Max"

Cleaned title:`;
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent",
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 3e4,
        // 30 second timeout
        maxRedirects: 5
      }
    );
    const data = response.data;
    const cleanedTitle = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (cleanedTitle && cleanedTitle.length > 0) {
      console.log(`Gemini cleaned title: "${productTitle}" → "${cleanedTitle}"`);
      return cleanedTitle;
    } else {
      console.log("Gemini returned empty response, using fallback");
      return cleanProductTitleFallback(productTitle);
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    geminiFailureCount++;
    console.log(`Gemini failure count: ${geminiFailureCount}/${MAX_GEMINI_FAILURES}`);
    console.log("Using fallback title cleaning");
    return cleanProductTitleFallback(productTitle);
  }
}
function cleanProductTitleFallback(productTitle) {
  if (!productTitle) return "";
  const seoWords = [
    "with",
    "and",
    "the",
    "latest",
    "new",
    "best",
    "top",
    "premium",
    "advanced",
    "professional",
    "pro",
    "plus",
    "max",
    "ultra",
    "extreme",
    "ultimate",
    "wireless",
    "bluetooth",
    "smart",
    "intelligent",
    "automatic",
    "automatic",
    "noise",
    "cancelling",
    "cancellation",
    "active",
    "passive",
    "hybrid",
    "over-ear",
    "on-ear",
    "in-ear",
    "true",
    "wireless",
    "earbuds",
    "headphones",
    "speakers",
    "sound",
    "audio",
    "music",
    "bass",
    "treble",
    "clarity",
    "crystal",
    "clear",
    "sharp",
    "vivid",
    "brilliant",
    "stunning",
    "amazing",
    "incredible",
    "fantastic",
    "excellent",
    "perfect",
    "ideal",
    "optimal",
    "superior",
    "premium",
    "high-quality",
    "high",
    "quality",
    "durable",
    "long-lasting",
    "reliable",
    "trusted",
    "popular",
    "favorite",
    "choice",
    "recommended",
    "award-winning",
    "award",
    "winning",
    "best-selling",
    "best",
    "selling",
    "trending",
    "viral",
    "hot",
    "cool",
    "awesome",
    "great",
    "good",
    "nice",
    "beautiful",
    "elegant",
    "stylish",
    "modern",
    "contemporary",
    "classic",
    "traditional",
    "vintage",
    "retro",
    "unique",
    "special",
    "exclusive",
    "limited",
    "edition",
    "collector",
    "series",
    "collection",
    "set",
    "bundle",
    "package",
    "kit",
    "combo",
    "deal",
    "offer",
    "discount",
    "sale",
    "clearance",
    "outlet",
    "refurbished",
    "used",
    "pre-owned",
    "second-hand",
    "like-new",
    "mint",
    "condition",
    "warranty",
    "guarantee",
    "certified",
    "authentic",
    "genuine",
    "original",
    "official",
    "licensed",
    "authorized",
    "dealer",
    "reseller",
    "distributor",
    "manufacturer",
    "brand",
    "company",
    "corporation",
    "inc",
    "ltd",
    "llc",
    "co",
    "corp",
    "international",
    "global",
    "worldwide",
    "imported",
    "domestic",
    "local",
    "regional",
    "national",
    "federal",
    "state",
    "provincial",
    "municipal",
    "city",
    "town",
    "village",
    "community",
    "neighborhood",
    "district",
    "area",
    "zone",
    "region",
    "territory",
    "country",
    "nation",
    "continent",
    "hemisphere",
    "planet",
    "earth",
    "world",
    "universe",
    "galaxy",
    "solar",
    "system",
    "space",
    "cosmos",
    "nature",
    "natural",
    "organic",
    "biological",
    "chemical",
    "physical",
    "mechanical",
    "electrical",
    "electronic",
    "digital",
    "analog",
    "hybrid",
    "mixed",
    "combined",
    "integrated",
    "unified",
    "consolidated",
    "merged",
    "fused",
    "blended",
    "mixed",
    "combined",
    "integrated",
    "unified",
    "consolidated",
    "merged",
    "fused",
    "blended",
    "mixed",
    "combined"
  ];
  let cleanedTitle = productTitle;
  const seoWordsRegex = new RegExp(`\\b(${seoWords.join("|")})\\b`, "gi");
  cleanedTitle = cleanedTitle.replace(seoWordsRegex, "");
  cleanedTitle = cleanedTitle.replace(/\s+/g, " ").trim();
  cleanedTitle = cleanedTitle.replace(/^[:\-\s]+|[:\-\s]+$/g, "");
  const marketingPhrases = [
    /with\s+[a-z\s]+$/i,
    /featuring\s+[a-z\s]+$/i,
    /including\s+[a-z\s]+$/i,
    /comes\s+with\s+[a-z\s]+$/i,
    /includes\s+[a-z\s]+$/i,
    /packaged\s+with\s+[a-z\s]+$/i,
    /bundle\s+with\s+[a-z\s]+$/i,
    /set\s+with\s+[a-z\s]+$/i,
    /kit\s+with\s+[a-z\s]+$/i,
    /combo\s+with\s+[a-z\s]+$/i,
    /deal\s+with\s+[a-z\s]+$/i,
    /offer\s+with\s+[a-z\s]+$/i,
    /discount\s+with\s+[a-z\s]+$/i,
    /sale\s+with\s+[a-z\s]+$/i,
    /clearance\s+with\s+[a-z\s]+$/i,
    /outlet\s+with\s+[a-z\s]+$/i,
    /refurbished\s+with\s+[a-z\s]+$/i,
    /used\s+with\s+[a-z\s]+$/i,
    /pre-owned\s+with\s+[a-z\s]+$/i,
    /second-hand\s+with\s+[a-z\s]+$/i,
    /like-new\s+with\s+[a-z\s]+$/i,
    /mint\s+with\s+[a-z\s]+$/i,
    /condition\s+with\s+[a-z\s]+$/i,
    /warranty\s+with\s+[a-z\s]+$/i,
    /guarantee\s+with\s+[a-z\s]+$/i,
    /certified\s+with\s+[a-z\s]+$/i,
    /authentic\s+with\s+[a-z\s]+$/i,
    /genuine\s+with\s+[a-z\s]+$/i,
    /original\s+with\s+[a-z\s]+$/i,
    /official\s+with\s+[a-z\s]+$/i,
    /licensed\s+with\s+[a-z\s]+$/i,
    /authorized\s+with\s+[a-z\s]+$/i,
    /dealer\s+with\s+[a-z\s]+$/i,
    /reseller\s+with\s+[a-z\s]+$/i,
    /distributor\s+with\s+[a-z\s]+$/i,
    /manufacturer\s+with\s+[a-z\s]+$/i,
    /brand\s+with\s+[a-z\s]+$/i,
    /company\s+with\s+[a-z\s]+$/i,
    /corporation\s+with\s+[a-z\s]+$/i,
    /inc\s+with\s+[a-z\s]+$/i,
    /ltd\s+with\s+[a-z\s]+$/i,
    /llc\s+with\s+[a-z\s]+$/i,
    /co\s+with\s+[a-z\s]+$/i,
    /corp\s+with\s+[a-z\s]+$/i,
    /international\s+with\s+[a-z\s]+$/i,
    /global\s+with\s+[a-z\s]+$/i,
    /worldwide\s+with\s+[a-z\s]+$/i,
    /imported\s+with\s+[a-z\s]+$/i,
    /domestic\s+with\s+[a-z\s]+$/i,
    /local\s+with\s+[a-z\s]+$/i,
    /regional\s+with\s+[a-z\s]+$/i,
    /national\s+with\s+[a-z\s]+$/i,
    /federal\s+with\s+[a-z\s]+$/i,
    /state\s+with\s+[a-z\s]+$/i,
    /provincial\s+with\s+[a-z\s]+$/i,
    /municipal\s+with\s+[a-z\s]+$/i,
    /city\s+with\s+[a-z\s]+$/i,
    /town\s+with\s+[a-z\s]+$/i,
    /village\s+with\s+[a-z\s]+$/i,
    /community\s+with\s+[a-z\s]+$/i,
    /neighborhood\s+with\s+[a-z\s]+$/i,
    /district\s+with\s+[a-z\s]+$/i,
    /area\s+with\s+[a-z\s]+$/i,
    /zone\s+with\s+[a-z\s]+$/i,
    /region\s+with\s+[a-z\s]+$/i,
    /territory\s+with\s+[a-z\s]+$/i,
    /country\s+with\s+[a-z\s]+$/i,
    /nation\s+with\s+[a-z\s]+$/i,
    /continent\s+with\s+[a-z\s]+$/i,
    /hemisphere\s+with\s+[a-z\s]+$/i,
    /planet\s+with\s+[a-z\s]+$/i,
    /earth\s+with\s+[a-z\s]+$/i,
    /world\s+with\s+[a-z\s]+$/i,
    /universe\s+with\s+[a-z\s]+$/i,
    /galaxy\s+with\s+[a-z\s]+$/i,
    /solar\s+with\s+[a-z\s]+$/i,
    /system\s+with\s+[a-z\s]+$/i,
    /space\s+with\s+[a-z\s]+$/i,
    /cosmos\s+with\s+[a-z\s]+$/i,
    /nature\s+with\s+[a-z\s]+$/i,
    /natural\s+with\s+[a-z\s]+$/i,
    /organic\s+with\s+[a-z\s]+$/i,
    /biological\s+with\s+[a-z\s]+$/i,
    /chemical\s+with\s+[a-z\s]+$/i,
    /physical\s+with\s+[a-z\s]+$/i,
    /mechanical\s+with\s+[a-z\s]+$/i,
    /electrical\s+with\s+[a-z\s]+$/i,
    /electronic\s+with\s+[a-z\s]+$/i,
    /digital\s+with\s+[a-z\s]+$/i,
    /analog\s+with\s+[a-z\s]+$/i,
    /hybrid\s+with\s+[a-z\s]+$/i,
    /mixed\s+with\s+[a-z\s]+$/i,
    /combined\s+with\s+[a-z\s]+$/i,
    /integrated\s+with\s+[a-z\s]+$/i,
    /unified\s+with\s+[a-z\s]+$/i,
    /consolidated\s+with\s+[a-z\s]+$/i,
    /merged\s+with\s+[a-z\s]+$/i,
    /fused\s+with\s+[a-z\s]+$/i,
    /blended\s+with\s+[a-z\s]+$/i
  ];
  for (const phrase of marketingPhrases) {
    cleanedTitle = cleanedTitle.replace(phrase, "");
  }
  cleanedTitle = cleanedTitle.replace(/\s+/g, " ").trim();
  cleanedTitle = cleanedTitle.replace(/^[:\-\s]+|[:\-\s]+$/g, "");
  console.log(`Fallback cleaned title: "${productTitle}" → "${cleanedTitle}"`);
  return cleanedTitle;
}
let lastSearchApiCall = 0;
const SEARCH_API_RATE_LIMIT = 1e3;
let isRateLimited = false;
let rateLimitResetTime = 0;
async function makeSearchApiRequest(url) {
  const now = Date.now();
  if (isRateLimited && now < rateLimitResetTime) {
    const remainingTime = rateLimitResetTime - now;
    console.log(`Rate limited, waiting ${remainingTime}ms before retry`);
    await new Promise((resolve) => setTimeout(resolve, remainingTime));
    isRateLimited = false;
  }
  const timeSinceLastCall = now - lastSearchApiCall;
  if (timeSinceLastCall < SEARCH_API_RATE_LIMIT) {
    const delay = SEARCH_API_RATE_LIMIT - timeSinceLastCall;
    console.log(`Rate limiting: waiting ${delay}ms before next SearchAPI call`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastSearchApiCall = Date.now();
  try {
    const response = await axios.get(url, {
      timeout: 15e3,
      // 15 second timeout
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PriceComparisonBot/1.0)"
      }
    });
    if (response.status === 429) {
      console.warn("SearchAPI rate limit exceeded, setting global rate limit for 30 seconds");
      isRateLimited = true;
      rateLimitResetTime = now + 3e4;
      return null;
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        console.warn("SearchAPI rate limit exceeded, setting global rate limit for 30 seconds");
        isRateLimited = true;
        rateLimitResetTime = now + 3e4;
        return null;
      }
      console.error(`SearchAPI request failed: ${error.response?.status} ${error.response?.statusText}`);
    } else {
      console.error("SearchAPI request error:", error);
    }
    return null;
  }
}
async function testSearchAPIKey() {
  if (!SEARCH_API_KEY) return false;
  try {
    const testUrl = `https://www.searchapi.io/api/v1/search?engine=google&q=test&api_key=${SEARCH_API_KEY}`;
    const response = await axios.get(testUrl, {
      timeout: 1e4,
      // 10 second timeout
      maxRedirects: 3
    });
    if (response.status === 200) {
      console.log("✅ SearchAPI key is valid");
      return true;
    } else if (response.status === 401) {
      console.error("❌ SearchAPI key is invalid or expired");
      return false;
    } else if (response.status === 429) {
      console.warn("⚠️ SearchAPI rate limit exceeded during test");
      return false;
    } else {
      console.warn(`⚠️ SearchAPI test returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.error("❌ SearchAPI key is invalid or expired");
        return false;
      } else if (error.response?.status === 429) {
        console.warn("⚠️ SearchAPI rate limit exceeded during test");
        return false;
      } else {
        console.error(`❌ SearchAPI test failed: ${error.response?.status} ${error.response?.statusText}`);
        return false;
      }
    } else {
      console.error("❌ SearchAPI test failed:", error);
      return false;
    }
  }
}
function extractProductModel(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const modelPatterns = [
      /[A-Z]{2,3}\d{6,8}[A-Z]?/g,
      // Pattern like BDFS26040XQ
      /\d{8,12}/g,
      // Long numeric codes
      /[A-Z]{2,4}\d{4,6}[A-Z]?/g
      // Shorter patterns
    ];
    for (const pattern of modelPatterns) {
      const matches = pathname.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`Found model in Lithuanian URL path: ${matches[0]}`);
        return matches[0];
      }
    }
    const fullUrlMatches = url.match(/[A-Z]{2,3}\d{6,8}[A-Z]?/);
    if (fullUrlMatches) {
      console.log(`Found model in full URL: ${fullUrlMatches[0]}`);
      return fullUrlMatches[0];
    }
    return null;
  } catch (error) {
    console.error("Error extracting product model:", error);
    return null;
  }
}
function extractBrandFromTitle(productTitle) {
  if (!productTitle) return "";
  const brands = [
    "Samsung",
    "LG",
    "Bosch",
    "Siemens",
    "Beko",
    "Whirlpool",
    "Electrolux",
    "Panasonic",
    "Sharp",
    "Toshiba",
    "Hitachi",
    "Daewoo",
    "Haier",
    "Apple",
    "Sony",
    "Philips",
    "Braun",
    "KitchenAid",
    "Kenmore",
    "Maytag",
    "Frigidaire",
    "GE",
    "Hotpoint",
    "Zanussi",
    "AEG",
    "Miele",
    "Gorenje",
    "Vestel",
    "Arçelik",
    "Blaupunkt",
    "Grundig",
    // Audio/Electronics brands
    "Sonos",
    "Bose",
    "JBL",
    "Sennheiser",
    "Audio-Technica",
    "Shure",
    "Beyerdynamic",
    "AKG",
    "Denon",
    "Marantz",
    "Pioneer",
    "Onkyo",
    "Yamaha",
    "Harman Kardon",
    "Klipsch",
    "Bowers & Wilkins",
    "B&W",
    "Focal",
    "KEF",
    "Monitor Audio",
    "Dynaudio",
    "Elac",
    "Wharfedale",
    "Cambridge Audio",
    "Rega",
    "Naim",
    "Linn",
    "McIntosh",
    "Krell",
    "Paradigm",
    "Martin Logan",
    "Definitive Technology",
    "Polk Audio",
    "Infinity",
    "Cerwin Vega",
    "Jamo",
    "Dali",
    "Q Acoustics",
    "Monitor",
    "M-Audio",
    "Focusrite",
    "Presonus",
    "Behringer",
    "Rode",
    "Blue",
    "Audio Technica",
    "Sennheiser",
    "Beyerdynamic",
    "AKG",
    "Shure",
    "Sony",
    "Panasonic",
    "Sharp",
    "Toshiba",
    "Hitachi",
    "Daewoo",
    "LG",
    "Samsung",
    "Philips",
    "Braun",
    "KitchenAid",
    "Kenmore",
    "Maytag",
    "Frigidaire",
    "GE",
    "Hotpoint",
    "Zanussi",
    "AEG",
    "Miele",
    "Gorenje",
    "Vestel",
    "Arçelik",
    "Blaupunkt",
    "Grundig",
    // Computer/Electronics brands
    "Apple",
    "Dell",
    "HP",
    "Lenovo",
    "Asus",
    "Acer",
    "MSI",
    "Gigabyte",
    "Intel",
    "AMD",
    "NVIDIA",
    "Corsair",
    "EVGA",
    "Thermaltake",
    "Cooler Master",
    "Noctua",
    "be quiet!",
    "Fractal Design",
    "Phanteks",
    "Lian Li",
    "NZXT",
    "Silverstone",
    "Antec",
    "Seasonic",
    "EVGA",
    "Corsair",
    "G.Skill",
    "Crucial",
    "Samsung",
    "Western Digital",
    "Seagate",
    "Kingston",
    "ADATA",
    "Team Group",
    "Patriot",
    "PNY",
    "Logitech",
    "Razer",
    "SteelSeries",
    "HyperX",
    "Corsair",
    "ROCCAT",
    "Mad Catz",
    "Saitek",
    "Thrustmaster",
    "Fanatec",
    "Logitech G",
    // Gaming brands
    "Nintendo",
    "Sony",
    "Microsoft",
    "Xbox",
    "PlayStation",
    "Steam",
    "Valve",
    "Blizzard",
    "EA",
    "Ubisoft",
    "Activision",
    "Bethesda",
    "Rockstar",
    "Take-Two",
    "2K",
    "Capcom",
    "Konami",
    "Sega",
    "Bandai Namco",
    "Square Enix",
    "Atlus",
    "NIS America",
    "Xseed",
    "Aksys",
    "Idea Factory",
    "Compile Heart",
    "Gust",
    "Falcom",
    "Nihon Falcom",
    "Falcom",
    "Nihon",
    "Falcom",
    "Nihon",
    "Falcom"
  ];
  const titleLower = productTitle.toLowerCase();
  for (const brand of brands) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  const words = productTitle.split(" ");
  if (words.length > 0) {
    const firstWord = words[0];
    if (firstWord.length > 2 && firstWord.length < 15 && /^[A-Z]/.test(firstWord)) {
      return firstWord;
    }
  }
  return "";
}
function extractProductType(productTitle) {
  if (!productTitle) return "";
  const titleLower = productTitle.toLowerCase();
  const productTypes = [
    // Kitchen appliances
    "dishwasher",
    "washing machine",
    "dryer",
    "refrigerator",
    "freezer",
    "oven",
    "microwave",
    "stove",
    "cooker",
    "range",
    "hood",
    "extractor",
    "blender",
    "mixer",
    "food processor",
    "coffee maker",
    "toaster",
    "kettle",
    "iron",
    "vacuum cleaner",
    "air conditioner",
    "heater",
    "fan",
    "dehumidifier",
    "humidifier",
    "purifier",
    "filter",
    // Electronics
    "laptop",
    "computer",
    "desktop",
    "tablet",
    "phone",
    "smartphone",
    "tv",
    "television",
    "monitor",
    "speaker",
    "headphone",
    "camera",
    "printer",
    "scanner",
    "router",
    "modem",
    "keyboard",
    "mouse",
    // Audio equipment
    "headphones",
    "headphone",
    "earbuds",
    "earbud",
    "earphones",
    "earphone",
    "speakers",
    "speaker",
    "subwoofer",
    "woofer",
    "tweeter",
    "tweeters",
    "amplifier",
    "amp",
    "receiver",
    "preamp",
    "preamplifier",
    "power amp",
    "power amplifier",
    "integrated amp",
    "integrated amplifier",
    "mono block",
    "monoblock",
    "stereo amp",
    "stereo amplifier",
    "tube amp",
    "tube amplifier",
    "solid state",
    "solid-state",
    "class a",
    "class b",
    "class ab",
    "class d",
    "turntable",
    "record player",
    "vinyl player",
    "cd player",
    "cdp",
    "dvd player",
    "blu-ray player",
    "streamer",
    "streaming",
    "dac",
    "digital to analog converter",
    "digital-to-analog converter",
    "adc",
    "analog to digital converter",
    "analog-to-digital converter",
    "phono",
    "phono stage",
    "phono preamp",
    "phono preamplifier",
    "mc",
    "mm",
    "moving coil",
    "moving magnet",
    "cartridge",
    "stylus",
    "needle",
    "tonearm",
    "platter",
    "belt drive",
    "direct drive",
    "idler wheel",
    "motor",
    "bearing",
    "spindle",
    "mat",
    "clamp",
    "weight",
    "stabilizer",
    "isolation",
    "feet",
    "spikes",
    "cones",
    "balls",
    "pads",
    "sorbothane",
    "cable",
    "wire",
    "interconnect",
    "speaker cable",
    "speaker wire",
    "power cord",
    "power cable",
    "mains cable",
    "mains cord",
    "iec",
    "power strip",
    "surge protector",
    "ups",
    "uninterruptible power supply",
    "battery",
    "batteries",
    "rechargeable",
    "lithium",
    "li-ion",
    "li-poly",
    "nickel",
    "ni-mh",
    "ni-cd",
    "alkaline",
    "zinc",
    "carbon"
  ];
  for (const type of productTypes) {
    if (titleLower.includes(type)) {
      return type;
    }
  }
  return "";
}
function removeDuplicateResults(results) {
  if (!results || results.length === 0) return [];
  const seen = /* @__PURE__ */ new Set();
  const uniqueResults = [];
  for (const result of results) {
    const url = result.link || result.product_link || result.source_url || "";
    const title = result.title || "";
    const key = `${url}|${title}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(result);
    }
  }
  console.log(`Removed ${results.length - uniqueResults.length} duplicate results`);
  return uniqueResults;
}
async function searchExactProductModel(productModel, productTitle, userCountry, actualPrice) {
  if (!SEARCH_API_KEY) {
    console.warn("SearchAPI key not configured");
    return [];
  }
  try {
    let getCountryCode = function(country) {
      const { SEARCH_API_SUPPORTED_COUNTRIES: SEARCH_API_SUPPORTED_COUNTRIES2 } = require("../services/location");
      const supportedCountry = Object.values(SEARCH_API_SUPPORTED_COUNTRIES2).find(
        (c) => c.country.toLowerCase() === country.toLowerCase()
      );
      if (supportedCountry) {
        return supportedCountry.countryCode;
      }
      console.warn(`Country "${country}" not found in supported countries, defaulting to US`);
      return "us";
    };
    console.log(`Searching for exact product model: ${productModel}`);
    console.log(`Original product title: ${productTitle}`);
    console.log(`User country: ${userCountry}`);
    console.log(`Actual price: ${actualPrice || "Not available"}`);
    console.log(`SearchAPI Key available: ${SEARCH_API_KEY ? "Yes" : "No"}`);
    const isKeyValid = await testSearchAPIKey();
    if (!isKeyValid) {
      console.warn("SearchAPI key is invalid, skipping search");
      return [];
    }
    const cleanedProductTitle = await cleanProductTitleWithGemini(productTitle);
    console.log(`Cleaned product title: "${cleanedProductTitle}"`);
    const countryCode = getCountryCode(userCountry);
    console.log(`Using country code: ${countryCode} for SearchAPI search`);
    let searchQueries = [];
    if (productModel) {
      searchQueries.push(`"${productModel}"`);
      const brand = extractBrandFromTitle(cleanedProductTitle);
      if (brand) {
        searchQueries.push(`"${productModel}" ${brand}`);
      }
      const productType = extractProductType(cleanedProductTitle);
      if (productType) {
        searchQueries.push(`"${productModel}" ${productType}`);
      }
    }
    if (cleanedProductTitle) {
      searchQueries.push(`"${cleanedProductTitle}"`);
      searchQueries.push(cleanedProductTitle);
      const brand = extractBrandFromTitle(cleanedProductTitle);
      const words = cleanedProductTitle.split(" ").filter((word) => word.length > 2);
      if (brand && words.length > 1) {
        const modelWords = words.slice(1, 3).join(" ");
        if (modelWords) {
          searchQueries.push(`${brand} ${modelWords}`);
        }
      }
    }
    if (searchQueries.length === 0) {
      searchQueries.push(`"${productTitle}"`);
      searchQueries.push(productTitle);
    }
    console.log(`Search queries to try: ${JSON.stringify(searchQueries)}`);
    let allResults = [];
    let searchApiFailed = false;
    let rateLimited = false;
    for (const searchQuery of searchQueries) {
      console.log(`Trying search query: ${searchQuery}`);
      const searchApiUrl = `https://www.searchapi.io/api/v1/search?engine=google_shopping&q=${encodeURIComponent(searchQuery)}&gl=${countryCode}&api_key=${SEARCH_API_KEY}`;
      console.log(`SearchAPI URL: ${searchApiUrl}`);
      const searchData = await makeSearchApiRequest(searchApiUrl);
      if (!searchData) {
        console.warn(`SearchAPI failed for query "${searchQuery}", trying next query or fallback`);
        searchApiFailed = true;
        if (searchData === null) {
          rateLimited = true;
          console.warn("Rate limit detected, stopping further searches");
          break;
        }
        continue;
      }
      console.log(`Raw SearchAPI response for "${searchQuery}":`, JSON.stringify(searchData, null, 2));
      let shoppingResults = searchData.shopping_ads || searchData.shopping_results || searchData.inline_shopping || [];
      console.log(`Found ${shoppingResults.length} shopping results for query "${searchQuery}"`);
      const knowledgeGraph = searchData.knowledge_graph;
      if (knowledgeGraph && knowledgeGraph.offers) {
        console.log(`Found ${knowledgeGraph.offers.length} knowledge graph offers for query "${searchQuery}"`);
        shoppingResults.push(...knowledgeGraph.offers);
      }
      const relevantMatches = filterRelevantProductMatches(shoppingResults, productModel, cleanedProductTitle, productTitle);
      console.log(`Found ${relevantMatches.length} relevant matches for query "${searchQuery}"`);
      allResults.push(...relevantMatches);
      if (relevantMatches.length >= 3) {
        console.log("Found sufficient results, stopping search");
        break;
      }
    }
    if (searchApiFailed && allResults.length === 0 || rateLimited) {
      console.log("SearchAPI failed completely or was rate limited, using fallback comparisons");
      return generateFallbackComparisons(productTitle, actualPrice || 0, userCountry);
    }
    const uniqueResults = removeDuplicateResults(allResults);
    console.log(`Total unique relevant matches found: ${uniqueResults.length}`);
    const validationPromises = uniqueResults.map(
      (result) => validateAndSanitizeResult(result, productTitle, actualPrice)
    );
    const validatedResults = await Promise.allSettled(validationPromises);
    const comparisons = validatedResults.filter(
      (result) => result.status === "fulfilled" && result.value !== null
    ).map((result) => result.value).slice(0, 10);
    console.log(`Converted ${comparisons.length} relevant SearchAPI results to PriceComparison format`);
    const priceFilteredComparisons = filterByPriceRange(comparisons, actualPrice || 0);
    console.log("Final price-filtered comparisons:", JSON.stringify(priceFilteredComparisons, null, 2));
    if (priceFilteredComparisons.length > 0) {
      console.log(`Returning ${priceFilteredComparisons.length} SearchAPI results with actual product URLs`);
      return priceFilteredComparisons;
    } else {
      console.log("No SearchAPI results found, using fallback");
      return generateFallbackComparisons(productTitle, actualPrice || 0, userCountry);
    }
  } catch (error) {
    console.error("SearchAPI search error:", error);
    console.log("Using fallback comparisons due to error");
    return generateFallbackComparisons();
  }
}
function generateFallbackComparisons(productTitle, actualPrice, userCountry) {
  console.log("No real product comparisons available - SearchAPI failed or returned no results");
  console.log("Returning empty array to avoid fake URLs");
  return [];
}
function filterRelevantProductMatches(results, productModel, cleanedTitle, originalTitle) {
  if (!results || results.length === 0) return [];
  const cleanedTitleLower = cleanedTitle.toLowerCase();
  originalTitle.toLowerCase();
  const modelLower = productModel?.toLowerCase() || "";
  return results.filter((result) => {
    const resultTitle = (result.title || "").toLowerCase();
    if (productModel && modelLower) {
      if (resultTitle.includes(modelLower)) {
        console.log(`Model match found: ${productModel} in "${result.title}"`);
        return true;
      }
    }
    const brand = extractBrandFromTitle(cleanedTitle);
    if (brand) {
      const brandLower = brand.toLowerCase();
      if (resultTitle.includes(brandLower)) {
        console.log(`Brand match found: ${brand} in "${result.title}"`);
        return true;
      }
    }
    const titleWords = cleanedTitleLower.split(/\s+/).filter((word) => word.length > 2);
    const resultWords = resultTitle.split(/\s+/).filter((word) => word.length > 2);
    let matchCount = 0;
    for (const word of titleWords) {
      if (resultWords.some((resultWord) => resultWord.includes(word) || word.includes(resultWord))) {
        matchCount++;
      }
    }
    const minMatches = Math.max(2, Math.floor(titleWords.length * 0.4));
    const isMatch = matchCount >= minMatches;
    if (isMatch) {
      console.log(`Relevant match found: ${matchCount}/${titleWords.length} words match in "${result.title}"`);
    }
    return isMatch;
  });
}
function generateAssessment(price, basePrice, retailer) {
  let cost = 2;
  if (price < basePrice * 0.9) cost = 1;
  else if (price > basePrice * 1.1) cost = 3;
  return {
    cost,
    value: Math.floor(Math.random() * 3) + 1,
    // 1-3
    quality: Math.floor(Math.random() * 3) + 1,
    // 1-3
    description: `Found on ${retailer}`
  };
}
const extractPriceFromExtensions = (extensions = []) => {
  const priceRegex = /€\s?\d{1,3}(?:[.,]\d{2})?/;
  for (const el of extensions) {
    const match = el.match(priceRegex);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
};
async function validateAndSanitizeResult(result, productTitle, actualPrice) {
  const priceFromExtensions = extractPriceFromExtensions(result.rich_snippet?.extensions);
  const price = priceFromExtensions ? extractPrice(priceFromExtensions) : extractPrice(result.price || result.priceText || result.price_string || result.extracted_price || "");
  const rawUrl = result.link || result.product_link || result.source_url || result.url || result.offers_link || "";
  const url = extractDirectRetailerUrl(rawUrl);
  if (price == null || !url) {
    console.log(`Skipping invalid result: ${result.title} (no price or URL)`);
    return null;
  }
  const isRealProductUrl = url && url.length > 20 && // Real product URLs are longer
  !url.match(/^https?:\/\/[^\/]+\/?$/) && // Not just a domain
  (url.includes("/product/") || url.includes("/p/") || url.includes("/dp/") || url.includes("/item/") || url.includes("/shop/") || url.includes("google.com/shopping/product/"));
  if (!isRealProductUrl) {
    console.log(`Skipping result with non-product URL: ${result.title} (URL: ${url})`);
    return null;
  }
  if (url.includes("google.com/shopping/product/")) {
    console.log(`Skipping HTML validation for Google Shopping URL: ${url}`);
    const finalTitle = result.title || "Unknown Product";
    const finalPrice = price || 0;
    const finalImage = result.thumbnail || result.image || "";
    const assessment = generateAssessment(finalPrice, actualPrice || 0, result.seller || result.source || "");
    return {
      title: finalTitle,
      store: extractStoreName(result.seller || result.source || ""),
      price: finalPrice,
      currency: result.currency || "€",
      url,
      image: finalImage,
      condition: "New",
      assessment
    };
  }
  try {
    console.log(`Validating URL: ${url}`);
    const response = await axios.get(url, {
      timeout: 1e4,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PriceComparisonBot/1.0)"
      }
    });
    const html = response.data;
    const isValidProductPage = validateProductPage(html, productTitle);
    if (!isValidProductPage) {
      console.log(`URL validation failed: ${result.title} (URL: ${url}) - No valid product content found`);
      return null;
    }
    console.log(`URL validation successful: ${result.title} (URL: ${url})`);
    const extractedInfo = extractProductInfoFromHTML(html, url);
    console.log(`Extracted product info:`, extractedInfo);
    const finalTitle = extractedInfo.title || result.title || productTitle;
    const finalPrice = extractedInfo.price || price;
    const finalImage = extractedInfo.image || result.thumbnail || result.image || "";
    const assessment = generateAssessment(finalPrice, actualPrice || 0, result.seller || result.source || "");
    return {
      title: finalTitle,
      store: extractStoreName(result.seller || result.source || ""),
      price: finalPrice,
      currency: result.currency || "€",
      url,
      image: finalImage,
      condition: "New",
      assessment
    };
  } catch (error) {
    console.log(`URL validation failed: ${result.title} (URL: ${url}) - HTTP error: ${error}`);
    return null;
  }
}
function validateProductPage(html, productTitle) {
  const htmlLower = html.toLowerCase();
  const titleLower = productTitle.toLowerCase();
  const errorIndicators = [
    "page not found",
    "404",
    "not found",
    "error",
    "sorry",
    "unavailable",
    "out of stock",
    "discontinued",
    "click the button below to continue shopping"
  ];
  for (const indicator of errorIndicators) {
    if (htmlLower.includes(indicator)) {
      console.log(`Found error indicator: ${indicator}`);
      return false;
    }
  }
  const productIndicators = [
    "add to cart",
    "buy now",
    "add to basket",
    "purchase",
    "price",
    "€",
    "$",
    "product",
    "item",
    "shipping",
    "delivery",
    "stock",
    "availability"
  ];
  let productIndicatorCount = 0;
  for (const indicator of productIndicators) {
    if (htmlLower.includes(indicator)) {
      productIndicatorCount++;
    }
  }
  const titleWords = titleLower.split(" ").filter((word) => word.length > 2);
  let titleMatchCount = 0;
  for (const word of titleWords) {
    if (htmlLower.includes(word)) {
      titleMatchCount++;
    }
  }
  const hasProductContent = productIndicatorCount >= 3;
  const hasTitleMatches = titleMatchCount >= Math.max(1, titleWords.length * 0.3);
  console.log(`Product validation: ${productIndicatorCount} product indicators, ${titleMatchCount}/${titleWords.length} title matches`);
  return hasProductContent && hasTitleMatches;
}
function extractProductInfoFromHTML(html, url) {
  html.toLowerCase();
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }
  let price = 0;
  const pricePatterns = [
    /€\s*(\d+[.,]\d{2})/i,
    /\$(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*€/i,
    /(\d+[.,]\d{2})\s*\$/i,
    /price[^>]*>.*?(\d+[.,]\d{2})/i,
    /cost[^>]*>.*?(\d+[.,]\d{2})/i
  ];
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      price = parseFloat(match[1].replace(",", "."));
      break;
    }
  }
  let image = "";
  const imagePatterns = [
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
    /<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i,
    /<img[^>]*src="([^"]*product[^"]*)"[^>]*>/i,
    /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp))"[^>]*>/i
  ];
  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      image = match[1];
      if (image.startsWith("//")) {
        image = "https:" + image;
      } else if (image.startsWith("/")) {
        const urlObj = new URL(url);
        image = urlObj.origin + image;
      }
      break;
    }
  }
  return { title, price, image };
}
function filterByPriceRange(comparisons, originalPrice) {
  if (originalPrice <= 0) {
    console.log("No original price available, skipping price filtering");
    return comparisons;
  }
  const isGoogleShopping = comparisons.some((comp) => comp.url.includes("google.com/shopping/product/"));
  let minPrice, maxPrice;
  if (isGoogleShopping) {
    minPrice = originalPrice * 0.1;
    maxPrice = originalPrice * 3;
    console.log(`Google Shopping detected - using lenient price range: €${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`);
  } else {
    minPrice = originalPrice * 0.4;
    maxPrice = originalPrice * 2;
    console.log(`Price range: €${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`);
  }
  const filtered = comparisons.filter((comparison) => {
    const isInRange = comparison.price >= minPrice && comparison.price <= maxPrice;
    if (isInRange) {
      console.log(`✓ ${comparison.store}: €${comparison.price} (within range)`);
    } else {
      console.log(`Filtered out ${comparison.store}: €${comparison.price} (${comparison.price < minPrice ? "too cheap" : "too expensive"})`);
    }
    return isInRange;
  });
  console.log(`Price filtering: ${comparisons.length} → ${filtered.length} results`);
  return filtered;
}
function getLocalRetailers(country) {
  const retailerMap = {
    "Germany": [
      "amazon.de",
      "mediamarkt.de",
      "saturn.de",
      "otto.de",
      "idealo.de",
      "geizhals.de",
      "preisvergleich.de",
      "galaxus.de",
      "coolblue.de",
      "cyberport.de",
      "alternate.de",
      "mindfactory.de",
      "caseking.de",
      "hardwareversand.de",
      "computeruniverse.net",
      "notebooksbilliger.de",
      "redcoon.de",
      "arlt.com",
      "hifi-schluderbacher.de",
      "premiumhifi.de"
    ],
    "United States": [
      "amazon.com",
      "walmart.com",
      "target.com",
      "bestbuy.com",
      "newegg.com",
      "bhphotovideo.com",
      "adorama.com",
      "microcenter.com",
      "ebay.com",
      "costco.com",
      "samsclub.com"
    ],
    "United Kingdom": [
      "amazon.co.uk",
      "currys.co.uk",
      "argos.co.uk",
      "johnlewis.com",
      "very.co.uk",
      "ao.com",
      "ebay.co.uk",
      "scan.co.uk",
      "overclockers.co.uk"
    ],
    "France": [
      "amazon.fr",
      "fnac.com",
      "darty.com",
      "boulanger.com",
      "ldlc.com",
      "materiel.net",
      "rue-du-commerce.fr",
      "cdiscount.com"
    ],
    "Italy": [
      "amazon.it",
      "unieuro.it",
      "mediaworld.it",
      "trony.it",
      "euronics.it"
    ],
    "Spain": [
      "amazon.es",
      "pccomponentes.com",
      "mediamarkt.es",
      "elcorteingles.es"
    ],
    "Netherlands": [
      "amazon.nl",
      "bol.com",
      "coolblue.nl",
      "mediamarkt.nl",
      "saturn.nl"
    ],
    "Belgium": [
      "amazon.be",
      "bol.com",
      "coolblue.be",
      "mediamarkt.be",
      "saturn.be"
    ],
    "Austria": [
      "amazon.at",
      "mediamarkt.at",
      "saturn.at",
      "otto.at",
      "idealo.at"
    ],
    "Switzerland": [
      "amazon.ch",
      "digitec.ch",
      "galaxus.ch",
      "mediamarkt.ch",
      "saturn.ch"
    ]
  };
  return retailerMap[country] || retailerMap["United States"];
}
function sortByLocalRetailers(comparisons, userCountry) {
  const localRetailers = getLocalRetailers(userCountry);
  return comparisons.sort((a, b) => {
    const aIsLocal = localRetailers.some(
      (retailer) => a.store.toLowerCase().includes(retailer.toLowerCase())
    );
    const bIsLocal = localRetailers.some(
      (retailer) => b.store.toLowerCase().includes(retailer.toLowerCase())
    );
    if (aIsLocal && !bIsLocal) return -1;
    if (!aIsLocal && bIsLocal) return 1;
    return a.price - b.price;
  });
}
async function detectProductFromUrl(url) {
  try {
    console.log(`Detecting product from URL: ${url}`);
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    const brandFromHostname = extractBrandFromHostname(hostname);
    const pathInfo = extractProductFromPathname(pathname);
    const detectedProduct = {
      brand: brandFromHostname || pathInfo.brand || "",
      model: pathInfo.model || "",
      title: pathInfo.title || "",
      category: pathInfo.category || "",
      price: pathInfo.price
    };
    console.log(`Detected product:`, detectedProduct);
    return detectedProduct;
  } catch (error) {
    console.error("Error detecting product from URL:", error);
    return null;
  }
}
function extractBrandFromHostname(hostname) {
  const brandPatterns = [
    /^www\.(sonos|bose|jbl|sennheiser|beyerdynamic|akg|shure|denon|marantz|yamaha|pioneer|onkyo|harman|klipsch|bowerswilkins|focal|kef|monitor|dynaudio|elac|wharfedale|cambridge|rega|naim|linn|mcintosh|krell|paradigm|martinlogan|definitive|polk|infinity|cerwinvega|jamo|dali|qacoustics|m-audio|focusrite|presonus|behringer|rode|blue|audiotechnica|raycon|anker|soundcore|houseofmarley)\./i,
    /^www\.(samsung|lg|bosch|siemens|beko|whirlpool|electrolux|panasonic|sharp|toshiba|hitachi|daewoo|haier|apple|sony|philips|braun|kitchenaid|kenmore|maytag|frigidaire|ge|hotpoint|zanussi|aeg|miele|gorenje|vestel|arçelik|blaupunkt|grundig)\./i,
    /^www\.(dell|hp|lenovo|asus|acer|msi|gigabyte|intel|amd|nvidia|corsair|evga|thermaltake|coolermaster|noctua|bequiet|fractal|phanteks|lianli|nzxt|silverstone|antec|seasonic|gskill|crucial|western|seagate|kingston|adata|teamgroup|patriot|pny|logitech|razer|steelseries|hyperx|roccat|madcatz|saitek|thrustmaster|fanatec)\./i
  ];
  for (const pattern of brandPatterns) {
    const match = hostname.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  return "";
}
function extractProductFromPathname(pathname) {
  const pathParts = pathname.split("/").filter((part) => part.length > 0);
  const productPatterns2 = [
    // Sonos patterns
    { pattern: /sonos-ace/i, brand: "sonos", model: "ace", category: "headphones" },
    { pattern: /sonos-era/i, brand: "sonos", model: "era", category: "speakers" },
    { pattern: /sonos-beam/i, brand: "sonos", model: "beam", category: "soundbar" },
    { pattern: /sonos-arc/i, brand: "sonos", model: "arc", category: "soundbar" },
    { pattern: /sonos-sub/i, brand: "sonos", model: "sub", category: "subwoofer" },
    { pattern: /sonos-one/i, brand: "sonos", model: "one", category: "speakers" },
    { pattern: /sonos-five/i, brand: "sonos", model: "five", category: "speakers" },
    { pattern: /sonos-move/i, brand: "sonos", model: "move", category: "portable-speaker" },
    { pattern: /sonos-roam/i, brand: "sonos", model: "roam", category: "portable-speaker" },
    // Bose patterns
    { pattern: /bose-quietcomfort/i, brand: "bose", model: "quietcomfort", category: "headphones" },
    { pattern: /bose-soundlink/i, brand: "bose", model: "soundlink", category: "speakers" },
    { pattern: /bose-home-speaker/i, brand: "bose", model: "home-speaker", category: "speakers" },
    { pattern: /bose-sport/i, brand: "bose", model: "sport", category: "headphones" },
    // JBL patterns
    { pattern: /jbl-charge/i, brand: "jbl", model: "charge", category: "portable-speaker" },
    { pattern: /jbl-flip/i, brand: "jbl", model: "flip", category: "portable-speaker" },
    { pattern: /jbl-pulse/i, brand: "jbl", model: "pulse", category: "portable-speaker" },
    { pattern: /jbl-partybox/i, brand: "jbl", model: "partybox", category: "portable-speaker" },
    // Sennheiser patterns
    { pattern: /sennheiser-momentum/i, brand: "sennheiser", model: "momentum", category: "headphones" },
    { pattern: /sennheiser-hd/i, brand: "sennheiser", model: "hd", category: "headphones" },
    { pattern: /sennheiser-ie/i, brand: "sennheiser", model: "ie", category: "earphones" },
    // Audio-Technica patterns
    { pattern: /audio-technica-ath/i, brand: "audio-technica", model: "ath", category: "headphones" },
    { pattern: /audio-technica-at/i, brand: "audio-technica", model: "at", category: "microphones" },
    // Shure patterns
    { pattern: /shure-se/i, brand: "shure", model: "se", category: "earphones" },
    { pattern: /shure-srh/i, brand: "shure", model: "srh", category: "headphones" },
    { pattern: /shure-sm/i, brand: "shure", model: "sm", category: "microphones" },
    // Beyerdynamic patterns
    { pattern: /beyerdynamic-dt/i, brand: "beyerdynamic", model: "dt", category: "headphones" },
    { pattern: /beyerdynamic-t/i, brand: "beyerdynamic", model: "t", category: "microphones" },
    // AKG patterns
    { pattern: /akg-k/i, brand: "akg", model: "k", category: "headphones" },
    { pattern: /akg-p/i, brand: "akg", model: "p", category: "microphones" },
    // Denon patterns
    { pattern: /denon-avr/i, brand: "denon", model: "avr", category: "receiver" },
    { pattern: /denon-dm/i, brand: "denon", model: "dm", category: "micro-system" },
    // Marantz patterns
    { pattern: /marantz-sr/i, brand: "marantz", model: "sr", category: "receiver" },
    { pattern: /marantz-pm/i, brand: "marantz", model: "pm", category: "amplifier" },
    // Yamaha patterns
    { pattern: /yamaha-rx/i, brand: "yamaha", model: "rx", category: "receiver" },
    { pattern: /yamaha-ax/i, brand: "yamaha", model: "ax", category: "amplifier" },
    { pattern: /yamaha-ns/i, brand: "yamaha", model: "ns", category: "speakers" },
    // Pioneer patterns
    { pattern: /pioneer-vsx/i, brand: "pioneer", model: "vsx", category: "receiver" },
    { pattern: /pioneer-a/i, brand: "pioneer", model: "a", category: "amplifier" },
    // Onkyo patterns
    { pattern: /onkyo-tx/i, brand: "onkyo", model: "tx", category: "receiver" },
    { pattern: /onkyo-a/i, brand: "onkyo", model: "a", category: "amplifier" },
    // Klipsch patterns
    { pattern: /klipsch-rp/i, brand: "klipsch", model: "rp", category: "speakers" },
    { pattern: /klipsch-reference/i, brand: "klipsch", model: "reference", category: "speakers" },
    { pattern: /klipsch-synergy/i, brand: "klipsch", model: "synergy", category: "speakers" },
    // Bowers & Wilkins patterns
    { pattern: /bowers-wilkins-600/i, brand: "bowers & wilkins", model: "600", category: "speakers" },
    { pattern: /bowers-wilkins-700/i, brand: "bowers & wilkins", model: "700", category: "speakers" },
    { pattern: /bowers-wilkins-800/i, brand: "bowers & wilkins", model: "800", category: "speakers" },
    { pattern: /bowers-wilkins-px/i, brand: "bowers & wilkins", model: "px", category: "headphones" },
    { pattern: /bowers-wilkins-pi/i, brand: "bowers & wilkins", model: "pi", category: "earphones" },
    // Focal patterns
    { pattern: /focal-aria/i, brand: "focal", model: "aria", category: "speakers" },
    { pattern: /focal-chora/i, brand: "focal", model: "chora", category: "speakers" },
    { pattern: /focal-utopia/i, brand: "focal", model: "utopia", category: "speakers" },
    { pattern: /focal-elegia/i, brand: "focal", model: "elegia", category: "headphones" },
    { pattern: /focal-clear/i, brand: "focal", model: "clear", category: "headphones" },
    // KEF patterns
    { pattern: /kef-q/i, brand: "kef", model: "q", category: "speakers" },
    { pattern: /kef-r/i, brand: "kef", model: "r", category: "speakers" },
    { pattern: /kef-reference/i, brand: "kef", model: "reference", category: "speakers" },
    { pattern: /kef-ls50/i, brand: "kef", model: "ls50", category: "speakers" },
    // Monitor Audio patterns
    { pattern: /monitor-audio-bronze/i, brand: "monitor audio", model: "bronze", category: "speakers" },
    { pattern: /monitor-audio-silver/i, brand: "monitor audio", model: "silver", category: "speakers" },
    { pattern: /monitor-audio-gold/i, brand: "monitor audio", model: "gold", category: "speakers" },
    { pattern: /monitor-audio-platinum/i, brand: "monitor audio", model: "platinum", category: "speakers" }
  ];
  const pathString = pathname.toLowerCase();
  for (const pattern of productPatterns2) {
    if (pattern.pattern.test(pathString)) {
      return {
        brand: pattern.brand,
        model: pattern.model,
        title: `${pattern.brand} ${pattern.model}`.toLowerCase(),
        category: pattern.category
      };
    }
  }
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart) {
    const modelMatch = lastPart.match(/([a-z]{2,4}\d{2,4}[a-z]?)/i);
    if (modelMatch) {
      return {
        brand: "",
        model: modelMatch[1],
        title: lastPart,
        category: "electronics"
      };
    }
  }
  return {
    brand: "",
    model: "",
    title: pathParts.join(" "),
    category: "electronics"
  };
}
function convertToStandardFormat(scrapedData) {
  const product = {
    title: scrapedData.originalProduct?.title || "Product",
    price: scrapedData.originalProduct?.price || 0,
    currency: scrapedData.originalProduct?.currency || "€",
    url: scrapedData.originalProduct?.url || "",
    image: scrapedData.originalProduct?.image || "/placeholder.svg",
    store: scrapedData.originalProduct?.store || "Unknown"
  };
  const comparisons = scrapedData.comparisons || [];
  return { product, comparisons };
}
async function runGeminiValidation(originalProduct, comparisons) {
  if (geminiFailureCount >= MAX_GEMINI_FAILURES) {
    console.log("Skipping Gemini validation due to previous failures");
    return comparisons;
  }
  const prompt = `You are a product comparison filter. Given an original product and a list of product comparisons from different stores, return only the ones that truly match the original product (same model and condition). Also clean up image URLs and standardize pricing.

IMPORTANT: Return ONLY a valid JSON array, no markdown formatting, no explanations, no code blocks. Just the raw JSON array.

Original Product:
${JSON.stringify(originalProduct)}

Comparisons:
${JSON.stringify(comparisons)}

Return ONLY a JSON array of cleaned and validated comparison products:`;
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { "Content-Type": "application/json" },
        timeout: 3e4,
        // 30 second timeout
        maxRedirects: 5
      }
    );
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return safeParseGeminiJSON(text, comparisons);
  } catch (error) {
    console.error("Gemini API error:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    }
    geminiFailureCount++;
    console.log(`Gemini validation failure count: ${geminiFailureCount}/${MAX_GEMINI_FAILURES}`);
    throw new Error(`Gemini API request failed: ${error}`);
  }
}
router$1.post("/scrape-enhanced", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    console.log(`Backend scraping request for: ${url}`);
    const detectedProduct = await detectProductFromUrl(url);
    console.log(`Enhanced product detection result:`, detectedProduct);
    const productModel = extractProductModel(url);
    console.log(`Extracted product model: ${productModel || "Not found"}`);
    const userCountry = req.body.userLocation?.country || "United States";
    console.log(`User country detected: ${userCountry}`);
    let capturedData = null;
    try {
      const detectedProduct2 = await detectProductFromUrl(url);
      console.log("Detected product:", detectedProduct2);
      capturedData = {
        originalProduct: {
          title: detectedProduct2?.title || "Product",
          price: detectedProduct2?.price || 0,
          currency: "€",
          url,
          image: "/placeholder.svg",
          store: new URL(url).hostname.replace(/^www\./, "")
        },
        comparisons: []
      };
    } catch (error) {
      console.error("Error detecting product:", error);
      capturedData = {
        originalProduct: {
          title: "Product",
          price: 0,
          currency: "€",
          url,
          image: "/placeholder.svg",
          store: new URL(url).hostname.replace(/^www\./, "")
        },
        comparisons: []
      };
    }
    console.log("Original scraping result:", JSON.stringify(capturedData, null, 2));
    let comparisons = [];
    let searchApiUsed = false;
    try {
      let searchAttempted = false;
      if (detectedProduct && detectedProduct.brand && detectedProduct.model && !searchAttempted) {
        console.log(`Using enhanced product detection: ${detectedProduct.brand} ${detectedProduct.model}`);
        const searchTitle = `${detectedProduct.brand} ${detectedProduct.model}`;
        comparisons = await searchExactProductModel(
          detectedProduct.model,
          searchTitle,
          userCountry,
          capturedData?.originalProduct?.price
        );
        searchApiUsed = true;
        searchAttempted = true;
      }
      if (comparisons.length === 0 && productModel && !searchAttempted) {
        console.log(`Using extracted product model: ${productModel}`);
        comparisons = await searchExactProductModel(
          productModel,
          capturedData?.originalProduct?.title || "Product",
          userCountry,
          capturedData?.originalProduct?.price
        );
        searchApiUsed = true;
        searchAttempted = true;
      }
      if (comparisons.length === 0 && capturedData?.originalProduct?.title && !searchAttempted) {
        console.log("No results with product model, trying with product title");
        comparisons = await searchExactProductModel(
          "",
          capturedData.originalProduct.title,
          userCountry,
          capturedData.originalProduct.price
        );
        searchApiUsed = true;
        searchAttempted = true;
      }
    } catch (searchError) {
      console.error("SearchAPI error:", searchError);
      console.log("SearchAPI failed, will use fallback comparisons");
    }
    const hasRealUrls = comparisons.length > 0 && searchApiUsed && comparisons.some((comp) => comp.url && comp.url.length > 20 && !comp.url.match(/^https?:\/\/[^\/]+\/?$/));
    if (hasRealUrls) {
      console.log(`Found ${comparisons.length} real SearchAPI results with actual product URLs, using them`);
      comparisons = sortByLocalRetailers(comparisons, userCountry);
      if (capturedData) {
        capturedData.comparisons = comparisons;
      } else {
        capturedData = {
          originalProduct: {
            title: detectedProduct?.title || "Product",
            price: 0,
            currency: "€",
            url,
            image: "/placeholder.svg",
            store: new URL(url).hostname.replace(/^www\./, "")
          },
          comparisons
        };
      }
    } else {
      console.log("No real SearchAPI results with valid URLs found, using empty comparisons");
      if (!capturedData || !capturedData.originalProduct || capturedData.originalProduct.price === 0) {
        console.log("Original scraping failed or returned no price");
        const product = {
          title: detectedProduct?.title || "Product",
          price: 0,
          currency: "€",
          url,
          image: "/placeholder.svg",
          store: new URL(url).hostname.replace(/^www\./, "")
        };
        capturedData = {
          originalProduct: product,
          comparisons: []
          // Empty array instead of fake URLs
        };
      } else {
        console.log("Using empty comparisons - no real URLs available");
        capturedData.comparisons = [];
      }
    }
    if (!capturedData) {
      throw new Error("Failed to scrape product data");
    }
    const result = convertToStandardFormat(capturedData);
    let validatedComparisons = result.comparisons;
    try {
      validatedComparisons = await runGeminiValidation(result.product, result.comparisons);
      console.log(`Gemini validation successful, filtered to ${validatedComparisons.length} comparisons`);
    } catch (geminiErr) {
      console.error("Gemini validation failed, using unfiltered comparisons:", geminiErr);
      validatedComparisons = result.comparisons;
    }
    const requestId = Date.now().toString();
    res.json({
      product: result.product,
      comparisons: validatedComparisons,
      requestId
    });
  } catch (error) {
    console.error("Scraping error:", error);
    try {
      const url = req.body.url;
      const userCountry = req.body.userLocation?.country || "United States";
      console.log("Providing fallback response due to error");
      const fallbackProduct = {
        title: "Product",
        price: 0,
        currency: "€",
        url,
        image: "/placeholder.svg",
        store: new URL(url).hostname.replace(/^www\./, "")
      };
      res.json({
        product: fallbackProduct,
        comparisons: [],
        // Empty array instead of fake URLs
        requestId: Date.now().toString()
      });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      res.json({
        product: {
          title: "Product",
          price: 0,
          currency: "€",
          url: req.body.url || "",
          image: "/placeholder.svg",
          store: "unknown"
        },
        comparisons: [],
        requestId: Date.now().toString(),
        error: "Failed to scrape product data"
      });
    }
  }
});
async function scrapeWithN8nWebhook(url, gl) {
  try {
    console.log("Calling n8n webhook for URL:", url, "GL:", gl);
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "https://n8n.srv824584.hstgr.cloud/webhook/new-test";
    console.log("Using n8n webhook URL:", n8nWebhookUrl);
    const params = { url };
    if (gl) {
      params.gl = gl;
    }
    console.log("Full URL being called:", `${n8nWebhookUrl}?${new URLSearchParams(params).toString()}`);
    const response = await axios.get(n8nWebhookUrl, {
      params,
      timeout: 6e4,
      // 60 second timeout (increased from 30)
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("n8n webhook response status:", response.status);
    console.log("n8n webhook response data:", JSON.stringify(response.data, null, 2));
    if (response.status !== 200) {
      throw new Error(`n8n webhook returned status ${response.status}`);
    }
    const data = response.data;
    if (data && data.mainProduct && Array.isArray(data.suggestions)) {
      const comparisons = data.suggestions.map((suggestion) => ({
        title: suggestion.title,
        store: suggestion.site || "unknown",
        price: extractPrice(suggestion.standardPrice || suggestion.discountPrice || "0"),
        currency: extractCurrency(suggestion.standardPrice || suggestion.discountPrice || ""),
        url: suggestion.link,
        image: suggestion.image,
        condition: "New",
        assessment: {
          cost: 3,
          value: 3,
          quality: 3,
          description: `Found on ${suggestion.site || "unknown"}`
        }
      }));
      return {
        mainProduct: {
          title: data.mainProduct.title,
          price: data.mainProduct.price,
          image: data.mainProduct.image,
          url: data.mainProduct.url
        },
        suggestions: data.suggestions,
        comparisons
      };
    }
    if (Array.isArray(data) && data.length > 0 && data[0].mainProduct && Array.isArray(data[0].suggestions)) {
      console.log("Handling new n8n response format (array with mainProduct and suggestions)");
      const firstItem = data[0];
      const mainProduct = firstItem.mainProduct;
      const comparisons = firstItem.suggestions.map((suggestion) => ({
        title: suggestion.title,
        store: suggestion.site || "unknown",
        price: extractPrice(suggestion.standardPrice || suggestion.discountPrice || "0"),
        currency: extractCurrency(suggestion.standardPrice || suggestion.discountPrice || ""),
        url: suggestion.link,
        image: suggestion.image,
        condition: "New",
        // New fields
        merchant: suggestion.merchant,
        stock: suggestion.stock,
        reviewsCount: suggestion.reviewsCount,
        deliveryPrice: suggestion.deliveryPrice,
        details: suggestion.details,
        returnPolicy: suggestion.returnPolicy,
        rating: suggestion.rating ? parseFloat(suggestion.rating) : void 0,
        assessment: {
          cost: 3,
          value: 3,
          quality: 3,
          description: `Found on ${suggestion.site || "unknown"}`
        }
      }));
      return {
        mainProduct: {
          title: mainProduct.title,
          price: mainProduct.price,
          image: mainProduct.image,
          url: mainProduct.url
        },
        suggestions: firstItem.suggestions,
        comparisons
      };
    }
    if (data && data.title && (data.standardPrice || data.discountPrice)) {
      console.log("Handling new n8n response format (single object)");
      const mainProduct = {
        title: data.title,
        price: data.standardPrice || data.discountPrice || "Price not available",
        image: data.image,
        url: data.link
      };
      const suggestion = {
        title: data.title,
        standardPrice: data.standardPrice,
        discountPrice: data.discountPrice,
        site: data.site,
        link: data.link,
        image: data.image,
        // New fields
        merchant: data.merchant,
        stock: data.stock,
        reviewsCount: data.reviewsCount,
        deliveryPrice: data.deliveryPrice,
        details: data.details,
        returnPolicy: data.returnPolicy,
        rating: data.rating
      };
      const comparison = {
        title: data.title,
        store: data.site || "unknown",
        price: extractPrice(data.standardPrice || data.discountPrice || "0"),
        currency: extractCurrency(data.standardPrice || data.discountPrice || ""),
        url: data.link,
        image: data.image,
        condition: "New",
        // New fields
        merchant: data.merchant,
        stock: data.stock,
        reviewsCount: data.reviewsCount,
        deliveryPrice: data.deliveryPrice,
        details: data.details,
        returnPolicy: data.returnPolicy,
        rating: data.rating ? parseFloat(data.rating) : void 0,
        assessment: {
          cost: 3,
          value: 3,
          quality: 3,
          description: `Found on ${data.site || "unknown"}`
        }
      };
      return {
        mainProduct,
        suggestions: [suggestion],
        comparisons: [comparison]
      };
    }
    if (!data || Object.keys(data).length === 0) {
      console.log("n8n webhook returned empty data");
      throw new Error("No product data received from webhook");
    }
    throw new Error("Invalid n8n webhook response format");
  } catch (error) {
    console.error("n8n webhook error:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        fullUrl: error.config?.url + "?" + new URLSearchParams(error.config?.params || {}).toString()
      });
    }
    throw error;
  }
}
function extractCurrency(priceString) {
  if (priceString.includes("€")) return "€";
  if (priceString.includes("$")) return "$";
  if (priceString.includes("£")) return "£";
  return "€";
}
async function filterSuggestionsByRegisteredBusinesses(suggestions) {
  try {
    const registeredBusinesses = await businessService.getActiveBusinesses();
    if (registeredBusinesses.length === 0) {
      return suggestions;
    }
    const registeredDomains = new Set(
      registeredBusinesses.map((business) => business.domain.toLowerCase())
    );
    const filteredSuggestions = suggestions.filter((suggestion) => {
      if (!suggestion.url) return false;
      try {
        const url = new URL(suggestion.url);
        const domain = url.hostname.toLowerCase().replace("www.", "");
        return registeredDomains.has(domain);
      } catch {
        return false;
      }
    });
    if (filteredSuggestions.length === 0) {
      console.log("No suggestions match registered businesses");
      return [];
    }
    console.log(`Filtered ${suggestions.length} suggestions to ${filteredSuggestions.length} from registered businesses`);
    return filteredSuggestions;
  } catch (error) {
    console.error("Error filtering suggestions by registered businesses:", error);
    return suggestions;
  }
}
async function trackBusinessVisits(suggestions) {
  try {
    const visitedDomains = /* @__PURE__ */ new Set();
    for (const suggestion of suggestions) {
      if (suggestion.url) {
        try {
          const url = new URL(suggestion.url);
          const domain = url.hostname.toLowerCase().replace("www.", "");
          visitedDomains.add(domain);
        } catch {
        }
      }
    }
    for (const domain of visitedDomains) {
      const business = await businessService.findBusinessByDomain(domain);
      if (business) {
        await businessService.incrementBusinessVisits(business.id);
        console.log(`Tracked visit for business: ${business.name} (${domain})`);
      }
    }
  } catch (error) {
    console.error("Error tracking business visits:", error);
  }
}
router$1.post("/n8n-scrape", async (req, res) => {
  console.log("=== n8n-scrape route called ===");
  console.log("Request body:", req.body);
  try {
    const { url, requestId, gl, userCountry, findSimilar } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    console.log(`n8n webhook scraping request for URL: ${url}, GL: ${gl}`);
    console.log(`Request ID: ${requestId}`);
    console.log(`Find Similar: ${findSimilar}`);
    const result = await scrapeWithN8nWebhook(url, gl);
    console.log("n8n webhook scraping successful");
    console.log("Main product:", result.mainProduct);
    console.log("Original suggestions count:", result.suggestions?.length || 0);
    if (result.suggestions && result.suggestions.length > 0) {
      result.suggestions = await filterSuggestionsByRegisteredBusinesses(result.suggestions);
      console.log("Filtered suggestions count:", result.suggestions.length);
      await trackBusinessVisits(result.suggestions);
    }
    if (findSimilar && result.mainProduct) {
      console.log("Processing similar products search...");
      const productTitle = result.mainProduct.title;
      const productBrand = extractBrandFromTitle(productTitle);
      const productType = extractProductType(productTitle);
      const similarSearchQuery = `${productBrand} ${productType}`;
      console.log(`Similar products search query: ${similarSearchQuery}`);
      if (result.suggestions && result.suggestions.length > 0) {
        result.suggestions = result.suggestions.map((suggestion) => ({
          ...suggestion,
          isSimilar: true,
          similarityReason: `Similar ${productType} from ${suggestion.merchant || suggestion.site || "other retailers"}`
        }));
        console.log(`Enhanced ${result.suggestions.length} suggestions for similar products`);
      }
    }
    try {
      const userId = req.user?.id;
      if (userId && result.mainProduct?.title) {
        await searchHistoryService.addSearch(userId, {
          url,
          title: result.mainProduct.title,
          requestId: requestId || `search_${Date.now()}`
        });
        console.log(`Search history saved for user ${userId} (type: ${findSimilar ? "similar" : "price_comparison"})`);
      } else {
        console.log("No user authentication found, skipping search history save");
      }
    } catch (historyError) {
      console.error("Failed to save search history:", historyError);
    }
    res.json(result);
  } catch (error) {
    console.error("n8n webhook scraping error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.log("Returning error response:", errorMessage);
    res.status(500).json({
      error: "Failed to fetch product information",
      message: errorMessage,
      mainProduct: null,
      suggestions: []
    });
  }
});
const JWT_SECRET$1 = process.env.JWT_SECRET || "your-secret-key-change-in-production";
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET$1, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET$1);
    return decoded;
  } catch {
    return null;
  }
}
const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await userService.createUser({
      email,
      password: hashedPassword,
      isAdmin: false
      // First user can be made admin manually
    });
    const token = generateToken(user.id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    res.status(201).json({
      success: true,
      token,
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = generateToken(user.id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    res.json({
      success: true,
      token,
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};
const logout = (req, res) => {
  res.clearCookie("auth_token");
  res.json({ success: true });
};
const getCurrentUser = async (req, res) => {
  try {
    let token = req.cookies.auth_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    if (!token) {
      return res.json({
        user: null,
        authenticated: false
      });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.json({
        user: null,
        authenticated: false
      });
    }
    const userId = typeof decoded.userId === "string" ? parseInt(decoded.userId, 10) : decoded.userId;
    if (isNaN(userId)) {
      return res.json({
        user: null,
        authenticated: false
      });
    }
    const user = await userService.findUserById(userId);
    if (!user) {
      return res.json({
        user: null,
        authenticated: false
      });
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      },
      authenticated: true
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.json({
      user: null,
      authenticated: false
    });
  }
};
const addToSearchHistory = async (req, res) => {
  try {
    let token = req.cookies.auth_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = typeof decoded.userId === "string" ? parseInt(decoded.userId, 10) : decoded.userId;
    if (isNaN(userId)) {
      return res.status(401).json({ error: "Invalid user ID in token" });
    }
    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    const { url, title, requestId } = req.body;
    if (!url || !title || !requestId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    await searchHistoryService.addSearch(user.id, {
      url,
      title,
      requestId
    });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error adding to search history:", error);
    res.status(500).json({ error: "Failed to add to search history" });
  }
};
const getUserSearchHistory = async (req, res) => {
  try {
    let token = req.cookies.auth_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = typeof decoded.userId === "string" ? parseInt(decoded.userId, 10) : decoded.userId;
    if (isNaN(userId)) {
      return res.status(401).json({ error: "Invalid user ID in token" });
    }
    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    const history = await searchHistoryService.getUserSearchHistory(
      user.id,
      20
    );
    res.json({
      history: history.map((h) => ({
        url: h.url,
        title: h.title,
        requestId: h.requestId,
        timestamp: h.timestamp
      }))
    });
  } catch (error) {
    console.error("Error getting search history:", error);
    res.status(500).json({ error: "Failed to get search history" });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        searchCount: u._count.searchHistory
      }))
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.json({
      users: [],
      error: "Failed to get users"
    });
  }
};
const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies.auth_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }
    try {
      const userId = typeof decoded.userId === "string" ? parseInt(decoded.userId, 10) : decoded.userId;
      if (isNaN(userId)) {
        return res.status(401).json({ error: "Invalid user ID in token" });
      }
      const user = await userService.findUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      req.user = {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      };
      next();
    } catch (dbError) {
      console.error("Database error in requireAuth:", dbError);
      return res.status(500).json({ error: "Database error during authentication" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
};
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  next();
};
const router = express__default.Router();
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({
      error: "Failed to fetch favorites",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      price,
      currency,
      url,
      image,
      store,
      merchant,
      stock,
      rating,
      reviewsCount,
      deliveryPrice,
      details,
      returnPolicy,
      condition = "New"
    } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: "Title and URL are required" });
    }
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        url
      }
    });
    if (existingFavorite) {
      return res.status(400).json({ error: "Product already in favorites" });
    }
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        title,
        price,
        currency,
        url,
        image,
        store,
        merchant,
        stock,
        rating: rating ? parseFloat(rating) : null,
        reviewsCount: reviewsCount ? parseInt(reviewsCount) : null,
        deliveryPrice,
        details,
        returnPolicy,
        condition
      }
    });
    res.json(favorite);
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const favoriteId = parseInt(req.params.id);
    const favorite = await prisma.favorite.findFirst({
      where: {
        id: favoriteId,
        userId
      }
    });
    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }
    await prisma.favorite.delete({
      where: { id: favoriteId }
    });
    res.json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});
router.get("/check", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        url
      }
    });
    res.json({ isFavorited: !!favorite, favoriteId: favorite?.id });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ error: "Failed to check favorite status" });
  }
});
const saveSearchHistory = async (req, res) => {
  try {
    const { url, userKey } = req.body;
    if (!url || !userKey) {
      return res.status(400).json({ error: "Missing url or userKey" });
    }
    await legacySearchHistoryService.addSearch(userKey, url);
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving search history:", error);
    res.status(500).json({ error: "Failed to save search history" });
  }
};
const getSearchHistory = async (req, res) => {
  try {
    const userKey = req.query.userKey;
    if (!userKey) {
      return res.status(400).json({ error: "Missing userKey" });
    }
    const historyRecords = await legacySearchHistoryService.getUserSearchHistory(userKey, 10);
    const history = historyRecords.map((record) => record.url);
    res.json({ history });
  } catch (error) {
    console.error("Error getting search history:", error);
    res.status(500).json({ error: "Failed to get search history" });
  }
};
const healthCheckHandler = async (req, res) => {
  try {
    const dbHealth = await healthCheck.checkConnection();
    const stats = await healthCheck.getStats();
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: dbHealth,
      stats,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const SEARCH_API_SUPPORTED_COUNTRIES = {
  // Middle East
  AE: {
    country: "United Arab Emirates",
    countryCode: "ae",
    region: "Middle East",
    currency: "AED",
    timeZone: "Asia/Dubai"
  },
  // Americas
  AI: {
    country: "Anguilla",
    countryCode: "ai",
    region: "Caribbean",
    currency: "XCD",
    timeZone: "America/Anguilla"
  },
  AR: {
    country: "Argentina",
    countryCode: "ar",
    region: "South America",
    currency: "ARS",
    timeZone: "America/Argentina/Buenos_Aires"
  },
  AU: {
    country: "Australia",
    countryCode: "au",
    region: "Asia Pacific",
    currency: "AUD",
    timeZone: "Australia/Sydney"
  },
  BM: {
    country: "Bermuda",
    countryCode: "bm",
    region: "North America",
    currency: "BMD",
    timeZone: "Atlantic/Bermuda"
  },
  BR: {
    country: "Brazil",
    countryCode: "br",
    region: "South America",
    currency: "BRL",
    timeZone: "America/Sao_Paulo"
  },
  CA: {
    country: "Canada",
    countryCode: "ca",
    region: "North America",
    currency: "CAD",
    timeZone: "America/Toronto"
  },
  CL: {
    country: "Chile",
    countryCode: "cl",
    region: "South America",
    currency: "CLP",
    timeZone: "America/Santiago"
  },
  CO: {
    country: "Colombia",
    countryCode: "co",
    region: "South America",
    currency: "COP",
    timeZone: "America/Bogota"
  },
  MX: {
    country: "Mexico",
    countryCode: "mx",
    region: "North America",
    currency: "MXN",
    timeZone: "America/Mexico_City"
  },
  PE: {
    country: "Peru",
    countryCode: "pe",
    region: "South America",
    currency: "PEN",
    timeZone: "America/Lima"
  },
  US: {
    country: "United States",
    countryCode: "us",
    region: "North America",
    currency: "$",
    timeZone: "America/New_York"
  },
  VE: {
    country: "Venezuela",
    countryCode: "ve",
    region: "South America",
    currency: "VES",
    timeZone: "America/Caracas"
  },
  // Europe
  AT: {
    country: "Austria",
    countryCode: "at",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Vienna"
  },
  BE: {
    country: "Belgium",
    countryCode: "be",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Brussels"
  },
  BG: {
    country: "Bulgaria",
    countryCode: "bg",
    region: "Eastern Europe",
    currency: "BGN",
    timeZone: "Europe/Sofia"
  },
  CH: {
    country: "Switzerland",
    countryCode: "ch",
    region: "Western Europe",
    currency: "CHF",
    timeZone: "Europe/Zurich"
  },
  CZ: {
    country: "Czech Republic",
    countryCode: "cz",
    region: "Eastern Europe",
    currency: "CZK",
    timeZone: "Europe/Prague"
  },
  DE: {
    country: "Germany",
    countryCode: "de",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Berlin"
  },
  DK: {
    country: "Denmark",
    countryCode: "dk",
    region: "Nordic",
    currency: "DKK",
    timeZone: "Europe/Copenhagen"
  },
  EE: {
    country: "Estonia",
    countryCode: "ee",
    region: "Baltic",
    currency: "€",
    timeZone: "Europe/Tallinn"
  },
  ES: {
    country: "Spain",
    countryCode: "es",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Madrid"
  },
  FI: {
    country: "Finland",
    countryCode: "fi",
    region: "Nordic",
    currency: "€",
    timeZone: "Europe/Helsinki"
  },
  FR: {
    country: "France",
    countryCode: "fr",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Paris"
  },
  GB: {
    country: "United Kingdom",
    countryCode: "gb",
    region: "Western Europe",
    currency: "£",
    timeZone: "Europe/London"
  },
  GR: {
    country: "Greece",
    countryCode: "gr",
    region: "Southern Europe",
    currency: "€",
    timeZone: "Europe/Athens"
  },
  HR: {
    country: "Croatia",
    countryCode: "hr",
    region: "Eastern Europe",
    currency: "€",
    timeZone: "Europe/Zagreb"
  },
  HU: {
    country: "Hungary",
    countryCode: "hu",
    region: "Eastern Europe",
    currency: "HUF",
    timeZone: "Europe/Budapest"
  },
  IE: {
    country: "Ireland",
    countryCode: "ie",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Dublin"
  },
  IT: {
    country: "Italy",
    countryCode: "it",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Rome"
  },
  LT: {
    country: "Lithuania",
    countryCode: "lt",
    region: "Baltic",
    currency: "€",
    timeZone: "Europe/Vilnius"
  },
  LV: {
    country: "Latvia",
    countryCode: "lv",
    region: "Baltic",
    currency: "€",
    timeZone: "Europe/Riga"
  },
  LU: {
    country: "Luxembourg",
    countryCode: "lu",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Luxembourg"
  },
  MT: {
    country: "Malta",
    countryCode: "mt",
    region: "Southern Europe",
    currency: "€",
    timeZone: "Europe/Malta"
  },
  NL: {
    country: "Netherlands",
    countryCode: "nl",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Amsterdam"
  },
  NO: {
    country: "Norway",
    countryCode: "no",
    region: "Nordic",
    currency: "NOK",
    timeZone: "Europe/Oslo"
  },
  PL: {
    country: "Poland",
    countryCode: "pl",
    region: "Eastern Europe",
    currency: "PLN",
    timeZone: "Europe/Warsaw"
  },
  PT: {
    country: "Portugal",
    countryCode: "pt",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Lisbon"
  },
  RO: {
    country: "Romania",
    countryCode: "ro",
    region: "Eastern Europe",
    currency: "RON",
    timeZone: "Europe/Bucharest"
  },
  SE: {
    country: "Sweden",
    countryCode: "se",
    region: "Nordic",
    currency: "SEK",
    timeZone: "Europe/Stockholm"
  },
  SI: {
    country: "Slovenia",
    countryCode: "si",
    region: "Eastern Europe",
    currency: "€",
    timeZone: "Europe/Ljubljana"
  },
  SK: {
    country: "Slovakia",
    countryCode: "sk",
    region: "Eastern Europe",
    currency: "€",
    timeZone: "Europe/Bratislava"
  },
  // Asia Pacific
  HK: {
    country: "Hong Kong",
    countryCode: "hk",
    region: "Asia Pacific",
    currency: "HKD",
    timeZone: "Asia/Hong_Kong"
  },
  ID: {
    country: "Indonesia",
    countryCode: "id",
    region: "Asia Pacific",
    currency: "IDR",
    timeZone: "Asia/Jakarta"
  },
  IN: {
    country: "India",
    countryCode: "in",
    region: "Asia Pacific",
    currency: "₹",
    timeZone: "Asia/Kolkata"
  },
  JP: {
    country: "Japan",
    countryCode: "jp",
    region: "Asia Pacific",
    currency: "¥",
    timeZone: "Asia/Tokyo"
  },
  KR: {
    country: "South Korea",
    countryCode: "kr",
    region: "Asia Pacific",
    currency: "₩",
    timeZone: "Asia/Seoul"
  },
  MY: {
    country: "Malaysia",
    countryCode: "my",
    region: "Asia Pacific",
    currency: "MYR",
    timeZone: "Asia/Kuala_Lumpur"
  },
  NZ: {
    country: "New Zealand",
    countryCode: "nz",
    region: "Asia Pacific",
    currency: "NZD",
    timeZone: "Pacific/Auckland"
  },
  PH: {
    country: "Philippines",
    countryCode: "ph",
    region: "Asia Pacific",
    currency: "PHP",
    timeZone: "Asia/Manila"
  },
  SG: {
    country: "Singapore",
    countryCode: "sg",
    region: "Asia Pacific",
    currency: "SGD",
    timeZone: "Asia/Singapore"
  },
  TH: {
    country: "Thailand",
    countryCode: "th",
    region: "Asia Pacific",
    currency: "THB",
    timeZone: "Asia/Bangkok"
  },
  TW: {
    country: "Taiwan",
    countryCode: "tw",
    region: "Asia Pacific",
    currency: "TWD",
    timeZone: "Asia/Taipei"
  },
  VN: {
    country: "Vietnam",
    countryCode: "vn",
    region: "Asia Pacific",
    currency: "VND",
    timeZone: "Asia/Ho_Chi_Minh"
  },
  // Africa
  EG: {
    country: "Egypt",
    countryCode: "eg",
    region: "Africa",
    currency: "EGP",
    timeZone: "Africa/Cairo"
  },
  GH: {
    country: "Ghana",
    countryCode: "gh",
    region: "Africa",
    currency: "GHS",
    timeZone: "Africa/Accra"
  },
  KE: {
    country: "Kenya",
    countryCode: "ke",
    region: "Africa",
    currency: "KES",
    timeZone: "Africa/Nairobi"
  },
  NG: {
    country: "Nigeria",
    countryCode: "ng",
    region: "Africa",
    currency: "NGN",
    timeZone: "Africa/Lagos"
  },
  ZA: {
    country: "South Africa",
    countryCode: "za",
    region: "Africa",
    currency: "ZAR",
    timeZone: "Africa/Johannesburg"
  },
  // Middle East
  IL: {
    country: "Israel",
    countryCode: "il",
    region: "Middle East",
    currency: "ILS",
    timeZone: "Asia/Jerusalem"
  },
  SA: {
    country: "Saudi Arabia",
    countryCode: "sa",
    region: "Middle East",
    currency: "SAR",
    timeZone: "Asia/Riyadh"
  },
  TR: {
    country: "Turkey",
    countryCode: "tr",
    region: "Middle East",
    currency: "TRY",
    timeZone: "Europe/Istanbul"
  }
};
const localDealers = [
  // Lithuania
  {
    name: "pigu.lt",
    url: "https://pigu.lt",
    country: "Lithuania",
    region: "Baltic",
    searchUrlPattern: "https://pigu.lt/search?q={query}",
    currency: "€",
    priority: 1
  },
  {
    name: "varle.lt",
    url: "https://varle.lt",
    country: "Lithuania",
    region: "Baltic",
    searchUrlPattern: "https://varle.lt/search?q={query}",
    currency: "€",
    priority: 2
  },
  {
    name: "kilobaitas.lt",
    url: "https://kilobaitas.lt",
    country: "Lithuania",
    region: "Baltic",
    searchUrlPattern: "https://kilobaitas.lt/search?q={query}",
    currency: "€",
    priority: 3
  },
  // Latvia
  {
    name: "1a.lv",
    url: "https://1a.lv",
    country: "Latvia",
    region: "Baltic",
    searchUrlPattern: "https://1a.lv/search?q={query}",
    currency: "€",
    priority: 1
  },
  {
    name: "220.lv",
    url: "https://220.lv",
    country: "Latvia",
    region: "Baltic",
    searchUrlPattern: "https://220.lv/search?q={query}",
    currency: "€",
    priority: 2
  },
  // Estonia
  {
    name: "kaup24.ee",
    url: "https://kaup24.ee",
    country: "Estonia",
    region: "Baltic",
    searchUrlPattern: "https://kaup24.ee/search?q={query}",
    currency: "€",
    priority: 1
  },
  // Germany
  {
    name: "amazon.de",
    url: "https://amazon.de",
    country: "Germany",
    region: "Western Europe",
    searchUrlPattern: "https://amazon.de/s?k={query}",
    currency: "€",
    priority: 1
  },
  {
    name: "mediamarkt.de",
    url: "https://mediamarkt.de",
    country: "Germany",
    region: "Western Europe",
    searchUrlPattern: "https://mediamarkt.de/search?query={query}",
    currency: "€",
    priority: 2
  },
  // France
  {
    name: "amazon.fr",
    url: "https://amazon.fr",
    country: "France",
    region: "Western Europe",
    searchUrlPattern: "https://amazon.fr/s?k={query}",
    currency: "€",
    priority: 1
  },
  {
    name: "fnac.com",
    url: "https://fnac.com",
    country: "France",
    region: "Western Europe",
    searchUrlPattern: "https://fnac.com/search?query={query}",
    currency: "€",
    priority: 2
  },
  // UK
  {
    name: "amazon.co.uk",
    url: "https://amazon.co.uk",
    country: "United Kingdom",
    region: "Western Europe",
    searchUrlPattern: "https://amazon.co.uk/s?k={query}",
    currency: "£",
    priority: 1
  },
  {
    name: "currys.co.uk",
    url: "https://currys.co.uk",
    country: "United Kingdom",
    region: "Western Europe",
    searchUrlPattern: "https://currys.co.uk/search?q={query}",
    currency: "£",
    priority: 2
  },
  // Poland
  {
    name: "allegro.pl",
    url: "https://allegro.pl",
    country: "Poland",
    region: "Eastern Europe",
    searchUrlPattern: "https://allegro.pl/listing?string={query}",
    currency: "PLN",
    priority: 1
  },
  {
    name: "x-kom.pl",
    url: "https://x-kom.pl",
    country: "Poland",
    region: "Eastern Europe",
    searchUrlPattern: "https://x-kom.pl/search?q={query}",
    currency: "PLN",
    priority: 2
  },
  // Nordic countries
  {
    name: "elgiganten.dk",
    url: "https://elgiganten.dk",
    country: "Denmark",
    region: "Nordic",
    searchUrlPattern: "https://elgiganten.dk/search?SearchTerm={query}",
    currency: "DKK",
    priority: 1
  },
  {
    name: "elkjop.no",
    url: "https://elkjop.no",
    country: "Norway",
    region: "Nordic",
    searchUrlPattern: "https://elkjop.no/search?SearchTerm={query}",
    currency: "NOK",
    priority: 1
  },
  {
    name: "power.fi",
    url: "https://power.fi",
    country: "Finland",
    region: "Nordic",
    searchUrlPattern: "https://power.fi/search?SearchTerm={query}",
    currency: "€",
    priority: 1
  }
];
function detectLocationFromIP(ip) {
  if (ip.includes("192.168") || ip.includes("127.0") || ip.includes("10.") || ip.includes("172.")) {
    return {
      country: "Lithuania",
      countryCode: "LT",
      region: "Baltic",
      city: "Vilnius",
      currency: "€",
      timeZone: "Europe/Vilnius"
    };
  }
  return {
    country: "United States",
    countryCode: "US",
    region: "North America",
    currency: "$",
    timeZone: "America/New_York"
  };
}
function detectLocationFromHeaders(headers) {
  if (headers["cf-ipcountry"]) {
    const countryCode = headers["cf-ipcountry"].toUpperCase();
    return getLocationByCountryCode(countryCode);
  }
  const acceptLanguage = headers["accept-language"];
  if (acceptLanguage) {
    if (acceptLanguage.includes("lt")) {
      return {
        country: "Lithuania",
        countryCode: "LT",
        region: "Baltic",
        currency: "€",
        timeZone: "Europe/Vilnius"
      };
    }
    if (acceptLanguage.includes("lv")) {
      return {
        country: "Latvia",
        countryCode: "LV",
        region: "Baltic",
        currency: "€",
        timeZone: "Europe/Riga"
      };
    }
    if (acceptLanguage.includes("et")) {
      return {
        country: "Estonia",
        countryCode: "EE",
        region: "Baltic",
        currency: "€",
        timeZone: "Europe/Tallinn"
      };
    }
    if (acceptLanguage.includes("de")) {
      return {
        country: "Germany",
        countryCode: "DE",
        region: "Western Europe",
        currency: "€",
        timeZone: "Europe/Berlin"
      };
    }
  }
  return null;
}
function getLocationByCountryCode(countryCode) {
  const supportedCountry = SEARCH_API_SUPPORTED_COUNTRIES[countryCode];
  if (supportedCountry) {
    return supportedCountry;
  }
  return SEARCH_API_SUPPORTED_COUNTRIES["US"];
}
function isCountrySupported(countryCode) {
  const normalizedCode = countryCode.toLowerCase();
  return Object.values(SEARCH_API_SUPPORTED_COUNTRIES).some(
    (country) => country.countryCode === normalizedCode
  );
}
function getLocalDealers(location) {
  return localDealers.filter(
    (dealer) => dealer.country === location.country || dealer.region === location.region
  ).sort((a, b) => a.priority - b.priority);
}
const getLocationHandler = async (req, res) => {
  try {
    if (req.method === "POST" && req.body && req.body.location) {
      const userLocation = req.body.location;
      if (!isCountrySupported(userLocation.countryCode)) {
        return res.status(400).json({
          error: "Country not supported by SearchAPI",
          message: `Country code '${userLocation.countryCode}' is not supported. Please choose from the supported countries list.`
        });
      }
      const dealers2 = getLocalDealers(userLocation);
      res.json({
        location: userLocation,
        localDealers: dealers2.slice(0, 5)
        // Return top 5 local dealers
      });
      return;
    }
    const clientIP = req.ip || req.socket.remoteAddress || "127.0.0.1";
    let location = detectLocationFromHeaders(req.headers);
    if (!location) {
      location = detectLocationFromIP(clientIP);
    }
    if (!isCountrySupported(location.countryCode)) {
      location = SEARCH_API_SUPPORTED_COUNTRIES["US"];
    }
    const dealers = getLocalDealers(location);
    res.json({
      location,
      localDealers: dealers.slice(0, 5)
      // Return top 5 local dealers
    });
  } catch (error) {
    console.error("Location detection error:", error);
    res.json({
      location: SEARCH_API_SUPPORTED_COUNTRIES["US"],
      localDealers: [],
      error: "Failed to detect location"
    });
  }
};
const getAllAffiliateUrls = async (req, res) => {
  try {
    const urls = await affiliateService.getAllAffiliateUrls();
    res.json({ success: true, urls });
  } catch (error) {
    console.error("Error fetching affiliate URLs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch affiliate URLs" });
  }
};
const getAffiliateStats = async (req, res) => {
  try {
    const stats = await affiliateService.getAffiliateStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching affiliate stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch affiliate stats" });
  }
};
const createAffiliateUrl = async (req, res) => {
  try {
    const { name, url, description, isActive } = req.body;
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: "Name and URL are required"
      });
    }
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format"
      });
    }
    const affiliateUrl = await affiliateService.createAffiliateUrl({
      name,
      url,
      description,
      isActive
    });
    res.status(201).json({
      success: true,
      affiliateUrl,
      message: "Affiliate URL created successfully"
    });
  } catch (error) {
    console.error("Error creating affiliate URL:", error);
    res.status(500).json({ success: false, error: "Failed to create affiliate URL" });
  }
};
const updateAffiliateUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, description, isActive } = req.body;
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: "Name and URL are required"
      });
    }
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format"
      });
    }
    const affiliateUrl = await affiliateService.updateAffiliateUrl(parseInt(id), {
      name,
      url,
      description,
      isActive
    });
    res.json({
      success: true,
      affiliateUrl,
      message: "Affiliate URL updated successfully"
    });
  } catch (error) {
    console.error("Error updating affiliate URL:", error);
    res.status(500).json({ success: false, error: "Failed to update affiliate URL" });
  }
};
const deleteAffiliateUrl = async (req, res) => {
  try {
    const { id } = req.params;
    await affiliateService.deleteAffiliateUrl(parseInt(id));
    res.json({
      success: true,
      message: "Affiliate URL deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting affiliate URL:", error);
    res.status(500).json({ success: false, error: "Failed to delete affiliate URL" });
  }
};
const trackAffiliateClick = async (req, res) => {
  try {
    const { id } = req.params;
    await affiliateService.incrementClicks(parseInt(id));
    const affiliateUrl = await affiliateService.getAffiliateUrlById(parseInt(id));
    if (affiliateUrl && affiliateUrl.isActive) {
      res.redirect(affiliateUrl.url);
    } else {
      res.status(404).json({ success: false, error: "Affiliate URL not found or inactive" });
    }
  } catch (error) {
    console.error("Error tracking affiliate click:", error);
    res.status(500).json({ success: false, error: "Failed to track click" });
  }
};
const trackAffiliateConversion = async (req, res) => {
  try {
    const { id, revenue = 0 } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Affiliate URL ID is required"
      });
    }
    await affiliateService.addConversion(parseInt(id), parseFloat(revenue));
    res.json({
      success: true,
      message: "Conversion tracked successfully"
    });
  } catch (error) {
    console.error("Error tracking affiliate conversion:", error);
    res.status(500).json({ success: false, error: "Failed to track conversion" });
  }
};
const registerBusiness$1 = async (req, res) => {
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
      commission
    } = req.body;
    if (!name || !domain || !website) {
      return res.status(400).json({
        success: false,
        error: "Name, domain, and website are required"
      });
    }
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        success: false,
        error: "Invalid domain format"
      });
    }
    const existingBusiness = await businessService.findBusinessByDomain(domain);
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        error: "A business with this domain already exists"
      });
    }
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
      email: contactEmail || `contact@${domain}`,
      password: "defaultpassword123"
      // This will be hashed in the service
    });
    res.status(201).json({
      success: true,
      business,
      message: "Business registered successfully"
    });
  } catch (error) {
    console.error("Error registering business:", error);
    res.status(500).json({ success: false, error: "Failed to register business" });
  }
};
const getAllBusinesses = async (req, res) => {
  try {
    const businesses = await businessService.getAllBusinesses();
    res.json({ success: true, businesses });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({ success: false, error: "Failed to fetch businesses" });
  }
};
const getActiveBusinesses = async (req, res) => {
  try {
    const businesses = await businessService.getActiveBusinesses();
    res.json({ success: true, businesses });
  } catch (error) {
    console.error("Error fetching active businesses:", error);
    res.status(500).json({ success: false, error: "Failed to fetch businesses" });
  }
};
const getBusinessByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    const business = await businessService.findBusinessByDomain(domain);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found"
      });
    }
    res.json({ success: true, business });
  } catch (error) {
    console.error("Error fetching business:", error);
    res.status(500).json({ success: false, error: "Failed to fetch business" });
  }
};
const updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const business = await businessService.updateBusiness(parseInt(id), updateData);
    res.json({
      success: true,
      business,
      message: "Business updated successfully"
    });
  } catch (error) {
    console.error("Error updating business:", error);
    res.status(500).json({ success: false, error: "Failed to update business" });
  }
};
const deleteBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    await businessService.deleteBusiness(parseInt(id));
    res.json({
      success: true,
      message: "Business deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting business:", error);
    res.status(500).json({ success: false, error: "Failed to delete business" });
  }
};
const verifyBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const business = await businessService.verifyBusiness(parseInt(id));
    res.json({
      success: true,
      business,
      message: "Business verified successfully"
    });
  } catch (error) {
    console.error("Error verifying business:", error);
    res.status(500).json({ success: false, error: "Failed to verify business" });
  }
};
const getBusinessStats$1 = async (req, res) => {
  try {
    const stats = await businessService.getBusinessStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching business stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch business stats" });
  }
};
const updateBusinessCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminCommissionRate } = req.body;
    if (typeof adminCommissionRate !== "number" || adminCommissionRate < 0 || adminCommissionRate > 100) {
      return res.status(400).json({
        success: false,
        error: "Commission rate must be a number between 0 and 100"
      });
    }
    const business = await businessService.updateAdminCommissionRate(parseInt(id), adminCommissionRate);
    res.json({
      success: true,
      business,
      message: "Commission rate updated successfully"
    });
  } catch (error) {
    console.error("Error updating business commission:", error);
    res.status(500).json({ success: false, error: "Failed to update commission rate" });
  }
};
const updateBusinessPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required"
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long"
      });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must contain uppercase, lowercase, and number"
      });
    }
    const business = await businessService.updateBusinessPassword(parseInt(id), password);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: "Business not found"
      });
    }
    res.json({
      success: true,
      message: "Business password updated successfully"
    });
  } catch (error) {
    console.error("Error updating business password:", error);
    res.status(500).json({ success: false, error: "Failed to update business password" });
  }
};
const getBusinessDetailedStats = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await businessService.getBusinessStatistics(parseInt(id));
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Business not found"
      });
    }
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching business detailed stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch business statistics" });
  }
};
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
function generateBusinessToken(businessId, email) {
  return jwt.sign(
    { businessId, email, type: "business" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function verifyBusinessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
const registerBusiness = async (req, res) => {
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
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        success: false,
        error: "Invalid domain format"
      });
    }
    const existingBusinessByDomain = await businessService.findBusinessByDomain(domain);
    if (existingBusinessByDomain) {
      return res.status(400).json({
        success: false,
        error: "A business with this domain already exists"
      });
    }
    const existingBusinessByEmail = await businessService.findBusinessByEmail(email);
    if (existingBusinessByEmail) {
      return res.status(400).json({
        success: false,
        error: "A business with this email already exists"
      });
    }
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
      password: hashedPassword
    });
    const token = generateBusinessToken(business.id, business.email);
    res.cookie("business_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    res.status(201).json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email
      },
      message: "Business registered successfully"
    });
  } catch (error) {
    console.error("Error registering business:", error);
    res.status(500).json({ success: false, error: "Failed to register business" });
  }
};
const loginBusiness = async (req, res) => {
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
    const token = generateBusinessToken(business.id, business.email);
    res.cookie("business_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    res.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        domain: business.domain,
        email: business.email
      },
      message: "Business login successful"
    });
  } catch (error) {
    console.error("Error logging in business:", error);
    res.status(500).json({ success: false, error: "Failed to login" });
  }
};
const getCurrentBusiness = async (req, res) => {
  try {
    let token = req.cookies.business_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
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
        email: business.email
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
const logoutBusiness = async (req, res) => {
  res.clearCookie("business_token");
  res.json({ success: true, message: "Business logged out successfully" });
};
const getBusinessStats = async (req, res) => {
  try {
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
rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // 5 attempts per window
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});
rateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 100,
  // 100 requests per minute
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});
rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 10,
  // 10 attempts per window
  message: { error: "Too many business operations, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});
const validateRegistration = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password").isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must be at least 8 characters with uppercase, lowercase, and number")
];
const validateBusinessRegistration = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password").isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must be at least 8 characters with uppercase, lowercase, and number"),
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Business name must be between 2 and 100 characters"),
  body("domain").isFQDN().withMessage("Please provide a valid domain (e.g., example.com)"),
  body("website").custom((value) => {
    try {
      new URL(value);
      return true;
    } catch {
    }
    const fqdnRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.[A-Za-z]{2,}$/;
    if (fqdnRegex.test(value)) return true;
    throw new Error("Please provide a valid website URL or domain (e.g., example.com or https://example.com)");
  })
];
const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required")
];
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array()
    });
  }
  next();
};
const cache = (duration) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = mcache.get(key);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    res.sendResponse = res.send;
    res.send = (body2) => {
      mcache.put(key, body2, duration * 1e3);
      res.sendResponse(body2);
    };
    next();
  };
};
const securityHeaders = (req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
};
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn("Security event:", logData);
    } else if (res.statusCode >= 400) {
      console.error("Error event:", logData);
    } else {
      console.log("Request:", logData);
    }
  });
  next();
};
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key].trim();
      }
    });
  }
  next();
};
const validateUrl = (req, res, next) => {
  const url = req.body?.url || req.query?.url;
  if (url) {
    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: "Invalid URL protocol" });
      }
      const allowedDomains = [
        "amazon.com",
        "amazon.co.uk",
        "amazon.de",
        "amazon.fr",
        "amazon.it",
        "amazon.es",
        "ebay.com",
        "ebay.co.uk",
        "ebay.de",
        "ebay.fr",
        "ebay.it",
        "ebay.es",
        "walmart.com",
        "bestbuy.com",
        "target.com",
        "apple.com",
        "playstation.com",
        "newegg.com",
        "costco.com",
        "larq.com",
        "livelarq.com",
        "sonos.com",
        "shopify.com",
        "etsy.com",
        "aliexpress.com",
        "banggood.com",
        "gearbest.com"
      ];
      const hostname = parsedUrl.hostname.toLowerCase().replace("www.", "");
      if (!allowedDomains.some((domain) => hostname.includes(domain))) {
        console.warn(`Attempted access to non-whitelisted domain: ${hostname}`);
      }
    } catch (error) {
      return res.status(400).json({ error: "Invalid URL format" });
    }
  }
  next();
};
dotenv.config();
console.log("Environment variables loaded:");
console.log("NODE_ENV:", "production");
async function createServer() {
  const dbStatus = await checkDatabaseConnection();
  console.log("Database status:", dbStatus.status, dbStatus.message);
  const app = express__default();
  app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.searchapi.io", "https://n8n.srv824584.hstgr.cloud"]
      }
    },
    hsts: {
      maxAge: 31536e3,
      includeSubDomains: true,
      preload: true
    }
  }));
  app.use(compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6
  }));
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "https://pavlo4.netlify.app",
    "https://app.pavlo.com"
    // Assuming this is your custom domain
  ];
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((allowedOrigin) => origin.startsWith(allowedOrigin))) {
        callback(null, true);
      } else {
        console.error(`CORS error: Origin ${origin} not allowed`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"]
  };
  app.use(cors(corsOptions));
  app.use(express__default.json({ limit: "10mb" }));
  app.use(express__default.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(sanitizeInput);
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });
  app.get("/api/demo", cache(300), handleDemo);
  app.get("/api/location", cache(600), getLocationHandler);
  app.post("/api/location", getLocationHandler);
  app.get("/api/supported-countries", cache(3600), (req, res) => {
    const { getSupportedCountries } = require("./services/location");
    const countries = getSupportedCountries();
    res.json({ countries });
  });
  app.post(
    "/api/auth/register",
    validateRegistration,
    handleValidationErrors,
    register
  );
  app.post(
    "/api/auth/login",
    validateLogin,
    handleValidationErrors,
    login
  );
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getCurrentUser);
  app.post("/api/register", register);
  app.post("/api/login", login);
  app.post("/api/logout", logout);
  app.get("/api/user/me", getCurrentUser);
  app.post("/api/search-history", requireAuth, addToSearchHistory);
  app.get("/api/search-history", requireAuth, getUserSearchHistory);
  app.get("/api/admin/users", requireAuth, requireAdmin, getAllUsers);
  app.get("/api/admin/affiliate/urls", requireAuth, requireAdmin, getAllAffiliateUrls);
  app.get("/api/admin/affiliate/stats", requireAuth, requireAdmin, getAffiliateStats);
  app.post("/api/admin/affiliate/urls", requireAuth, requireAdmin, createAffiliateUrl);
  app.put("/api/admin/affiliate/urls/:id", requireAuth, requireAdmin, updateAffiliateUrl);
  app.delete("/api/admin/affiliate/urls/:id", requireAuth, requireAdmin, deleteAffiliateUrl);
  app.get("/api/affiliate/click/:id", trackAffiliateClick);
  app.post("/api/affiliate/conversion", trackAffiliateConversion);
  app.post(
    "/api/business/auth/register",
    validateBusinessRegistration,
    handleValidationErrors,
    registerBusiness
  );
  app.post(
    "/api/business/auth/login",
    validateLogin,
    handleValidationErrors,
    loginBusiness
  );
  app.get("/api/business/auth/me", getCurrentBusiness);
  app.post("/api/business/auth/logout", logoutBusiness);
  app.get("/api/business/auth/stats", getBusinessStats);
  app.post("/api/business/register", registerBusiness$1);
  app.get("/api/business/active", cache(300), getActiveBusinesses);
  app.get("/api/business/domain/:domain", cache(600), getBusinessByDomain);
  app.get("/api/admin/business", requireAuth, requireAdmin, getAllBusinesses);
  app.get("/api/admin/business/stats", requireAuth, requireAdmin, getBusinessStats$1);
  app.get("/api/admin/business/:id/stats", requireAuth, requireAdmin, getBusinessDetailedStats);
  app.put("/api/admin/business/:id", requireAuth, requireAdmin, updateBusiness);
  app.put("/api/admin/business/:id/commission", requireAuth, requireAdmin, updateBusinessCommission);
  app.put("/api/admin/business/:id/password", requireAuth, requireAdmin, updateBusinessPassword);
  app.delete("/api/admin/business/:id", requireAuth, requireAdmin, deleteBusiness);
  app.post("/api/admin/business/:id/verify", requireAuth, requireAdmin, verifyBusiness);
  app.use("/api/favorites", router);
  app.post("/api/user/search-history", requireAuth, addToSearchHistory);
  app.get("/api/user/search-history", requireAuth, getUserSearchHistory);
  app.post("/api/legacy/search-history", saveSearchHistory);
  app.get("/api/legacy/search-history", getSearchHistory);
  app.post(
    "/api/scrape",
    validateUrl,
    (req, res) => {
      req.url = "/n8n-scrape";
      router$1(req, res, () => {
      });
    }
  );
  app.use(
    "/api",
    validateUrl,
    router$1
  );
  app.post(
    "/api/scrape-product",
    validateUrl,
    (req, res) => {
      req.url = "/n8n-scrape";
      router$1(req, res, () => {
      });
    }
  );
  app.post(
    "/api/n8n-webhook-scrape",
    validateUrl,
    (req, res) => {
      req.url = "/n8n-scrape";
      router$1(req, res, () => {
      });
    }
  );
  app.get("/api/location-info", getLocationHandler);
  app.get("/api/health", healthCheckHandler);
  app.get("/go/:affiliateId/:productId", async (req, res) => {
    const { affiliateId, productId } = req.params;
    const productUrl = await clickLogService.getProductUrlByAffiliateAndProductId(affiliateId, productId);
    if (!productUrl) {
      return res.status(404).send("Product not found");
    }
    await clickLogService.logClick({
      affiliateId,
      productId,
      userId: req.user?.id,
      userAgent: req.get("User-Agent"),
      referrer: req.get("Referer"),
      ip: req.ip
    });
    const utmParams = new URLSearchParams({
      utm_source: "pavlo4",
      utm_medium: "affiliate",
      utm_campaign: "product_suggestion",
      aff_token: Math.random().toString(36).slice(2, 12)
    });
    const redirectUrl = productUrl + (productUrl.includes("?") ? "&" : "?") + utmParams.toString();
    return res.redirect(302, redirectUrl);
  });
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully");
    await gracefulShutdown();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully");
    await gracefulShutdown();
    process.exit(0);
  });
  return app;
}
(async () => {
  const app = await createServer();
  const port = process.env.PORT || 3e3;
  const __dirname = import.meta.dirname;
  const distPath = path.join(__dirname, "../spa");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(port, () => {
    console.log(`🚀 Fusion Starter server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
  });
})();
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
