import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();

// Import database service
import { PrismaClient } from "@prisma/client";

// Create a single Prisma Client instance
const createPrismaClient = () => {
    // Use Netlify database URL if available, otherwise fall back to local DATABASE_URL
    const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    
    console.log('Creating Prisma client with database URL:', databaseUrl ? 'SET' : 'NOT SET');
    console.log('Using Netlify database:', !!process.env.NETLIFY_DATABASE_URL);

    if (!databaseUrl) {
        console.error('No database URL found (neither NETLIFY_DATABASE_URL nor DATABASE_URL)');
        return null;
    }

    return new PrismaClient({
        log: ['error'],
        datasources: {
            db: {
                url: databaseUrl
            }
        }
    });
};

export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = prisma;
}

// Test database connection with retry logic
async function testDatabaseConnection() {
    try {
        if (!prisma) {
            console.error('Prisma client not initialized - DATABASE_URL missing');
            return false;
        }
        
        console.log('Testing database connection...');
        await prisma.$connect();
        console.log('Database connection successful');
        
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to generate JWT token for business
function generateBusinessToken(businessId: number, email: string) {
    return jwt.sign(
        { businessId, email, type: "business" },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

// Helper function to verify business token
function verifyBusinessToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
        return null;
    }
}

// Business service functions
const businessService = {
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

    async createBusiness(data: any) {
        return prisma.business.create({
            data,
        });
    },

    async getBusinessStatistics(businessId: number) {
        try {
            console.log('Getting business statistics for businessId:', businessId);
            
            // Test database connection first
            const dbConnected = await testDatabaseConnection();
            if (!dbConnected) {
                console.log('Database connection failed, cannot get business statistics');
                return null;
            }
            
            // Get business details
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

            console.log('Business found:', business);

            if (!business) {
                console.log('Business not found for ID:', businessId);
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

            console.log('Recent clicks count:', clicks.length);
            console.log('Recent conversions count:', conversions.length);

            // Calculate derived fields
            const averageOrderValue = business.totalPurchases > 0 ? business.totalRevenue / business.totalPurchases : 0;
            const conversionRate = business.totalVisits > 0 ? (business.totalPurchases / business.totalVisits) * 100 : 0;
            const projectedFee = business.totalRevenue * (business.adminCommissionRate / 100);

            const result = {
                ...business,
                averageOrderValue,
                conversionRate,
                projectedFee,
                recentClicks: clicks,
                recentConversions: conversions,
            };

            console.log('Returning business statistics:', result);
            return result;
        } catch (error) {
            console.error("Error getting business statistics:", error);
            return null;
        }
    },
};

// Simple server creation function for Netlify Functions
export async function createServer() {
    // Test database connection on startup
    console.log('Testing database connection...');
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.error('Failed to connect to database on startup');
    } else {
        console.log('Database connection successful on startup');
    }

    const app = express();

    // Trust Netlify/Heroku/Cloud proxy for correct req.ip and rate limiting
    app.set('trust proxy', 1);

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "blob:"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://rsms.me"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: [
                    "'self'",
                    "https://api.searchapi.io",
                    "https://n8n.srv824584.hstgr.cloud",
                    "https://pavlo4.netlify.app",
                ],
            },
        },
    }));

    // CORS configuration
    app.use(cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    }));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(cookieParser());

    // Compression middleware
    app.use(compression());

    // Basic health check
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Debug endpoint to check environment variables
    app.get("/api/debug/env", (req, res) => {
        res.json({
            DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
            JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
            NODE_ENV: process.env.NODE_ENV,
            FRONTEND_URL: process.env.FRONTEND_URL,
            ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
        });
    });

    // Debug endpoint to test database connection
    app.get("/api/debug/db", async (req, res) => {
        try {
            console.log('Testing database connection from debug endpoint...');
            const dbConnected = await testDatabaseConnection();
            
            if (dbConnected) {
                // Test business query
                const business = await prisma.business.findUnique({
                    where: { id: 3 },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        domain: true,
                    }
                });
                
                res.json({
                    success: true,
                    databaseConnected: true,
                    businessFound: !!business,
                    business: business
                });
            } else {
                res.json({
                    success: false,
                    databaseConnected: false,
                    error: "Database connection failed"
                });
            }
        } catch (error) {
            console.error('Database test error:', error);
            res.json({
                success: false,
                databaseConnected: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });

    // Location endpoint
    app.get("/api/location", (req, res) => {
        res.json({ 
            success: true, 
            location: { 
                country: "LT", 
                city: "Vilnius" 
            } 
        });
    });

    // Auth endpoints (simplified responses)
    app.get("/api/auth/me", (req, res) => {
        res.json({ 
            success: false, 
            message: "Not authenticated" 
        });
    });

    // Business authentication endpoints
    app.get("/api/business/auth/me", async (req, res) => {
        try {
            // Check for token in cookies or Authorization header
            let token = req.cookies.business_token;

            if (!token) {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
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
                    email: business.email,
                    affiliateId: business.affiliateId,
                    trackingVerified: business.trackingVerified,
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
    });

    app.post("/api/business/auth/login", async (req, res) => {
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

            // Generate token
            const token = generateBusinessToken(business.id, business.email);

            // Set cookie
            res.cookie("business_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.json({
                success: true,
                business: {
                    id: business.id,
                    name: business.name,
                    domain: business.domain,
                    email: business.email,
                },
                message: "Business login successful"
            });
        } catch (error) {
            console.error("Error logging in business:", error);
            res.status(500).json({ success: false, error: "Failed to login" });
        }
    });

    app.post("/api/business/auth/logout", (req, res) => {
        res.clearCookie("business_token");
        res.json({ success: true, message: "Business logged out successfully" });
    });

    // Business statistics endpoint
    app.get("/api/business/auth/stats", async (req, res) => {
        try {
            console.log('Stats endpoint called');
            
            // Check for business authentication
            let token = req.cookies.business_token;

            if (!token) {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                }
            }

            console.log('Token found:', !!token);

            if (!token) {
                console.log('No token found');
                return res.status(401).json({
                    success: false,
                    error: "Not authenticated"
                });
            }

            const decoded = verifyBusinessToken(token);
            console.log('Token decoded:', decoded);

            if (!decoded || decoded.type !== "business") {
                console.log('Invalid token:', decoded);
                return res.status(401).json({
                    success: false,
                    error: "Invalid token"
                });
            }

            console.log('Business ID from token:', decoded.businessId);

            const stats = await businessService.getBusinessStatistics(decoded.businessId);
            console.log('Stats result:', !!stats);

            if (!stats) {
                console.log('Business not found in getBusinessStatistics');
                return res.status(404).json({
                    success: false,
                    error: "Business not found"
                });
            }

            console.log('Returning successful stats response');
            res.json({ success: true, stats });
        } catch (error) {
            console.error("Error getting business stats:", error);
            res.status(500).json({ success: false, error: "Failed to get business statistics" });
        }
    });

    // Track event endpoint
    app.post("/api/track-event", async (req, res) => {
        try {
            const {
                event_type,
                business_id,
                affiliate_id,
                platform,
                session_id,
                user_agent,
                referrer,
                timestamp,
                url,
                data
            } = req.body;

            console.log('Track event request:', { event_type, business_id, affiliate_id, platform });

            // Validate required fields
            if (!event_type || !business_id || !affiliate_id) {
                console.log('Missing required fields:', { event_type, business_id, affiliate_id });
                return res.status(400).json({
                    success: false,
                    error: "Missing required fields: event_type, business_id, affiliate_id"
                });
            }

            // Test database connection first
            console.log('Testing database connection...');
            const dbConnected = await testDatabaseConnection();

            if (dbConnected) {
                // Database is available - try to save the event
                try {
                    console.log('Creating tracking event in database...');
                    const trackingEvent = await prisma.trackingEvent.create({
                        data: {
                            eventType: event_type,
                            businessId: parseInt(business_id),
                            affiliateId: affiliate_id,
                            platform: platform || 'universal',
                            sessionId: session_id,
                            userAgent: user_agent,
                            referrer: referrer,
                            timestamp: new Date(timestamp),
                            url: url,
                            eventData: data || {},
                            ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
                        }
                    });

                    console.log('Tracking event created:', trackingEvent.id);

                    res.json({
                        success: true,
                        message: "Event tracked successfully",
                        event_id: trackingEvent.id
                    });
                } catch (dbError) {
                    console.error('Database operation failed:', dbError);
                    res.json({
                        success: true,
                        message: "Event tracked successfully (logged only)",
                        event_id: Date.now(),
                        note: "Database operation failed, but event was logged"
                    });
                }
            } else {
                // Database not available - just log the event
                console.log('Event received (no database):', {
                    event_type,
                    business_id,
                    affiliate_id,
                    platform,
                    session_id,
                    user_agent,
                    referrer,
                    timestamp,
                    url,
                    data
                });

                res.json({
                    success: true,
                    message: "Event tracked successfully (logged only)",
                    event_id: Date.now(),
                    note: "Database not available - check DATABASE_URL environment variable"
                });
            }

        } catch (error) {
            console.error("Error tracking event:", error);
            res.status(500).json({
                success: false,
                error: "Failed to track event",
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });

    return app;
} 