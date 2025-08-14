// Enhanced Shopify Tracker - Advanced Event Tracking
// Tracks user interactions on Shopify stores with enhanced features

(function() {
  'use strict';

  // Configuration
  const TRACKING_ENDPOINT = 'https://ipick.io/api/track-event';
  const DEBUG_MODE = true;

  // Get configuration from script tag
  const script = document.currentScript || document.querySelector('script[src*="shopify-tracker-enhanced.js"]');
  const businessId = script?.getAttribute('data-business-id');
  const affiliateId = script?.getAttribute('data-affiliate-id');
  const debug = script?.getAttribute('data-debug') === 'true';

  // Utility functions
  function log(message, data = null) {
    if (DEBUG_MODE || debug) {
      console.log('[PriceHunt]', message, data);
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
    // Use script attributes or fallback to URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bid = businessId || urlParams.get('business_id') || urlParams.get('bid');
    const aid = affiliateId || urlParams.get('affiliate_id') || urlParams.get('aid');
    
    // Fallback to meta tags
    let finalBusinessId = bid;
    let finalAffiliateId = aid;
    
    if (!finalBusinessId) {
      const businessMeta = document.querySelector('meta[name="pricehunt-business-id"]');
      if (businessMeta) finalBusinessId = businessMeta.getAttribute('content');
    }
    
    if (!finalAffiliateId) {
      const affiliateMeta = document.querySelector('meta[name="pricehunt-affiliate-id"]');
      if (affiliateMeta) finalAffiliateId = affiliateMeta.getAttribute('content');
    }

    return { businessId: finalBusinessId, affiliateId: finalAffiliateId };
  }

  function extractShopifyProductData() {
    const productData = {
      title: '',
      price: '',
      currency: '',
      image: '',
      url: window.location.href,
      productId: '',
      variantId: '',
      category: '',
      brand: ''
    };

    // Enhanced Shopify selectors
    const titleSelectors = [
      'h1[data-testid="product-title"]',
      '.product-title',
      '.product-name',
      'h1',
      '[data-testid="title"]',
      '.product-single__title',
      '[data-product-title]',
      '.product__title'
    ];

    const priceSelectors = [
      '[data-testid="price"]',
      '.price',
      '.product-price',
      '.current-price',
      '[class*="price"]',
      '.product-single__price',
      '[data-product-price]',
      '.product__price'
    ];

    const imageSelectors = [
      '[data-testid="product-image"]',
      '.product-image img',
      '.product-photo img',
      'img[alt*="product"]',
      '.product-single__photo img',
      '[data-product-image]',
      '.product__image img'
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

    // Extract product ID from Shopify meta tags
    const productIdMeta = document.querySelector('meta[property="og:product:retailer_item_id"]');
    if (productIdMeta) {
      productData.productId = productIdMeta.getAttribute('content');
    }

    // Extract variant ID from URL or form
    const variantMatch = window.location.search.match(/variant=(\d+)/);
    if (variantMatch) {
      productData.variantId = variantMatch[1];
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
      platform: 'shopify',
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      page_title: document.title,
      data: {
        ...data,
        ...extractShopifyProductData()
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

  // Track page view - This is the missing function!
  function trackPageView() {
    log('Tracking page view');
    sendTrackingData("page_view", {
      page_title: document.title,
      page_url: window.location.href
    });
  }

  // Track checkout events
  function trackCheckout(checkoutData = {}) {
    log('Tracking checkout');
    sendTrackingData("checkout", {
      checkout_id: checkoutData.id,
      total_price: checkoutData.totalPrice,
      currency: checkoutData.currency,
      email: checkoutData.email,
      ...checkoutData
    });
  }

  // Track product view
  function trackProductView() {
    log('Tracking product view');
    const productData = extractShopifyProductData();
    sendTrackingData("product_view", {
      product_title: productData.title,
      product_price: productData.price,
      product_currency: productData.currency,
      product_image: productData.image,
      product_url: productData.url,
      product_id: productData.productId,
      variant_id: productData.variantId
    });
  }

  // Track add to cart
  function trackAddToCart(productData) {
    log('Tracking add to cart');
    sendTrackingData("add_to_cart", {
      product_title: productData.title,
      product_price: productData.price,
      product_currency: productData.currency,
      product_image: productData.image,
      product_url: productData.url,
      product_id: productData.productId,
      variant_id: productData.variantId
    });
  }

  // Track browse/category view
  function trackBrowse() {
    log('Tracking browse');
    sendTrackingData("browse", {
      page_title: document.title,
      page_url: window.location.href,
      category: extractShopifyProductData().category
    });
  }

  // Enhanced add to cart detection for Shopify themes
  function enhanceAddToCartTracking() {
    log('Setting up enhanced cart tracking...');
    
    // Listen for Shopify's native add to cart events
    document.addEventListener('DOMContentLoaded', function() {
      // Common Shopify add to cart selectors
      const addToCartSelectors = [
        '[data-action="add-to-cart"]',
        '.add-to-cart',
        '[data-add-to-cart]',
        '[data-testid*="add-to-cart"]',
        '[aria-label*="add to cart"]',
        '[title*="add to cart"]',
        '.btn-add-to-cart',
        '.product-form__submit',
        '.add-to-cart-btn',
        '.product-form__cart-submit',
        '[data-product-form] button[type="submit"]'
      ];

      // Add click listeners to all add to cart buttons
      addToCartSelectors.forEach((selector) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
          button.addEventListener('click', function(e) {
            log('Add to cart button clicked:', button);
            const productData = extractShopifyProductData();
            trackAddToCart(productData);
          });
        });
      });

      // Listen for Shopify cart events
      document.addEventListener("cart:updated", function (e) {
        log('Cart updated event:', e.detail);
      });

      document.addEventListener("cart:added", function (e) {
        log('Product added to cart event:', e.detail);
        const productData = extractShopifyProductData();
        trackAddToCart(productData);
      });

      // Listen for form submissions
      document.addEventListener('submit', function(e) {
        const form = e.target;
        const formAction = form.action.toLowerCase();
        
        if (formAction.includes('/cart/add') || 
            formAction.includes('cart') ||
            form.classList.contains('add-to-cart-form') ||
            form.classList.contains('product-form')) {
          
          log('Add to cart form submitted');
          const productData = extractShopifyProductData();
          trackAddToCart(productData);
        }
      });
    });
  }

  // Event listeners
  function setupEventListeners() {
    log('Setting up event listeners...');
    
    // Track "Add to Cart" buttons
    document.addEventListener('click', function(e) {
      const target = e.target;
      const targetText = target.textContent.toLowerCase();
      
      if (target.matches('[data-track="add-to-cart"], .add-to-cart, [class*="cart"], [class*="add"]') ||
          targetText.includes('add to cart') ||
          targetText.includes('add to bag')) {
        
        log('Add to cart button clicked via event listener');
        const productData = extractShopifyProductData();
        trackAddToCart(productData);
      }
    });
  }

  // Initialize tracking
  function init() {
    log('Initializing enhanced tracking...');
    
    // Check if we're on a Shopify site
    if (window.Shopify || document.querySelector('[data-shopify]') || window.location.hostname.includes('myshopify.com')) {
      log('Shopify theme detected');
    }
    
    // Track initial page view
    trackPageView();
    
    // Track product view if on product page
    if (window.location.pathname.includes('/product') || 
        window.location.pathname.includes('/products') ||
        document.querySelector('[data-testid="product-title"]') ||
        document.querySelector('.product-single__title')) {
      trackProductView();
    } else {
      // Track browse/category view
      trackBrowse();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Enhanced Shopify-specific tracking
    enhanceAddToCartTracking();
    
    log('Enhanced tracking initialized successfully');
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
        case "checkout":
          trackCheckout(data);
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
    trackCheckout: trackCheckout,
    trackBrowse: trackBrowse
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
