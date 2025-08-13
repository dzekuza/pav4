// Shopify Pixel-Only Tracker - No Shopify Apps Required
// This is a pure pixel script that can be added to any Shopify store
(function() {
  'use strict';

  // Configuration - can be overridden by global config
  const config = {
    apiUrl: "https://pavlo4.netlify.app/.netlify/functions/track-event",
    businessId: null, // Will be extracted from script attributes or URL
    affiliateId: null, // Will be extracted from script attributes or URL
    platform: "shopify",
    sessionId: generateSessionId(),
    apiKey: "16272754ed68cbdcb55e8f579703d92e",
    debug: false
  };

  // Get configuration from script tag attributes
  function getScriptConfig() {
    const script = document.currentScript || 
                   document.querySelector('script[src*="shopify-pixel-only-tracker.js"]') ||
                   document.querySelector('script[src*="shopify-tracker-loader.js"]');
    
    if (script) {
      return {
        businessId: script.getAttribute('data-business-id'),
        affiliateId: script.getAttribute('data-affiliate-id'),
        debug: script.getAttribute('data-debug') === 'true'
      };
    }
    return {};
  }

  // Override config with script attributes and global config
  const scriptConfig = getScriptConfig();
  Object.assign(config, scriptConfig);
  
  if (window.ipickConfig) {
    Object.assign(config, window.ipickConfig);
  }

  function generateSessionId() {
    return "pixel_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  function log(message, level = 'info') {
    if (config.debug) {
      const timestamp = new Date().toISOString();
      console.log(`[ipick Pixel] [${timestamp}] ${message}`);
    }
  }

  // Extract business ID and affiliate ID from various sources
  function extractBusinessId() {
    if (config.businessId) return config.businessId;
    
    const urlParams = new URLSearchParams(window.location.search);
    const businessId = urlParams.get('business_id') || 
                      urlParams.get('utm_source') || 
                      urlParams.get('ref');
    
    if (businessId) {
      log(`Extracted business ID from URL: ${businessId}`);
      return businessId;
    }
    
    // Fallback: try to get from referrer
    if (document.referrer) {
      const referrerParams = new URLSearchParams(document.referrer.split('?')[1] || '');
      const refBusinessId = referrerParams.get('business_id') || 
                           referrerParams.get('utm_source');
      if (refBusinessId) {
        log(`Extracted business ID from referrer: ${refBusinessId}`);
        return refBusinessId;
      }
    }
    
    log('No business ID found, using default');
    return '2'; // Default business ID
  }

  function extractAffiliateId() {
    if (config.affiliateId) return config.affiliateId;
    
    const urlParams = new URLSearchParams(window.location.search);
    const affiliateId = urlParams.get('affiliate_id') || 
                       urlParams.get('utm_medium') || 
                       urlParams.get('aff');
    
    if (affiliateId) {
      log(`Extracted affiliate ID from URL: ${affiliateId}`);
      return affiliateId;
    }
    
    // Fallback: try to get from referrer
    if (document.referrer) {
      const referrerParams = new URLSearchParams(document.referrer.split('?')[1] || '');
      const refAffiliateId = referrerParams.get('affiliate_id') || 
                            referrerParams.get('utm_medium');
      if (refAffiliateId) {
        log(`Extracted affiliate ID from referrer: ${refAffiliateId}`);
        return refAffiliateId;
      }
    }
    
    log('No affiliate ID found, using default');
    return 'aff_godislovel_1755091745057_n7ccoo'; // Default affiliate ID
  }

  // Send tracking data with multiple fallback methods
  function sendTrackingData(eventType, data) {
    const businessId = extractBusinessId();
    const affiliateId = extractAffiliateId();
    
    const trackingData = {
      event_type: eventType,
      business_id: businessId,
      affiliate_id: affiliateId,
      platform: config.platform,
      session_id: config.sessionId,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: Date.now(),
      url: window.location.href,
      page_title: document.title,
      data: {
        ...data,
        shop_domain: window.location.hostname,
        source: "shopify-pixel-only",
        page_type: getPageType()
      }
    };

    log(`Sending ${eventType} event:`, trackingData);

    // Method 1: Direct fetch (primary method)
    fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(trackingData),
    })
    .then(response => {
      if (response.ok) {
        log(`${eventType} event sent successfully`);
        return response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .catch(error => {
      log(`Direct fetch failed: ${error.message}, trying fallback methods`);
      
      // Method 2: Image beacon (CORS-safe)
      try {
        const params = new URLSearchParams({
          event_type: eventType,
          business_id: businessId,
          affiliate_id: affiliateId,
          session_id: config.sessionId,
          timestamp: Date.now().toString(),
          url: window.location.href,
          data: JSON.stringify(data)
        });
        
        const img = new Image();
        img.src = `${config.apiUrl}?${params.toString()}`;
        log(`Event sent via image beacon`);
      } catch (e) {
        log(`Image beacon failed: ${e.message}`);
      }

      // Method 3: localStorage for later processing
      try {
        const pendingEvents = JSON.parse(localStorage.getItem('ipick_pending_events') || '[]');
        pendingEvents.push({
          ...trackingData,
          timestamp: Date.now(),
          retry_count: 0
        });
        localStorage.setItem('ipick_pending_events', JSON.stringify(pendingEvents));
        log(`Event stored in localStorage for later processing`);
      } catch (e) {
        log(`localStorage fallback failed: ${e.message}`);
      }
    });
  }

  // Get page type
  function getPageType() {
    const path = window.location.pathname;
    if (path.includes('/products/')) return 'product';
    if (path.includes('/collections/')) return 'collection';
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/checkout')) return 'checkout';
    if (path.includes('/checkouts/')) return 'checkout';
    if (path.includes('/account')) return 'account';
    if (path === '/' || path === '') return 'home';
    return 'other';
  }

  // Extract product data from page
  function extractProductData() {
    try {
      // Method 1: Shopify product JSON
      const productJson = document.querySelector('script[type="application/json"][data-product-json]');
      if (productJson) {
        const product = JSON.parse(productJson.textContent);
        return {
          product_id: product.id,
          product_name: product.title,
          price: product.price,
          currency: product.currency || 'USD',
          vendor: product.vendor,
          product_type: product.product_type,
          tags: product.tags,
          variants: product.variants?.length || 0
        };
      }

      // Method 2: Meta tags
      const metaTitle = document.querySelector('meta[property="og:title"]')?.content;
      const metaPrice = document.querySelector('meta[property="product:price:amount"]')?.content;
      const metaCurrency = document.querySelector('meta[property="product:price:currency"]')?.content;
      
      if (metaTitle) {
        return {
          product_name: metaTitle,
          price: metaPrice,
          currency: metaCurrency || 'USD'
        };
      }

      // Method 3: Page content extraction
      const title = document.querySelector('h1')?.textContent?.trim();
      const priceElement = document.querySelector('[class*="price"], [data-price]');
      const price = priceElement?.textContent?.match(/[\d,]+\.?\d*/)?.[0];
      
      if (title) {
        return {
          product_name: title,
          price: price,
          currency: 'USD'
        };
      }

      return null;
    } catch (error) {
      log(`Error extracting product data: ${error.message}`);
      return null;
    }
  }

  // Extract order data from checkout completion page
  function extractOrderData() {
    try {
      const orderData = {};

      // Extract order ID from URL
      const urlMatch = window.location.pathname.match(/\/checkouts\/[^\/]+\/([^\/]+)\/thank-you/);
      if (urlMatch) {
        orderData.order_id = urlMatch[1];
      } else {
        const altMatch = window.location.pathname.match(/\/orders?\/([^\/]+)/);
        if (altMatch) {
          orderData.order_id = altMatch[1];
        }
      }

      // Extract total amount
      const totalSelectors = [
        '[data-total]',
        '.total',
        '.order-total',
        '.amount',
        '.order-summary__total',
        '.total-line__price',
        '[class*="total"]',
        '[class*="amount"]'
      ];

      for (const selector of totalSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          const match = text.match(/[\d,]+\.?\d*/);
          if (match) {
            const amount = parseFloat(match[0].replace(/,/g, ''));
            if (amount > 0) {
              orderData.total_amount = amount;
              break;
            }
          }
        }
        if (orderData.total_amount) break;
      }

      // Extract currency
      const text = document.body.textContent;
      if (text.includes('$')) orderData.currency = 'USD';
      else if (text.includes('€')) orderData.currency = 'EUR';
      else if (text.includes('£')) orderData.currency = 'GBP';
      else if (text.includes('¥')) orderData.currency = 'JPY';
      else orderData.currency = 'USD';

      return orderData;
    } catch (error) {
      log(`Error extracting order data: ${error.message}`);
      return {};
    }
  }

  // Check if we're on a checkout completion page
  function isCheckoutCompletionPage() {
    const indicators = [
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/thank-you'),
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/thank_you'),
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/complete'),
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/success'),
      window.location.pathname.includes('/orders/'),
      window.location.pathname.includes('/order/'),
      window.location.pathname.includes('/thank-you'),
      window.location.pathname.includes('/thank_you'),
      window.location.pathname.includes('/success'),
      window.location.pathname.includes('/complete'),
      document.title.toLowerCase().includes('order confirmation'),
      document.title.toLowerCase().includes('thank you'),
      document.title.toLowerCase().includes('purchase complete'),
      document.title.toLowerCase().includes('order received')
    ];

    return indicators.some(indicator => indicator);
  }

  // Track page view
  function trackPageView() {
    sendTrackingData('page_view', {
      page_title: document.title,
      page_url: window.location.href,
      page_type: getPageType()
    });
  }

  // Track product view
  function trackProductView() {
    const productData = extractProductData();
    if (productData) {
      sendTrackingData('product_view', productData);
    }
  }

  // Track add to cart
  function trackAddToCart() {
    const productData = extractProductData();
    if (productData) {
      sendTrackingData('add_to_cart', productData);
    }
  }

  // Track checkout start
  function trackCheckoutStart() {
    sendTrackingData('checkout_start', {
      page_url: window.location.href,
      page_title: document.title
    });
  }

  // Track purchase completion
  function trackPurchaseComplete() {
    const orderData = extractOrderData();
    sendTrackingData('purchase_complete', {
      ...orderData,
      checkout_id: window.location.pathname.split('/').pop(),
      checkout_url: window.location.href
    });
  }

  // Process pending events from localStorage
  function processPendingEvents() {
    try {
      const pendingEvents = JSON.parse(localStorage.getItem('ipick_pending_events') || '[]');
      if (pendingEvents.length > 0) {
        log(`Processing ${pendingEvents.length} pending events`);
        
        const processedEvents = [];
        
        for (const event of pendingEvents) {
          // Don't retry events older than 1 hour
          if (Date.now() - event.timestamp > 3600000) {
            log(`Skipping old event: ${event.event_type}`);
            continue;
          }
          
          // Don't retry more than 3 times
          if (event.retry_count >= 3) {
            log(`Skipping event with too many retries: ${event.event_type}`);
            continue;
          }
          
          // Try to send the event
          sendTrackingData(event.event_type, event.data);
          processedEvents.push(event);
        }
        
        // Remove processed events from localStorage
        const remainingEvents = pendingEvents.filter(event => 
          !processedEvents.includes(event)
        );
        localStorage.setItem('ipick_pending_events', JSON.stringify(remainingEvents));
        
        log(`Processed ${processedEvents.length} events, ${remainingEvents.length} remaining`);
      }
    } catch (error) {
      log(`Error processing pending events: ${error.message}`);
    }
  }

  // Initialize tracking
  function initTracking() {
    log('Initializing pixel-only tracking');

    // Process any pending events
    processPendingEvents();

    // Track page view
    trackPageView();

    // Track product view if on product page
    if (getPageType() === 'product') {
      trackProductView();
    }

    // Track purchase if on completion page
    if (isCheckoutCompletionPage()) {
      trackPurchaseComplete();
    }

    // Listen for add to cart clicks
    document.addEventListener('click', function(e) {
      const target = e.target;
      
      if (target.matches('[name="add"], .add-to-cart, [class*="add"], [class*="cart"]')) {
        setTimeout(() => {
          trackAddToCart();
        }, 100);
      }
    });

    // Listen for form submissions (checkout)
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.action && form.action.includes('/checkout')) {
        trackCheckoutStart();
      }
    });

    // Listen for URL changes (for SPA checkouts)
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        log('URL changed to: ' + currentUrl);
        
        // Track new page view
        trackPageView();
        
        // Check for product view
        if (getPageType() === 'product') {
          trackProductView();
        }
        
        // Check for purchase completion
        if (isCheckoutCompletionPage()) {
          trackPurchaseComplete();
        }
      }
    }, 1000);

    // Set up periodic check for pending events
    setInterval(processPendingEvents, 5000);

    log('Pixel-only tracking initialized successfully');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }

  // Expose functions globally
  window.ipickPixelTrack = {
    sendEvent: sendTrackingData,
    trackPageView: trackPageView,
    trackProductView: trackProductView,
    trackAddToCart: trackAddToCart,
    trackCheckoutStart: trackCheckoutStart,
    trackPurchaseComplete: trackPurchaseComplete,
    extractProductData: extractProductData,
    extractOrderData: extractOrderData,
    isCheckoutComplete: isCheckoutCompletionPage
  };

})();
