// PriceHunt Shopify Integration
(function() {
  'use strict';

  // Configuration
  const config = {
    businessId: null,
    affiliateId: null,
    debug: false,
    endpoint: 'https://paaav.vercel.app/api/track-event',
    sessionId: generateSessionId(),
    pageLoadTime: Date.now()
  };

  // Initialize tracking
  function init() {
    // Get configuration from script tag
    const script = document.currentScript || document.querySelector('script[src*="shopify-tracker.js"]');
    if (script) {
      config.businessId = script.getAttribute('data-business-id');
      config.affiliateId = script.getAttribute('data-affiliate-id');
      config.debug = script.getAttribute('data-debug') === 'true';
    }

    // Validate required parameters
    if (!config.businessId || !config.affiliateId) {
      log('Error: Missing required parameters (business-id or affiliate-id)', 'error');
      return;
    }

    log('PriceHunt Shopify Tracker initialized', 'info');
    
    // Track page load
    trackPageView();
    
    // Set up event listeners
    setupEventListeners();
    
    // Track initial product data if available
    trackInitialProduct();
  }

  // Generate unique session ID
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Logging function
  function log(message, level = 'info') {
    if (config.debug) {
      const prefix = '[PriceHunt Tracker]';
      switch (level) {
        case 'error':
          console.error(prefix, message);
          break;
        case 'warn':
          console.warn(prefix, message);
          break;
        default:
          console.log(prefix, message);
      }
    }
  }

  // Track page view
  function trackPageView() {
    const eventData = {
      event_type: 'page_view',
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      timestamp: Date.now()
    };

    sendEvent(eventData);
  }

  // Track initial product data
  function trackInitialProduct() {
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.product) {
      const product = window.Shopify.theme.product;
      
      const eventData = {
        event_type: 'product_view',
        business_id: config.businessId,
        affiliate_id: config.affiliateId,
        session_id: config.sessionId,
        product_id: product.id,
        product_name: product.title,
        product_price: product.price,
        product_variant_id: product.selected_or_first_available_variant?.id,
        product_url: window.location.href,
        timestamp: Date.now()
      };

      sendEvent(eventData);
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    // Track add to cart events
    document.addEventListener('click', function(e) {
      const target = e.target;
      
      // Check for add to cart buttons
      if (isAddToCartButton(target)) {
        trackAddToCart(target);
      }
      
      // Check for product clicks
      if (isProductLink(target)) {
        trackProductClick(target);
      }
    });

    // Track form submissions (checkout)
    document.addEventListener('submit', function(e) {
      if (isCheckoutForm(e.target)) {
        trackCheckoutStart(e.target);
      }
    });

    // Track AJAX add to cart (for dynamic cart updates)
    if (window.Shopify && window.Shopify.onCartUpdate) {
      window.Shopify.onCartUpdate = function(cart) {
        trackCartUpdate(cart);
      };
    }

    // Shopify-specific tracking
    document.addEventListener('DOMContentLoaded', function() {
      // Track product page views
      if (window.Shopify && window.Shopify.theme) {
        const product = window.Shopify.theme.product;
        if (product) {
          window.PriceHuntTracker.track('product_view', {
            product_id: product.id,
            product_name: product.title,
            product_price: product.price
          });
        }
      }
      
      // Track add to cart
      document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action="add-to-cart"], .add-to-cart, [class*="cart"]')) {
          window.PriceHuntTracker.track('add_to_cart', {
            product_id: e.target.getAttribute('data-product-id'),
            product_name: e.target.getAttribute('data-product-name')
          });
        }
      });
    });
  }

  // Check if element is an add to cart button
  function isAddToCartButton(element) {
    const selectors = [
      '[data-action="add-to-cart"]',
      '.add-to-cart',
      '[class*="cart"]',
      '[class*="add"]',
      'button[type="submit"]',
      'input[type="submit"]'
    ];
    
    return selectors.some(selector => element.matches(selector)) ||
           element.textContent.toLowerCase().includes('add to cart') ||
           element.textContent.toLowerCase().includes('buy now');
  }

  // Check if element is a product link
  function isProductLink(element) {
    const href = element.href || element.getAttribute('href');
    if (!href) return false;
    
    return href.includes('/products/') || 
           element.closest('a[href*="/products/"]') ||
           element.closest('.product-item') ||
           element.closest('[class*="product"]');
  }

  // Check if form is checkout form
  function isCheckoutForm(form) {
    return form.action.includes('checkout') ||
           form.action.includes('cart') ||
           form.getAttribute('data-action') === 'checkout';
  }

  // Track add to cart event
  function trackAddToCart(button) {
    const productData = extractProductData(button);
    
    const eventData = {
      event_type: 'add_to_cart',
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      product_id: productData.id,
      product_name: productData.name,
      product_price: productData.price,
      product_variant_id: productData.variantId,
      quantity: productData.quantity || 1,
      timestamp: Date.now()
    };

    sendEvent(eventData);
  }

  // Track product click
  function trackProductClick(link) {
    const productData = extractProductData(link);
    
    const eventData = {
      event_type: 'product_click',
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      product_id: productData.id,
      product_name: productData.name,
      product_price: productData.price,
      product_url: link.href || link.getAttribute('href'),
      timestamp: Date.now()
    };

    sendEvent(eventData);
  }

  // Track checkout start
  function trackCheckoutStart(form) {
    const eventData = {
      event_type: 'checkout_start',
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      form_action: form.action,
      timestamp: Date.now()
    };

    sendEvent(eventData);
  }

  // Track cart update
  function trackCartUpdate(cart) {
    const eventData = {
      event_type: 'cart_update',
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      cart_total: cart.total_price,
      item_count: cart.item_count,
      timestamp: Date.now()
    };

    sendEvent(eventData);
  }

  // Extract product data from element
  function extractProductData(element) {
    let data = {
      id: null,
      name: null,
      price: null,
      variantId: null,
      quantity: 1
    };

    // Try to get data from data attributes
    data.id = element.getAttribute('data-product-id') || 
              element.getAttribute('data-id') ||
              element.closest('[data-product-id]')?.getAttribute('data-product-id');
    
    data.name = element.getAttribute('data-product-name') ||
                element.getAttribute('data-title') ||
                element.closest('[data-product-name]')?.getAttribute('data-product-name');
    
    data.price = element.getAttribute('data-price') ||
                 element.closest('[data-price]')?.getAttribute('data-price');
    
    data.variantId = element.getAttribute('data-variant-id') ||
                     element.getAttribute('data-variant') ||
                     element.closest('[data-variant-id]')?.getAttribute('data-variant-id');

    // Try to get data from Shopify global object
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.product) {
      const product = window.Shopify.theme.product;
      if (!data.id) data.id = product.id;
      if (!data.name) data.name = product.title;
      if (!data.price) data.price = product.price;
      if (!data.variantId) data.variantId = product.selected_or_first_available_variant?.id;
    }

    // Try to get data from meta tags
    if (!data.name) {
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTitle) data.name = metaTitle.getAttribute('content');
    }

    if (!data.price) {
      const metaPrice = document.querySelector('meta[property="product:price:amount"]');
      if (metaPrice) data.price = metaPrice.getAttribute('content');
    }

    return data;
  }

  // Send event to server
  function sendEvent(eventData) {
    log('Sending event: ' + eventData.event_type, 'info');
    
    fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      log('Event sent successfully: ' + eventData.event_type, 'info');
    })
    .catch(error => {
      log('Failed to send event: ' + error.message, 'error');
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose tracking functions globally for manual tracking
  window.PriceHuntTracker = {
    track: function(eventType, data) {
      const eventData = {
        event_type: eventType,
        business_id: config.businessId,
        affiliate_id: config.affiliateId,
        session_id: config.sessionId,
        ...data,
        timestamp: Date.now()
      };
      sendEvent(eventData);
    },
    
    trackPageView: trackPageView,
    trackProductView: trackInitialProduct,
    trackAddToCart: trackAddToCart,
    trackProductClick: trackProductClick,
    trackCheckoutStart: trackCheckoutStart,
    trackCartUpdate: trackCartUpdate
  };

})(); 