import { json, type LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const businessDomain = url.searchParams.get('businessDomain');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 100;

    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const expectedToken = 'gsk-X89z6jDWkTRqgq7htYnZi4wcXQ8L3B9g';
    
    if (token !== expectedToken) {
      return json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // For now, return mock data to test the dashboard
    const mockData = {
      success: true,
      data: {
        summary: {
          totalBusinesses: 1,
          businessDomain: businessDomain || 'example.com',
          totalCheckouts: 15,
          completedCheckouts: 8,
          totalOrders: 8,
          conversionRate: 53.33,
          totalRevenue: 1250.50,
          currency: 'USD'
        },
        businesses: [{
          id: '1',
          domain: businessDomain || 'example.com',
          myshopifyDomain: 'example.myshopify.com',
          name: 'Example Store',
          email: 'admin@example.com',
          currency: 'USD',
          plan: 'Basic',
          createdAt: '2024-01-01T00:00:00Z'
        }],
        recentCheckouts: [
          {
            id: '1',
            email: 'customer1@example.com',
            totalPrice: '150.00',
            currency: 'USD',
            createdAt: '2024-08-14T10:00:00Z',
            completedAt: '2024-08-14T10:05:00Z',
            sourceUrl: 'https://ipick.io/product/123',
            sourceName: 'Pavlo4 Price Comparison',
            name: '#1001',
            token: 'token1',
            processingStatus: 'complete',
            isPavlo4Referral: true
          },
          {
            id: '2',
            email: 'customer2@example.com',
            totalPrice: '75.50',
            currency: 'USD',
            createdAt: '2024-08-14T09:30:00Z',
            completedAt: null,
            sourceUrl: 'https://google.com',
            sourceName: 'Google Search',
            name: '#1002',
            token: 'token2',
            processingStatus: 'processing',
            isPavlo4Referral: false
          }
        ],
        recentOrders: [
          {
            id: '1',
            name: '#1001',
            email: 'customer1@example.com',
            totalPrice: '150.00',
            currency: 'USD',
            financialStatus: 'paid',
            fulfillmentStatus: 'fulfilled',
            createdAt: '2024-08-14T10:05:00Z'
          },
          {
            id: '2',
            name: '#1000',
            email: 'customer3@example.com',
            totalPrice: '200.00',
            currency: 'USD',
            financialStatus: 'pending',
            fulfillmentStatus: 'unfulfilled',
            createdAt: '2024-08-14T08:00:00Z'
          }
        ],
        referralStatistics: {
          totalReferrals: 25,
          ipickReferrals: 12,
          ipickConversionRate: 66.67,
          totalConversions: 8,
          referralRevenue: 850.00,
          topSources: {
            'ipick.io': 12,
            'google': 8,
            'facebook': 3,
            'direct': 2
          }
        },
        trends: {
          last30Days: {
            checkouts: 15,
            orders: 8,
            revenue: 1250.50
          },
          last7Days: {
            checkouts: 5,
            orders: 3,
            revenue: 450.00
          }
        },
        orderStatuses: {
          'paid': 6,
          'pending': 2,
          'refunded': 0
        },
        recentReferrals: [
          {
            id: '1',
            referralId: 'ref1',
            businessDomain: businessDomain || 'example.com',
            source: 'ipick.io',
            medium: 'referral',
            campaign: 'price-comparison',
            conversionStatus: 'converted',
            conversionValue: 150.00,
            clickedAt: '2024-08-14T09:45:00Z',
            isPavlo4: true
          },
          {
            id: '2',
            referralId: 'ref2',
            businessDomain: businessDomain || 'example.com',
            source: 'google',
            medium: 'organic',
            campaign: 'search',
            conversionStatus: 'clicked',
            conversionValue: 0,
            clickedAt: '2024-08-14T09:30:00Z',
            isPavlo4: false
          }
        ]
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: {
          businessDomain,
          startDate: startDate,
          endDate: endDate,
          limit
        }
      }
    };

    return json(mockData);
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return json({
      success: false,
      error: "Failed to generate dashboard data"
    }, { status: 500 });
  }
};
