import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { neon } from '@neondatabase/serverless';

// Load environment variables
dotenv.config();

// Create Neon SQL client with fallback
const getSql = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(databaseUrl);
};

// Test database connection with retry logic
async function testDatabaseConnection() {
    try {
        console.log('Testing database connection with Neon...');
        const sql = getSql();
        const result = await sql`SELECT 1 as test`;
        console.log('Database connection successful:', result);
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

// Create Express app
const app = express();

// Trust Vercel proxy for correct req.ip and rate limiting
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

// Basic health check - always works
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        message: "API is working!"
    });
});

// Debug endpoint to check environment variables
app.get("/api/debug/env", (req, res) => {
    res.json({
        DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
        JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
        NODE_ENV: process.env.NODE_ENV,
        FRONTEND_URL: process.env.FRONTEND_URL,
    });
});

// Debug endpoint to test database connection
app.get("/api/debug/db", async (req, res) => {
    try {
        console.log('Testing database connection from debug endpoint...');
        const dbConnected = await testDatabaseConnection();
        
        if (dbConnected) {
            // Try to get table information
            try {
                const sql = getSql();
                const tablesResult = await sql`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                `;
                
                // Get businesses table schema
                const businessesSchema = await sql`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = 'businesses'
                    ORDER BY ordinal_position
                `;
                
                // Get users table schema
                const usersSchema = await sql`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                    ORDER BY ordinal_position
                `;
                
                // Get tracking_events table schema
                const trackingEventsSchema = await sql`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = 'tracking_events'
                    ORDER BY ordinal_position
                `;
                
                res.json({
                    success: true,
                    databaseConnected: true,
                    message: "Database connection successful",
                    tables: tablesResult.map(t => t.table_name),
                    businessesSchema: businessesSchema,
                    usersSchema: usersSchema,
                    trackingEventsSchema: trackingEventsSchema
                });
            } catch (schemaError) {
                res.json({
                    success: true,
                    databaseConnected: true,
                    message: "Database connection successful",
                    error: "Could not fetch schema information",
                    details: schemaError instanceof Error ? schemaError.message : String(schemaError)
                });
            }
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

// Location endpoint - always works
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

// User registration endpoint
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email and password are required"
            });
        }

        // Validate email format
        if (!email.includes('@')) {
            return res.status(400).json({
                success: false,
                error: "Invalid email format"
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: "Password must be at least 6 characters long"
            });
        }

        // Try to connect to database
        try {
            const sql = getSql();
            
            // Check if user already exists
            const existingUserResult = await sql`
                SELECT id FROM users WHERE email = ${email}
            `;
            if (existingUserResult.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: "A user with this email already exists"
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create the user
            const result = await sql`
                INSERT INTO users (email, password, "isAdmin", "createdAt", "updatedAt")
                VALUES (${email}, ${hashedPassword}, false, NOW(), NOW())
                RETURNING id, email, "isAdmin"
            `;

            const user = result[0];

            console.log('User created successfully:', user.id);

            res.status(201).json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    isAdmin: user.isAdmin,
                },
                message: "User registered successfully"
            });

        } catch (dbError) {
            console.error('Database error in user registration:', dbError);
            res.status(500).json({
                success: false,
                error: "Database connection failed",
                details: dbError instanceof Error ? dbError.message : String(dbError)
            });
        }

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({
            success: false,
            error: "Failed to register user",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// User login endpoint
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email and password are required"
            });
        }

        // Try to find user in database
        try {
            const sql = getSql();
            const userResult = await sql`
                SELECT id, email, password, "isAdmin" FROM users WHERE email = ${email}
            `;
            const user = userResult[0];

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid email or password"
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid email or password"
                });
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, email: user.email, isAdmin: user.isAdmin },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            // Set cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    isAdmin: user.isAdmin,
                },
                message: "Login successful"
            });
        } catch (dbError) {
            console.error('Database error in user login:', dbError);
            res.status(500).json({
                success: false,
                error: "Database connection failed"
            });
        }
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ success: false, error: "Failed to login" });
    }
});

