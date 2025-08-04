// Shopify-specific tracking script
(function () {
  'use strict';

  // Configuration
  const config = {
    businessId: null,
    affiliateId: null,
    apiUrl: 'https://pavlo4.netlify.app/api',
    debug: false
  };

  // Get configuration from script tag
  function initConfig() {
    const script = document.currentScript || document.querySelector('script[src*="shopify-tracker.js"]');
    if (script) {
      config.businessId = script.getAttribute('data-business-id');
      config.affiliateId = script.getAttribute('data-affiliate-id');
      config.debug = script.getAttribute('data-debug') === 'true';
    }
  }

  // Generate unique session ID
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Send tracking data to API
  function sendTrackingData(eventType, data) {
    if (!config.businessId || !config.affiliateId) {
      if (config.debug) console.log('Tracking: Missing business_id or affiliate_id');
      return;
    }

    const trackingData = {
      event_type: eventType,
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      platform: 'shopify',
      session_id: config.sessionId,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: Date.now(),
      url: window.location.href,
      data: data
    };

    if (config.debug) {
      console.log('Tracking event:', eventType, data);
    }

    // Send to our API
    fetch(config.apiUrl + '/track-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData)
    }).catch(error => {
      if (config.debug) console.log('Tracking error:', error);
    });
  }

  // Extract product data from Shopify theme
  function extractProductData(element) {
    let productData = {};

    // Try to get data from Shopify theme object
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.product) {
      const product = window.Shopify.theme.product;
      productData = {
        product_id: product.id,
        product_name: product.title,
        price: product.price,
        currency: window.Shopify.currency?.active || 'USD'
      };
    }

    // Try to get data from element attributes
    if (element) {
      productData.product_id = productData.product_id || 
        element.getAttribute('data-product-id') ||
        element.getAttribute('data-variant-id') ||
        element.closest('[data-product-id]')?.getAttribute('data-product-id') ||
        element.closest('[data-variant-id]')?.getAttribute('data-variant-id');

      productData.product_name = productData.product_name ||
        element.getAttribute('data-product-title') ||
        element.getAttribute('title') ||
        element.closest('[data-product-title]')?.getAttribute('data-product-title');

      productData.price = productData.price ||
        element.getAttribute('data-product-price') ||
        element.getAttribute('data-price') ||
        element.closest('[data-product-price]')?.getAttribute('data-product-price');
    }

    // Try to get data from URL if on product page
    if (window.location.pathname.includes('/products/')) {
      const pathParts = window.location.pathname.split('/');
      const productHandle = pathParts[pathParts.indexOf('products') + 1];
      if (productHandle && !productData.product_id) {
        productData.product_id = productHandle;
      }
    }

    return productData;
  }

  // Track page view
  function trackPageView() {
    const pageData = {
      page_title: document.title,
      page_url: window.location.href,
      page_type: getPageType()
    };

    // Add product data if on product page
    if (window.location.pathname.includes('/products/')) {
      const productData = extractProductData();
      Object.assign(pageData, productData);
    }

    sendTrackingData('page_view', pageData);
  }

  // Get page type
  function getPageType() {
    const path = window.location.pathname;
    if (path.includes('/products/')) return 'product';
    if (path.includes('/collections/')) return 'collection';
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/checkout')) return 'checkout';
    if (path === '/' || path === '') return 'home';
    return 'other';
  }

  // Track add to cart
  function trackAddToCart(element) {
    const productData = extractProductData(element);
    sendTrackingData('add_to_cart', productData);
  }

  // Track purchase click
  function trackPurchaseClick(element) {
    const productData = extractProductData(element);
    sendTrackingData('purchase_click', productData);
  }

  // Track product view
  function trackProductView(element) {
    const productData = extractProductData(element);
    sendTrackingData('product_view', productData);
  }

  // Track conversion (purchase completed)
  function trackConversion() {
    let orderData = {};

    // Try to get order data from Shopify checkout
    if (window.Shopify && window.Shopify.checkout) {
      orderData = {
        order_id: window.Shopify.checkout.order_id,
        total_amount: window.Shopify.checkout.total_price,
        currency: window.Shopify.currency?.active || 'USD',
        products: window.Shopify.checkout.line_items || []
      };
    }

    // Try to get order data from URL parameters
    if (window.location.search.includes('order_id=')) {
      const urlParams = new URLSearchParams(window.location.search);
      orderData.order_id = orderData.order_id || urlParams.get('order_id');
    }

    sendTrackingData('conversion', orderData);
  }

  // Initialize tracking
  function initTracking() {
    config.sessionId = generateSessionId();
    initConfig();

    if (config.debug) {
      console.log('Shopify tracking initialized:', config);
    }

    // Track page view
    trackPageView();

    // Listen for clicks on common Shopify elements
    document.addEventListener('click', function (e) {
      const target = e.target;

      // Track add to cart buttons
      if (target.matches('[data-action="add-to-cart"], .btn--add-to-cart, [name="add"], [class*="add-to-cart"], [class*="cart-add"]')) {
        trackAddToCart(target);
      }

      // Track buy now buttons
      if (target.matches('[data-action="buy-it-now"], .btn--buy-it-now, [name="buy-it-now"], [class*="buy-now"], [class*="purchase-now"]')) {
        trackPurchaseClick(target);
      }

      // Track product links
      if (target.matches('a[href*="/products/"], .product-link, [class*="product"]')) {
        trackProductView(target);
      }
    });

    // Track Shopify-specific events
    if (window.Shopify) {
      // Track add to cart via AJAX
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        if (url && typeof url === 'string' && url.includes('/cart/add.js')) {
          // This is an add to cart request
          setTimeout(() => {
            trackAddToCart();
          }, 100);
        }
        return originalFetch.apply(this, args);
      };

      // Track checkout completion
      if (window.location.pathname.includes('/checkout') && window.location.search.includes('thank_you')) {
        setTimeout(() => {
          trackConversion();
        }, 1000);
      }
    }

    // Track form submissions (for custom checkout flows)
    document.addEventListener('submit', function (e) {
      const form = e.target;
      if (form.action && form.action.includes('checkout')) {
        trackPurchaseClick();
      }
    });

    // Track AJAX requests for cart updates
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (url && typeof url === 'string' && url.includes('/cart/add.js')) {
        this.addEventListener('load', function() {
          if (this.status === 200) {
            trackAddToCart();
          }
        });
      }
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }

  // Expose tracking functions globally
  window.trackEvent = function (eventType, data) {
    switch (eventType) {
      case 'purchase_click':
        trackPurchaseClick();
        break;
      case 'product_view':
        trackProductView();
        break;
      case 'add_to_cart':
        trackAddToCart();
        break;
      case 'conversion':
        trackConversion();
        break;
      default:
        sendTrackingData(eventType, data);
    }
  };

  // Expose configuration for debugging
  window.trackerConfig = config;

})(); 