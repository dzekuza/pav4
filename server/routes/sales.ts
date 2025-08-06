import express from 'express';
import { PrismaClient, SaleStatus, CommissionStatus } from '@prisma/client';
import SalesTrackingService, { SaleData } from '../services/sales-tracking';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { requireBusinessAuth } from '../middleware/business-auth';

// Extend Express Request interface to include business property
declare global {
  namespace Express {
    interface Request {
      business?: {
        id: number;
        name: string;
        domain: string;
        email: string;
      };
    }
  }
}

const router = express.Router();
const prisma = new PrismaClient();

// Track a new sale (can be called by external systems)
router.post('/track', async (req, res) => {
    try {
        const saleData: SaleData = req.body;

        // Validate required fields
        if (!saleData.orderId || !saleData.businessId || !saleData.productUrl || !saleData.productPrice) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: orderId, businessId, productUrl, productPrice'
            });
        }

        const sale = await SalesTrackingService.trackSale(saleData);

        res.status(200).json({
            success: true,
            saleId: sale.id,
            orderId: sale.orderId,
            commissionAmount: sale.commissionAmount
        });
    } catch (error) {
        console.error('Error tracking sale:', error);
        res.status(500).json({ success: false, error: 'Failed to track sale' });
    }
});

// Update sale status
router.put('/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!status || !Object.values(SaleStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: PENDING, CONFIRMED, CANCELLED, REFUNDED'
            });
        }

        const sale = await SalesTrackingService.updateSaleStatus(orderId, status);

        res.status(200).json({
            success: true,
            orderId: sale.orderId,
            status: sale.status
        });
    } catch (error) {
        console.error('Error updating sale status:', error);
        res.status(500).json({ success: false, error: 'Failed to update sale status' });
    }
});

// Mark commission as paid
router.put('/commission/paid/:saleId', requireAuth, async (req, res) => {
    try {
        const { saleId } = req.params;
        const saleIdNum = parseInt(saleId);

        if (isNaN(saleIdNum)) {
            return res.status(400).json({ success: false, error: 'Invalid sale ID' });
        }

        const sale = await SalesTrackingService.markCommissionPaid(saleIdNum);

        res.status(200).json({
            success: true,
            saleId: sale.id,
            commissionPaid: sale.commissionPaid
        });
    } catch (error) {
        console.error('Error marking commission paid:', error);
        res.status(500).json({ success: false, error: 'Failed to mark commission paid' });
    }
});

// Get business sales statistics
router.get('/stats/business/:businessId', requireBusinessAuth, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { startDate, endDate } = req.query;

        const businessIdNum = parseInt(businessId);
        if (isNaN(businessIdNum)) {
            return res.status(400).json({ success: false, error: 'Invalid business ID' });
        }

        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const stats = await SalesTrackingService.getBusinessSalesStats(businessIdNum, start, end);

        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error('Error getting business sales stats:', error);
        res.status(500).json({ success: false, error: 'Failed to get sales statistics' });
    }
});

// Get user commission statistics
router.get('/stats/commissions', requireAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user!.id;

        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const stats = await SalesTrackingService.getUserCommissionStats(userId, start, end);

        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error('Error getting user commission stats:', error);
        res.status(500).json({ success: false, error: 'Failed to get commission statistics' });
    }
});

// Get all sales for a business (with pagination)
router.get('/business/:businessId', requireBusinessAuth, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        const businessIdNum = parseInt(businessId);
        if (isNaN(businessIdNum)) {
            return res.status(400).json({ success: false, error: 'Invalid business ID' });
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const whereClause: any = { businessId };
        if (status && Object.values(SaleStatus).includes(status as SaleStatus)) {
            whereClause.status = status;
        }

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: { id: true, email: true }
                    },
                    commissions: true
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limitNum
            }),
            prisma.sale.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            sales,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error getting business sales:', error);
        res.status(500).json({ success: false, error: 'Failed to get sales' });
    }
});

