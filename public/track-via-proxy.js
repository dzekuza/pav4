// PriceHunt Tracking via Proxy (CORS-free solution)
(function() {
  'use strict';
  
  // Configuration
  const config = {
    businessId: '10', // godislove.lt business ID
    affiliateId: 'pavlo4', // Default affiliate ID
    apiUrl: 'https://pavlo4.netlify.app/.netlify/functions/track-event',
    debug: true,
    retryAttempts: 3,
    retryDelay: 1000
  };

  function log(message, level = 'info') {
    if (config.debug) {
      const prefix = '[PriceHunt Tracker]';
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

  // Generate a unique session ID
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get or create session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('pricehunt_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      try {
        sessionStorage.setItem('pricehunt_session_id', sessionId);
      } catch (e) {
        // Fallback if sessionStorage is not available
        log('SessionStorage not available, using temporary session ID', 'warn');
      }
    }
    return sessionId;
  }

  // Send event with retry logic
  async function sendEvent(eventType, data = {}, attempt = 1) {
    const eventData = {
      event_type: eventType,
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      platform: 'shopify',
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: Date.now(),
      url: window.location.href,
      data: data,
      page_title: document.title
    };

    log('Sending event: ' + eventType);
    log('Event data:', eventData);

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const result = await response.json();
        log('Event sent successfully:', result);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      log('Failed to send event: ' + error.message, 'error');
      
      // Retry logic
      if (attempt < config.retryAttempts) {
        log(`Retrying in ${config.retryDelay}ms (attempt ${attempt + 1}/${config.retryAttempts})`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        return sendEvent(eventType, data, attempt + 1);
      } else {
        log('Max retry attempts reached, event failed', 'error');
        
        // Fallback: try alternative method using image beacon
        try {
          const params = new URLSearchParams({
            event_type: eventType,
            business_id: config.businessId,
            affiliate_id: config.affiliateId,
            platform: 'shopify',
            session_id: getSessionId(),
            timestamp: Date.now().toString(),
            url: window.location.href,
            data: JSON.stringify(data)
          });
          
          const img = new Image();
          img.src = `${config.apiUrl}?${params.toString()}`;
          log('Sent event via image beacon fallback');
        } catch (fallbackError) {
          log('Fallback method also failed: ' + fallbackError.message, 'error');
        }
      }
    }
  }

  // Extract product data from page
  function extractProductData() {
    try {
      // Try to find JSON-LD structured data
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product') {
            return {
              product_id: data.sku || data.gtin || data['@id'] || 'unknown',
              product_name: data.name || document.title,
              product_price: data.offers?.price || '0',
              product_currency: data.offers?.priceCurrency || 'EUR',
              product_image: data.image || '',
              product_url: data.url || window.location.href
            };
          }
        } catch (e) {
          // Continue to next script
        }
      }

      // Fallback: try to extract from meta tags
      const metaTags = {
        product_id: document.querySelector('meta[property="product:retailer_item_id"]')?.content ||
                    document.querySelector('meta[name="product_id"]')?.content,
        product_name: document.querySelector('meta[property="og:title"]')?.content ||
                     document.querySelector('meta[name="product_name"]')?.content ||
                     document.title,
        product_price: document.querySelector('meta[property="product:price:amount"]')?.content ||
                      document.querySelector('meta[name="product_price"]')?.content,
        product_currency: document.querySelector('meta[property="product:price:currency"]')?.content ||
                         document.querySelector('meta[name="product_currency"]')?.content ||
                         'EUR'
      };

      if (metaTags.product_name) {
        return metaTags;
      }

      // Final fallback: basic page info
      return {
        product_id: 'unknown',
        product_name: document.title,
        product_price: '0',
        product_currency: 'EUR',
        product_url: window.location.href
      };
    } catch (error) {
      log('Error extracting product data: ' + error.message, 'error');
      return {
        product_id: 'unknown',
        product_name: document.title,
        product_price: '0',
        product_currency: 'EUR'
      };
    }
  }

  // Track page view
  async function trackPageView() {
    await sendEvent('page_view');
  }

  // Track product view
  async function trackProductView() {
    const productData = extractProductData();
    log('Found product via JSON-LD:', productData);
    await sendEvent('product_view', productData);
  }

  // Track add to cart events
  async function trackAddToCart(element = null) {
    let productData = extractProductData();
    
    // Try to extract additional data from the clicked element
    if (element) {
      try {
        // Look for product data in nearby elements
        const container = element.closest('[data-product-id], [data-sku], .product, .product-item');
        if (container) {
          const productId = container.dataset.productId || 
                           container.dataset.sku || 
                           container.querySelector('[data-product-id]')?.dataset.productId;
          if (productId) {
            productData.product_id = productId;
          }
        }
      } catch (e) {
        // Ignore errors in element data extraction
      }
    }

    log('Extracted product data for add to cart:', productData);
    await sendEvent('add_to_cart', productData);
  }

  // Track checkout start
  async function trackCheckoutStart() {
    await sendEvent('checkout_start', {
      checkout_url: window.location.href
    });
  }

  // Set up event listeners
  function setupEventListeners() {
    log('Setting up event listeners...');

    // Track form submissions (add to cart)
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.action && (form.action.includes('/cart/add') || form.action.includes('cart'))) {
        log('Add to cart form submitted');
        trackAddToCart(form);
      }
    });

    // Track button clicks
    document.addEventListener('click', function(e) {
      const target = e.target;
      const text = target.textContent?.toLowerCase() || '';
      const href = target.href || '';
      
      // Check for add to cart buttons
      if (text.includes('add to cart') || 
          text.includes('buy now') || 
          text.includes('add to bag') ||
          target.classList.contains('add-to-cart') ||
          target.id?.includes('add-to-cart')) {
        log('Add to cart button clicked:', target);
        trackAddToCart(target);
      }
      
      // Check for checkout buttons
      if (text.includes('checkout') || 
          href.includes('/checkout') ||
          target.classList.contains('checkout') ||
          target.id?.includes('checkout')) {
        log('Checkout button clicked');
        trackCheckoutStart();
      }
    });

    log('Event listeners setup complete');
  }

  // Check for purchase completion
  function checkForPurchaseCompletion() {
    // Look for common purchase completion indicators
    const url = window.location.href;
    const title = document.title.toLowerCase();
    
    if (url.includes('/thank-you') || 
        url.includes('/order-confirmation') ||
        url.includes('/confirmation') ||
        title.includes('thank you') ||
        title.includes('order confirmation') ||
        title.includes('purchase complete')) {
      
      log('Purchase completion detected');
      sendEvent('purchase_complete', {
        order_url: url,
        order_id: extractOrderId()
      });
    }
  }

  // Extract order ID from page
  function extractOrderId() {
    try {
      // Try to find order ID in various places
      const orderIdElement = document.querySelector('[data-order-id], .order-id, #order-id');
      if (orderIdElement) {
        return orderIdElement.textContent?.trim() || orderIdElement.dataset.orderId;
      }

      // Try to extract from URL
      const urlMatch = window.location.href.match(/order[_-]?id=([^&]+)/i);
      if (urlMatch) {
        return urlMatch[1];
      }

      return 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  // Set up mutation observer for dynamic content
  function setupMutationObserver() {
    try {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            // Check if new content contains product information
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node;
                if (element.querySelector && element.querySelector('[data-product-id], .product')) {
                  log('New product content detected');
                  // Could trigger additional tracking here if needed
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      log('Mutation observer setup complete');
    } catch (error) {
      log('Error setting up mutation observer: ' + error.message, 'error');
    }
  }

  // Initialize
  async function init() {
    log('PriceHunt Enhanced Shopify Tracker initialized for ' + window.location.hostname);
    log('Config:', config);
    
    // Track initial page view
    await trackPageView();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for product data and track product view
    const productData = extractProductData();
    if (productData.product_id !== 'unknown') {
      await trackProductView();
    }
    
    // Set up mutation observer for dynamic content
    setupMutationObserver();
    
    // Check for purchase completion
    checkForPurchaseCompletion();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose functions globally for manual testing
  window.PriceHuntTracker = {
    trackPageView: trackPageView,
    trackProductView: trackProductView,
    trackAddToCart: trackAddToCart,
    trackCheckoutStart: trackCheckoutStart,
    sendEvent: sendEvent,
    extractProductData: extractProductData
  };

})();
