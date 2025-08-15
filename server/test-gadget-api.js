import { gadgetAnalytics } from './services/gadget-analytics.js';

async function testGadgetAPI() {
  console.log('🧪 Testing Gadget API Integration...\n');

  try {
    // Test 1: Get dashboard data for godislove.lt
    console.log('1️⃣ Testing getDashboardData for godislove.lt...');
    const dashboardData = await gadgetAnalytics.getDashboardData('godislove.lt');
    console.log('✅ Dashboard data retrieved successfully');
    console.log('📊 Summary:', {
      totalCheckouts: dashboardData.data?.summary?.totalCheckouts,
      totalOrders: dashboardData.data?.summary?.totalOrders,
      totalRevenue: dashboardData.data?.summary?.totalRevenue,
      currency: dashboardData.data?.summary?.currency
    });

    // Test 2: Get shops
    console.log('\n2️⃣ Testing getShops...');
    const shops = await gadgetAnalytics.getShops('godislove.lt');
    console.log('✅ Shops retrieved successfully');
    console.log('🏪 Found shops:', shops.length);
    shops.forEach(shop => {
      console.log(`   - ${shop.name} (${shop.domain})`);
    });

    // Test 3: Get checkouts
    console.log('\n3️⃣ Testing getCheckouts...');
    const checkouts = await gadgetAnalytics.getCheckouts(['75941839177'], null, null, 5);
    console.log('✅ Checkouts retrieved successfully');
    console.log('🛒 Found checkouts:', checkouts.length);
    checkouts.slice(0, 3).forEach(checkout => {
      console.log(`   - ${checkout.email || 'No email'} - ${checkout.totalPrice} ${checkout.currency}`);
    });

    // Test 4: Get orders
    console.log('\n4️⃣ Testing getOrders...');
    const orders = await gadgetAnalytics.getOrders(['75941839177'], null, null, 5);
    console.log('✅ Orders retrieved successfully');
    console.log('📦 Found orders:', orders.length);
    orders.slice(0, 3).forEach(order => {
      console.log(`   - ${order.name} - ${order.totalPrice} ${order.currency} (${order.financialStatus})`);
    });

    // Test 5: Generate complete dashboard data
    console.log('\n5️⃣ Testing generateDashboardData...');
    const completeData = await gadgetAnalytics.generateDashboardData('godislove.lt');
    console.log('✅ Complete dashboard data generated successfully');
    console.log('📈 Complete summary:', {
      totalBusinesses: completeData.data?.summary?.totalBusinesses,
      totalCheckouts: completeData.data?.summary?.totalCheckouts,
      totalOrders: completeData.data?.summary?.totalOrders,
      totalRevenue: completeData.data?.summary?.totalRevenue,
      conversionRate: completeData.data?.summary?.conversionRate
    });

    console.log('\n🎉 All tests passed! Gadget API integration is working correctly.');
    console.log('🌐 Using development environment: https://checkoutdata--development.gadget.app');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testGadgetAPI();
