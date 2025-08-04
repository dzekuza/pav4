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
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma = prisma;
}

// Simple server creation function for Netlify Functions
export async function createServer() {
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

            // Check if business exists
            console.log('Checking business with ID:', business_id);
            const business = await prisma.business.findUnique({
                where: { id: parseInt(business_id) }
            });

            if (!business) {
                console.log('Business not found:', business_id);
                return res.status(400).json({
                    success: false,
                    error: "Business not found"
                });
            }

            console.log('Business found:', business.name);

            // Create tracking event in database
            console.log('Creating tracking event...');
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

            // Update business statistics based on event type
            if (event_type === 'purchase_click' || event_type === 'conversion') {
                console.log('Updating business visits...');
                await prisma.business.update({
                    where: { id: parseInt(business_id) },
                    data: {
                        totalVisits: {
                            increment: 1
                        }
                    }
                });
            }

            if (event_type === 'conversion') {
                console.log('Updating business purchases...');
                await prisma.business.update({
                    where: { id: parseInt(business_id) },
                    data: {
                        totalPurchases: {
                            increment: 1
                        },
                        totalRevenue: {
                            increment: parseFloat(data?.total_amount || '0')
                        }
                    }
                });
            }

            console.log('Track event completed successfully');
            res.json({
                success: true,
                message: "Event tracked successfully",
                event_id: trackingEvent.id
            });

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