import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Track affiliate link clicks
router.post('/click', async (req, res) => {
  try {
    const {
      productUrl,
      productTitle,
      productPrice,
      retailer,
      userId,
      sessionId,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    } = req.body;

    // Store click data in database
    const clickData = await prisma.affiliateClick.create({
      data: {
        productUrl,
        productTitle: productTitle || 'Unknown Product',
        productPrice: productPrice || '0',
        retailer: retailer || 'unknown',
        userId: userId || null,
        sessionId: sessionId || 'unknown',
        referrer: referrer || '',
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
      },
    });

    console.log('Affiliate click tracked:', {
      productUrl,
      retailer,
      sessionId,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    res.status(200).json({ success: true, clickId: clickData.id });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    res.status(500).json({ success: false, error: 'Failed to track click' });
  }
});

// Track conversions (purchases)
router.post('/conversion', async (req, res) => {
  try {
    const {
      productUrl,
      productTitle,
      productPrice,
      retailer,
      userId,
      sessionId,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    } = req.body;

    // Store conversion data in database
    const conversionData = await prisma.affiliateConversion.create({
      data: {
        productUrl,
        productTitle: productTitle || 'Unknown Product',
        productPrice: productPrice || '0',
        retailer: retailer || 'unknown',
        userId: userId || null,
        sessionId: sessionId || 'unknown',
        referrer: referrer || '',
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
      },
    });

    console.log('Affiliate conversion tracked:', {
      productUrl,
      retailer,
      sessionId,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    res.status(200).json({ success: true, conversionId: conversionData.id });
  } catch (error) {
    console.error('Error tracking affiliate conversion:', error);
    res.status(500).json({ success: false, error: 'Failed to track conversion' });
  }
});

// Get affiliate statistics
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate, retailer } = req.query;

    const whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    
    if (retailer) {
      whereClause.retailer = retailer;
    }

    // Get click statistics
    const clickStats = await prisma.affiliateClick.groupBy({
      by: ['retailer'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        productPrice: true,
      },
    });

    // Get conversion statistics
    const conversionStats = await prisma.affiliateConversion.groupBy({
      by: ['retailer'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        productPrice: true,
      },
    });

    // Calculate conversion rates
    const stats = clickStats.map(clickStat => {
      const conversionStat = conversionStats.find(
        conv => conv.retailer === clickStat.retailer
      );
      
      const conversionRate = conversionStat 
        ? (conversionStat._count.id / clickStat._count.id) * 100 
        : 0;

      return {
        retailer: clickStat.retailer,
        clicks: clickStat._count.id,
        conversions: conversionStat?._count.id || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue: conversionStat?._sum.productPrice || 0,
      };
    });

    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Error getting affiliate stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// Get UTM campaign performance
router.get('/utm-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Get UTM campaign statistics
    const utmStats = await prisma.affiliateClick.groupBy({
      by: ['utmSource', 'utmMedium', 'utmCampaign'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    const utmConversionStats = await prisma.affiliateConversion.groupBy({
      by: ['utmSource', 'utmMedium', 'utmCampaign'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Calculate conversion rates for UTM campaigns
    const stats = utmStats.map(utmStat => {
      const conversionStat = utmConversionStats.find(
        conv => 
          conv.utmSource === utmStat.utmSource &&
          conv.utmMedium === utmStat.utmMedium &&
          conv.utmCampaign === utmStat.utmCampaign
      );
      
      const conversionRate = conversionStat 
        ? (conversionStat._count.id / utmStat._count.id) * 100 
        : 0;

      return {
        utmSource: utmStat.utmSource,
        utmMedium: utmStat.utmMedium,
        utmCampaign: utmStat.utmCampaign,
        clicks: utmStat._count.id,
        conversions: conversionStat?._count.id || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    });

    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Error getting UTM stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get UTM stats' });
  }
});

export default router; 