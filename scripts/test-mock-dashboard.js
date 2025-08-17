// Test dashboard with mock data
const mockData = {
  events: [
    {
      id: "1",
      sessionId: "session_1",
      eventType: "page_view",
      path: "/products/gift-card",
      productId: "10220568969549",
      occurredAt: "2025-01-15T10:30:00Z",
      shop: { id: "shop_1", domain: "checkoutipick.myshopify.com" }
    },
    {
      id: "2",
      sessionId: "session_1",
      eventType: "add_to_cart",
      path: "/products/gift-card",
      productId: "10220568969549",
      quantity: 1,
      value: 25.00,
      currency: "EUR",
      occurredAt: "2025-01-15T10:35:00Z",
      shop: { id: "shop_1", domain: "checkoutipick.myshopify.com" }
    },
    {
      id: "3",
      sessionId: "session_2",
      eventType: "page_view",
      path: "/products/gift-card",
      productId: "10220568969549",
      occurredAt: "2025-01-15T11:00:00Z",
      shop: { id: "shop_1", domain: "checkoutipick.myshopify.com" }
    },
    {
      id: "4",
      sessionId: "session_3",
      eventType: "checkout_start",
      path: "/checkout",
      occurredAt: "2025-01-15T14:20:00Z",
      shop: { id: "shop_1", domain: "checkoutipick.myshopify.com" }
    }
  ],
  orders: [
    {
      id: "1",
      orderId: "1001",
      totalPrice: 25.00,
      currency: "EUR",
      createdAt: "2025-01-15T14:25:00Z",
      sessionId: "session_1",
      shop: { id: "shop_1", domain: "checkoutipick.myshopify.com" }
    },
    {
      id: "2",
      orderId: "1002",
      totalPrice: 50.00,
      currency: "EUR",
      createdAt: "2025-01-16T09:15:00Z",
      sessionId: "session_4",
      shop: { id: "shop_1", domain: "checkoutipick.myshopify.com" }
    }
  ],
  aggregates: [
    {
      id: "1",
      date: "2025-01-15",
      sessions: 3,
      productViews: 5,
      shop: { id: "shop_1", domain: "checkoutipick.myshopify.com" }
    },
    {
      id: "2",
      date: "2025-01-16",
      sessions: 2,
      productViews: 3,
      shop: { id: "shop_1", domain: "checkoutipick.myshopify.com" }
    }
  ]
};

function calculateKPIs(aggregates, events, orders) {
  const totalSessions = aggregates.reduce((sum, agg) => sum + agg.sessions, 0);
  const totalProductViews = aggregates.reduce((sum, agg) => sum + agg.productViews, 0);
  const totalAddToCart = events.filter(e => e.eventType === 'add_to_cart').length;
  const totalCheckoutStart = events.filter(e => e.eventType === 'checkout_start').length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  
  const conversionRate = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;
  const cartConversionRate = totalAddToCart > 0 ? (totalOrders / totalAddToCart) * 100 : 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalSessions,
    totalProductViews,
    totalAddToCart,
    totalCheckoutStart,
    totalOrders,
    totalRevenue,
    conversionRate,
    cartConversionRate,
    averageOrderValue
  };
}

function displayMockDashboard() {
  console.log("🎯 MOCK DASHBOARD FOR checkoutipick.myshopify.com");
  console.log("=" .repeat(60));
  
  const kpis = calculateKPIs(mockData.aggregates, mockData.events, mockData.orders);
  
  console.log("\n📊 KPI CARDS:");
  console.log(`Total Sessions: ${kpis.totalSessions}`);
  console.log(`Product Views: ${kpis.totalProductViews}`);
  console.log(`Add to Cart: ${kpis.totalAddToCart}`);
  console.log(`Checkout Start: ${kpis.totalCheckoutStart}`);
  console.log(`Total Orders: ${kpis.totalOrders}`);
  console.log(`Conversion Rate: ${kpis.conversionRate.toFixed(1)}%`);
  console.log(`Cart Conversion: ${kpis.cartConversionRate.toFixed(1)}%`);
  console.log(`Total Revenue: €${kpis.totalRevenue.toFixed(2)}`);
  console.log(`Average Order Value: €${kpis.averageOrderValue.toFixed(2)}`);
  
  console.log("\n📈 RECENT EVENTS:");
  mockData.events.forEach((event, index) => {
    console.log(`${index + 1}. ${event.eventType.replace('_', ' ')} - ${event.path} (${new Date(event.occurredAt).toLocaleString()})`);
  });
  
  console.log("\n💰 RECENT ORDERS:");
  mockData.orders.forEach((order, index) => {
    console.log(`${index + 1}. Order ${order.orderId} - €${order.totalPrice} (${new Date(order.createdAt).toLocaleString()})`);
  });
  
  console.log("\n📅 DAILY AGGREGATES:");
  mockData.aggregates.forEach((agg, index) => {
    console.log(`${index + 1}. ${agg.date}: ${agg.sessions} sessions, ${agg.productViews} product views`);
  });
  
  console.log("\n" + "=" .repeat(60));
  console.log("💡 This is how your dashboard would look with real data!");
  console.log("To see real data, you need:");
  console.log("1. Customer activity on the store");
  console.log("2. The ipick Tracker properly installed");
  console.log("3. Orders being placed through tracked links");
}

displayMockDashboard();
