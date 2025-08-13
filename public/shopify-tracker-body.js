/**
 * PriceHunt Shopify Tracker - Body Script
 * 
 * This script should be added to the <body> section of your Shopify theme.
 * It handles all the actual tracking logic and event detection.
 * 
 * Usage: Add this script to your theme.liquid file just before the closing </body> tag
 */

(function() {
  'use strict';
  
  // Wait for head script to be ready
  function waitForHeadScript() {
    if (window.PriceHuntHeadReady && window.PriceHuntConfig) {
      initializeTracking();
    } else {
      setTimeout(waitForHeadScript, 100);
    }
  }
  
  // Prevent multiple initializations
  if (window.PriceHuntBodyInitialized) {
    return;
  }
  window.PriceHuntBodyInitialized = true;
  
  // Configuration
  const config = window.PriceHuntConfig || {};
  const debug = config.debug || false;
  
  // Session management
  const sessionId = generateSessionId();
  const eventsSent = [];
  const lastEventTime = {};
  
  function log(message, level = 'info') {
    if (debug) {
      console.log(`[PriceHunt Tracker] [${new Date().toISOString()}] ${message}`);
    }
  }
  
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Send event to server
  function sendEvent(eventData) {
    // Prevent duplicate events with better deduplication
    let eventKey;
    if (eventData.event_type === "checkout_start") {
      eventKey = `${eventData.event_type}_${sessionId}_${eventData.data.form_action || 'unknown'}`;
    } else {
      eventKey = `${eventData.event_type}_${sessionId}_${JSON.stringify(eventData.data)}`;
    }
    
    if (eventsSent.includes(eventKey)) {
      log("Duplicate event detected, skipping: " + eventData.event_type, "warn");
      return;
    }
    
    // Prevent rapid duplicate events (same type within 2 seconds)
    const now = Date.now();
    const lastTime = lastEventTime[eventData.event_type] || 0;
    if (now - lastTime < 2000) {
      log("Rapid duplicate event detected, skipping: " + eventData.event_type, "warn");
      return;
    }
    lastEventTime[eventData.event_type] = now;
    
    // Add to sent events
    eventsSent.push(eventKey);
    
    // Push to data layer
    if (window.PriceHuntPush) {
      window.PriceHuntPush({
        'event': eventData.event_type,
        'business_id': eventData.business_id,
        'affiliate_id': eventData.affiliate_id,
        'session_id': eventData.session_id,
        'url': eventData.url,
        'data': eventData.data,
        'timestamp': eventData.timestamp
      });
    }
    
    // Send to server
    fetch('https://pavlo4.netlify.app/.netlify/functions/track-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    })
    .then(response => {
      if (response.ok) {
        log("Event sent successfully: " + eventData.event_type, "success");
      } else {
        log("Failed to send event: " + response.status, "error");
      }
    })
    .catch(error => {
      log("Error sending event: " + error.message, "error");
    });
  }
  
  // Extract product data from element
  function extractProductData(element) {
    let data = {
      id: null,
      name: null,
      price: null,
      variantId: null,
      quantity: 1,
    };

    log("Extracting product data from element:", element);

    // Try to get data from data attributes
    data.id = element.getAttribute("data-product-id") || 
              element.getAttribute("data-id") || 
              element.closest("[data-product-id]")?.getAttribute("data-product-id");

    data.name = element.getAttribute("data-product-name") || 
                element.getAttribute("data-title") || 
                element.closest("[data-product-name]")?.getAttribute("data-product-name");

    data.price = element.getAttribute("data-price") || 
                 element.closest("[data-price]")?.getAttribute("data-price");

    data.variantId = element.getAttribute("data-variant-id") || 
                     element.closest("[data-variant-id]")?.getAttribute("data-variant-id");

    data.quantity = element.getAttribute("data-quantity") || 
                    element.closest("[data-quantity]")?.getAttribute("data-quantity") || 1;

    // Try to get from Shopify theme data
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.product) {
      const product = window.Shopify.theme.product;
      data.id = data.id || product.id;
      data.name = data.name || product.title;
      data.price = data.price || product.price;
      data.variantId = data.variantId || (product.selected_or_first_available_variant?.id);
    }

    return data;
  }
  
  // Check if form is cart form (add to cart)
  function isCartForm(form) {
    const action = form.action || '';
    const dataAction = form.getAttribute("data-action") || '';
    
    return (
      action.includes("/cart/add") ||
      action.includes("/cart") && !action.includes("/checkout") ||
      dataAction === "add_to_cart" ||
      dataAction.includes("add_to_cart") ||
      form.classList.contains("add-to-cart-form") ||
      form.id === "add-to-cart-form" ||
      form.querySelector('[name="add"]') ||
      form.querySelector('[data-add-to-cart]')
    );
  }
  
  // Check if form is checkout form
  function isCheckoutForm(form) {
    const action = form.action || '';
    const dataAction = form.getAttribute("data-action") || '';
    
    return (
      action.includes("/checkout") ||
      action.includes("/checkouts/") ||
      dataAction === "checkout" ||
      dataAction.includes("checkout") ||
      form.classList.contains("checkout-form") ||
      form.id === "checkout-form" ||
      form.querySelector('[name="checkout"]') ||
      form.querySelector('[data-checkout]')
    );
  }
  
  // Extract product data from form
  function extractProductDataFromForm(form) {
    const productId = form.querySelector('[name="id"]')?.value ||
                     form.querySelector('[data-product-id]')?.getAttribute('data-product-id');
    
    const quantity = form.querySelector('[name="quantity"]')?.value || 1;
    
    return {
      id: productId,
      quantity: parseInt(quantity),
      form_action: form.action
    };
  }
  
  // Track product view
  function trackProductView() {
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.product) {
      const product = window.Shopify.theme.product;
      const eventData = {
        event_type: "product_view",
        business_id: config.businessId,
        affiliate_id: config.affiliateId,
        session_id: sessionId,
        url: window.location.href,
        data: {
          product_id: product.id,
          product_name: product.title,
          product_price: product.price,
          product_variant_id: product.selected_or_first_available_variant?.id,
          product_type: product.type,
          product_vendor: product.vendor,
        },
        timestamp: Date.now(),
      };
      
      sendEvent(eventData);
      return true;
    }
    return false;
  }
  
  // Track add to cart
  function trackAddToCart(productData) {
    const eventData = {
      event_type: "add_to_cart",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: sessionId,
      url: window.location.href,
      data: productData,
      timestamp: Date.now(),
    };
    
    sendEvent(eventData);
  }
  
  // Track checkout start
  function trackCheckoutStart(form) {
    const eventData = {
      event_type: "checkout_start",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: sessionId,
      url: window.location.href,
      data: {
        form_action: form.action,
        trigger: "form_submission",
      },
      timestamp: Date.now(),
    };
    
    sendEvent(eventData);
  }
  
  // Track checkout page visit
  function trackCheckoutPageVisit() {
    const eventData = {
      event_type: "checkout_start",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: sessionId,
      url: window.location.href,
      data: {
        trigger: "page_visit",
      },
      timestamp: Date.now(),
    };
    
    sendEvent(eventData);
  }
  
  // Track purchase completion
  function trackPurchaseCompletion() {
    const purchaseIndicators = [
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/thank_you'),
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/thank-you'),
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/complete'),
      window.location.pathname.includes('/orders/'),
      window.location.pathname.includes('/order/'),
      window.location.pathname.includes('/thank-you'),
      window.location.pathname.includes('/thank_you'),
      window.location.pathname.includes('/success'),
      window.location.pathname.includes('/complete'),
    ];
    
    const isPurchasePage = purchaseIndicators.some(indicator => indicator);
    
    if (isPurchasePage) {
      log("Purchase completion detected", "info");
      
      // Extract order information
      let orderData = {};
      
      // Try to get order ID from URL
      const urlMatch = window.location.pathname.match(/\/orders?\/([^\/]+)/);
      if (urlMatch) {
        orderData.order_id = urlMatch[1];
      }
      
      // Try to get order information from page content
      const orderElements = document.querySelectorAll('[data-order-id], [data-order-number], .order-id, .order-number');
      if (orderElements.length > 0) {
        orderData.order_id = orderData.order_id || orderElements[0].textContent.trim();
      }
      
      // Try to get total amount from page
      const totalElements = document.querySelectorAll('[data-total], .total, .order-total, .amount');
      if (totalElements.length > 0) {
        const totalText = totalElements[0].textContent.trim();
        const amountMatch = totalText.match(/[\d,]+\.?\d*/);
        if (amountMatch) {
          orderData.total = amountMatch[0];
        }
      }
      
      const eventData = {
        event_type: "purchase",
        business_id: config.businessId,
        affiliate_id: config.affiliateId,
        session_id: sessionId,
        url: window.location.href,
        data: {
          ...orderData,
          platform: "shopify",
        },
        timestamp: Date.now(),
      };
      
      sendEvent(eventData);
      return true;
    }
    return false;
  }
  
  // Track Shopify-specific purchase completion
  function trackShopifyPurchaseCompletion() {
    log("Tracking Shopify purchase completion", "info");
    
    // Extract order ID from URL (format: /checkouts/cn/order_id/thank-you)
    const urlMatch = window.location.pathname.match(/\/checkouts\/[^\/]+\/([^\/]+)\/thank-you/);
    const orderId = urlMatch ? urlMatch[1] : 'unknown';
    
    log("Extracted order ID: " + orderId, "info");
    
    // Try to extract order details from the page
    let orderData = {
      order_id: orderId,
      platform: "shopify",
      url: window.location.href,
      page_title: document.title
    };
    
    // Try to get order total from various selectors
    const totalSelectors = [
      '.order-summary__total',
      '.total-line__price',
      '[data-total]',
      '.total',
      '.order-total',
      '.amount'
    ];
    
    for (const selector of totalSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const totalText = element.textContent.trim();
        const amountMatch = totalText.match(/[\d,]+\.?\d*/);
        if (amountMatch) {
          orderData.total = amountMatch[0];
          break;
        }
      }
    }
    
    const eventData = {
      event_type: "purchase",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: sessionId,
      url: window.location.href,
      data: orderData,
      timestamp: Date.now(),
    };
    
    sendEvent(eventData);
    return true;
  }
  
  // Initialize tracking
  function initializeTracking() {
    log("Initializing PriceHunt tracking...", "info");
    
    // Track page view
    const pageViewData = {
      event_type: "page_view",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: sessionId,
      url: window.location.href,
      data: {
        page_title: document.title,
        referrer: document.referrer,
      },
      timestamp: Date.now(),
    };
    sendEvent(pageViewData);
    
    // Track product view if on product page
    if (trackProductView()) {
      log("Product view tracked", "success");
    }
    
    // Set up event listeners
    log("Setting up event listeners...", "info");
    
    // Track form submissions (cart and checkout)
    document.addEventListener("submit", function (e) {
      const form = e.target;
      
      if (isCartForm(form)) {
        log("Cart form submitted (add to cart):", form);
        const productData = extractProductDataFromForm(form);
        if (productData.id) {
          trackAddToCart(productData);
        }
      } else if (isCheckoutForm(form)) {
        log("Checkout form submitted:", form);
        trackCheckoutStart(form);
      }
    });
    
    // Track clicks on add to cart buttons
    document.addEventListener("click", function (e) {
      const target = e.target;
      
      // Check if it's an add to cart button
      if (target.matches('[data-add-to-cart], .add-to-cart, [data-action*="add"], button[name="add"]')) {
        log("Add to cart button clicked:", target);
        const productData = extractProductData(target);
        if (productData.id) {
          trackAddToCart(productData);
        }
      }
      
      // Check if it's a checkout button
      if (target.matches('[data-checkout], .checkout, [data-action*="checkout"], button[name="checkout"]')) {
        log("Checkout button clicked:", target);
        trackCheckoutStart(target.closest('form') || target);
      }
    });
    
    log("Event listeners setup complete", "info");
    
    // Check for purchase completion
    if (trackPurchaseCompletion()) {
      log("Purchase completion tracked on page load", "success");
    }
    
    // Check specifically for Shopify thank-you page format
    if (window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/thank-you')) {
      log("Shopify thank-you page detected, tracking purchase completion");
      trackShopifyPurchaseCompletion();
    }
    
    // Check if we're on a checkout page and track checkout start
    if (window.location.pathname.includes('/checkout') || window.location.pathname.includes('/checkouts/')) {
      log("Checkout page detected, tracking checkout start");
      trackCheckoutPageVisit();
    }
    
    // Mark as initialized
    config.initialized = true;
    log("PriceHunt tracking initialized successfully", "success");
  }
  
  // Start initialization
  waitForHeadScript();
  
  // Expose tracking functions globally
  window.PriceHuntTracker = {
    track: function (eventType, data) {
      const eventData = {
        event_type: eventType,
        business_id: config.businessId,
        affiliate_id: config.affiliateId,
        session_id: sessionId,
        url: window.location.href,
        data: data || {},
        timestamp: Date.now(),
      };
      sendEvent(eventData);
    },
    
    trackProductView: trackProductView,
    trackAddToCart: trackAddToCart,
    trackCheckoutStart: trackCheckoutStart,
    trackPurchaseCompletion: trackPurchaseCompletion,
    trackShopifyPurchaseCompletion: trackShopifyPurchaseCompletion,
    
    // Debug functions
    getConfig: function () {
      return { ...config };
    },
    
    getEventsSent: function () {
      return [...eventsSent];
    },
    
    initialized: false
  };
  
  // Mark as initialized when complete
  if (config.initialized) {
    window.PriceHuntTracker.initialized = true;
  }
})();
