import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import path from "path";

// Load environment variables
dotenv.config();

// Import database service
import { PrismaClient } from "@prisma/client";

// Create a single Prisma Client instance
const createPrismaClient = () => {
    console.log('Creating Prisma client with DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        return null;
    }
    
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });
};

export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = prisma;
}

// Test database connection
async function testDatabaseConnection() {
    try {
        if (!prisma) {
            console.error('Prisma client not initialized - DATABASE_URL missing');
            return false;
        }
        await prisma.$connect();
        console.log('Database connection successful');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

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