// User logout endpoint
app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true, message: "Logged out successfully" });
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

        // Try to get business from database
        try {
            const sql = getSql();
            const businessResult = await sql`
                SELECT id, name, domain, email, "affiliateId", "trackingVerified"
                FROM businesses 
                WHERE id = ${decoded.businessId}
            `;
            const business = businessResult[0];

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
        } catch (dbError) {
            console.error('Database error in business auth:', dbError);
            res.json({
                business: null,
                authenticated: false,
                error: "Database connection failed"
            });
        }
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

        // Try to find business in database
        try {
            const sql = getSql();
            const businessResult = await sql`
                SELECT * FROM businesses 
                WHERE email = ${email}
            `;
            const business = businessResult[0];

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
        } catch (dbError) {
            console.error('Database error in business login:', dbError);
            res.status(500).json({ 
                success: false, 
                error: "Database connection failed" 
            });
        }
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

        // Try to get business statistics
        try {
            const sql = getSql();
            const businessResult = await sql`
                SELECT id, name, domain, "totalVisits", "totalPurchases", "totalRevenue", commission, "adminCommissionRate", "affiliateId", "trackingVerified"
                FROM businesses 
                WHERE id = ${decoded.businessId}
            `;
            
            const business = businessResult[0];

            if (!business) {
                console.log('Business not found in getBusinessStatistics');
                return res.status(404).json({
                    success: false,
                    error: "Business not found"
                });
            }

            // Calculate derived fields
            const averageOrderValue = business.totalPurchases > 0 ? business.totalRevenue / business.totalPurchases : 0;
            const conversionRate = business.totalVisits > 0 ? (business.totalPurchases / business.totalVisits) * 100 : 0;
            const projectedFee = business.totalRevenue * (business.adminCommissionRate / 100);

            const stats = {
                id: business.id,
                name: business.name,
                domain: business.domain,
                totalVisits: business.totalVisits,
                totalPurchases: business.totalPurchases,
                totalRevenue: business.totalRevenue,
                commission: business.commission,
                adminCommissionRate: business.adminCommissionRate,
                affiliateId: business.affiliateId,
                trackingVerified: business.trackingVerified,
                averageOrderValue,
                conversionRate,
                projectedFee,
                recentClicks: [],
                recentConversions: [],
            };

            console.log('Returning successful stats response');
            res.json({ success: true, stats });
        } catch (dbError) {
            console.error('Database error in business stats:', dbError);
            res.status(500).json({ 
                success: false, 
                error: "Database connection failed",
                details: dbError instanceof Error ? dbError.message : String(dbError)
            });
        }
    } catch (error) {
        console.error("Error getting business stats:", error);
        res.status(500).json({ success: false, error: "Failed to get business statistics" });
    }
});

// Business registration endpoint
app.post("/api/business/register", async (req, res) => {
    try {
        const { 
            name, 
            domain, 
            website, 
            email,
            password
        } = req.body;

        console.log('Business registration request:', { name, domain, email });

        if (!name || !domain || !website || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: "Name, domain, website, email, and password are required" 
            });
        }

        // Validate email format
        if (!email.includes('@')) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid email format" 
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                error: "Password must be at least 6 characters long" 
            });
        }

        // Validate domain format
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid domain format" 
            });
        }

        // Try to connect to database
        try {
            const sql = getSql();
            
            // Check if domain already exists
            const existingDomainResult = await sql`
                SELECT id FROM businesses WHERE domain = ${domain}
            `;
            if (existingDomainResult.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: "A business with this domain already exists" 
                });
            }

            // Check if email already exists
            const existingEmailResult = await sql`
                SELECT id FROM businesses WHERE email = ${email}
            `;
            if (existingEmailResult.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: "A business with this email already exists" 
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Generate affiliate ID
            const affiliateId = `aff_${domain.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;

            // Create the business with minimal required fields
            const result = await sql`
                INSERT INTO businesses (
                    name, domain, website, email, password, "affiliateId", 
                    "isActive", "createdAt", "updatedAt"
                ) VALUES (
                    ${name}, ${domain}, ${website}, ${email}, ${hashedPassword}, 
                    ${affiliateId}, true, NOW(), NOW()
                ) RETURNING id, name, domain, email, "affiliateId"
            `;

            const business = result[0];

            console.log('Business created successfully:', business.id);

            res.status(201).json({ 
                success: true, 
                business: {
                    id: business.id,
                    name: business.name,
                    domain: business.domain,
                    email: business.email,
                    affiliateId: business.affiliateId,
                },
                message: "Business registered successfully. You can now log in and complete your profile in settings." 
            });

        } catch (dbError) {
            console.error('Database error in business registration:', dbError);
            res.status(500).json({ 
                success: false, 
                error: "Database connection failed",
                details: dbError instanceof Error ? dbError.message : String(dbError)
            });
        }

    } catch (error) {
        console.error("Error registering business:", error);
        res.status(500).json({ 
            success: false, 
            error: "Failed to register business",
            details: error instanceof Error ? error.message : String(error)
        });
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

        // Try to save the event to database
        try {
            console.log('Creating tracking event in database...');
            const sql = getSql();
            const result = await sql`
                INSERT INTO tracking_events (
                    event_type, business_id, affiliate_id, platform, session_id, 
                    user_agent, referrer, timestamp, url, event_data, ip_address
                ) VALUES (
                    ${event_type}, ${parseInt(business_id)}, ${affiliate_id}, 
                    ${platform || 'universal'}, ${session_id}, ${user_agent}, 
                    ${referrer}, ${new Date(timestamp)}, ${url}, ${JSON.stringify(data || {})}, 
                    ${req.ip || req.connection.remoteAddress || 'unknown'}
                ) RETURNING id
            `;
            
            const trackingEvent = result[0];
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

    } catch (error) {
        console.error("Error tracking event:", error);
        res.status(500).json({
            success: false,
            error: "Failed to track event",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// Get tracking events for a business
app.get("/api/business/tracking-events", async (req, res) => {
    try {
        // Check for business authentication
        let token = req.cookies.business_token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
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

        // Get tracking events for this business
        try {
            const sql = getSql();
            const events = await sql`
                SELECT 
                    id,
                    "eventType",
                    "businessId",
                    "affiliateId",
                    platform,
                    "sessionId",
                    "userAgent",
                    referrer,
                    timestamp,
                    url,
                    "eventData",
                    "ipAddress"
                FROM tracking_events 
                WHERE "businessId" = ${decoded.businessId}
                ORDER BY timestamp DESC 
                LIMIT 50
            `;

            res.json({
                success: true,
                events: events
            });
        } catch (dbError) {
            console.error('Database error in tracking events:', dbError);
            res.status(500).json({ 
                success: false, 
                error: "Database connection failed",
                details: dbError instanceof Error ? dbError.message : String(dbError)
            });
        }
    } catch (error) {
        console.error("Error getting tracking events:", error);
        res.status(500).json({ success: false, error: "Failed to get tracking events" });
    }
});

// Test endpoint to simulate tracking events
app.post("/api/business/test-tracking", async (req, res) => {
    try {
        // Check for business authentication
        let token = req.cookies.business_token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
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

        // Get business info
        try {
            const sql = getSql();
            const businessResult = await sql`
                SELECT id, "affiliateId" FROM businesses WHERE id = ${decoded.businessId}
            `;
            
            const business = businessResult[0];
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found"
                });
            }

            // Create test tracking events
            const testEvents = [
                {
                    eventType: 'page_view',
                    url: `https://${business.domain || 'teststore.com'}`,
                    eventData: JSON.stringify({ page: 'home' })
                },
                {
                    eventType: 'product_view',
                    url: `https://${business.domain || 'teststore.com'}/product/test-product`,
                    eventData: JSON.stringify({ product_id: 'test-123', product_name: 'Test Product' })
                },
                {
                    eventType: 'add_to_cart',
                    url: `https://${business.domain || 'teststore.com'}/cart`,
                    eventData: JSON.stringify({ product_id: 'test-123', quantity: 1 })
                },
                {
                    eventType: 'purchase',
                    url: `https://${business.domain || 'teststore.com'}/checkout`,
                    eventData: JSON.stringify({ order_id: 'test-order-123', total: 99.99 })
                }
            ];

            // Insert test events
            for (const event of testEvents) {
                const sessionId = `test-session-${Date.now()}`;
                await sql`
                    INSERT INTO tracking_events (
                        "eventType",
                        "businessId",
                        "affiliateId",
                        platform,
                        "sessionId",
                        "userAgent",
                        referrer,
                        timestamp,
                        url,
                        "eventData",
                        "ipAddress"
                    ) VALUES (
                        ${event.eventType},
                        ${business.id},
                        ${business.affiliateId},
                        'test',
                        ${sessionId},
                        'Test User Agent',
                        'https://paaav.vercel.app',
                        NOW(),
                        ${event.url},
                        ${event.eventData},
                        '127.0.0.1'
                    )
                `;
            }

            res.json({
                success: true,
                message: `Created ${testEvents.length} test tracking events`,
                events: testEvents
            });
        } catch (dbError) {
            console.error('Database error in test tracking:', dbError);
            res.status(500).json({ 
                success: false, 
                error: "Database connection failed",
                details: dbError instanceof Error ? dbError.message : String(dbError)
            });
        }
    } catch (error) {
        console.error("Error creating test tracking events:", error);
        res.status(500).json({ success: false, error: "Failed to create test events" });
    }
});

