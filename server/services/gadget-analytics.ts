import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use production environment by default (development is paused)
const GADGET_API_URL = 'https://checkoutdata.gadget.app/api/graphql';

const API_KEY = process.env.PAVL_APP || process.env.PAVLP_DASHBOARD_ACCESS;

if (!API_KEY) {
  console.error('No API key found. Please set PAVL_APP or PAVLP_DASHBOARD_ACCESS environment variable');
}

export class GadgetAnalytics {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = GADGET_API_URL;
    console.log('GadgetAnalytics initialized with:', {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      environment: 'production'
    });
  }

  // Get dashboard data for all businesses or specific domain
  async getDashboardData(businessDomain: string | null = null, startDate: string | null = null, endDate: string | null = null, sessionToken?: string) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Use session token if provided (for authenticated requests), otherwise use API key
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      } else if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else {
        throw new Error('No authentication provided. Please provide session token or set PAVL_APP or PAVLP_DASHBOARD_ACCESS environment variable');
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
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
        }),
        // Add timeout for Netlify serverless functions
        signal: AbortSignal.timeout(10000) // 10 second timeout
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
  async getBusinessAnalytics(businessDomain: string, startDate: string | null = null, endDate: string | null = null, sessionToken?: string) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Use session token if provided (for authenticated requests), otherwise use API key
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      } else if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else {
        throw new Error('No authentication provided. Please provide session token or set PAVL_APP or PAVLP_DASHBOARD_ACCESS environment variable');
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
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
        }),
        // Add timeout for Netlify serverless functions
        signal: AbortSignal.timeout(10000) // 10 second timeout
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
  async getShops(businessDomain: string | null = null, sessionToken?: string) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Use session token if provided (for authenticated requests), otherwise use API key
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      } else if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else {
        throw new Error('No authentication provided. Please provide session token or set PAVL_APP or PAVLP_DASHBOARD_ACCESS environment variable');
      }

      console.log('getShops called with businessDomain:', businessDomain);
      
      let query = `
        query getShops {
          shopifyShops(first: 100) {
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
      `;

      if (businessDomain) {
        query = `
          query getShops($businessDomain: String) {
            shopifyShops(first: 100, filter: {
              OR: [
                { domain: { equals: $businessDomain } },
                { myshopifyDomain: { equals: $businessDomain } }
              ]
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
        `;
      }

      console.log('Making GraphQL request to:', this.baseUrl);
      console.log('Query:', query);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables: businessDomain ? { businessDomain } : {}
        }),
        // Add timeout for Netlify serverless functions
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('GraphQL response received');
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(result.errors[0].message);
      }

      const shops = result.data.shopifyShops.edges.map((edge: any) => edge.node);
      console.log('Shops found:', shops.length);
      return shops;
    } catch (error) {
      console.error('Error fetching shops:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // Get checkouts for specific shops
  async getCheckouts(shopIds: string[], startDate: string | null = null, endDate: string | null = null, limit: number = 100) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query getCheckouts($limit: Int) {
              shopifyCheckouts(
                first: $limit,
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
            limit
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // Filter by shop IDs and dates on the client side
      let checkouts = result.data.shopifyCheckouts.edges.map((edge: any) => edge.node);
      
      // Filter by shop IDs
      if (shopIds.length > 0) {
        checkouts = checkouts.filter((checkout: any) => 
          checkout.shop && shopIds.includes(checkout.shop.id)
        );
      }
      
      // Filter by dates
      if (startDate || endDate) {
        checkouts = checkouts.filter((checkout: any) => {
          const checkoutDate = new Date(checkout.createdAt);
          if (startDate && checkoutDate < new Date(startDate)) return false;
          if (endDate && checkoutDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      return checkouts;
    } catch (error) {
      console.error('Error fetching checkouts:', error);
      throw error;
    }
  }

  // Get orders for specific shops
  async getOrders(shopIds: string[], startDate: string | null = null, endDate: string | null = null, limit: number = 100) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query getOrders($limit: Int) {
              shopifyOrders(
                first: $limit,
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
            limit
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // Filter by shop IDs and dates on the client side
      let orders = result.data.shopifyOrders.edges.map((edge: any) => edge.node);
      
      // Filter by shop IDs
      if (shopIds.length > 0) {
        orders = orders.filter((order: any) => 
          order.shop && shopIds.includes(order.shop.id)
        );
      }
      
      // Filter by dates
      if (startDate || endDate) {
        orders = orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt);
          if (startDate && orderDate < new Date(startDate)) return false;
          if (endDate && orderDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get referrals for specific shops
  async getReferrals(shopIds: string[], startDate: string | null = null, endDate: string | null = null, limit: number = 100) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query getReferrals($limit: Int) {
              businessReferrals(
                first: $limit,
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
            limit
          }
        })
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // Filter by shop IDs and dates on the client side
      let referrals = result.data.businessReferrals.edges.map((edge: any) => edge.node);
      
      // Filter by shop IDs
      if (shopIds.length > 0) {
        referrals = referrals.filter((referral: any) => 
          referral.shop && shopIds.includes(referral.shop.id)
        );
      }
      
      // Filter by dates
      if (startDate || endDate) {
        referrals = referrals.filter((referral: any) => {
          const referralDate = new Date(referral.clickedAt);
          if (startDate && referralDate < new Date(startDate)) return false;
          if (endDate && referralDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      return referrals;
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  }

  // Generate comprehensive dashboard data
  async generateDashboardData(businessDomain: string | null = null, startDate: string | null = null, endDate: string | null = null, sessionToken?: string) {
    console.log('=== generateDashboardData called ===');
    console.log('businessDomain:', businessDomain);
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
    console.log('API Key available:', !!this.apiKey);
    console.log('Base URL:', this.baseUrl);
    
    try {
      // Get shops
      console.log('Getting shops...');
      const shops = await this.getShops(businessDomain, sessionToken);
      console.log('Shops found:', shops.length);
      const shopIds = shops.map(shop => shop.id);

      if (shopIds.length === 0) {
        console.log('No shops found for domain:', businessDomain);
        return {
          success: false,
          error: "No shops found for the specified domain"
        };
      }

      // Get all data
      console.log('Getting data for shop IDs:', shopIds);
      const [checkouts, orders, referrals] = await Promise.all([
        this.getCheckouts(shopIds, startDate, endDate),
        this.getOrders(shopIds, startDate, endDate),
        this.getReferrals(shopIds, startDate, endDate)
      ]);
      console.log('Data retrieved - checkouts:', checkouts.length, 'orders:', orders.length, 'referrals:', referrals.length);

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
        r.utmSource?.toLowerCase().includes('ipick.io') || 
        r.utmSource?.toLowerCase().includes('ipick.io')
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
            isIpickReferral: checkout.sourceUrl?.toLowerCase().includes('ipick.io') || 
                             checkout.sourceName?.toLowerCase().includes('ipick.io'),
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
            isPavlo4: referral.utmSource?.toLowerCase().includes('ipick.io'),
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

      console.log('Dashboard data generated successfully');
      return response;
    } catch (error) {
      console.error("Error generating dashboard data:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        error: "Failed to generate dashboard data",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export const gadgetAnalytics = new GadgetAnalytics();
