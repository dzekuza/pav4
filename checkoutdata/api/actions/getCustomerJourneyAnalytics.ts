import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const {
    businessDomain,
    startDate,
    endDate,
    sessionId,
    utmSource,
    eventType,
    limit = 100
  } = params;

  // Build filter conditions
  const filters: any = { AND: [] };

  // Date range filtering
  if (startDate) {
    filters.AND.push({
      timestamp: { greaterThanOrEqual: startDate }
    });
  }

  if (endDate) {
    filters.AND.push({
      timestamp: { lessThanOrEqual: endDate }
    });
  }

  // Business domain filtering
  if (businessDomain) {
    const businessReferrals = await api.businessReferral.findMany({
      filter: { businessDomain: { equals: businessDomain } },
      select: { id: true }
    });
    
    if (businessReferrals.length > 0) {
      filters.AND.push({
        businessReferral: {
          in: businessReferrals.map(br => br.id)
        }
      });
    }
  }

  // Session filtering
  if (sessionId) {
    filters.AND.push({
      sessionId: { equals: sessionId }
    });
  }

  // UTM source filtering
  if (utmSource) {
    filters.AND.push({
      utmSource: { equals: utmSource }
    });
  }

  // Event type filtering
  if (eventType) {
    filters.AND.push({
      eventType: { equals: eventType }
    });
  }

  // Get all customer journey events
  const journeyEvents = await api.customerJourney.findMany({
    filter: filters.AND.length > 0 ? filters : undefined,
    sort: { timestamp: "Descending" },
    first: Math.min(limit * 10, 250), // Get more events for analysis
    select: {
      id: true,
      sessionId: true,
      userId: true,
      email: true,
      eventType: true,
      pageUrl: true,
      pageTitle: true,
      productId: true,
      productName: true,
      productPrice: true,
      cartValue: true,
      discountCode: true,
      discountValue: true,
      checkoutId: true,
      orderId: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      country: true,
      timestamp: true,
      businessReferral: {
        id: true,
        businessDomain: true,
        targetUrl: true
      }
    }
  });

  // Calculate journey summary
  const uniqueSessions = new Set(journeyEvents.map(e => e.sessionId)).size;
  const uniqueVisitors = new Set(journeyEvents.filter(e => e.userId).map(e => e.userId)).size;
  const totalPageViews = journeyEvents.filter(e => e.eventType === "page_view").length;
  const totalPurchases = journeyEvents.filter(e => e.eventType === "purchase").length;
  const conversionRate = uniqueSessions > 0 ? (totalPurchases / uniqueSessions) * 100 : 0;

  // Calculate bounce rate (sessions with only one event)
  const sessionEventCounts = journeyEvents.reduce((acc, event) => {
    acc[event.sessionId] = (acc[event.sessionId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const bouncingSessions = Object.values(sessionEventCounts).filter(count => count === 1).length;
  const bounceRate = uniqueSessions > 0 ? (bouncingSessions / uniqueSessions) * 100 : 0;

  // Entry and exit pages
  const sessionPages = journeyEvents.reduce((acc, event) => {
    if (event.eventType === "page_view") {
      if (!acc[event.sessionId]) {
        acc[event.sessionId] = [];
      }
      acc[event.sessionId].push({
        pageUrl: event.pageUrl || "",
        pageTitle: event.pageTitle || "",
        timestamp: typeof event.timestamp === 'string' ? event.timestamp : new Date().toISOString()
      });
    }
    return acc;
  }, {} as Record<string, Array<{pageUrl: string, pageTitle: string, timestamp: string}>>);

  const entryPages: Record<string, number> = {};
  const exitPages: Record<string, number> = {};

  Object.values(sessionPages).forEach((pages: any[]) => {
    if (pages.length > 0) {
      pages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const entryPage = pages[0].pageUrl || "Unknown";
      const exitPage = pages[pages.length - 1].pageUrl || "Unknown";
      
      entryPages[entryPage] = (entryPages[entryPage] || 0) + 1;
      exitPages[exitPage] = (exitPages[exitPage] || 0) + 1;
    }
  });

  // Traffic sources analysis
  const trafficSources: Record<string, number> = {};
  const utmCampaigns: Record<string, number> = {};
  const referrals: Record<string, number> = {};
  let ipickReferrals = 0;

  journeyEvents.forEach(event => {
    if (event.utmSource) {
      trafficSources[event.utmSource] = (trafficSources[event.utmSource] || 0) + 1;
    }
    if (event.utmCampaign) {
      utmCampaigns[event.utmCampaign] = (utmCampaigns[event.utmCampaign] || 0) + 1;
    }
    if (event.businessReferral?.businessDomain) {
      const domain = event.businessReferral.businessDomain;
      referrals[domain] = (referrals[domain] || 0) + 1;
      if (domain.includes('ipick.io')) {
        ipickReferrals++;
      }
    }
  });

  // Product analytics
  const productViews: Record<string, {count: number, name: string, price: number}> = {};
  const addToCarts: Record<string, number> = {};
  
  journeyEvents.forEach(event => {
    if (event.eventType === "product_view" && event.productId) {
      if (!productViews[event.productId]) {
        productViews[event.productId] = {
          count: 0,
          name: event.productName || "Unknown Product",
          price: event.productPrice || 0
        };
      }
      productViews[event.productId].count++;
    }
    if (event.eventType === "add_to_cart" && event.productId) {
      addToCarts[event.productId] = (addToCarts[event.productId] || 0) + 1;
    }
  });

  // Customer behavior
  const cartValues = journeyEvents
    .filter(e => e.cartValue && e.cartValue > 0)
    .map(e => e.cartValue!);
  
  const averageCartValue = cartValues.length > 0 
    ? cartValues.reduce((sum, val) => sum + val, 0) / cartValues.length 
    : 0;

  const discountUsage: Record<string, number> = {};
  journeyEvents.forEach(event => {
    if (event.discountCode) {
      discountUsage[event.discountCode] = (discountUsage[event.discountCode] || 0) + 1;
    }
  });

  // Recent journeys (complete customer journeys)
  const recentJourneys = Object.entries(sessionPages)
    .slice(0, 20)
    .map(([sessionId, pages]) => {
      const sessionEvents = journeyEvents.filter(e => e.sessionId === sessionId);
      const hasPurchase = sessionEvents.some(e => e.eventType === "purchase");
      const totalValue = sessionEvents.reduce((sum, e) => sum + (e.cartValue || 0), 0);
      
      return {
        sessionId,
        events: sessionEvents.length,
        hasPurchase,
        totalValue,
        startTime: pages[0]?.timestamp,
        endTime: pages[pages.length - 1]?.timestamp || "",
        country: sessionEvents[0]?.country,
        utmSource: sessionEvents[0]?.utmSource
      };
    });

  // Funnel analysis
  const funnelSteps = {
    visits: uniqueSessions,
    productViews: journeyEvents.filter(e => e.eventType === "product_view").length,
    addToCarts: journeyEvents.filter(e => e.eventType === "add_to_cart").length,
    checkoutStarts: journeyEvents.filter(e => e.eventType === "checkout_start").length,
    purchases: totalPurchases
  };

  const funnelRates = {
    visitToProductView: funnelSteps.visits > 0 ? (funnelSteps.productViews / funnelSteps.visits) * 100 : 0,
    productViewToAddCart: funnelSteps.productViews > 0 ? (funnelSteps.addToCarts / funnelSteps.productViews) * 100 : 0,
    addCartToCheckout: funnelSteps.addToCarts > 0 ? (funnelSteps.checkoutStarts / funnelSteps.addToCarts) * 100 : 0,
    checkoutToPurchase: funnelSteps.checkoutStarts > 0 ? (funnelSteps.purchases / funnelSteps.checkoutStarts) * 100 : 0
  };

  return {
    summary: {
      totalSessions: uniqueSessions,
      uniqueVisitors,
      totalPageViews,
      totalPurchases,
      conversionRate: Math.round(conversionRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      averageCartValue: Math.round(averageCartValue * 100) / 100
    },
    topPages: {
      entryPages: Object.entries(entryPages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([url, count]) => ({ url, count })),
      exitPages: Object.entries(exitPages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([url, count]) => ({ url, count }))
    },
    trafficSources: {
      sources: Object.entries(trafficSources)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([source, count]) => ({ source, count })),
      campaigns: Object.entries(utmCampaigns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([campaign, count]) => ({ campaign, count })),
      ipickReferrals,
      totalReferrals: Object.values(referrals).reduce((sum, val) => sum + val, 0)
    },
    productAnalytics: {
      mostViewed: Object.entries(productViews)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 10)
        .map(([productId, data]) => ({
          productId,
          name: data.name,
          price: data.price,
          views: data.count,
          addToCarts: addToCarts[productId] || 0,
          conversionRate: data.count > 0 ? Math.round(((addToCarts[productId] || 0) / data.count) * 10000) / 100 : 0
        }))
    },
    customerBehavior: {
      averageCartValue: Math.round(averageCartValue * 100) / 100,
      discountUsage: Object.entries(discountUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([code, count]) => ({ code, count })),
      checkoutAbandonment: funnelSteps.checkoutStarts - funnelSteps.purchases
    },
    recentJourneys,
    funnelAnalysis: {
      steps: funnelSteps,
      conversionRates: {
        visitToProductView: Math.round(funnelRates.visitToProductView * 100) / 100,
        productViewToAddCart: Math.round(funnelRates.productViewToAddCart * 100) / 100,
        addCartToCheckout: Math.round(funnelRates.addCartToCheckout * 100) / 100,
        checkoutToPurchase: Math.round(funnelRates.checkoutToPurchase * 100) / 100
      }
    }
  };
};

export const params = {
  businessDomain: { type: "string" },
  startDate: { type: "string" },
  endDate: { type: "string" },
  sessionId: { type: "string" },
  utmSource: { type: "string" },
  eventType: { type: "string" },
  limit: { type: "number" }
};
