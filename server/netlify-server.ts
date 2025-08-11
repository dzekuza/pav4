import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { neon } from '@netlify/neon';

// Load environment variables
dotenv.config();

// Create Neon SQL client
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

// Test database connection with retry logic
async function testDatabaseConnection() {
    try {
        console.log('Testing database connection with Neon...');
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

// Business service functions using Neon
const businessService = {
    async findBusinessByEmail(email: string) {
        try {
            const result = await sql`
                SELECT * FROM business 
                WHERE email = ${email}
            `;
            return result[0] || null;
        } catch (error) {
            console.error('Error finding business by email:', error);
            return null;
        }
    },

    async findBusinessById(id: number) {
        try {
            const result = await sql`
                SELECT * FROM business 
                WHERE id = ${id}
            `;
            return result[0] || null;
        } catch (error) {
            console.error('Error finding business by id:', error);
            return null;
        }
    },

    async createBusiness(data: any) {
        try {
            const result = await sql`
                INSERT INTO business (name, domain, website, email, password, affiliate_id, is_active, created_at, updated_at)
                VALUES (${data.name}, ${data.domain}, ${data.website}, ${data.email}, ${data.password}, ${data.affiliateId}, true, NOW(), NOW())
                RETURNING *
            `;
            return result[0] || null;
        } catch (error) {
            console.error('Error creating business:', error);
            return null;
        }
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
            const businessResult = await sql`
                SELECT id, name, domain, total_visits, total_purchases, total_revenue, commission, admin_commission_rate, affiliate_id, tracking_verified
                FROM business 
                WHERE id = ${businessId}
            `;
            
            const business = businessResult[0];
            console.log('Business found:', business);

            if (!business) {
                console.log('Business not found for ID:', businessId);
                return null;
            }

            // Get recent clicks and conversions
            const [clicks, conversions] = await Promise.all([
                sql`
                    SELECT * FROM business_click 
                    WHERE business_id = ${businessId}
                    ORDER BY timestamp DESC 
                    LIMIT 10
                `,
                sql`
                    SELECT * FROM business_conversion 
                    WHERE business_id = ${businessId}
                    ORDER BY timestamp DESC 
                    LIMIT 10
                `
            ]);

            console.log('Recent clicks count:', clicks.length);
            console.log('Recent conversions count:', conversions.length);

            // Calculate derived fields
            const averageOrderValue = business.total_purchases > 0 ? business.total_revenue / business.total_purchases : 0;
            const conversionRate = business.total_visits > 0 ? (business.total_purchases / business.total_visits) * 100 : 0;
            const projectedFee = business.total_revenue * (business.admin_commission_rate / 100);

            const result = {
                id: business.id,
                name: business.name,
                domain: business.domain,
                totalVisits: business.total_visits,
                totalPurchases: business.total_purchases,
                totalRevenue: business.total_revenue,
                commission: business.commission,
                adminCommissionRate: business.admin_commission_rate,
                affiliateId: business.affiliate_id,
                trackingVerified: business.tracking_verified,
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
            NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? "SET" : "NOT SET",
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
                // Test business query
                const businessResult = await sql`
                    SELECT id, name, email, domain 
                    FROM business 
                    WHERE id = 3
                `;
                const business = businessResult[0];
                
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

    // User authentication endpoints
    app.get("/api/auth/me", async (req, res) => {
        try {
            // Check for token in cookies or Authorization header
            let token = req.cookies.auth_token;
            
            if (!token) {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                }
            }

            if (!token) {
                // Return null user instead of 401 for unauthenticated requests
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

            // Handle both string and number user IDs
            const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;
            
            if (isNaN(userId)) {
                return res.json({
                    user: null,
                    authenticated: false
                });
            }

            const userResult = await sql`
                SELECT id, email, is_admin as "isAdmin"
                FROM users 
                WHERE id = ${userId}
            `;
            const user = userResult[0];
            
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
                    isAdmin: user.isAdmin,
                },
                authenticated: true
            });
        } catch (error) {
            console.error("Get current user error:", error);
            // Return null user instead of 500 error
            res.json({
                user: null,
                authenticated: false
            });
        }
    });

    // Helper function to generate JWT token for users
    function generateToken(userId: number): string {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
    }

    // Helper function to verify user token
    function verifyToken(token: string): { userId: number } | null {
        try {
            return jwt.verify(token, JWT_SECRET) as { userId: number };
        } catch {
            return null;
        }
    }

    // User registration endpoint
    app.post("/api/auth/register", async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "Email and password are required" });
            }

            if (password.length < 8) {
                return res
                    .status(400)
                    .json({ error: "Password must be at least 8 characters long" });
            }

            // Check for uppercase, lowercase, and number
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumber = /\d/.test(password);

            if (!hasUpperCase || !hasLowerCase || !hasNumber) {
                return res
                    .status(400)
                    .json({ 
                        error: "Password must contain uppercase, lowercase, and number",
                        details: [{
                            type: "field",
                            value: password,
                            msg: "Password must be at least 8 characters with uppercase, lowercase, and number",
                            path: "password",
                            location: "body"
                        }]
                    });
            }

            // Check if user already exists
            const existingUserResult = await sql`
                SELECT id FROM users WHERE email = ${email}
            `;
            if (existingUserResult.length > 0) {
                return res
                    .status(400)
                    .json({ error: "User with this email already exists" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create new user
            const userResult = await sql`
                INSERT INTO users (email, password, is_admin, created_at, updated_at)
                VALUES (${email}, ${hashedPassword}, false, NOW(), NOW())
                RETURNING id, email, is_admin as "isAdmin"
            `;
            const user = userResult[0];

            // Generate token
            const token = generateToken(user.id);

            res.cookie("auth_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.status(201).json({
                success: true,
                token: token,
                accessToken: token,
                user: {
                    id: user.id,
                    email: user.email,
                    isAdmin: user.isAdmin,
                },
            });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ error: "Failed to register user" });
        }
    });

    // User login endpoint
    app.post("/api/auth/login", async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "Email and password are required" });
            }

            // Find user by email
            const userResult = await sql`
                SELECT id, email, password, is_admin as "isAdmin"
                FROM users 
                WHERE email = ${email}
            `;
            const user = userResult[0];
            
            if (!user) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            // Generate token
            const token = generateToken(user.id);

            res.cookie("auth_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.json({
                success: true,
                token: token,
                accessToken: token,
                user: {
                    id: user.id,
                    email: user.email,
                    isAdmin: user.isAdmin,
                },
            });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ error: "Failed to login" });
        }
    });

    // User logout endpoint
    app.post("/api/auth/logout", (req, res) => {
        res.clearCookie("auth_token");
        res.json({ success: true });
    });

    // Search history endpoints
    app.post("/api/search-history", async (req, res) => {
        try {
            // Check for user authentication
            let token = req.cookies.auth_token;
            
            if (!token) {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
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

            const { query, results } = req.body;
            
            if (!query) {
                return res.status(400).json({ error: "Query is required" });
            }

            // Add to search history
            await sql`
                INSERT INTO user_search_history (user_id, query, results, created_at)
                VALUES (${decoded.userId}, ${query}, ${JSON.stringify(results || [])}, NOW())
            `;

            res.json({ success: true });
        } catch (error) {
            console.error("Error adding to search history:", error);
            res.status(500).json({ error: "Failed to add to search history" });
        }
    });

    app.get("/api/search-history", async (req, res) => {
        try {
            // Check for user authentication
            let token = req.cookies.auth_token;
            
            if (!token) {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
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

            // Get user's search history
            const historyResult = await sql`
                SELECT id, query, results, created_at as "createdAt"
                FROM user_search_history 
                WHERE user_id = ${decoded.userId}
                ORDER BY created_at DESC
                LIMIT 50
            `;

            res.json({ 
                success: true,
                history: historyResult.map(item => ({
                    id: item.id,
                    query: item.query,
                    results: item.results,
                    createdAt: item.createdAt
                }))
            });
        } catch (error) {
            console.error("Error getting search history:", error);
            res.status(500).json({ error: "Failed to get search history" });
        }
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
                    affiliateId: business.affiliate_id,
                    trackingVerified: business.tracking_verified,
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

            if (!business.is_active) {
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

    // Business registration endpoint
    app.post("/api/business/register", async (req, res) => {
        try {
            const { 
                name, 
                domain, 
                website, 
                email,
                password,
                description, 
                logo, 
                contactEmail, 
                contactPhone, 
                address, 
                country, 
                category, 
                commission 
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

            // Test database connection first
            const dbConnected = await testDatabaseConnection();
            if (!dbConnected) {
                return res.status(500).json({ 
                    success: false, 
                    error: "Database connection failed" 
                });
            }

            // Check if domain already exists
            const existingDomainResult = await sql`
                SELECT id FROM business WHERE domain = ${domain}
            `;
            if (existingDomainResult.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: "A business with this domain already exists" 
                });
            }

            // Check if email already exists
            const existingEmailResult = await sql`
                SELECT id FROM business WHERE email = ${email}
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

            // Create the business
            const result = await sql`
                INSERT INTO business (
                    name, domain, website, email, password, description, logo, 
                    contact_email, contact_phone, address, country, category, 
                    commission, affiliate_id, is_active, created_at, updated_at
                ) VALUES (
                    ${name}, ${domain}, ${website}, ${email}, ${hashedPassword}, 
                    ${description || ''}, ${logo || ''}, ${contactEmail || ''}, 
                    ${contactPhone || ''}, ${address || ''}, ${country || ''}, 
                    ${category || ''}, ${commission ? parseFloat(commission) : 0}, 
                    ${affiliateId}, true, NOW(), NOW()
                ) RETURNING id, name, domain, email, affiliate_id
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
                    affiliateId: business.affiliate_id,
                },
                message: "Business registered successfully. You can now log in with your email and password." 
            });

        } catch (error) {
            console.error("Error registering business:", error);
            res.status(500).json({ 
                success: false, 
                error: "Failed to register business",
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });

    // Business activity endpoints
    app.get("/api/business/activity/clicks", async (req, res) => {
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

            // Get click logs for this business
            const clicksResult = await sql`
                SELECT id, product_url as "productUrl", product_title as "productTitle", 
                       product_price as "productPrice", retailer, session_id as "sessionId",
                       referrer, utm_source as "utmSource", utm_medium as "utmMedium", 
                       utm_campaign as "utmCampaign", ip_address as "ipAddress", 
                       user_agent as "userAgent", timestamp
                FROM business_clicks 
                WHERE business_id = ${decoded.businessId}
                ORDER BY timestamp DESC
                LIMIT 100
            `;
            
            res.json({ success: true, clicks: clicksResult });
        } catch (error) {
            console.error("Error getting business clicks:", error);
            res.status(500).json({ success: false, error: "Failed to get business clicks" });
        }
    });

    app.get("/api/business/activity/conversions", async (req, res) => {
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

            // Get conversions for this business
            const conversionsResult = await sql`
                SELECT id, product_url as "productUrl", product_title as "productTitle", 
                       product_price as "productPrice", retailer, session_id as "sessionId",
                       referrer, utm_source as "utmSource", utm_medium as "utmMedium", 
                       utm_campaign as "utmCampaign", ip_address as "ipAddress", 
                       user_agent as "userAgent", timestamp
                FROM business_conversions 
                WHERE business_id = ${decoded.businessId}
                ORDER BY timestamp DESC
                LIMIT 100
            `;
            
            res.json({ success: true, conversions: conversionsResult });
        } catch (error) {
            console.error("Error getting business conversions:", error);
            res.status(500).json({ success: false, error: "Failed to get business conversions" });
        }
    });

    app.get("/api/business/activity/events", async (req, res) => {
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
            const eventsResult = await sql`
                SELECT id, event_type as "eventType", platform, session_id as "sessionId",
                       user_agent as "userAgent", referrer, timestamp, url, event_data as "eventData",
                       ip_address as "ipAddress"
                FROM tracking_event 
                WHERE business_id = ${decoded.businessId}
                ORDER BY timestamp DESC
                LIMIT 100
            `;
            
            res.json({ success: true, events: eventsResult });
        } catch (error) {
            console.error("Error getting business events:", error);
            res.status(500).json({ success: false, error: "Failed to get business events" });
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
                    error: "Missing requiredd fields: event_type, business_id, affiliate_id"
                });
            }

            // Test database connection first
            console.log('Testing database connection...');
            const dbConnected = await testDatabaseConnection();

            if (dbConnected) {
                // Database is available - try to save the event
                try {
                    console.log('Creating tracking event in database...');
                    const result = await sql`
                        INSERT INTO tracking_event (
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
                    note: "Database not available - check NETLIFY_DATABASE_URL environment variable"
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