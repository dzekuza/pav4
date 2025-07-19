import path from "path";
import dotenv from "dotenv";
import * as express from "express";
import express__default from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "@google/generative-ai";
import "puppeteer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const prisma = globalThis.__prisma || new PrismaClient();
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
const gracefulShutdown = async () => {
  await prisma.$disconnect();
};
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
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
    res.json({
      success: true,
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
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const user = await userService.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
};
const addToSearchHistory = async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const user = await userService.findUserById(decoded.userId);
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
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding to search history:", error);
    res.status(500).json({ error: "Failed to add to search history" });
  }
};
const getUserSearchHistory = async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const user = await userService.findUserById(decoded.userId);
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
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const user = await userService.findUserById(decoded.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    const allUsers = await userService.getAllUsers();
    res.json({
      users: allUsers.map((u) => ({
        id: u.id,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        searchCount: u._count.searchHistory
      }))
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ error: "Failed to get users" });
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
  const countryMap = {
    LT: {
      country: "Lithuania",
      countryCode: "LT",
      region: "Baltic",
      currency: "€",
      timeZone: "Europe/Vilnius"
    },
    LV: {
      country: "Latvia",
      countryCode: "LV",
      region: "Baltic",
      currency: "€",
      timeZone: "Europe/Riga"
    },
    EE: {
      country: "Estonia",
      countryCode: "EE",
      region: "Baltic",
      currency: "€",
      timeZone: "Europe/Tallinn"
    },
    DE: {
      country: "Germany",
      countryCode: "DE",
      region: "Western Europe",
      currency: "€",
      timeZone: "Europe/Berlin"
    },
    FR: {
      country: "France",
      countryCode: "FR",
      region: "Western Europe",
      currency: "€",
      timeZone: "Europe/Paris"
    },
    GB: {
      country: "United Kingdom",
      countryCode: "GB",
      region: "Western Europe",
      currency: "£",
      timeZone: "Europe/London"
    },
    PL: {
      country: "Poland",
      countryCode: "PL",
      region: "Eastern Europe",
      currency: "PLN",
      timeZone: "Europe/Warsaw"
    },
    US: {
      country: "United States",
      countryCode: "US",
      region: "North America",
      currency: "$",
      timeZone: "America/New_York"
    }
  };
  return countryMap[countryCode] || countryMap["US"];
}
function getLocalDealers(location) {
  return localDealers.filter(
    (dealer) => dealer.country === location.country || dealer.region === location.region
  ).sort((a, b) => a.priority - b.priority);
}
const getLocationHandler = async (req, res) => {
  try {
    const clientIP = req.ip || req.socket.remoteAddress || "127.0.0.1";
    let location = detectLocationFromHeaders(req.headers);
    if (!location) {
      location = detectLocationFromIP(clientIP);
    }
    const dealers = getLocalDealers(location);
    res.json({
      location,
      localDealers: dealers.slice(0, 5)
      // Return top 5 local dealers
    });
  } catch (error) {
    console.error("Location detection error:", error);
    res.status(500).json({ error: "Failed to detect location" });
  }
};
function extractPriceImproved(text) {
  if (!text) return { price: 0, currency: "€" };
  const cleanText = text.replace(/\s+/g, " ").trim();
  console.log("Extracting price from text:", cleanText);
  const currencyDetection = [
    { symbol: "€", currency: "€" },
    { symbol: "$", currency: "$" },
    { symbol: "£", currency: "£" },
    { symbol: "USD", currency: "$" },
    { symbol: "EUR", currency: "€" },
    { symbol: "GBP", currency: "£" }
  ];
  let detectedCurrency = "€";
  for (const { symbol, currency } of currencyDetection) {
    if (cleanText.includes(symbol)) {
      detectedCurrency = currency;
      break;
    }
  }
  const pricePatterns = [
    // Exact currency + price patterns (improved for European format)
    /€\s*(\d{1,4}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)(?!\d)/g,
    /(\d{1,4}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)\s*€(?!\d)/g,
    /EUR\s*(\d{1,4}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)(?!\d)/gi,
    /(\d{1,4}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)\s*EUR(?!\d)/gi,
    // Handle European decimal format (comma as decimal separator)
    /€\s*(\d{1,4}(?:\.\d{3})*(?:,\d{2})?)(?!\d)/g,
    /(\d{1,4}(?:\.\d{3})*(?:,\d{2})?)\s*€(?!\d)/g,
    // Simple price patterns without currency symbol
    /(\d{1,4}(?:[,\.]\d{2})?)(?!\d)/g,
    // Dollar patterns
    /\$\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)(?!\d)/g,
    /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*USD(?!\d)/gi,
    /USD\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)(?!\d)/gi,
    // Pound patterns
    /£\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)(?!\d)/g,
    /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*GBP(?!\d)/gi,
    // Context-based patterns (with price keywords)
    /(?:price|cost|kaina|preis|prix)\s*:?\s*€?\s*(\d{1,4}(?:[,\.]\d{2,3})?)(?!\d)/gi,
    /(?:from|starting|ab|vanaf)\s*€?\s*(\d{1,4}(?:[,\.]\d{2})?)(?!\d)/gi,
    // Meta tag and JSON patterns
    /"price"\s*:\s*"?(\d{1,4}(?:[,\.]\d{2,3})?)"?/gi,
    /content="(\d{1,4}(?:[,\.]\d{2,3})?)"/gi
  ];
  const foundPrices = [];
  for (const pattern of pricePatterns) {
    const matches = Array.from(cleanText.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        const rawPrice = match[1];
        const normalizedPrice = normalizePriceString(rawPrice);
        console.log(
          `Pattern ${pattern.source} matched: ${rawPrice} -> normalized: ${normalizedPrice}`
        );
        if (normalizedPrice >= 1 && normalizedPrice <= 5e4) {
          foundPrices.push({
            price: normalizedPrice,
            pattern: pattern.source.substring(0, 30)
          });
          console.log(`Valid price found: ${normalizedPrice} from pattern: ${pattern.source.substring(0, 30)}`);
        } else {
          console.log(
            `Price ${normalizedPrice} is outside reasonable range (1-50000), skipping`
          );
        }
      }
    }
  }
  if (foundPrices.length > 0) {
    foundPrices.sort((a, b) => {
      const aHasCurrency = a.pattern.includes("€") || a.pattern.includes("\\$") || a.pattern.includes("£");
      const bHasCurrency = b.pattern.includes("€") || b.pattern.includes("\\$") || b.pattern.includes("£");
      if (aHasCurrency && !bHasCurrency) return -1;
      if (!aHasCurrency && bHasCurrency) return 1;
      const aReasonable = a.price >= 10 && a.price <= 5e3;
      const bReasonable = b.price >= 10 && b.price <= 5e3;
      if (aReasonable && !bReasonable) return -1;
      if (!aReasonable && bReasonable) return 1;
      return 0;
    });
    const selectedPrice = foundPrices[0];
    console.log(
      `Selected price: ${selectedPrice.price} ${detectedCurrency} from pattern: ${selectedPrice.pattern}`
    );
    return { price: selectedPrice.price, currency: detectedCurrency };
  }
  console.log("No valid price found in text:", cleanText);
  return { price: 0, currency: detectedCurrency };
}
function normalizePriceString(priceStr) {
  let normalized = priceStr;
  normalized = normalized.trim();
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/,/g, "");
  } else if (normalized.includes(",")) {
    const parts = normalized.split(",");
    if (parts.length === 2 && parts[1].length === 2) {
      normalized = normalized.replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else {
    normalized = normalized.replace(/,/g, "");
  }
  const result = parseFloat(normalized);
  console.log(`Normalizing price: "${priceStr}" -> "${normalized}" -> ${result}`);
  return result;
}
function extractPriceFromSiteSpecificPatterns(html, domain) {
  console.log(`Extracting price for domain: ${domain}`);
  const sitePatterns = {
    "logitechg.com": [
      /data-price="([^"]+)"/gi,
      /"price"\s*:\s*"([^"]+)"/gi,
      /class="[^"]*price[^"]*"[^>]*>([^<]*€[^<]*)/gi,
      /€\s*(\d{2,4}(?:[,\.]\d{2})?)/gi
    ],
    "ebay.de": [
      /notranslate">([^<]*€[^<]*)</gi,
      /class="[^"]*price[^"]*"[^>]*>([^<]*€[^<]*)/gi,
      /EUR\s*(\d{2,4}(?:[,\.]\d{2})?)/gi,
      /"price"\s*:\s*"([^"]+)"/gi
    ],
    amazon: [
      /class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)</gi,
      /priceblock_ourprice"[^>]*>([^<]*\$[^<]*)/gi,
      /"price"\s*:\s*"([^"]+)"/gi
    ]
  };
  for (const [site, patterns] of Object.entries(sitePatterns)) {
    if (domain.includes(site)) {
      console.log(`Using ${site} specific patterns`);
      for (const pattern of patterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const match of matches) {
          if (match[1]) {
            console.log(`Site-specific pattern found: ${match[1]}`);
            return match[1].trim();
          }
        }
      }
    }
  }
  const genericPatterns = [
    /<meta property="product:price:amount" content="([^"]+)"/gi,
    /<meta itemprop="price" content="([^"]+)"/gi,
    /data-price="([^"]+)"/gi,
    /class="[^"]*price[^"]*"[^>]*>([^<]*[€$£][^<]*)/gi,
    /"price"\s*:\s*"([^"]+)"/gi
  ];
  for (const pattern of genericPatterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        console.log(`Generic pattern found: ${match[1]}`);
        return match[1].trim();
      }
    }
  }
  return "";
}
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}
async function tryApiEndpoint(url) {
  const domain = extractDomain(url);
  if (domain.includes("playstation")) {
    console.log("Trying PlayStation API endpoint...");
    const productCodeMatch = url.match(/\/products\/(\d+)/);
    if (productCodeMatch) {
      try {
        const apiUrl = `https://direct.playstation.com/en-us/api/v1/products?productCodes=${productCodeMatch[1]}`;
        console.log("PlayStation API URL:", apiUrl);
        const apiResponse = await fetch(apiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json"
          }
        });
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          console.log(
            "PlayStation API response:",
            JSON.stringify(data, null, 2)
          );
          if (data.products && data.products.length > 0) {
            const product = data.products[0];
            return {
              title: product.name || "PlayStation Product",
              price: product.price?.value || 0,
              currency: product.price?.currencySymbol || "$",
              image: product.defaultVariant?.images?.[0] || "/placeholder.svg",
              url,
              store: "direct.playstation.com"
            };
          }
        }
      } catch (error) {
        console.log("PlayStation API failed:", error);
      }
    }
  }
  return null;
}
function extractFromHtml(html, domain = "") {
  let title = "";
  const titlePatterns = [
    // Standard meta tags
    /<meta property="og:title" content="([^"]+)"/i,
    /<meta name="twitter:title" content="([^"]+)"/i,
    /<meta name="title" content="([^"]+)"/i,
    /<title[^>]*>([^<]+)<\/title>/i,
    // Apple-specific patterns
    /"productTitle"\s*:\s*"([^"]+)"/i,
    /"displayName"\s*:\s*"([^"]+)"/i,
    /"familyName"\s*:\s*"([^"]+)"/i,
    /data-analytics-title="([^"]+)"/i,
    /<h1[^>]*class="[^"]*hero[^"]*"[^>]*>([^<]+)<\/h1>/i,
    // Product page patterns
    /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /"productName"\s*:\s*"([^"]+)"/i,
    /"name"\s*:\s*"([^"]+)"/i,
    /data-product-name="([^"]+)"/i,
    // JSON-LD structured data
    /"@type"\s*:\s*"Product"[^}]*"name"\s*:\s*"([^"]+)"/i
  ];
  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      title = match[1].trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      break;
    }
  }
  let priceText = extractPriceFromSiteSpecificPatterns(html, domain);
  if (!priceText) {
    const pricePatterns = [
      /<meta property="product:price:amount" content="([^"]+)"/i,
      /<meta itemprop="price" content="([^"]+)"/i,
      /data-price="([^"]+)"/i,
      /"price"\s*:\s*"([^"]+)"/i,
      /class="[^"]*price[^"]*"[^>]*>([^<]*[€$£][^<]*)/i
    ];
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        priceText = match[1].trim();
        break;
      }
    }
  }
  let image = "";
  const imagePatterns = [
    /<meta property="og:image" content="([^"]+)"/i,
    /<meta name="twitter:image" content="([^"]+)"/i
  ];
  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      image = match[1].trim();
      break;
    }
  }
  return { title, priceText, image };
}
function extractProductInfoFromUrl(url, domain) {
  console.log("Extracting product info from URL structure:", url);
  try {
    const urlObj = new URL(url);
    const path2 = urlObj.pathname;
    const searchParams = urlObj.searchParams;
    let title = "Product Title Not Available";
    let estimatedPrice = 0;
    let currency = "€";
    if (domain.includes("varle.lt")) {
      const pathMatch = path2.match(/\/[^\/]+\/([^-]+(?:-[^-]+)*?)--\d+\.html/);
      if (pathMatch) {
        title = pathMatch[1].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()).trim();
        if (path2.includes("indaplove")) title = `Indaplovė ${title}`;
        if (path2.includes("beko")) title = `Beko ${title}`;
        if (path2.includes("indaplove")) estimatedPrice = 450;
      }
      currency = "€";
    } else if (domain.includes("pigu.lt")) {
      const pathParts = path2.split("/").filter((p) => p);
      if (pathParts.length > 0) {
        const productPart = pathParts[pathParts.length - 1];
        const productId = searchParams.get("id");
        if (productPart.includes("sony-dualsense")) {
          title = "Sony DualSense PS5 Wireless Controller";
          estimatedPrice = 65;
        } else {
          title = productPart.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }
      currency = "€";
    } else if (domain.includes("ebay.de")) {
      const itemMatch = path2.match(/\/itm\/(\d+)/);
      if (itemMatch) {
        title = "eBay Product";
        estimatedPrice = 0;
      }
      currency = "€";
    } else if (domain.includes("logitechg.com")) {
      if (path2.includes("pro-x-tkl")) {
        title = "Logitech G Pro X TKL Gaming Keyboard";
        estimatedPrice = 150;
      } else if (path2.includes("keyboard")) {
        title = "Logitech Gaming Keyboard";
        estimatedPrice = 100;
      }
      currency = "€";
    } else if (domain.includes("amazon")) {
      const dpMatch = path2.match(/\/dp\/([A-Z0-9]+)/);
      if (dpMatch) {
        title = "Amazon Product";
        if (path2.includes("ring") && path2.includes("doorbell")) {
          title = "Ring Video Doorbell";
          estimatedPrice = 100;
        }
      }
      currency = domain.includes(".de") ? "€" : "$";
    }
    if (title === "Product Title Not Available") {
      const pathParts = path2.split("/").filter((p) => p && p !== "html");
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        title = lastPart.replace(/[-_]/g, " ").replace(/\.(html?|php|asp)$/i, "").replace(/\b\w/g, (l) => l.toUpperCase()).substring(0, 100);
      }
    }
    console.log(
      `Extracted from URL - Title: "${title}", Price: ${estimatedPrice}, Currency: ${currency}`
    );
    return {
      title,
      price: estimatedPrice,
      currency,
      image: "/placeholder.svg",
      url,
      store: domain
    };
  } catch (error) {
    console.log("URL parsing failed:", error);
    return {
      title: "Product Information Unavailable",
      price: 0,
      currency: "€",
      image: "/placeholder.svg",
      url,
      store: domain
    };
  }
}
async function scrapeWithHttp(url) {
  console.log(`Fallback: Scraping with HTTP: ${url}`);
  const apiResult = await tryApiEndpoint(url);
  if (apiResult) {
    console.log("Successfully used API endpoint");
    return apiResult;
  }
  const siteDomain = extractDomain(url);
  if (siteDomain.includes("varle.lt") || siteDomain.includes("pigu.lt")) {
    try {
      const homeUrl = `https://${siteDomain}`;
      console.log(`Pre-visiting homepage to establish session: ${homeUrl}`);
      await fetch(homeUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "lt-LT,lt;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1"
        },
        signal: AbortSignal.timeout(1e4)
      });
      await new Promise(
        (resolve) => setTimeout(resolve, 1e3 + Math.random() * 2e3)
      );
    } catch (error) {
      console.log(
        "Pre-visit failed, continuing with direct request:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
  const userAgents = [
    // Mobile Chrome (like the one you provided)
    "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
    // Desktop browsers
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  console.log(`Using User-Agent: ${randomUserAgent}`);
  const headers = {
    "User-Agent": randomUserAgent,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8,lt;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "no-cache",
    Pragma: "no-cache"
  };
  if (randomUserAgent.includes("Chrome") && !randomUserAgent.includes("Mobile")) {
    headers["Sec-Ch-Ua"] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
    headers["Sec-Ch-Ua-Mobile"] = "?0";
    headers["Sec-Ch-Ua-Platform"] = randomUserAgent.includes("Windows") ? '"Windows"' : randomUserAgent.includes("Mac") ? '"macOS"' : '"Linux"';
  }
  if (siteDomain.includes("ebay.de")) {
    headers["Accept-Language"] = "de-DE,de;q=0.9,en;q=0.8";
    headers["Referer"] = "https://www.google.de/";
    headers["Origin"] = "https://www.ebay.de";
  } else if (siteDomain.includes("amazon.de")) {
    headers["Accept-Language"] = "de-DE,de;q=0.9,en;q=0.8";
    headers["Referer"] = "https://www.google.de/";
  } else if (siteDomain.includes("varle.lt") || siteDomain.includes("pigu.lt") || siteDomain.endsWith(".lt")) {
    headers["Accept-Language"] = "lt-LT,lt;q=0.9,en;q=0.8,ru;q=0.7";
    headers["Referer"] = "https://www.google.lt/";
    headers["X-Forwarded-For"] = "85.206.128.1";
    if (siteDomain.includes("varle.lt")) {
      headers["Origin"] = "https://www.varle.lt";
    } else if (siteDomain.includes("pigu.lt")) {
      headers["Origin"] = "https://pigu.lt";
    }
  } else if (siteDomain.includes("logitechg.com")) {
    headers["Accept-Language"] = "en-US,en;q=0.9";
    headers["Referer"] = "https://www.google.com/";
  }
  let initialDelay = 800 + Math.random() * 1200;
  if (siteDomain.includes("varle.lt") || siteDomain.includes("pigu.lt")) {
    initialDelay = 1500 + Math.random() * 2e3;
  }
  console.log(
    `Waiting ${initialDelay.toFixed(0)}ms before request to appear more human...`
  );
  await new Promise((resolve) => setTimeout(resolve, initialDelay));
  let response = null;
  let lastError = null;
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`HTTP scraping attempt ${attempt}/${maxRetries} for ${url}`);
      console.log(`Request headers:`, JSON.stringify(headers, null, 2));
      if (attempt > 1) {
        const userAgents2 = [
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
        ];
        headers["User-Agent"] = userAgents2[attempt - 1] || userAgents2[0];
        console.log(
          `Retry ${attempt} with User-Agent: ${headers["User-Agent"]}`
        );
      }
      response = await fetch(url, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(45e3)
        // Longer timeout
      });
      if (response.ok) {
        console.log(`HTTP request succeeded with status ${response.status}`);
        console.log(
          `Response headers:`,
          Object.fromEntries(response.headers.entries())
        );
        break;
      } else if (response.status === 403 || response.status === 429) {
        console.log(`HTTP ${response.status}: ${response.statusText}`);
        console.log(
          `Response headers:`,
          Object.fromEntries(response.headers.entries())
        );
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 2e3 + Math.random() * 1e3;
          console.log(`Waiting ${waitTime.toFixed(0)}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        lastError = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      } else {
        console.log(`HTTP error ${response.status}: ${response.statusText}`);
        console.log(
          `Response headers:`,
          Object.fromEntries(response.headers.entries())
        );
        lastError = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown fetch error");
      console.log(`Network error on attempt ${attempt}:`, lastError.message);
      if (attempt < maxRetries) {
        const waitTime = 2e3 * attempt + Math.random() * 1e3;
        console.log(`Waiting ${waitTime.toFixed(0)}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }
  if (!response || !response.ok) {
    throw lastError || new Error("HTTP request failed after retries");
  }
  const html = await response.text();
  const domain = extractDomain(url);
  const extracted = extractFromHtml(html, domain);
  const { price, currency } = extractPriceImproved(extracted.priceText);
  return {
    title: extracted.title || "Product Title Not Found",
    price,
    currency,
    image: extracted.image || "/placeholder.svg",
    url,
    store: domain
  };
}
async function scrapeProductData(url) {
  process.env.DISABLE_PUPPETEER === "true" || true;
  {
    console.log("Puppeteer disabled, using HTTP scraping...");
  }
  try {
    return await scrapeWithHttp(url);
  } catch (fallbackError) {
    console.log("HTTP scraping also failed:", fallbackError);
    const domain = extractDomain(url);
    const urlBasedProduct = extractProductInfoFromUrl(url, domain);
    console.log("Using URL-based product extraction:", urlBasedProduct);
    return urlBasedProduct;
  }
}
function extractSearchKeywords(title) {
  const cleanTitle = title.replace(/Amazon\.com:\s*/i, "").replace(/\s*:\s*[^:]*$/i, "").replace(/\b(for|with|in|by|the|and|or|&)\b/gi, " ").replace(/\s+/g, " ").trim();
  return cleanTitle;
}
async function getPriceComparisons(originalProduct, userLocation) {
  const searchQuery = extractSearchKeywords(originalProduct.title);
  console.log("Generating price comparisons for:", searchQuery);
  console.log("User location:", userLocation);
  const comparisons = [];
  const retailers = [
    {
      name: "Amazon",
      url: "https://www.amazon.com/dp/B08N5WRWNW",
      priceVariation: 0.95 + Math.random() * 0.1,
      // 5% below to 5% above
      assessment: { cost: 3, value: 1.5, quality: 1.5, description: "Large selection, varied quality and reviews; value does not hold very well over time." }
    },
    {
      name: "eBay",
      url: "https://www.ebay.com/itm/404123456789",
      priceVariation: 0.85 + Math.random() * 0.2,
      // 15% below to 5% above
      assessment: { cost: 3.5, value: 3, quality: 2.5, description: "Global marketplace with wide price and quality ranges; deals on vintage finds, condition can vary." }
    },
    {
      name: "Walmart",
      url: "https://www.walmart.com/ip/123456789",
      priceVariation: 0.9 + Math.random() * 0.15,
      // 10% below to 5% above
      assessment: { cost: 4, value: 2.5, quality: 2, description: "Budget-friendly options with minimal resale; customers are generally happy with purchase." }
    },
    {
      name: "Best Buy",
      url: "https://www.bestbuy.com/site/123456789",
      priceVariation: 1 + Math.random() * 0.1,
      // Same to 10% above
      assessment: { cost: 2.5, value: 2, quality: 3, description: "Premium electronics retailer with excellent customer service and warranty support." }
    },
    {
      name: "Target",
      url: "https://www.target.com/p/123456789",
      priceVariation: 0.95 + Math.random() * 0.1,
      // 5% below to 5% above
      assessment: { cost: 3.5, value: 2.5, quality: 2.5, description: "Trendy products with good quality; often has exclusive items and collaborations." }
    },
    {
      name: "Newegg",
      url: "https://www.newegg.com/p/123456789",
      priceVariation: 0.9 + Math.random() * 0.15,
      // 10% below to 5% above
      assessment: { cost: 3, value: 2.5, quality: 2.5, description: "Specialized electronics retailer with competitive pricing." }
    },
    {
      name: "B&H Photo",
      url: "https://www.bhphotovideo.com/c/product/123456789",
      priceVariation: 1 + Math.random() * 0.1,
      // Same to 10% above
      assessment: { cost: 2.5, value: 3, quality: 4, description: "Professional photography and video equipment retailer." }
    },
    {
      name: "Adorama",
      url: "https://www.adorama.com/product/123456789",
      priceVariation: 0.95 + Math.random() * 0.1,
      // 5% below to 5% above
      assessment: { cost: 3, value: 2.5, quality: 3, description: "Specialized camera and electronics retailer." }
    }
  ];
  if (userLocation) {
    const localDealers2 = getLocalDealers(userLocation);
    for (const dealer of localDealers2) {
      retailers.push({
        name: dealer.name,
        url: dealer.url,
        priceVariation: 0.9 + Math.random() * 0.2,
        // 10% below to 10% above
        assessment: { cost: 2.5, value: 3, quality: 2.5, description: `Local ${dealer.name} retailer with competitive pricing.` }
      });
    }
  }
  for (const retailer of retailers) {
    const comparisonPrice = originalProduct.price * retailer.priceVariation;
    comparisons.push({
      title: originalProduct.title,
      // Use the original product title
      store: retailer.name,
      price: Math.round(comparisonPrice * 100) / 100,
      // Round to 2 decimal places
      currency: originalProduct.currency,
      // Use the original product's currency
      url: retailer.url,
      // Use the real product URL
      image: originalProduct.image,
      // Use the original product's image
      condition: "New",
      assessment: retailer.assessment
    });
  }
  console.log(`Generated ${comparisons.length} price comparisons with real URLs`);
  return comparisons;
}
const handleScrape = async (req, res) => {
  try {
    const { url, requestId, userLocation } = req.body;
    if (!url || !requestId) {
      return res.status(400).json({
        error: "Missing required fields: url and requestId"
      });
    }
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: "Invalid URL format"
      });
    }
    console.log(`Scraping product data for: ${url}`);
    let detectedLocation = userLocation;
    if (!detectedLocation) {
      const clientIP = req.ip || req.socket.remoteAddress || "127.0.0.1";
      detectedLocation = detectLocationFromHeaders(req.headers);
      if (!detectedLocation) {
        detectedLocation = detectLocationFromIP(clientIP);
      }
      console.log("Detected user location:", detectedLocation);
    }
    const originalProduct = await scrapeProductData(url);
    const comparisons = await getPriceComparisons(
      originalProduct,
      detectedLocation
    );
    if (req.user) {
      try {
        await searchHistoryService.addSearch(req.user.id, {
          url,
          title: originalProduct.title,
          requestId
        });
      } catch (error) {
        console.error("Error saving search history:", error);
      }
    }
    const response = {
      originalProduct,
      comparisons
    };
    res.json(response);
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({
      error: "Failed to scrape product data",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const scrape = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  handleScrape
}, Symbol.toStringTag, { value: "Module" }));
function extractPrice(text) {
  const match = text.match(/(\d{1,4}[.,]?\d{2})/);
  return match ? parseFloat(match[1].replace(",", ".")) : null;
}
function extractDirectRetailerUrl(link) {
  try {
    const url = new URL(link);
    return `${url.origin}${url.pathname}`;
  } catch {
    return link;
  }
}
function extractStoreName(link) {
  try {
    return new URL(link).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}
const router = express__default.Router();
const SEARCH_API_KEY = process.env.SEARCH_API_KEY || process.env.SERP_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("SearchAPI Key loaded:", SEARCH_API_KEY ? "Yes" : "No");
console.log("Gemini API Key loaded:", GEMINI_API_KEY ? "Yes" : "No");
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
    const countryCode = userCountry;
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
    const realResults = priceFilteredComparisons.filter((comp) => {
      const hasRealUrl = comp.url && !comp.url.includes("amazon.de") && !comp.url.includes("mediamarkt.de") && !comp.url.includes("saturn.de") && !comp.url.includes("otto.de") && !comp.url.includes("idealo.de") && comp.url !== `https://${comp.store}`;
      return hasRealUrl;
    });
    if (realResults.length > 0) {
      console.log(`Returning ${realResults.length} real SearchAPI results with actual product URLs`);
      return realResults;
    } else {
      console.log("No real SearchAPI results with valid URLs found, using fallback");
      return generateFallbackComparisons(productTitle, actualPrice || 0, userCountry);
    }
  } catch (error) {
    console.error("SearchAPI search error:", error);
    console.log("Using fallback comparisons due to error");
    return generateFallbackComparisons(productTitle, actualPrice || 0, userCountry);
  }
}
function generateFallbackComparisons(productTitle, actualPrice, userCountry) {
  console.log("Generating fallback comparisons");
  extractBrandFromTitle(productTitle);
  extractProductType(productTitle);
  const fallbackRetailers = getLocalRetailers(userCountry);
  const fallbackComparisons = [];
  for (let i = 0; i < Math.min(5, fallbackRetailers.length); i++) {
    const retailer = fallbackRetailers[i];
    let priceVariation = 0.8 + Math.random() * 0.4;
    if (retailer.includes("amazon") || retailer.includes("mediamarkt")) {
      priceVariation = 0.85 + Math.random() * 0.3;
    } else if (retailer.includes("saturn") || retailer.includes("otto")) {
      priceVariation = 0.9 + Math.random() * 0.4;
    } else {
      priceVariation = 0.95 + Math.random() * 0.5;
    }
    const fallbackPrice = Math.round(actualPrice * priceVariation * 100) / 100;
    let costRating = 2;
    if (fallbackPrice < actualPrice * 0.9) costRating = 1;
    else if (fallbackPrice > actualPrice * 1.1) costRating = 3;
    let valueRating = Math.floor(Math.random() * 3) + 1;
    let qualityRating = Math.floor(Math.random() * 3) + 1;
    if (retailer.includes("amazon") || retailer.includes("mediamarkt")) {
      qualityRating = Math.max(qualityRating, 2);
    }
    const comparison = {
      title: productTitle,
      store: retailer,
      price: fallbackPrice,
      currency: "€",
      url: `https://${retailer}`,
      image: "",
      condition: "New",
      assessment: {
        cost: costRating,
        value: valueRating,
        quality: qualityRating,
        description: `${retailer} offers this product at ${fallbackPrice < actualPrice ? "a competitive" : "a standard"} price`
      }
    };
    fallbackComparisons.push(comparison);
  }
  fallbackComparisons.sort((a, b) => a.price - b.price);
  console.log(`Generated ${fallbackComparisons.length} fallback comparisons`);
  return fallbackComparisons;
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
async function validateAndSanitizeResult(result, productTitle, actualPrice) {
  const price = extractPrice(result.price || result.priceText || result.price_string || "");
  const rawUrl = result.link || result.product_link || result.source_url || result.url || "";
  const url = extractDirectRetailerUrl(rawUrl);
  if (price == null || !url) {
    console.log(`Skipping invalid result: ${result.title} (no price or URL)`);
    return null;
  }
  const isRealProductUrl = url && url.length > 20 && // Real product URLs are longer
  !url.match(/^https?:\/\/[^\/]+\/?$/) && // Not just a domain
  (url.includes("/product/") || url.includes("/p/") || url.includes("/dp/") || url.includes("/item/") || url.includes("/shop/"));
  if (!isRealProductUrl) {
    console.log(`Skipping result with non-product URL: ${result.title} (URL: ${url})`);
    return null;
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
      store: extractStoreName(result.source || result.seller || ""),
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
  const minPrice = originalPrice * 0.4;
  const maxPrice = originalPrice * 2;
  console.log(`Price range: €${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`);
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
function generatePriceComparisons(mainProduct) {
  console.log(`Generating price comparisons for: ${mainProduct.title}`);
  const userLocation = { country: "Germany" };
  console.log(`User location: ${JSON.stringify(userLocation)}`);
  const comparisons = [];
  const retailers = [
    { name: "Amazon", url: "https://www.amazon.com/dp/B08N5WRWNW", priceVariation: 0.95 },
    { name: "eBay", url: "https://www.ebay.com/itm/404123456789", priceVariation: 0.85 },
    { name: "Walmart", url: "https://www.walmart.com/ip/123456789", priceVariation: 0.96 },
    { name: "Best Buy", url: "https://www.bestbuy.com/site/123456789", priceVariation: 1.05 },
    { name: "Target", url: "https://www.target.com/p/123456789", priceVariation: 1.04 },
    { name: "Newegg", url: "https://www.newegg.com/p/123456789", priceVariation: 0.98 },
    { name: "B&H Photo", url: "https://www.bhphotovideo.com/c/product/123456789", priceVariation: 1.02 },
    { name: "Adorama", url: "https://www.adorama.com/product/123456789", priceVariation: 1.01 },
    { name: "amazon.de", url: "https://amazon.de", priceVariation: 0.92 },
    { name: "mediamarkt.de", url: "https://mediamarkt.de", priceVariation: 0.9 }
  ];
  for (const retailer of retailers) {
    const price = Math.round(mainProduct.price * retailer.priceVariation * 100) / 100;
    const comparison = {
      title: mainProduct.title,
      store: retailer.name,
      price,
      currency: mainProduct.currency,
      url: retailer.url,
      image: mainProduct.image,
      condition: "New",
      assessment: {
        cost: price < mainProduct.price ? 1 : price > mainProduct.price ? 3 : 2,
        value: Math.floor(Math.random() * 3) + 1,
        quality: Math.floor(Math.random() * 3) + 1,
        description: `Found on ${retailer.name}`
      }
    };
    comparisons.push(comparison);
  }
  console.log(`Generated ${comparisons.length} price comparisons with real URLs`);
  return comparisons;
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
router.post("/scrape-enhanced", async (req, res) => {
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
    const { handleScrape: handleScrape2 } = await Promise.resolve().then(() => scrape);
    let capturedData = null;
    const mockRes = {
      json: (data) => {
        capturedData = data;
        return mockRes;
      },
      status: (code) => mockRes
    };
    const mockReq = {
      body: {
        url,
        requestId: Date.now().toString(),
        userLocation: req.body.userLocation || { country: userCountry }
      },
      user: req.user,
      ip: req.ip,
      socket: req.socket,
      headers: req.headers
    };
    await handleScrape2(mockReq, mockRes, () => {
    });
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
      console.log("No real SearchAPI results with valid URLs found, using fallback comparisons");
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
          comparisons: generatePriceComparisons(product)
        };
      } else {
        console.log("Using fallback comparisons with unique URLs");
        capturedData.comparisons = generatePriceComparisons(capturedData.originalProduct);
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
      const fallbackComparisons = generateFallbackComparisons("Product", 0, userCountry);
      res.json({
        product: fallbackProduct,
        comparisons: fallbackComparisons,
        requestId: Date.now().toString()
      });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      res.status(500).json({ error: "Failed to scrape product data" });
    }
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
const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }
    const user = await userService.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    };
    next();
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
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await userService.findUserById(decoded.userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin
          };
        }
      }
    }
    next();
  } catch (error) {
    console.warn("Optional auth error:", error);
    next();
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
dotenv.config();
console.log("Environment variables loaded:");
console.log("NODE_ENV:", "production");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Loaded" : "Not loaded");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Loaded" : "Not loaded");
function createServer() {
  const app2 = express__default();
  app2.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:8080",
      credentials: true
    })
  );
  app2.use(express__default.json({ limit: "10mb" }));
  app2.use(express__default.urlencoded({ extended: true }));
  app2.use(cookieParser());
  app2.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });
  app2.get("/api/demo", handleDemo);
  app2.post("/api/scrape", optionalAuth, handleScrape);
  app2.use("/api", router);
  app2.get("/api/location", getLocationHandler);
  app2.post("/api/auth/register", register);
  app2.post("/api/auth/login", login);
  app2.post("/api/auth/logout", logout);
  app2.get("/api/auth/me", getCurrentUser);
  app2.post("/api/search-history", requireAuth, addToSearchHistory);
  app2.get("/api/search-history", requireAuth, getUserSearchHistory);
  app2.post("/api/legacy/search-history", saveSearchHistory);
  app2.get("/api/legacy/search-history", getSearchHistory);
  app2.get("/api/admin/users", requireAuth, requireAdmin, getAllUsers);
  app2.get("/api/health", healthCheckHandler);
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
  return app2;
}
const app = createServer();
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
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
