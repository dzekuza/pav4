// Gadget Analytics Integration for Pavlo4
// Replace the API_KEY with your actual Gadget API key

const GADGET_API_URL = 'https://checkoutdata--development.gadget.app/api/graphql';
// API key should be provided when instantiating the class
// const API_KEY = 'your-api-key-here'; // Remove this line and provide API key via constructor

class BusinessAnalytics {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = GADGET_API_URL;
  }

  // Get dashboard data for all businesses or specific domain
  async getDashboardData(businessDomain = null, startDate = null, endDate = null) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query getBusinessDashboard($businessDomain: String, $startDate: String, $endDate: String) {
              getBusinessDashboard(
                businessDomain: $businessDomain, 
                startDate: $startDate, 
                endDate: $endDate
              ) {
                success
                data
                error
              }
            }
          `,
          variables: {
            businessDomain,
            startDate,
            endDate
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.getBusinessDashboard;
    } catch (error) {
      console.error('Error fetching business dashboard:', error);
      throw error;
    }
  }

  // Get specific business analytics
  async getBusinessAnalytics(businessDomain, startDate = null, endDate = null) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query getBusinessAnalytics($businessDomain: String!, $startDate: String, $endDate: String) {
              getBusinessAnalytics(
                businessDomain: $businessDomain, 
                startDate: $startDate, 
                endDate: $endDate
              )
            }
          `,
          variables: {
            businessDomain,
            startDate,
            endDate
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.getBusinessAnalytics;
    } catch (error) {
      console.error('Error fetching business analytics:', error);
      throw error;
    }
  }

  // Get all shops data
  async getShops(businessDomain = null) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query getShops($businessDomain: String) {
              shopifyShops(first: 100, filter: {
                ${businessDomain ? `OR: [
                  { domain: { equals: $businessDomain } },
                  { myshopifyDomain: { equals: $businessDomain } }
                ]` : ''}
              }) {
                edges {
                  node {
                    id
                    domain
                    myshopifyDomain
                    name
                    email
                    currency
                    planName
                    createdAt
                  }
                }
              }
            }
          `,
          variables: {
            businessDomain
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.shopifyShops.edges.map(edge => edge.node);
    } catch (error) {
      console.error('Error fetching shops:', error);
      throw error;
    }
  }

  // Get checkouts for specific shops
  async getCheckouts(shopIds, startDate = null, endDate = null, limit = 100) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query getCheckouts($shopIds: [ID!]!, $startDate: String, $endDate: String, $limit: Int) {
              shopifyCheckouts(
                first: $limit,
                filter: {
                  shopId: { in: $shopIds }
                  ${startDate || endDate ? `
                    createdAt: {
                      ${startDate ? 'greaterThanOrEqual: $startDate' : ''}
                      ${endDate ? 'lessThanOrEqual: $endDate' : ''}
                    }
                  ` : ''}
                },
                sort: { createdAt: Descending }
              ) {
                edges {
                  node {
                    id
                    email
                    totalPrice
                    currency
                    createdAt
                    completedAt
                    sourceUrl
                    sourceName
                    name
                    token
                    processingStatus
                    shop {
                      id
                      domain
                      name
                    }
                  }
                }
              }
            }
          `,
          variables: {
            shopIds,
            startDate,
            endDate,
            limit
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.shopifyCheckouts.edges.map(edge => edge.node);
    } catch (error) {
      console.error('Error fetching checkouts:', error);
      throw error;
    }
  }

  // Get orders for specific shops
  async getOrders(shopIds, startDate = null, endDate = null, limit = 100) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query getOrders($shopIds: [ID!]!, $startDate: String, $endDate: String, $limit: Int) {
              shopifyOrders(
                first: $limit,
                filter: {
                  shopId: { in: $shopIds }
                  ${startDate || endDate ? `
                    createdAt: {
                      ${startDate ? 'greaterThanOrEqual: $startDate' : ''}
                      ${endDate ? 'lessThanOrEqual: $endDate' : ''}
                    }
                  ` : ''}
                },
                sort: { createdAt: Descending }
              ) {
                edges {
                  node {
                    id
                    name
                    email
                    totalPrice
                    currency
                    financialStatus
                    fulfillmentStatus
                    createdAt
                    shop {
                      id
                      domain
                      name
                    }
                  }
                }
              }
            }
          `,
          variables: {
            shopIds,
            startDate,
            endDate,
            limit
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.shopifyOrders.edges.map(edge => edge.node);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get referrals for specific shops
  async getReferrals(shopIds, startDate = null, endDate = null, limit = 100) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query getReferrals($shopIds: [ID!]!, $startDate: String, $endDate: String, $limit: Int) {
              businessReferrals(
                first: $limit,
                filter: {
                  shopId: { in: $shopIds }
                  ${startDate || endDate ? `
                    clickedAt: {
                      ${startDate ? 'greaterThanOrEqual: $startDate' : ''}
                      ${endDate ? 'lessThanOrEqual: $endDate' : ''}
                    }
                  ` : ''}
                },
                sort: { clickedAt: Descending }
              ) {
                edges {
                  node {
                    id
                    referralId
                    businessDomain
                    utmSource
                    utmMedium
                    utmCampaign
                    conversionStatus
                    conversionValue
                    clickedAt
                    shop {
                      id
                      domain
                      name
                    }
                  }
                }
              }
            }
          `,
          variables: {
            shopIds,
            startDate,
            endDate,
            limit
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.businessReferrals.edges.map(edge => edge.node);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  }

  // Generate comprehensive dashboard data
  async generateDashboardData(businessDomain = null, startDate = null, endDate = null) {
    try {
      // Get shops
      const shops = await this.getShops(businessDomain);
      const shopIds = shops.map(shop => shop.id);

      if (shopIds.length === 0) {
        return {
          success: false,
          error: "No shops found for the specified domain"
        };
      }

      // Get all data
      const [checkouts, orders, referrals] = await Promise.all([
        this.getCheckouts(shopIds, startDate, endDate),
        this.getOrders(shopIds, startDate, endDate),
        this.getReferrals(shopIds, startDate, endDate)
      ]);

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
      const pavlo4Referrals = referrals.filter(r => 
        r.utmSource?.toLowerCase().includes('pavlo4') || 
        r.utmSource?.toLowerCase().includes('pavlo4')
      );
      const totalReferrals = referrals.length;
      const pavlo4Conversions = pavlo4Referrals.filter(r => r.conversionStatus === 'converted').length;
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
      const financialStatusBreakdown = orders.reduce((acc, order) => {
        const status = order.financialStatus || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Top referral sources
      const topSources = referrals.reduce((acc, r) => {
        const source = r.utmSource || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      // Format response
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
            currency: orders[0]?.currency || 'USD'
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
            isPavlo4Referral: checkout.sourceUrl?.toLowerCase().includes('pavlo4') || 
                             checkout.sourceName?.toLowerCase().includes('pavlo4'),
            shop: checkout.shop
          })),
          recentOrders: orders.slice(0, 20).map(order => ({
            id: order.id,
            name: order.name,
            email: order.email,
            totalPrice: order.totalPrice,
            currency: order.currency,
            financialStatus: order.financialStatus,
            fulfillmentStatus: order.fulfillmentStatus,
            createdAt: order.createdAt,
            shop: order.shop
          })),
          referralStatistics: {
            totalReferrals,
            pavlo4Referrals: pavlo4Referrals.length,
            pavlo4ConversionRate: pavlo4Referrals.length > 0 ? 
              Math.round((pavlo4Conversions / pavlo4Referrals.length) * 10000) / 100 : 0,
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
            isPavlo4: referral.utmSource?.toLowerCase().includes('pavlo4'),
            shop: referral.shop
          }))
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          filters: {
            businessDomain,
            startDate: startDate,
            endDate: endDate
          }
        }
      };

      return response;
    } catch (error) {
      console.error("Error generating dashboard data:", error);
      return {
        success: false,
        error: "Failed to generate dashboard data"
      };
    }
  }
}

// Initialize the analytics service
const analytics = new BusinessAnalytics(API_KEY);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BusinessAnalytics, analytics };
}