// Update business profile (business can update their own profile)
app.put("/api/business/profile", async (req, res) => {
    try {
        // Check for business authentication
        let token = req.cookies.business_token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
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

        const {
            name,
            domain,
            email,
            phone,
            address,
            country,
            category,
            description
        } = req.body;

        // Validate required fields
        if (!name || !domain) {
            return res.status(400).json({
                success: false,
                error: "Business name and domain are required"
            });
        }

        // Try to update business profile
        try {
            const sql = getSql();
            
            // Check if domain is already taken by another business
            const existingBusiness = await sql`
                SELECT id FROM businesses 
                WHERE domain = ${domain} AND id != ${decoded.businessId}
            `;
            
            if (existingBusiness.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: "Domain is already taken by another business"
                });
            }

            // Update business profile
            const result = await sql`
                UPDATE businesses 
                SET 
                    name = ${name},
                    domain = ${domain},
                    email = ${email || null},
                    "contactPhone" = ${phone || null},
                    address = ${address || null},
                    country = ${country || null},
                    category = ${category || null},
                    description = ${description || null},
                    "updatedAt" = NOW()
                WHERE id = ${decoded.businessId}
                RETURNING id, name, domain, email, "contactPhone", address, country, category, description
            `;

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found"
                });
            }

            res.json({
                success: true,
                message: "Business profile updated successfully",
                business: result[0]
            });
        } catch (dbError) {
            console.error('Database error in business profile update:', dbError);
            res.status(500).json({ 
                success: false, 
                error: "Database connection failed",
                details: dbError instanceof Error ? dbError.message : String(dbError)
            });
        }
    } catch (error) {
        console.error("Error updating business profile:", error);
        res.status(500).json({ success: false, error: "Failed to update business profile" });
    }
});

// Export for Vercel
export default app;