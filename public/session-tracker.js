/**
 * iPick Session Tracker
 * Embed this script on your business website to track user sessions and link with checkout data
 */

(function() {
  'use strict';

  // Configuration
  const TRACKER_CONFIG = {
    apiUrl: 'https://your-domain.com/api/track-session', // Replace with your actual API URL
    businessId: '', // Will be set by the business
    affiliateId: '', // Will be set by the business
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    debug: false
  };

  // Session management
  let currentSessionId = null;
  let sessionStartTime = null;
  let lastActivityTime = null;
  let isTracking = false;

  // Initialize tracker
  function initTracker(config) {
    if (config) {
      Object.assign(TRACKER_CONFIG, config);
    }

    // Try to get business ID from meta tags if not provided in config
    if (!TRACKER_CONFIG.businessId) {
      const businessIdMeta = document.querySelector('meta[name="ipick-business-id"]');
      if (businessIdMeta) {
        TRACKER_CONFIG.businessId = businessIdMeta.getAttribute('content');
      }
    }

    // Try to get affiliate ID from meta tags if not provided in config
    if (!TRACKER_CONFIG.affiliateId) {
      const affiliateIdMeta = document.querySelector('meta[name="ipick-affiliate-id"]');
      if (affiliateIdMeta) {
        TRACKER_CONFIG.affiliateId = affiliateIdMeta.getAttribute('content');
      }
    }

    if (!TRACKER_CONFIG.businessId) {
      console.error('iPick Tracker: businessId is required. Add it via config or meta tag.');
      return;
    }

    // Generate or retrieve session ID
    currentSessionId = getOrCreateSessionId();
    sessionStartTime = Date.now();
    lastActivityTime = Date.now();

    // Start tracking
    startTracking();

    if (TRACKER_CONFIG.debug) {
      console.log('iPick Tracker initialized:', {
        businessId: TRACKER_CONFIG.businessId,
        sessionId: currentSessionId,
        sessionStartTime: new Date(sessionStartTime)
      });
    }
  }

  // Generate or retrieve session ID
  function getOrCreateSessionId() {
    let sessionId = localStorage.getItem('ipick_session_id');
    
    if (!sessionId) {
      sessionId = 'ipick_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ipick_session_id', sessionId);
    }

    return sessionId;
  }

  // Start tracking
  function startTracking() {
    if (isTracking) return;
    isTracking = true;

    // Track page view
    trackEvent('page_view', {
      page_title: document.title,
      url: window.location.href,
      referrer: document.referrer
    });

    // Set up event listeners
    setupEventListeners();

    // Set up session timeout
    setupSessionTimeout();

    // Track user activity
    trackUserActivity();
  }

  // Set up event listeners
  function setupEventListeners() {
    // Track clicks on product links
    document.addEventListener('click', function(e) {
      const target = e.target.closest('a');
      if (target && target.href) {
        const url = new URL(target.href);
        
        // Check if it's a product page
        if (url.pathname.includes('/product/') || url.pathname.includes('/products/')) {
          trackEvent('product_view', {
            url: target.href,
            product_title: target.textContent.trim()
          });
        }
      }
    });

    // Track form submissions (add to cart, checkout)
    document.addEventListener('submit', function(e) {
      const form = e.target;
      const action = form.action || '';
      const method = form.method || 'GET';

      if (action.includes('cart') || action.includes('checkout') || 
          form.querySelector('[name*="cart"]') || form.querySelector('[name*="checkout"]')) {
        trackEvent('add_to_cart', {
          url: window.location.href,
          form_action: action,
          form_method: method
        });
      }
    });

    // Track checkout events
    if (window.location.href.includes('checkout') || window.location.href.includes('cart')) {
      trackEvent('checkout_start', {
        url: window.location.href,
        checkout_token: getCheckoutToken()
      });
    }
  }

  // Set up session timeout
  function setupSessionTimeout() {
    setInterval(function() {
      const now = Date.now();
      if (now - lastActivityTime > TRACKER_CONFIG.sessionTimeout) {
        // Session expired, create new session
        currentSessionId = getOrCreateSessionId();
        sessionStartTime = now;
        lastActivityTime = now;
        
        if (TRACKER_CONFIG.debug) {
          console.log('iPick Tracker: New session created due to timeout');
        }
      }
    }, 60000); // Check every minute
  }

  // Track user activity
  function trackUserActivity() {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(function(eventType) {
      document.addEventListener(eventType, function() {
        lastActivityTime = Date.now();
      }, { passive: true });
    });
  }

  // Get checkout token from URL or form
  function getCheckoutToken() {
    // Try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token') || urlParams.get('checkout_token') || urlParams.get('cart_token');
    
    // Try to get from form fields
    if (!token) {
      const tokenInput = document.querySelector('input[name="token"], input[name="checkout_token"], input[name="cart_token"]');
      if (tokenInput) {
        token = tokenInput.value;
      }
    }

    // Try to get from Shopify checkout
    if (!token && window.Shopify && window.Shopify.checkout) {
      token = window.Shopify.checkout.token;
    }

    return token;
  }

  // Track event
  function trackEvent(eventType, data = {}) {
    if (!currentSessionId || !isTracking) return;

    const event = {
      event_type: eventType,
      business_id: TRACKER_CONFIG.businessId,
      affiliate_id: TRACKER_CONFIG.affiliateId,
      platform: 'web',
      session_id: currentSessionId,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      page_title: document.title,
      data: data
    };

    // Send event to server
    fetch(TRACKER_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    })
    .then(response => response.json())
    .then(result => {
      if (TRACKER_CONFIG.debug) {
        console.log('iPick Tracker Event:', eventType, result);
      }
    })
    .catch(error => {
      if (TRACKER_CONFIG.debug) {
        console.error('iPick Tracker Error:', error);
      }
    });
  }

  // Track checkout completion
  function trackCheckoutComplete(orderData = {}) {
    const checkoutToken = getCheckoutToken();
    
    trackEvent('checkout_complete', {
      checkout_token: checkoutToken,
      totalPrice: orderData.totalPrice || '',
      orderId: orderData.orderId || '',
      currency: orderData.currency || '',
      ...orderData
    });
  }

  // Track order creation
  function trackOrderCreated(orderData = {}) {
    trackEvent('order_created', {
      order_id: orderData.orderId || '',
      totalPrice: orderData.totalPrice || '',
      currency: orderData.currency || '',
      financialStatus: orderData.financialStatus || '',
      fulfillmentStatus: orderData.fulfillmentStatus || '',
      ...orderData
    });
  }

  // Shopify integration
  function setupShopifyIntegration() {
    if (typeof window.Shopify !== 'undefined') {
      // Track Shopify checkout events
      if (window.Shopify.checkout) {
        const checkout = window.Shopify.checkout;
        
        // Track checkout completion
        if (checkout.order_id) {
          trackOrderCreated({
            orderId: checkout.order_id,
            totalPrice: checkout.total_price,
            currency: checkout.currency,
            financialStatus: checkout.financial_status,
            fulfillmentStatus: checkout.fulfillment_status
          });
        }
      }

      // Listen for Shopify checkout events
      if (window.Shopify.on) {
        window.Shopify.on('checkout:completed', function(event) {
          trackCheckoutComplete({
            totalPrice: event.total_price,
            orderId: event.order_id,
            currency: event.currency
          });
        });
      }
    }
  }

  // Public API
  window.iPickTracker = {
    init: initTracker,
    track: trackEvent,
    trackCheckoutComplete: trackCheckoutComplete,
    trackOrderCreated: trackOrderCreated,
    getSessionId: () => currentSessionId,
    setupShopifyIntegration: setupShopifyIntegration
  };

  // Auto-initialize if config is available or meta tags are present
  if (window.iPickTrackerConfig) {
    initTracker(window.iPickTrackerConfig);
  } else {
    // Try to initialize with meta tags
    const businessIdMeta = document.querySelector('meta[name="ipick-business-id"]');
    const affiliateIdMeta = document.querySelector('meta[name="ipick-affiliate-id"]');
    
    if (businessIdMeta) {
      initTracker({
        businessId: businessIdMeta.getAttribute('content'),
        affiliateId: affiliateIdMeta ? affiliateIdMeta.getAttribute('content') : '',
        apiUrl: 'https://ipick.io/api/track-session'
      });
    }
  }

  // Setup Shopify integration if available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupShopifyIntegration);
  } else {
    setupShopifyIntegration();
  }

})();
