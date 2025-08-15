import { ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

// Interface for journey objects matching Gadget API response
interface JourneyEvent {
  id: string;
  sessionId: string;
  eventType: string;
  timestamp: string | Date;
  pageUrl?: string | null;
  utmSource?: string | null;
  businessReferral?: {
    id?: string;
    referralId?: string;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
  } | null;
  cartValue?: number | null;
  deviceType?: string | null;
  browserName?: string | null;
  country?: string | null;
  email?: string | null;
  orderId?: string | null;
  productId?: string | null;
  productName?: string | null;
  productPrice?: number | null;
  discountCode?: string | null;
  discountValue?: number | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  ipAddress?: string | null;
  referrerUrl?: string | null;
  pageTitle?: string | null;
}

interface SessionEvents {
  [key: string]: JourneyEvent[];
}

// Helper function to calculate customer journey analytics
const calculateJourneyAnalytics = (journeys: JourneyEvent[], logger: any) => {
  try {
    // Group journeys by session
    const sessionMap = new Map<string, JourneyEvent[]>();
    journeys.forEach((journey: JourneyEvent) => {
      if (!sessionMap.has(journey.sessionId)) {
        sessionMap.set(journey.sessionId, []);
      }
      sessionMap.get(journey.sessionId)!.push(journey);
    });

    // Calculate basic metrics
    const totalSessions = sessionMap.size;
    const totalPageViews = journeys.filter((j: JourneyEvent) => j.eventType === 'page_view').length;
    const totalVisits = journeys.filter((j: JourneyEvent) => j.eventType === 'visit').length;
    const totalPurchases = journeys.filter((j: JourneyEvent) => j.eventType === 'purchase').length;

    // Calculate bounce rate (sessions with only 1 event)
    const bouncedSessions = Array.from(sessionMap.values()).filter((session: JourneyEvent[]) => session.length === 1).length;
    const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

    // Calculate conversion rate (visits to purchases)
    const conversionRate = totalVisits > 0 ? (totalPurchases / totalVisits) * 100 : 0;

    // Calculate average session duration
    let totalSessionDuration = 0;
    let sessionsWithDuration = 0;

    sessionMap.forEach((sessionEvents: JourneyEvent[]) => {
      if (sessionEvents.length > 1) {
        const sortedEvents = sessionEvents.sort((a: JourneyEvent, b: JourneyEvent) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        const duration = new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime();
        totalSessionDuration += duration;
        sessionsWithDuration++;
      }
    });

    const avgSessionDuration = sessionsWithDuration > 0 ? 
      Math.round(totalSessionDuration / sessionsWithDuration / 1000) : 0; // in seconds

    // Get top entry pages
    const entryPages = new Map<string, number>();
    sessionMap.forEach((sessionEvents: JourneyEvent[]) => {
      const sortedEvents = sessionEvents
        .filter((e: JourneyEvent) => e.eventType === 'page_view' && e.pageUrl)
        .sort((a: JourneyEvent, b: JourneyEvent) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      if (sortedEvents.length > 0) {
        const entryPage = sortedEvents[0].pageUrl;
        if (entryPage) {
          entryPages.set(entryPage, (entryPages.get(entryPage) || 0) + 1);
        }
      }
    });

    const topEntryPages = Array.from(entryPages.entries())
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 10)
      .map(([url, count]) => ({ url, sessions: count }));

    // iPick referral journey performance
    const ipickJourneys = journeys.filter((j: JourneyEvent) => 
      (j.utmSource && j.utmSource.toLowerCase().includes('ipick')) || 
      (j.businessReferral?.utmSource && j.businessReferral.utmSource.toLowerCase().includes('ipick'))
    );

    const ipickSessions = new Set(ipickJourneys.map((j: JourneyEvent) => j.sessionId)).size;
    const ipickPurchases = ipickJourneys.filter((j: JourneyEvent) => j.eventType === 'purchase').length;
    const ipickConversionRate = ipickSessions > 0 ? (ipickPurchases / ipickSessions) * 100 : 0;

    // Calculate revenue from journeys
    const journeyRevenue = journeys
      .filter((j: JourneyEvent) => j.eventType === 'purchase' && j.cartValue !== null && j.cartValue !== undefined)
      .reduce((sum: number, j: JourneyEvent) => sum + (j.cartValue || 0), 0);

    const ipickRevenue = ipickJourneys
      .filter((j: JourneyEvent) => j.eventType === 'purchase' && j.cartValue !== null && j.cartValue !== undefined)
      .reduce((sum: number, j: JourneyEvent) => sum + (j.cartValue || 0), 0);

    // Event type breakdown
    const eventBreakdown = journeys.reduce((acc: Record<string, number>, j: JourneyEvent) => {
      acc[j.eventType] = (acc[j.eventType] || 0) + 1;
      return acc;
    }, {});

    // Device and browser analytics
    const deviceBreakdown = journeys
      .filter((j: JourneyEvent) => j.deviceType !== null && j.deviceType !== undefined)
      .reduce((acc: Record<string, number>, j: JourneyEvent) => {
        if (j.deviceType) {
          acc[j.deviceType] = (acc[j.deviceType] || 0) + 1;
        }
        return acc;
      }, {});

    const browserBreakdown = journeys
      .filter((j: JourneyEvent) => j.browserName !== null && j.browserName !== undefined)
      .reduce((acc: Record<string, number>, j: JourneyEvent) => {
        if (j.browserName) {
          acc[j.browserName] = (acc[j.browserName] || 0) + 1;
        }
        return acc;
      }, {});

    // Geographic breakdown
    const countryBreakdown = journeys
      .filter((j: JourneyEvent) => j.country !== null && j.country !== undefined)
      .reduce((acc: Record<string, number>, j: JourneyEvent) => {
        if (j.country) {
          acc[j.country] = (acc[j.country] || 0) + 1;
        }
        return acc;
      }, {});

    // Conversion funnel
    const funnelData = {
      visits: totalVisits,
      pageViews: totalPageViews,
      addToCart: journeys.filter((j: JourneyEvent) => j.eventType === 'add_to_cart').length,
      checkoutStart: journeys.filter((j: JourneyEvent) => j.eventType === 'checkout_start').length,
      checkoutComplete: journeys.filter((j: JourneyEvent) => j.eventType === 'checkout_complete').length,
      purchases: totalPurchases
    };

    return {
      summary: {
        totalSessions,
        totalPageViews,
        totalVisits,
        totalPurchases,
        bounceRate: Math.round(bounceRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgSessionDuration: avgSessionDuration,
        journeyRevenue: Math.round(journeyRevenue * 100) / 100
      },
      ipickPerformance: {
        sessions: ipickSessions,
        purchases: ipickPurchases,
        conversionRate: Math.round(ipickConversionRate * 100) / 100,
        revenue: Math.round(ipickRevenue * 100) / 100
      },
      topEntryPages,
      conversionFunnel: funnelData,
      eventBreakdown,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
      sessionsOverTime: calculateSessionsOverTime(journeys),
      referralJourneyStats: calculateReferralJourneyStats(journeys)
    };
  } catch (error) {
    logger.error("Error calculating journey analytics:", error);
    return {
      summary: {
        totalSessions: 0,
        totalPageViews: 0,
        totalVisits: 0,
        totalPurchases: 0,
        bounceRate: 0,
        conversionRate: 0,
        avgSessionDuration: 0,
        journeyRevenue: 0
      },
      error: "Failed to calculate journey analytics"
    };
  }
};

// Helper function to calculate sessions over time
const calculateSessionsOverTime = (journeys: JourneyEvent[]) => {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const recent7Days = journeys.filter((j: JourneyEvent) => new Date(j.timestamp) >= last7Days);
  const recent30Days = journeys.filter((j: JourneyEvent) => new Date(j.timestamp) >= last30Days);

  const sessions7Days = new Set(recent7Days.map((j: JourneyEvent) => j.sessionId)).size;
  const sessions30Days = new Set(recent30Days.map((j: JourneyEvent) => j.sessionId)).size;

  return {
    last7Days: {
      sessions: sessions7Days,
      pageViews: recent7Days.filter((j: JourneyEvent) => j.eventType === 'page_view').length,
      purchases: recent7Days.filter((j: JourneyEvent) => j.eventType === 'purchase').length
    },
    last30Days: {
      sessions: sessions30Days,
      pageViews: recent30Days.filter((j: JourneyEvent) => j.eventType === 'page_view').length,
      purchases: recent30Days.filter((j: JourneyEvent) => j.eventType === 'purchase').length
    }
  };
};

// Helper function to calculate referral journey statistics
const calculateReferralJourneyStats = (journeys: JourneyEvent[]) => {
  const referralJourneys = journeys.filter((j: JourneyEvent) => j.businessReferral);
  const referralSources = referralJourneys.reduce((acc: Record<string, { sessions: Set<string>; purchases: number; revenue: number }>, j: JourneyEvent) => {
    const source = j.utmSource || 'unknown';
    if (!acc[source]) {
      acc[source] = { sessions: new Set<string>(), purchases: 0, revenue: 0 };
    }
    acc[source].sessions.add(j.sessionId);
    if (j.eventType === 'purchase') {
      acc[source].purchases++;
      acc[source].revenue += j.cartValue || 0;
    }
    return acc;
  }, {});

  // Convert sessions Set to count and format the data
  const formattedSources = Object.entries(referralSources).map(([source, data]) => ({
    source,
    sessions: data.sessions.size,
    purchases: data.purchases,
    revenue: Math.round(data.revenue * 100) / 100,
    conversionRate: data.sessions.size > 0 ? Math.round((data.purchases / data.sessions.size) * 10000) / 100 : 0
  }));

  return {
    totalReferralSessions: new Set(referralJourneys.map((j: JourneyEvent) => j.sessionId)).size,
    sourceBreakdown: formattedSources.sort((a, b) => b.sessions - a.sessions)
  };
};

export const run: ActionRun = async ({ params, logger, api, connections, session }) => {
  try {
    // Parse parameters with proper type checking
    const businessDomain = typeof params.businessDomain === 'string' ? params.businessDomain : undefined;
    const startDate = typeof params.startDate === 'string' && params.startDate ? new Date(params.startDate) : undefined;
    const endDate = typeof params.endDate === 'string' && params.endDate ? new Date(params.endDate) : undefined;
    const limit = typeof params.limit === 'number' && params.limit > 0 ? params.limit : 100;

    // Build date filter for queries
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.greaterThanOrEqual = startDate;
      if (endDate) dateFilter.lessThanOrEqual = endDate;
    }

    // Get shop data - use proper Gadget API patterns
    let shops;
    
    // For authenticated Shopify merchants, use their shop from session
    if (session && (session as any).shopId) {
      const shop = await api.shopifyShop.findFirst({
        filter: { id: { equals: (session as any).shopId } },
        select: {
          id: true,
          domain: true,
          myshopifyDomain: true,
          name: true,
          email: true,
          currency: true,
          planName: true,
          createdAt: true
        }
      });
      
      if (!shop) {
        return {
          success: false,
          error: "Shop not found for authenticated session"
        };
      }
      
      shops = [shop];
    } else {
      // For unauthenticated requests, find shops by domain
      let shopFilter: any = {};
      if (businessDomain) {
        shopFilter = {
          OR: [
            { domain: { equals: businessDomain } },
            { myshopifyDomain: { equals: businessDomain } }
          ]
        };
      }

      shops = await api.shopifyShop.findMany({
        filter: shopFilter,
        select: {
          id: true,
          domain: true,
          myshopifyDomain: true,
          name: true,
          email: true,
          currency: true,
          planName: true,
          createdAt: true
        }
      });

      if (businessDomain && shops.length === 0) {
        return {
          success: false,
          error: "Business domain not found"
        };
      }
    }

    const shopIds = shops.map(shop => shop.id);

    // Get checkout data with proper field selection
    let checkoutFilter: any = {
      shopId: { in: shopIds }
    };
    if (Object.keys(dateFilter).length > 0) {
      checkoutFilter.createdAt = dateFilter;
    }

    const checkouts = await api.shopifyCheckout.findMany({
      filter: checkoutFilter,
      first: limit,
      sort: { createdAt: "Descending" },
      select: {
        id: true,
        email: true,
        totalPrice: true,
        currency: true,
        createdAt: true,
        completedAt: true,
        sourceUrl: true,
        sourceName: true,
        name: true,
        token: true,
        processingStatus: true
      }
    });

    // Get order data with proper field selection
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

    // Get referral data with proper field selection
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

    // Get customer journey data with proper field selection
    let journeyFilter: any = {
      shopId: { in: shopIds }
    };
    if (Object.keys(dateFilter).length > 0) {
      journeyFilter.timestamp = dateFilter;
    }

    const customerJourneys = await api.customerJourney.findMany({
      filter: journeyFilter,
      first: 250, // Use max limit for journey data
      sort: { timestamp: "Descending" },
      select: {
        id: true,
        sessionId: true,
        eventType: true,
        pageUrl: true,
        pageTitle: true,
        timestamp: true,
        email: true,
        orderId: true,
        cartValue: true,
        productId: true,
        productName: true,
        productPrice: true,
        discountCode: true,
        discountValue: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        country: true,
        browserName: true,
        deviceType: true,
        ipAddress: true,
        referrerUrl: true,
        businessReferral: {
          id: true,
          referralId: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true
        }
      }
    });

    // Enhanced affiliate order detection
    const affiliateOrders: any[] = [];
    const directOrders: any[] = [];

    for (const order of orders) {
      let isAffiliateOrder = false;
      let matchedReferral = null;

      // Method 1: Check if order has UTM parameters in sourceUrl
      if (order.sourceUrl && typeof order.sourceUrl === 'string') {
        try {
          const url = new URL(order.sourceUrl);
          const utmSource = url.searchParams.get('utm_source');
          const utmMedium = url.searchParams.get('utm_medium');
          const utmCampaign = url.searchParams.get('utm_campaign');
          
          if (utmSource === 'ipick' && utmMedium === 'suggestion' && utmCampaign === 'business_tracking') {
            isAffiliateOrder = true;
            console.log(`Order identified as affiliate through UTM parameters: ${order.id}`);
          }
        } catch (error) {
          // Invalid URL, continue with other methods
        }
      }

      // Method 2: Check if order has a matching converted referral
      if (!isAffiliateOrder) {
        const convertedReferrals = referrals.filter(r => r.conversionStatus === 'converted');
        
        // Try to match by timing (within 48 hours)
        const orderCreatedAt = new Date(order.createdAt);
        const timeWindowMs = 48 * 60 * 60 * 1000; // 48 hours
        
        for (const referral of convertedReferrals) {
          if (referral.clickedAt && typeof referral.clickedAt === 'string') {
            const timeDiff = orderCreatedAt.getTime() - new Date(referral.clickedAt).getTime();
            if (timeDiff >= 0 && timeDiff <= timeWindowMs) {
              isAffiliateOrder = true;
              matchedReferral = referral;
              console.log(`Order matched to affiliate referral by timing: ${order.id}, referral: ${referral.id}, timeDiff: ${Math.round(timeDiff / (1000 * 60 * 60))}h`);
              break;
            }
          }
        }
      }

      // Method 3: Check if order has affiliate indicators in sourceName
      if (!isAffiliateOrder && order.sourceName && typeof order.sourceName === 'string') {
        const sourceName = order.sourceName.toLowerCase();
        if (sourceName.includes('ipick') || sourceName.includes('pavlo') || sourceName.includes('price comparison')) {
          isAffiliateOrder = true;
          console.log(`Order identified as affiliate through source name: ${order.id}, source: ${order.sourceName}`);
        }
      }

      // Categorize the order
      if (isAffiliateOrder) {
        affiliateOrders.push({
          ...order,
          isAffiliateOrder: true,
          matchedReferral: matchedReferral
        });
      } else {
        directOrders.push({
          ...order,
          isAffiliateOrder: false
        });
      }
    }

    // Calculate metrics
    const totalCheckouts = checkouts.length;
    const completedCheckouts = checkouts.filter(c => c.completedAt).length;
    const totalOrders = orders.length;
    const affiliateOrderCount = affiliateOrders.length;
    const directOrderCount = directOrders.length;
    const conversionRate = totalCheckouts > 0 ? (completedCheckouts / totalCheckouts) * 100 : 0;

    // Calculate revenue breakdown
    const totalRevenue = orders.reduce((sum, order) => {
      const priceStr = order.totalPrice && typeof order.totalPrice === 'string' ? order.totalPrice : '0';
      const price = parseFloat(priceStr);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    const affiliateRevenue = affiliateOrders.reduce((sum, order) => {
      const priceStr = order.totalPrice && typeof order.totalPrice === 'string' ? order.totalPrice : '0';
      const price = parseFloat(priceStr);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    const directRevenue = directOrders.reduce((sum, order) => {
      const priceStr = order.totalPrice && typeof order.totalPrice === 'string' ? order.totalPrice : '0';
      const price = parseFloat(priceStr);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    // Referral statistics
    const ipickReferrals = referrals.filter(r => 
      (r.utmSource && typeof r.utmSource === 'string' && r.utmSource.toLowerCase().includes('ipick'))
    );
    const totalReferrals = referrals.length;
    const ipickConversions = ipickReferrals.filter(r => r.conversionStatus === 'converted').length;
    const totalConversions = referrals.filter(r => r.conversionStatus === 'converted').length;

    // Revenue from referrals
    const referralRevenue = referrals
      .filter(r => r.conversionValue)
      .reduce((sum, r) => sum + (r.conversionValue || 0), 0);

    // Group data by time periods for trends
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentCheckouts = checkouts.filter(c => new Date(c.createdAt) >= last30Days);
    const recentOrders = orders.filter(o => new Date(o.createdAt) >= last30Days);
    const weeklyCheckouts = checkouts.filter(c => new Date(c.createdAt) >= last7Days);
    const weeklyOrders = orders.filter(o => new Date(o.createdAt) >= last7Days);

    // Financial status breakdown
    const financialStatusBreakdown = orders.reduce((acc: any, order) => {
      const status = order.financialStatus || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Top referral sources
    const topSources = referrals.reduce((acc: Record<string, number>, r) => {
      const source = (r.utmSource && typeof r.utmSource === 'string') ? r.utmSource : 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Calculate customer journey analytics - transform the API response to match our interface
    const transformedJourneys: JourneyEvent[] = customerJourneys.map(journey => ({
      id: journey.id,
      sessionId: journey.sessionId,
      eventType: journey.eventType,
      timestamp: journey.timestamp || new Date(),
      pageUrl: journey.pageUrl,
      utmSource: journey.utmSource,
      businessReferral: journey.businessReferral,
      cartValue: journey.cartValue,
      deviceType: journey.deviceType,
      browserName: journey.browserName,
      country: journey.country,
      email: journey.email,
      orderId: journey.orderId,
      productId: journey.productId,
      productName: journey.productName,
      productPrice: journey.productPrice,
      discountCode: journey.discountCode,
      discountValue: journey.discountValue,
      utmMedium: journey.utmMedium,
      utmCampaign: journey.utmCampaign,
      ipAddress: journey.ipAddress,
      referrerUrl: journey.referrerUrl,
      pageTitle: journey.pageTitle
    }));

    const journeyAnalytics = calculateJourneyAnalytics(transformedJourneys, logger);

    // Format response following Gadget best practices
    const response = {
      success: true,
      data: {
        summary: {
          totalBusinesses: shops.length,
          businessDomain: businessDomain || 'All Businesses',
          totalCheckouts,
          completedCheckouts,
          totalOrders,
          affiliateOrderCount,
          directOrderCount,
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          affiliateRevenue: Math.round(affiliateRevenue * 100) / 100,
          directRevenue: Math.round(directRevenue * 100) / 100,
          currency: orders[0]?.currency || 'EUR'
        },
        businesses: shops.map(shop => ({
          id: shop.id,
          domain: shop.domain,
          myshopifyDomain: shop.myshopifyDomain,
          name: shop.name,
          email: shop.email,
          currency: shop.currency,
          plan: shop.planName,
          createdAt: shop.createdAt
        })),
        recentCheckouts: checkouts.slice(0, 20).map(checkout => ({
          id: checkout.id,
          email: checkout.email,
          totalPrice: checkout.totalPrice,
          currency: checkout.currency,
          createdAt: checkout.createdAt,
          completedAt: checkout.completedAt,
          sourceUrl: checkout.sourceUrl,
          sourceName: checkout.sourceName,
          name: checkout.name,
          token: checkout.token,
          processingStatus: checkout.processingStatus,
          isIpickReferral: (checkout.sourceUrl && typeof checkout.sourceUrl === 'string' && checkout.sourceUrl.toLowerCase().includes('ipick')) || 
                          (checkout.sourceName && typeof checkout.sourceName === 'string' && checkout.sourceName.toLowerCase().includes('ipick'))
        })),
        recentOrders: orders.slice(0, 20).map(order => {
          // Check if this order is an affiliate order
          const isAffiliateOrder = affiliateOrders.some(ao => ao.id === order.id);
          const matchedReferral = isAffiliateOrder ? 
            affiliateOrders.find(ao => ao.id === order.id)?.matchedReferral : null;
          
          return {
            id: order.id,
            name: order.name,
            email: order.email,
            totalPrice: order.totalPrice,
            currency: order.currency,
            financialStatus: order.financialStatus,
            fulfillmentStatus: order.fulfillmentStatus,
            createdAt: order.createdAt,
            isAffiliateOrder: isAffiliateOrder,
            affiliateSource: matchedReferral?.utmSource || null,
            affiliateMedium: matchedReferral?.utmMedium || null,
            affiliateCampaign: matchedReferral?.utmCampaign || null,
            sourceUrl: order.sourceUrl,
            sourceName: order.sourceName
          };
        }),
        referralStatistics: {
          totalReferrals,
          ipickReferrals: ipickReferrals.length,
          ipickConversionRate: ipickReferrals.length > 0 ? 
            Math.round((ipickConversions / ipickReferrals.length) * 10000) / 100 : 0,
          totalConversions,
          referralRevenue: Math.round(referralRevenue * 100) / 100,
          topSources
        },
        trends: {
          last30Days: {
            checkouts: recentCheckouts.length,
            orders: recentOrders.length,
            revenue: recentOrders.reduce((sum, o) => {
              const priceStr = o.totalPrice && typeof o.totalPrice === 'string' ? o.totalPrice : '0';
              return sum + parseFloat(priceStr);
            }, 0)
          },
          last7Days: {
            checkouts: weeklyCheckouts.length,
            orders: weeklyOrders.length,
            revenue: weeklyOrders.reduce((sum, o) => {
              const priceStr = o.totalPrice && typeof o.totalPrice === 'string' ? o.totalPrice : '0';
              return sum + parseFloat(priceStr);
            }, 0)
          }
        },
        orderStatuses: financialStatusBreakdown,
        recentReferrals: referrals.slice(0, 10).map(referral => ({
          id: referral.id,
          referralId: referral.referralId,
          businessDomain: referral.businessDomain,
          source: referral.utmSource,
          medium: referral.utmMedium,
          campaign: referral.utmCampaign,
          conversionStatus: referral.conversionStatus,
          conversionValue: referral.conversionValue,
          clickedAt: referral.clickedAt,
          isIpick: referral.utmSource && typeof referral.utmSource === 'string' ? referral.utmSource.toLowerCase().includes('ipick') : false
        })),
        affiliateOrders: affiliateOrders.map(affiliateOrder => ({
          ...affiliateOrder,
          matchedReferral: affiliateOrder.matchedReferral ? {
            ...affiliateOrder.matchedReferral,
            clickedAt: affiliateOrder.matchedReferral.clickedAt
          } : null
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

    return response;
  } catch (error) {
    // Log error for debugging
    console.error("Error generating business dashboard:", error);
    return {
      success: false,
      error: "Failed to generate business dashboard analytics"
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
  returnType: true,
};