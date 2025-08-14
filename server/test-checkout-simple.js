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

      // Test 4: Get referrals
      console.log('🔗 Test 4: Fetching referrals...');
      const referrals = await this.getReferrals();
      console.log(`✅ Found ${referrals.length} referrals`);
      
      if (referrals.length > 0) {
        console.log('Sample referral:', JSON.stringify(referrals[0], null, 2));
      }
      console.log('');

      // Test 5: Analyze checkout data
      console.log('📊 Test 5: Analyzing checkout data...');
      await this.analyzeCheckoutData(checkouts, orders, shops, referrals);
      console.log('');

      console.log('🎉 All tests completed successfully!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error('Full error:', error);
    }
  }

  async analyzeCheckoutData(checkouts, orders, shops, referrals) {
    console.log('=== Checkout Analysis ===');
    
    // Basic statistics
    console.log(`Total Shops: ${shops.length}`);
    console.log(`Total Checkouts: ${checkouts.length}`);
    console.log(`Total Orders: ${orders.length}`);
    console.log(`Total Referrals: ${referrals.length}`);

    // Checkout completion rate
    const completedCheckouts = checkouts.filter(c => c.completedAt).length;
    const completionRate = checkouts.length > 0 ? (completedCheckouts / checkouts.length) * 100 : 0;
    console.log(`Checkout Completion Rate: ${completionRate.toFixed(2)}%`);

    // Revenue analysis
    const totalRevenue = orders.reduce((sum, order) => {
      const price = parseFloat(order.totalPrice || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    console.log(`Total Revenue: ${totalRevenue.toFixed(2)} ${orders[0]?.currency || 'USD'}`);

    // Recent activity (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCheckouts = checkouts.filter(c => new Date(c.createdAt) >= last7Days);
    const recentOrders = orders.filter(o => new Date(o.createdAt) >= last7Days);
    console.log(`Recent Checkouts (7 days): ${recentCheckouts.length}`);
    console.log(`Recent Orders (7 days): ${recentOrders.length}`);

    // Shop breakdown
    console.log('\n=== Shop Breakdown ===');
    shops.forEach(shop => {
      const shopCheckouts = checkouts.filter(c => c.shop?.id === shop.id);
      const shopOrders = orders.filter(o => o.shop?.id === shop.id);
      console.log(`${shop.name} (${shop.domain}):`);
      console.log(`  - Checkouts: ${shopCheckouts.length}`);
      console.log(`  - Orders: ${shopOrders.length}`);
      console.log(`  - Currency: ${shop.currency}`);
    });

    // Order status breakdown
    console.log('\n=== Order Status Breakdown ===');
    const statusBreakdown = orders.reduce((acc, order) => {
      const status = order.financialStatus || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });

    // Referral analysis
    if (referrals.length > 0) {
      console.log('\n=== Referral Analysis ===');
      const sourceBreakdown = referrals.reduce((acc, referral) => {
        const source = referral.utmSource || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(sourceBreakdown).forEach(([source, count]) => {
        console.log(`${source}: ${count}`);
      });
    }
  }

  async getCheckouts(limit = 50) {
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
      console.error('GraphQL errors for getCheckouts:', result.errors);
      throw new Error(result.errors[0].message);
    }

    return result.data.shopifyCheckouts.edges.map(edge => edge.node);
  }

  async getOrders(limit = 50) {
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
      console.error('GraphQL errors for getOrders:', result.errors);
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
      console.error('GraphQL errors for getShops:', result.errors);
      throw new Error(result.errors[0].message);
    }

    return result.data.shopifyShops.edges.map(edge => edge.node);
  }

  async getReferrals(limit = 50) {
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
      console.error('GraphQL errors for getReferrals:', result.errors);
      throw new Error(result.errors[0].message);
    }

    return result.data.businessReferrals.edges.map(edge => edge.node);
  }
}

// Run the test
const tester = new CheckoutEventTester();
tester.testCheckoutEvents().catch(console.error);
