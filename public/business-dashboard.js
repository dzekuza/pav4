// Business Dashboard Component for Pavlo4
// This component renders the analytics dashboard

class BusinessDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.analytics = new BusinessAnalytics(API_KEY);
  }

  async render(businessDomain = null) {
    try {
      // Show loading state
      this.container.innerHTML = '<div class="loading">Loading analytics...</div>';

      // Fetch data
      const dashboardData = await this.analytics.generateDashboardData(businessDomain);

      if (!dashboardData.success) {
        throw new Error(dashboardData.error);
      }

      const data = dashboardData.data;

      // Render the dashboard
      this.container.innerHTML = `
        <div class="business-dashboard">
          <h1>Business Analytics Dashboard</h1>
          
          ${this.renderSummaryCards(data.summary)}
          
          ${this.renderBusinessSelector(data.businesses)}
          
          ${this.renderReferralStats(data.referralStatistics)}
          
          ${this.renderRecentCheckouts(data.recentCheckouts)}
          
          ${this.renderRecentOrders(data.recentOrders)}
          
          ${this.renderTrends(data.trends)}
        </div>
      `;

      // Add event listeners
      this.attachEventListeners();
      
    } catch (error) {
      this.container.innerHTML = `
        <div class="error">
          <h2>Error Loading Dashboard</h2>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  renderSummaryCards(summary) {
    return `
      <div class="summary-cards">
        <div class="card">
          <h3>Total Businesses</h3>
          <div class="metric">${summary.totalBusinesses}</div>
        </div>
        <div class="card">
          <h3>Total Checkouts</h3>
          <div class="metric">${summary.totalCheckouts}</div>
        </div>
        <div class="card">
          <h3>Completed Checkouts</h3>
          <div class="metric">${summary.completedCheckouts}</div>
        </div>
        <div class="card">
          <h3>Conversion Rate</h3>
          <div class="metric">${summary.conversionRate}%</div>
        </div>
        <div class="card">
          <h3>Total Revenue</h3>
          <div class="metric">${summary.totalRevenue} ${summary.currency}</div>
        </div>
      </div>
    `;
  }

  renderBusinessSelector(businesses) {
    return `
      <div class="business-selector">
        <h3>Select Business</h3>
        <select id="business-select">
          <option value="">All Businesses</option>
          ${businesses.map(business => `
            <option value="${business.domain || business.myshopifyDomain}">
              ${business.name} (${business.domain || business.myshopifyDomain})
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  renderReferralStats(stats) {
    return `
      <div class="referral-stats">
        <h3>Pavlo4 Referral Performance</h3>
        <div class="stats-grid">
          <div class="stat">
            <label>Total Referrals</label>
            <div class="value">${stats.totalReferrals}</div>
          </div>
          <div class="stat pavlo4-highlight">
            <label>Pavlo4 Referrals</label>
            <div class="value">${stats.pavlo4Referrals}</div>
          </div>
          <div class="stat pavlo4-highlight">
            <label>Pavlo4 Conversion Rate</label>
            <div class="value">${stats.pavlo4ConversionRate}%</div>
          </div>
          <div class="stat">
            <label>Referral Revenue</label>
            <div class="value">${stats.referralRevenue}</div>
          </div>
        </div>
      </div>
    `;
  }

  renderRecentCheckouts(checkouts) {
    if (!checkouts || checkouts.length === 0) {
      return `
        <div class="recent-checkouts">
          <h3>Recent Checkouts</h3>
          <div class="no-data">No checkout data available</div>
        </div>
      `;
    }

    return `
      <div class="recent-checkouts">
        <h3>Recent Checkouts</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Source</th>
                <th>Business</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${checkouts.map(checkout => `
                <tr class="${checkout.isPavlo4Referral ? 'pavlo4-referral' : ''}">
                  <td>${checkout.id}</td>
                  <td>${checkout.email || 'N/A'}</td>
                  <td>${checkout.totalPrice} ${checkout.currency}</td>
                  <td>${checkout.completedAt ? '✅ Completed' : '⏳ Pending'}</td>
                  <td>
                    ${checkout.isPavlo4Referral ? 
                      '<span class="pavlo4-badge">🔥 Pavlo4</span>' : 
                      (checkout.sourceName || 'Direct')
                    }
                  </td>
                  <td>${checkout.shop?.name || 'N/A'}</td>
                  <td>${new Date(checkout.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderRecentOrders(orders) {
    if (!orders || orders.length === 0) {
      return `
        <div class="recent-orders">
          <h3>Recent Orders</h3>
          <div class="no-data">No order data available</div>
        </div>
      `;
    }

    return `
      <div class="recent-orders">
        <h3>Recent Orders</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Financial Status</th>
                <th>Fulfillment</th>
                <th>Business</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${order.name}</td>
                  <td>${order.email || 'N/A'}</td>
                  <td>${order.totalPrice} ${order.currency}</td>
                  <td><span class="status-badge ${order.financialStatus}">${order.financialStatus}</span></td>
                  <td>${order.fulfillmentStatus || 'N/A'}</td>
                  <td>${order.shop?.name || 'N/A'}</td>
                  <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderTrends(trends) {
    return `
      <div class="trends">
        <h3>Performance Trends</h3>
        <div class="trends-grid">
          <div class="trend-card">
            <h4>Last 7 Days</h4>
            <div class="trend-stats">
              <div>${trends.last7Days.checkouts} Checkouts</div>
              <div>${trends.last7Days.orders} Orders</div>
              <div>${trends.last7Days.revenue} Revenue</div>
            </div>
          </div>
          <div class="trend-card">
            <h4>Last 30 Days</h4>
            <div class="trend-stats">
              <div>${trends.last30Days.checkouts} Checkouts</div>
              <div>${trends.last30Days.orders} Orders</div>
              <div>${trends.last30Days.revenue} Revenue</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const businessSelect = document.getElementById('business-select');
    if (businessSelect) {
      businessSelect.addEventListener('change', (e) => {
        const selectedDomain = e.target.value;
        this.render(selectedDomain);
      });
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BusinessDashboard;
}
