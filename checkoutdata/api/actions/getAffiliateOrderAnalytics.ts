import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  try {
    // Parse parameters
    const businessDomain = params.businessDomain as string | undefined;
    const startDate = params.startDate ? new Date(params.startDate as string) : undefined;
    const endDate = params.endDate ? new Date(params.endDate as string) : undefined;
    const limit = params.limit ? Number(params.limit) : 100;

    // Build date filter for queries
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.greaterThanOrEqual = startDate;
      if (endDate) dateFilter.lessThanOrEqual = endDate;
    }

    // Get shop data
    let shopFilter: any = {};
    if (businessDomain) {
      shopFilter = {
        OR: [
          { domain: { equals: businessDomain } },
          { myshopifyDomain: { equals: businessDomain } }
        ]
      };
    }

    const shops = await api.shopifyShop.findMany({
      filter: shopFilter,
      select: {
        id: true,
        domain: true,
        name: true
      }
    });

    if (businessDomain && shops.length === 0) {
      return {
        success: false,
        error: "Business domain not found"
      };
    }

    const shopIds = shops.map(shop => shop.id);

    // Get all orders for the time period
    let orderFilter: any = {
      shopId: { in: shopIds }
    };
    if (Object.keys(dateFilter).length > 0) {
      orderFilter.createdAt = dateFilter;
    }

    const orders = await api.shopifyOrder.findMany({
      filter: orderFilter,
      first: limit,
      sort: { createdAt: "Descending" },
      select: {
        id: true,
        name: true,
        email: true,
        totalPrice: true,
        currency: true,
        financialStatus: true,
        fulfillmentStatus: true,
        createdAt: true,
        checkoutToken: true,
        sourceUrl: true,
        sourceName: true
      }
    });

    // Get all referrals for the time period
    let referralFilter: any = {
      shopId: { in: shopIds }
    };
    if (Object.keys(dateFilter).length > 0) {
      referralFilter.clickedAt = dateFilter;
    }

    const referrals = await api.businessReferral.findMany({
      filter: referralFilter,
      first: limit,
      sort: { clickedAt: "Descending" },
      select: {
        id: true,
        referralId: true,
        businessDomain: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        conversionStatus: true,
        conversionValue: true,
        clickedAt: true,
        targetUrl: true,
        sourceUrl: true
      }
    });

    // Enhanced affiliate order detection and analysis
    const affiliateOrders: any[] = [];
    const directOrders: any[] = [];
    const conversionMap = new Map(); // Map referral ID to order

    for (const order of orders) {
      let isAffiliateOrder = false;
      let matchedReferral = null;
      let detectionMethod = '';

      // Method 1: Check UTM parameters in sourceUrl
      if (order.sourceUrl) {
        try {
          const url = new URL(order.sourceUrl);
          const utmSource = url.searchParams.get('utm_source');
          const utmMedium = url.searchParams.get('utm_medium');
          const utmCampaign = url.searchParams.get('utm_campaign');
          
          if (utmSource === 'ipick' && utmMedium === 'suggestion' && utmCampaign === 'business_tracking') {
            isAffiliateOrder = true;
            detectionMethod = 'utm_parameters';
            console.log(`Order identified as affiliate through UTM parameters: ${order.id}`);
          }
        } catch (error) {
          // Invalid URL, continue with other methods
        }
      }

      // Method 2: Check converted referrals by timing
      if (!isAffiliateOrder) {
        const convertedReferrals = referrals.filter(r => r.conversionStatus === 'converted');
        const orderCreatedAt = new Date(order.createdAt);
        const timeWindowMs = 48 * 60 * 60 * 1000; // 48 hours
        
        for (const referral of convertedReferrals) {
          if (referral.clickedAt) {
            const timeDiff = orderCreatedAt.getTime() - new Date(referral.clickedAt).getTime();
            if (timeDiff >= 0 && timeDiff <= timeWindowMs) {
              isAffiliateOrder = true;
              matchedReferral = referral;
              detectionMethod = 'timing_match';
              conversionMap.set(referral.id, order.id);
              console.log(`Order matched to affiliate referral by timing: ${order.id}, referral: ${referral.id}, timeDiff: ${Math.round(timeDiff / (1000 * 60 * 60))}h`);
              break;
            }
          }
        }
      }

      // Method 3: Check source name for affiliate indicators
      if (!isAffiliateOrder && order.sourceName) {
        const sourceName = order.sourceName.toLowerCase();
        if (sourceName.includes('ipick') || sourceName.includes('pavlo') || sourceName.includes('price comparison')) {
          isAffiliateOrder = true;
          detectionMethod = 'source_name';
          console.log(`Order identified as affiliate through source name: ${order.id}, source: ${order.sourceName}`);
        }
      }

      // Categorize the order
      if (isAffiliateOrder) {
        affiliateOrders.push({
          ...order,
          isAffiliateOrder: true,
          matchedReferral: matchedReferral,
          detectionMethod: detectionMethod
        });
      } else {
        directOrders.push({
          ...order,
          isAffiliateOrder: false
        });
      }
    }

    // Calculate comprehensive analytics
    const totalOrders = orders.length;
    const affiliateOrderCount = affiliateOrders.length;
    const directOrderCount = directOrders.length;
    const affiliatePercentage = totalOrders > 0 ? (affiliateOrderCount / totalOrders) * 100 : 0;

    // Revenue calculations
    const totalRevenue = orders.reduce((sum, order) => {
      const price = parseFloat(order.totalPrice || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    const affiliateRevenue = affiliateOrders.reduce((sum, order) => {
      const price = parseFloat(order.totalPrice || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    const directRevenue = directOrders.reduce((sum, order) => {
      const price = parseFloat(order.totalPrice || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    // Referral conversion analysis
    const totalReferrals = referrals.length;
    const convertedReferrals = referrals.filter(r => r.conversionStatus === 'converted');
    const pendingReferrals = referrals.filter(r => r.conversionStatus === 'pending');
    const abandonedReferrals = referrals.filter(r => r.conversionStatus === 'abandoned');

    const conversionRate = totalReferrals > 0 ? (convertedReferrals.length / totalReferrals) * 100 : 0;
    const abandonmentRate = totalReferrals > 0 ? (abandonedReferrals.length / totalReferrals) * 100 : 0;

    // Average order values
    const affiliateAOV = affiliateOrderCount > 0 ? affiliateRevenue / affiliateOrderCount : 0;
    const directAOV = directOrderCount > 0 ? directRevenue / directOrderCount : 0;
    const overallAOV = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Detection method breakdown
    const detectionMethods = {
      utm_parameters: affiliateOrders.filter(o => o.detectionMethod === 'utm_parameters').length,
      timing_match: affiliateOrders.filter(o => o.detectionMethod === 'timing_match').length,
      source_name: affiliateOrders.filter(o => o.detectionMethod === 'source_name').length
    };

    // Time-based analysis
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentAffiliateOrders = affiliateOrders.filter(o => new Date(o.createdAt) >= last7Days);
    const recentDirectOrders = directOrders.filter(o => new Date(o.createdAt) >= last7Days);

    const monthlyAffiliateOrders = affiliateOrders.filter(o => new Date(o.createdAt) >= last30Days);
    const monthlyDirectOrders = directOrders.filter(o => new Date(o.createdAt) >= last30Days);

    // Return comprehensive analytics
    return {
      success: true,
      data: {
        summary: {
          totalOrders,
          affiliateOrderCount,
          directOrderCount,
          affiliatePercentage: Math.round(affiliatePercentage * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          affiliateRevenue: Math.round(affiliateRevenue * 100) / 100,
          directRevenue: Math.round(directRevenue * 100) / 100,
          currency: orders[0]?.currency || 'EUR'
        },
        conversionMetrics: {
          totalReferrals,
          convertedReferrals: convertedReferrals.length,
          pendingReferrals: pendingReferrals.length,
          abandonedReferrals: abandonedReferrals.length,
          conversionRate: Math.round(conversionRate * 100) / 100,
          abandonmentRate: Math.round(abandonmentRate * 100) / 100
        },
        averageOrderValues: {
          affiliateAOV: Math.round(affiliateAOV * 100) / 100,
          directAOV: Math.round(directAOV * 100) / 100,
          overallAOV: Math.round(overallAOV * 100) / 100
        },
        detectionMethods,
        timeBasedAnalysis: {
          last7Days: {
            affiliateOrders: recentAffiliateOrders.length,
            directOrders: recentDirectOrders.length,
            affiliateRevenue: Math.round(recentAffiliateOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || '0'), 0) * 100) / 100
          },
          last30Days: {
            affiliateOrders: monthlyAffiliateOrders.length,
            directOrders: monthlyDirectOrders.length,
            affiliateRevenue: Math.round(monthlyAffiliateOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || '0'), 0) * 100) / 100
          }
        },
        affiliateOrders: affiliateOrders.map(order => ({
          id: order.id,
          name: order.name,
          email: order.email,
          totalPrice: order.totalPrice,
          currency: order.currency,
          createdAt: order.createdAt,
          detectionMethod: order.detectionMethod,
          matchedReferral: order.matchedReferral ? {
            id: order.matchedReferral.id,
            referralId: order.matchedReferral.referralId,
            utmSource: order.matchedReferral.utmSource,
            utmMedium: order.matchedReferral.utmMedium,
            utmCampaign: order.matchedReferral.utmCampaign,
            clickedAt: order.matchedReferral.clickedAt
          } : null
        })),
        directOrders: directOrders.map(order => ({
          id: order.id,
          name: order.name,
          email: order.email,
          totalPrice: order.totalPrice,
          currency: order.currency,
          createdAt: order.createdAt,
          sourceUrl: order.sourceUrl,
          sourceName: order.sourceName
        }))
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: {
          businessDomain,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          limit
        }
      }
    };

  } catch (error) {
    console.error("Error generating affiliate order analytics:", error);
    return {
      success: false,
      error: "Failed to generate affiliate order analytics"
    };
  }
};

export const params = {
  businessDomain: { type: "string" },
  startDate: { type: "string" },
  endDate: { type: "string" },
  limit: { type: "number" }
};

export const options: ActionOptions = {
  returnType: true
};
