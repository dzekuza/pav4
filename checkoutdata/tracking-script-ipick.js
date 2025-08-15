/**
 * iPick.io Tracking Script for Shopify Integration
 * This script handles referral tracking and UTM parameter generation
 * for tracking conversions from ipick.io to Shopify stores
 */

class IpickTracking {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'https://checkoutdata--development.gadget.app/api',
      affiliateId: config.affiliateId || 'ipick_default',
      utmSource: config.utmSource || 'ipick',
      utmMedium: config.utmMedium || 'price_comparison',
      utmCampaign: config.utmCampaign || 'product_referral',
      ...config
    };
    
    this.init();
  }

  init() {
    // Initialize tracking when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupTracking());
    } else {
      this.setupTracking();
    }
  }

  setupTracking() {
    // Track page views
    this.trackPageView();
    
    // Setup click tracking for product links
    this.setupClickTracking();
    
    // Track user interactions
    this.trackUserInteractions();
  }

  /**
   * Generate UTM parameters for tracking
   */
  generateUTMParams(additionalParams = {}) {
    const baseParams = {
      utm_source: this.config.utmSource,
      utm_medium: this.config.utmMedium,
      utm_campaign: this.config.utmCampaign,
      ref: this.config.affiliateId,
      ...additionalParams
    };

    return new URLSearchParams(baseParams).toString();
  }

  /**
   * Create a tracking URL with UTM parameters
   */
  createTrackingUrl(originalUrl, additionalParams = {}) {
    try {
      const url = new URL(originalUrl);
      const utmParams = this.generateUTMParams(additionalParams);
      
      // Add UTM parameters to existing URL
      url.search = url.search ? `${url.search}&${utmParams}` : `?${utmParams}`;
      
      return url.toString();
    } catch (error) {
      console.error('Error creating tracking URL:', error);
      return originalUrl;
    }
  }

  /**
   * Track a referral click
   */
  async trackReferralClick(targetUrl, productData = {}) {
    try {
      const trackingData = {
        referralId: this.config.affiliateId,
        businessDomain: this.extractDomain(targetUrl),
        targetUrl: targetUrl,
        sourceUrl: window.location.href,
        productName: productData.name || productData.title || '',
        userId: this.getUserId(),
        utmSource: this.config.utmSource,
        utmMedium: this.config.utmMedium,
        utmCampaign: this.config.utmCampaign
      };

      const response = await fetch(`${this.config.apiUrl}/trackReferral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData)
      });

      if (response.ok) {
        console.log('Referral click tracked successfully');
        return true;
      } else {
        console.error('Failed to track referral click:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error tracking referral click:', error);
      return false;
    }
  }

  /**
   * Track page view
   */
  async trackPageView() {
    try {
      const pageData = {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        userId: this.getUserId(),
        timestamp: new Date().toISOString()
      };

      // You can implement page view tracking here
      console.log('Page view tracked:', pageData);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  /**
   * Setup click tracking for product links
   */
  setupClickTracking() {
    // Track clicks on product links
    document.addEventListener('click', async (event) => {
      const link = event.target.closest('a');
      if (!link) return;

      const href = link.href;
      if (!href) return;

      // Check if this is a product link (modify selector based on your HTML structure)
      const isProductLink = this.isProductLink(link);
      
      if (isProductLink) {
        event.preventDefault();
        
        // Extract product data
        const productData = this.extractProductData(link);
        
        // Track the click
        const tracked = await this.trackReferralClick(href, productData);
        
        if (tracked) {
          // Create tracking URL and redirect
          const trackingUrl = this.createTrackingUrl(href, {
            product_id: productData.id,
            product_name: productData.name
          });
          
          // Open in new tab or redirect
          if (link.target === '_blank' || event.ctrlKey || event.metaKey) {
            window.open(trackingUrl, '_blank');
          } else {
            window.location.href = trackingUrl;
          }
        } else {
          // Fallback to original behavior
          if (link.target === '_blank' || event.ctrlKey || event.metaKey) {
            window.open(href, '_blank');
          } else {
            window.location.href = href;
          }
        }
      }
    });
  }

  /**
   * Track user interactions
   */
  trackUserInteractions() {
    // Track search interactions
    const searchInputs = document.querySelectorAll('input[type="search"], .search-input, #search');
    searchInputs.forEach(input => {
      input.addEventListener('search', (event) => {
        this.trackSearch(event.target.value);
      });
    });

    // Track filter interactions
    const filterElements = document.querySelectorAll('.filter, .sort, select');
    filterElements.forEach(element => {
      element.addEventListener('change', (event) => {
        this.trackFilter(event.target.value, event.target.name || event.target.className);
      });
    });
  }

  /**
   * Track search queries
   */
  async trackSearch(query) {
    try {
      console.log('Search tracked:', query);
      // Implement search tracking here
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  /**
   * Track filter changes
   */
  async trackFilter(value, filterType) {
    try {
      console.log('Filter tracked:', { value, filterType });
      // Implement filter tracking here
    } catch (error) {
      console.error('Error tracking filter:', error);
    }
  }

  /**
   * Check if a link is a product link
   */
  isProductLink(link) {
    const href = link.href.toLowerCase();
    const text = link.textContent.toLowerCase();
    
    // Check for common product link patterns
    const productPatterns = [
      /\/product\//,
      /\/item\//,
      /\/buy\//,
      /\/shop\//,
      /amazon\.com/,
      /ebay\.com/,
      /walmart\.com/,
      /target\.com/,
      /bestbuy\.com/
    ];
    
    return productPatterns.some(pattern => pattern.test(href)) ||
           text.includes('buy') || 
           text.includes('shop') ||
           link.classList.contains('product-link') ||
           link.dataset.productId;
  }

  /**
   * Extract product data from a link
   */
  extractProductData(link) {
    return {
      id: link.dataset.productId || link.dataset.id || '',
      name: link.dataset.productName || link.title || link.textContent.trim(),
      price: link.dataset.price || '',
      category: link.dataset.category || '',
      brand: link.dataset.brand || ''
    };
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return '';
    }
  }

  /**
   * Get user ID (implement based on your user system)
   */
  getUserId() {
    // Implement based on your user authentication system
    return localStorage.getItem('ipick_user_id') || 
           sessionStorage.getItem('ipick_user_id') || 
           this.generateAnonymousId();
  }

  /**
   * Generate anonymous user ID
   */
  generateAnonymousId() {
    let anonymousId = localStorage.getItem('ipick_anonymous_id');
    if (!anonymousId) {
      anonymousId = 'anon_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ipick_anonymous_id', anonymousId);
    }
    return anonymousId;
  }

  /**
   * Manual tracking method for custom implementations
   */
  async trackCustomEvent(eventType, eventData = {}) {
    try {
      const eventPayload = {
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
        userId: this.getUserId(),
        url: window.location.href
      };

      const response = await fetch(`${this.config.apiUrl}/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload)
      });

      if (response.ok) {
        console.log('Custom event tracked successfully:', eventType);
        return true;
      } else {
        console.error('Failed to track custom event:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error tracking custom event:', error);
      return false;
    }
  }
}

// Auto-initialize if script is loaded directly
if (typeof window !== 'undefined') {
  window.IpickTracking = IpickTracking;
  
  // Auto-initialize with default config
  if (window.ipickTrackingConfig) {
    new IpickTracking(window.ipickTrackingConfig);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IpickTracking;
}

// Example usage:
/*
// Initialize tracking
const tracking = new IpickTracking({
  affiliateId: 'your_affiliate_id',
  apiUrl: 'https://checkoutdata--development.gadget.app/api',
  utmSource: 'ipick',
  utmMedium: 'price_comparison',
  utmCampaign: 'product_referral'
});

// Manual tracking example
tracking.trackCustomEvent('product_view', {
  productId: '123',
  productName: 'Sample Product',
  price: '29.99'
});

// Create tracking URL manually
const trackingUrl = tracking.createTrackingUrl('https://example.com/product/123', {
  product_id: '123',
  product_name: 'Sample Product'
});
*/
