// PriceHunt Tracking via Proxy (CORS-free solution)
(function() {
  'use strict';
  
  // Configuration
  const config = {
    businessId: '10', // godislove.lt business ID
    affiliateId: 'pavlo4', // Default affiliate ID
    proxyUrl: 'https://pavlo4.netlify.app/track-proxy.html',
    debug: true
  };

  function log(message, level = 'info') {
    if (config.debug) {
      const prefix = '[PriceHunt Proxy Tracker]';
      const timestamp = new Date().toISOString();
      switch (level) {
        case 'error':
          console.error(prefix, `[${timestamp}]`, message);
          break;
        case 'warn':
          console.warn(prefix, `[${timestamp}]`, message);
          break;
        default:
          console.log(prefix, `[${timestamp}]`, message);
      }
    }
  }

  function sendEvent(eventType, data = {}) {
    const eventData = {
      event_type: eventType,
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      platform: 'shopify',
      session_id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: Date.now(),
      url: window.location.href,
      data: data,
      page_title: document.title
    };

    log('Sending event: ' + eventType);
    log('Event data:', eventData);

    // Send via postMessage to proxy
    const proxyWindow = window.open(config.proxyUrl, 'pricehunt_proxy', 'width=400,height=600');
    
    if (proxyWindow) {
      // Wait for proxy to load
      setTimeout(() => {
        proxyWindow.postMessage({
          type: 'tracking_event',
          event: eventData
        }, 'https://pavlo4.netlify.app');
        
        log('Event sent via proxy');
      }, 1000);
    } else {
      log('Failed to open proxy window - popup blocked?', 'error');
    }
  }

  // Track page view on load
  function trackPageView() {
    sendEvent('page_view');
  }

  // Track add to cart events
  function trackAddToCart() {
    sendEvent('add_to_cart', {
      product_id: 'test-product',
      product_name: 'Test Product',
      product_price: '29.99',
      quantity: 1
    });
  }

  // Track checkout start
  function trackCheckoutStart() {
    sendEvent('checkout_start', {
      checkout_url: window.location.href
    });
  }

  // Set up event listeners
  function setupEventListeners() {
    // Track form submissions (add to cart)
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.action && (form.action.includes('/cart/add') || form.action.includes('cart'))) {
        log('Add to cart form submitted');
        trackAddToCart();
      }
    });

    // Track button clicks
    document.addEventListener('click', function(e) {
      const target = e.target;
      const text = target.textContent?.toLowerCase() || '';
      
      // Check for add to cart buttons
      if (text.includes('add to cart') || text.includes('buy now') || text.includes('add to bag')) {
        log('Add to cart button clicked');
        trackAddToCart();
      }
      
      // Check for checkout buttons
      if (text.includes('checkout') || target.href?.includes('/checkout')) {
        log('Checkout button clicked');
        trackCheckoutStart();
      }
    });
  }

  // Initialize
  function init() {
    log('PriceHunt Proxy Tracker initialized');
    trackPageView();
    setupEventListeners();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose functions globally for manual testing
  window.PriceHuntProxy = {
    trackPageView: trackPageView,
    trackAddToCart: trackAddToCart,
    trackCheckoutStart: trackCheckoutStart,
    sendEvent: sendEvent
  };

})();
