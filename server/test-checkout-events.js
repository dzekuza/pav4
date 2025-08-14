import fetch from 'node-fetch';

// Development environment configuration
const GADGET_API_URL = 'https://checkoutdata--development.gadget.app/api/graphql';
const API_KEY = 'gsk-BDE2GN4ftPEmRdMHVaRqX7FrWE7DVDEL';

class CheckoutEventTester {
  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = GADGET_API_URL;
  }

  async testCheckoutEvents() {
    console.log('🧪 Testing Checkout Events with Development Environment');
    console.log('API URL:', this.baseUrl);
    console.log('API Key:', this.apiKey.substring(0, 10) + '...');
    console.log('');

    try {
      // Test 1: Get all checkouts
      console.log('📋 Test 1: Fetching all checkouts...');
      const checkouts = await this.getCheckouts();
      console.log(`✅ Found ${checkouts.length} checkouts`);
      
      if (checkouts.length > 0) {
        console.log('Sample checkout:', JSON.stringify(checkouts[0], null, 2));
      }
      console.log('');

      // Test 2: Get all orders
      console.log('📦 Test 2: Fetching all orders...');
      const orders = await this.getOrders();
      console.log(`✅ Found ${orders.length} orders`);
      
      if (orders.length > 0) {
        console.log('Sample order:', JSON.stringify(orders[0], null, 2));
      }
      console.log('');

      // Test 3: Get all shops
      console.log('🏪 Test 3: Fetching all shops...');
      const shops = await this.getShops();
      console.log(`✅ Found ${shops.length} shops`);
      
      if (shops.length > 0) {
        console.log('Sample shop:', JSON.stringify(shops[0], null, 2));
      }
      console.log('');

      // Test 4: Get business dashboard data
      console.log('📊 Test 4: Fetching business dashboard data...');
      const dashboardData = await this.getBusinessDashboard();
      console.log('✅ Dashboard data retrieved');
      console.log('Dashboard summary:', JSON.stringify(dashboardData?.data?.summary, null, 2));
      console.log('');

      // Test 5: Get business analytics
      console.log('📈 Test 5: Fetching business analytics...');
      const analytics = await this.getBusinessAnalytics();
      console.log('✅ Analytics data retrieved');
      console.log('Analytics:', JSON.stringify(analytics, null, 2));
      console.log('');

      // Test 6: Get referrals
      console.log('🔗 Test 6: Fetching referrals...');
      const referrals = await this.getReferrals();
      console.log(`✅ Found ${referrals.length} referrals`);
      
      if (referrals.length > 0) {
        console.log('Sample referral:', JSON.stringify(referrals[0], null, 2));
      }
      console.log('');

      console.log('🎉 All tests completed successfully!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response body:', await error.response.text());
      }
      // Log the full error for debugging
      console.error('Full error:', error);
    }
  }

  async getCheckouts(limit = 10) {
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
        variables: { limit }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.shopifyCheckouts.edges.map(edge => edge.node);
  }

  async getOrders(limit = 10) {
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
        variables: { limit }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.shopifyOrders.edges.map(edge => edge.node);
  }

  async getShops() {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query: `
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
        `
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.shopifyShops.edges.map(edge => edge.node);
  }

  async getBusinessDashboard() {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query: `
          query getBusinessDashboard($businessDomain: String, $startDate: String, $endDate: String, $limit: Int) {
            getBusinessDashboard(
              businessDomain: $businessDomain,
              startDate: $startDate,
              endDate: $endDate,
              limit: $limit
            ) {
              success
              data
              error
            }
          }
        `,
        variables: {
          businessDomain: null,
          startDate: null,
          endDate: null,
          limit: 100
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors for getBusinessDashboard:', result.errors);
      throw new Error(result.errors[0].message);
    }

    return result.data.getBusinessDashboard;
  }

  async getBusinessAnalytics() {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query: `
          query getBusinessAnalytics($businessDomain: String, $startDate: String, $endDate: String) {
            getBusinessAnalytics(
              businessDomain: $businessDomain,
              startDate: $startDate,
              endDate: $endDate
            )
          }
        `,
        variables: {
          businessDomain: null,
          startDate: null,
          endDate: null
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.getBusinessAnalytics;
  }

  async getReferrals(limit = 10) {
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
        variables: { limit }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data.businessReferrals.edges.map(edge => edge.node);
  }
}

// Run the test
const tester = new CheckoutEventTester();
tester.testCheckoutEvents().catch(console.error);
