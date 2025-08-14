// Universal PriceHunt Tracker
// Tracks user interactions on business websites after redirects from pavlo4.netlify.app or ipick.io

(function() {
  'use strict';

  // Configuration - dynamically detect the appropriate endpoint
  function getTrackingEndpoint() {
    const currentHost = window.location.hostname;
    
    // If we're on the main app domain, use the production endpoint
    if (currentHost === 'ipick.io' || currentHost === 'pavlo4.netlify.app') {
      return 'https://ipick.io/api/track-event';
    }
    
    // For local development
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:8084/api/track-event';
    }
    
    // Default to production endpoint
    return 'https://ipick.io/api/track-event';
  }

  const TRACKING_ENDPOINT = getTrackingEndpoint();
  const DEBUG_MODE = false;

  // Utility functions
  function log(message, data = null) {
    if (DEBUG_MODE) {
      console.log('[PriceHunt Tracker]', message, data);
    }
  }

  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function getSessionId() {
    let sessionId = localStorage.getItem('pricehunt_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('pricehunt_session_id', sessionId);
    }
    return sessionId;
  }

  function extractBusinessInfo() {
    // Extract business info from URL parameters or meta tags
    const urlParams = new URLSearchParams(window.location.search);
    const businessId = urlParams.get('business_id') || urlParams.get('bid');
    const affiliateId = urlParams.get('affiliate_id') || urlParams.get('aid');
    
    // Fallback to meta tags
    if (!businessId) {
      const businessMeta = document.querySelector('meta[name="pricehunt-business-id"]');
      if (businessMeta) businessId = businessMeta.getAttribute('content');
    }
    
    if (!affiliateId) {
      const affiliateMeta = document.querySelector('meta[name="pricehunt-affiliate-id"]');
      if (affiliateMeta) affiliateId = affiliateMeta.getAttribute('content');
    }

    return { businessId, affiliateId };
  }

  function extractProductData() {
    const productData = {
      title: '',
      price: '',
      currency: '',
      image: '',
      url: window.location.href,
      category: '',
      brand: ''
    };

    // Try to extract product information from common selectors
    const titleSelectors = [
      'h1[data-testid="product-title"]',
      '.product-title',
      '.product-name',
      'h1',
      '[data-testid="title"]'
    ];

    const priceSelectors = [
      '[data-testid="price"]',
      '.price',
      '.product-price',
      '.current-price',
      '[class*="price"]'
    ];

    const imageSelectors = [
      '[data-testid="product-image"]',
      '.product-image img',
      '.product-photo img',
      'img[alt*="product"]'
    ];

    // Extract title
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        productData.title = element.textContent.trim();
        break;
      }
    }

    // Extract price
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const priceText = element.textContent.trim();
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          productData.price = priceMatch[0];
          productData.currency = priceText.replace(priceMatch[0], '').trim();
        }
        break;
      }
    }

    // Extract image
    for (const selector of imageSelectors) {
      const element = document.querySelector(selector);
      if (element && element.src) {
        productData.image = element.src;
        break;
      }
    }

    return productData;
  }

  function sendTrackingData(eventType, data = {}) {
    const { businessId, affiliateId } = extractBusinessInfo();
    
    if (!businessId || !affiliateId) {
      log('Missing business or affiliate ID, skipping tracking');
      return;
    }

    const trackingData = {
      event_type: eventType,
      business_id: businessId,
      affiliate_id: affiliateId,
      platform: 'web',
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      page_title: document.title,
      data: {
        ...data,
        ...extractProductData()
      }
    };

    log('Sending tracking data:', trackingData);

    fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        log('Event tracked successfully:', eventType);
      } else {
        log('Failed to track event:', result.error);
      }
    })
    .catch(error => {
      log('Error tracking event:', error);
    });
  }

  // Track add to cart
  function trackAddToCart(productData) {
    sendTrackingData("add_to_cart", {
      product_title: productData.title,
      product_price: productData.price,
      product_currency: productData.currency,
      product_image: productData.image,
      product_url: productData.url
    });
  }

  // Track page view
  function trackPageView() {
    sendTrackingData("page_view", {
      page_title: document.title,
      page_url: window.location.href
    });
  }

  // Track product view
  function trackProductView() {
    const productData = extractProductData();
    sendTrackingData("product_view", {
      product_title: productData.title,
      product_price: productData.price,
      product_currency: productData.currency,
      product_image: productData.image,
      product_url: productData.url
    });
  }

  // Track browse/category view
  function trackBrowse() {
    sendTrackingData("browse", {
      page_title: document.title,
      page_url: window.location.href,
      category: extractProductData().category
    });
  }

  // Event listeners
  function setupEventListeners() {
    // Track "Add to Cart" buttons
    document.addEventListener('click', function(e) {
      const target = e.target;
      const targetText = target.textContent.toLowerCase();
      
      if (target.matches('[data-track="add-to-cart"], .add-to-cart, [class*="cart"], [class*="add"]') ||
          targetText.includes('add to cart') ||
          targetText.includes('add to bag')) {
        
        const productData = extractProductData();
        trackAddToCart(productData);
      }
    });

    // Track form submissions that might be add to cart
    document.addEventListener('submit', function(e) {
      const form = e.target;
      const formAction = form.action.toLowerCase();
      
      if (formAction.includes('/cart/add') || 
          formAction.includes('cart') ||
          form.classList.contains('add-to-cart-form')) {
        
        const productData = extractProductData();
        trackAddToCart(productData);
      }
    });
  }

  // Initialize tracking
  function init() {
    log('Initializing PriceHunt Tracker');
    log('Using tracking endpoint:', TRACKING_ENDPOINT);
    
    // Track initial page view
    trackPageView();
    
    // Track product view if on product page
    if (window.location.pathname.includes('/product') || 
        window.location.pathname.includes('/item') ||
        document.querySelector('[data-testid="product-title"]')) {
      trackProductView();
    } else {
      // Track browse/category view
      trackBrowse();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    log('PriceHunt Tracker initialized');
  }

  // Expose functions globally for manual tracking
  window.PriceHuntTracker = {
    track: function(eventType, data) {
      switch(eventType) {
        case "page_view":
          trackPageView();
          break;
        case "product_view":
          trackProductView();
          break;
        case "add_to_cart":
          trackAddToCart(data);
          break;
        case "browse":
          trackBrowse();
          break;
        default:
          log('Unknown event type:', eventType);
      }
    },
    trackPageView: trackPageView,
    trackProductView: trackProductView,
    trackAddToCart: trackAddToCart,
    trackBrowse: trackBrowse
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
