import { RequestHandler } from "express";
import { prisma } from "../services/database";

export const trackEvent: RequestHandler = async (req, res) => {
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

        // Validate required fields
        if (!event_type || !business_id || !affiliate_id) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: event_type, business_id, affiliate_id"
            });
        }

        // Check if business exists
        const business = await prisma.business.findUnique({
            where: { id: parseInt(business_id) }
        });

        if (!business) {
            return res.status(400).json({
                success: false,
                error: "Business not found"
            });
        }

        // Create tracking event in database
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

        // Update business statistics based on event type
        if (event_type === 'purchase_click' || event_type === 'conversion') {
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

        res.json({
            success: true,
            message: "Event tracked successfully",
            event_id: trackingEvent.id
        });

    } catch (error) {
        console.error("Error tracking event:", error);
        res.status(500).json({
            success: false,
            error: "Failed to track event"
        });
    }
};

// Get tracking events for a business
export const getTrackingEvents: RequestHandler = async (req, res) => {
    try {
        const { business_id, limit = 100, offset = 0 } = req.query;

        if (!business_id) {
            return res.status(400).json({
                success: false,
                error: "business_id is required"
            });
        }

        const events = await prisma.trackingEvent.findMany({
            where: {
                businessId: parseInt(business_id as string)
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        res.json({
            success: true,
            events: events
        });

    } catch (error) {
        console.error("Error getting tracking events:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get tracking events"
        });
    }
}; 