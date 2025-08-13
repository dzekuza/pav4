// Shopify Checkout Tracker - Works around CSP limitations
(function() {
  'use strict';

  const config = {
    apiUrl: "https://pavlo4.netlify.app/.netlify/functions/track-event",
    businessId: "2", // Default business ID
    affiliateId: "shopify-checkout",
    platform: "shopify",
    sessionId: generateSessionId(),
    apiKey: "16272754ed68cbdcb55e8f579703d92e"
  };

  function generateSessionId() {
    return "checkout_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[Shopify Checkout Tracker] [${timestamp}] ${message}`);
  }

  // Send tracking data using multiple fallback methods
  function sendTrackingData(eventType, data) {
    const trackingData = {
      event_type: eventType,
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
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
        source: "shopify-checkout-tracker"
      }
    };

    log(`Sending ${eventType} event:`, trackingData);

    // Method 1: Try direct fetch (may fail due to CORS)
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
      
      // Method 2: Store in localStorage for parent page to pick up
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

      // Method 3: Try postMessage to parent window
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'ipick_tracking_event',
            data: trackingData
          }, '*');
          log(`Event sent via postMessage to parent window`);
        }
      } catch (e) {
        log(`postMessage fallback failed: ${e.message}`);
      }

      // Method 4: Try image beacon (works even with CORS)
      try {
        const params = new URLSearchParams({
          event_type: eventType,
          business_id: config.businessId,
          affiliate_id: config.affiliateId,
          session_id: config.sessionId,
          timestamp: Date.now().toString(),
          url: window.location.href,
          data: JSON.stringify(data)
        });
        
        const img = new Image();
        img.src = `${config.apiUrl}?${params.toString()}`;
        log(`Event sent via image beacon`);
      } catch (e) {
        log(`Image beacon fallback failed: ${e.message}`);
      }
    });
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

  // Extract order data from checkout completion page
  function extractOrderData() {
    const orderData = {};

    // Extract order ID
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
  }

  // Initialize checkout tracking
  function initCheckoutTracking() {
    log('Initializing checkout tracking');

    // Track page view
    sendTrackingData('page_view', {
      page_type: 'checkout',
      page_title: document.title,
      page_url: window.location.href
    });

    // Check if this is a checkout completion page
    if (isCheckoutCompletionPage()) {
      log('Checkout completion page detected');
      const orderData = extractOrderData();
      
      sendTrackingData('purchase_complete', {
        ...orderData,
        checkout_id: window.location.pathname.split('/').pop(),
        checkout_url: window.location.href
      });
    }

    // Listen for checkout form submissions
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.action && form.action.includes('/checkout')) {
        log('Checkout form submitted');
        sendTrackingData('checkout_start', {
          form_action: form.action,
          page_url: window.location.href
        });
      }
    });

    // Listen for URL changes (for SPA checkouts)
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        log('URL changed to: ' + currentUrl);
        
        if (isCheckoutCompletionPage()) {
          log('Checkout completion detected via URL change');
          const orderData = extractOrderData();
          sendTrackingData('purchase_complete', {
            ...orderData,
            checkout_id: window.location.pathname.split('/').pop(),
            checkout_url: window.location.href
          });
        }
      }
    }, 1000);

    // Listen for postMessage events from parent
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'ipick_tracking_request') {
        log('Received tracking request from parent');
        if (isCheckoutCompletionPage()) {
          const orderData = extractOrderData();
          sendTrackingData('purchase_complete', {
            ...orderData,
            checkout_id: window.location.pathname.split('/').pop(),
            checkout_url: window.location.href
          });
        }
      }
    });

    log('Checkout tracking initialized successfully');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCheckoutTracking);
  } else {
    initCheckoutTracking();
  }

  // Expose functions globally
  window.ipickCheckoutTrack = {
    sendEvent: sendTrackingData,
    isCheckoutComplete: isCheckoutCompletionPage,
    extractOrderData: extractOrderData
  };

})();