// Get user's commissions
router.get('/commissions', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const userId = req.user!.id;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const whereClause: any = { userId };
        if (status && Object.values(CommissionStatus).includes(status as CommissionStatus)) {
            whereClause.status = status;
        }

        const [commissions, total] = await Promise.all([
            prisma.commission.findMany({
                where: whereClause,
                include: {
                    sale: {
                        include: {
                            business: {
                                select: { name: true, domain: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limitNum
            }),
            prisma.commission.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            commissions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error getting user commissions:', error);
        res.status(500).json({ success: false, error: 'Failed to get commissions' });
    }
});

// Webhook management routes
router.post('/webhooks', requireBusinessAuth, async (req, res) => {
    try {
        const { url, secret, events } = req.body;
        const businessId = req.business!.id;

        if (!url || !secret || !events || !Array.isArray(events)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: url, secret, events (array)'
            });
        }

        const webhook = await prisma.webhook.create({
            data: {
                businessId,
                url,
                secret,
                events
            }
        });

        res.status(201).json({ success: true, webhook });
    } catch (error) {
        console.error('Error creating webhook:', error);
        res.status(500).json({ success: false, error: 'Failed to create webhook' });
    }
});

router.get('/webhooks', requireBusinessAuth, async (req, res) => {
    try {
        const businessId = req.business!.id;

        const webhooks = await prisma.webhook.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, webhooks });
    } catch (error) {
        console.error('Error getting webhooks:', error);
        res.status(500).json({ success: false, error: 'Failed to get webhooks' });
    }
});

router.put('/webhooks/:id', requireBusinessAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { url, secret, events, isActive } = req.body;
        const businessId = req.business!.id;

        const webhook = await prisma.webhook.update({
            where: {
                id: parseInt(id),
                businessId // Ensure business owns this webhook
            },
            data: {
                url,
                secret,
                events,
                isActive
            }
        });

        res.status(200).json({ success: true, webhook });
    } catch (error) {
        console.error('Error updating webhook:', error);
        res.status(500).json({ success: false, error: 'Failed to update webhook' });
    }
});

router.delete('/webhooks/:id', requireBusinessAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.business!.id;

        await prisma.webhook.delete({
            where: {
                id: parseInt(id),
                businessId // Ensure business owns this webhook
            }
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({ success: false, error: 'Failed to delete webhook' });
    }
});

// Commission rate management
router.post('/commission-rates', requireBusinessAuth, async (req, res) => {
    try {
        const { retailer, rate } = req.body;
        const businessId = req.business!.id;

        if (!retailer || typeof rate !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: retailer, rate'
            });
        }

        const commissionRate = await prisma.commissionRate.upsert({
            where: {
                businessId_retailer: {
                    businessId,
                    retailer
                }
            },
            update: { rate },
            create: {
                businessId,
                retailer,
                rate
            }
        });

        res.status(200).json({ success: true, commissionRate });
    } catch (error) {
        console.error('Error setting commission rate:', error);
        res.status(500).json({ success: false, error: 'Failed to set commission rate' });
    }
});

router.get('/commission-rates', requireBusinessAuth, async (req, res) => {
    try {
        const businessId = req.business!.id;

        const commissionRates = await prisma.commissionRate.findMany({
            where: { businessId },
            orderBy: { retailer: 'asc' }
        });

        res.status(200).json({ success: true, commissionRates });
    } catch (error) {
        console.error('Error getting commission rates:', error);
        res.status(500).json({ success: false, error: 'Failed to get commission rates' });
    }
});

// Admin routes for global sales overview
router.get('/admin/all-sales', requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, businessId, status } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const whereClause: any = {};
        if (businessId) whereClause.businessId = parseInt(businessId as string);
        if (status) whereClause.status = status;

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where: whereClause,
                include: {
                    business: {
                        select: { name: true, domain: true }
                    },
                    user: {
                        select: { id: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limitNum
            }),
            prisma.sale.count({ where: whereClause })
        ]);

        res.status(200).json({
            success: true,
            sales,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error getting all sales:', error);
        res.status(500).json({ success: false, error: 'Failed to get sales' });
    }
});

// Retry failed webhooks (admin only)
router.post('/admin/retry-webhooks', requireAdmin, async (req, res) => {
    try {
        await SalesTrackingService.retryFailedWebhooks();
        res.status(200).json({ success: true, message: 'Webhook retry process completed' });
    } catch (error) {
        console.error('Error retrying webhooks:', error);
        res.status(500).json({ success: false, error: 'Failed to retry webhooks' });
    }
});

export default router; 