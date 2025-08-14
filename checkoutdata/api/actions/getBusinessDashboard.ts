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

    // Get shop data - use proper Gadget API patterns
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
        createdAt: true
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
        clickedAt: true
      }
    });

    // Calculate metrics
    const totalCheckouts = checkouts.length;
    const completedCheckouts = checkouts.filter(c => c.completedAt).length;
    const totalOrders = orders.length;
    const conversionRate = totalCheckouts > 0 ? (completedCheckouts / totalCheckouts) * 100 : 0;

    // Calculate revenue from orders
    const totalRevenue = orders.reduce((sum, order) => {
      const price = parseFloat(order.totalPrice || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    // Referral statistics
    const ipickReferrals = referrals.filter(r => 
      r.utmSource?.toLowerCase().includes('ipick') || 
      r.utmSource?.toLowerCase().includes('ipick')
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
    const topSources = referrals.reduce((acc: any, r) => {
      const source = r.utmSource || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

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
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
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
          isIpickReferral: checkout.sourceUrl?.toLowerCase().includes('ipick') || 
                          checkout.sourceName?.toLowerCase().includes('ipick')
        })),
        recentOrders: orders.slice(0, 20).map(order => ({
          id: order.id,
          name: order.name,
          email: order.email,
          totalPrice: order.totalPrice,
          currency: order.currency,
          financialStatus: order.financialStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          createdAt: order.createdAt
        })),
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
            revenue: recentOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || '0'), 0)
          },
          last7Days: {
            checkouts: weeklyCheckouts.length,
            orders: weeklyOrders.length,
            revenue: weeklyOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || '0'), 0)
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
          isIpick: referral.utmSource?.toLowerCase().includes('ipick')
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
  returnType: true
};
