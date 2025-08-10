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
    
    // Set up mutation observer for dynamically added content
    setupMutationObserver();
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
        log('Add to cart button clicked', 'info');
        trackAddToCart(target);
      }
      
      // Check for product clicks
      if (isProductLink(target)) {
        log('Product link clicked', 'info');
        trackProductClick(target);
      }
      
      // Check for any link clicks (for general navigation tracking)
      if (target.tagName === 'A' && target.href) {
        log('Link clicked: ' + target.href, 'info');
        trackLinkClick(target);
      }
    });

    // Track form submissions (checkout)
    document.addEventListener('submit', function(e) {
      if (isCheckoutForm(e.target)) {
        log('Checkout form submitted', 'info');
        trackCheckoutStart(e.target);
      }
    });

    // Track AJAX add to cart (for dynamic cart updates)
    if (window.Shopify && window.Shopify.onCartUpdate) {
      window.Shopify.onCartUpdate = function(cart) {
        log('Cart updated via AJAX', 'info');
        trackCartUpdate(cart);
      };
    }
    
    // Listen for Shopify AJAX cart events
    document.addEventListener('cart:updated', function(e) {
      log('Cart updated event detected', 'info');
      trackCartUpdate(e.detail || {});
    });
    
    // Listen for Shopify add to cart events
    document.addEventListener('cart:added', function(e) {
      log('Product added to cart event detected', 'info');
      trackAddToCartEvent(e.detail || {});
    });
  }

  // Set up mutation observer for dynamically added content
  function setupMutationObserver() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              // Re-attach event listeners to new elements
              attachEventListenersToElement(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Attach event listeners to a specific element
  function attachEventListenersToElement(element) {
    // Find add to cart buttons in the element
    const addToCartButtons = element.querySelectorAll('[data-action="add-to-cart"], .add-to-cart, [class*="cart"], button[type="submit"]');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        log('Add to cart button clicked (dynamic)', 'info');
        trackAddToCart(button);
      });
    });

    // Find product links in the element
    const productLinks = element.querySelectorAll('a[href*="/products/"]');
    productLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        log('Product link clicked (dynamic)', 'info');
        trackProductClick(link);
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
      'input[type="submit"]',
      '[data-testid*="add-to-cart"]',
      '[aria-label*="add to cart"]',
      '[title*="add to cart"]'
    ];
    
    // Check selectors
    if (selectors.some(selector => element.matches(selector))) {
      return true;
    }
    
    // Check text content
    const text = element.textContent.toLowerCase();
    if (text.includes('add to cart') || 
        text.includes('buy now') || 
        text.includes('add to bag') ||
        text.includes('purchase')) {
      return true;
    }
    
    // Check parent elements
    const parent = element.closest('button, input, a');
    if (parent && isAddToCartButton(parent)) {
      return true;
    }
    
    return false;
  }

  // Check if element is a product link
  function isProductLink(element) {
    // If it's a link with product URL
    if (element.tagName === 'A' && element.href) {
      return element.href.includes('/products/');
    }
    
    // If it's inside a product link
    const parentLink = element.closest('a[href*="/products/"]');
    if (parentLink) {
      return true;
    }
    
    // If it's inside a product container
    const productContainer = element.closest('.product-item, .product-card, [class*="product"]');
    if (productContainer) {
      return true;
    }
    
    return false;
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

  // Track add to cart event from Shopify events
  function trackAddToCartEvent(detail) {
    const eventData = {
      event_type: 'add_to_cart',
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      product_id: detail.id || detail.product_id,
      product_name: detail.title || detail.product_name,
      product_price: detail.price || detail.product_price,
      product_variant_id: detail.variant_id,
      quantity: detail.quantity || 1,
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

  // Track link click
  function trackLinkClick(link) {
    const eventData = {
      event_type: 'link_click',
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      link_url: link.href,
      link_text: link.textContent.trim(),
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
      cart_total: cart.total_price || cart.total,
      item_count: cart.item_count || cart.items?.length || 0,
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

    // Try to get data from JSON-LD structured data
    if (!data.id || !data.name) {
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (jsonLd) {
        try {
          const structuredData = JSON.parse(jsonLd.textContent);
          if (structuredData['@type'] === 'Product') {
            if (!data.id) data.id = structuredData.sku || structuredData.gtin;
            if (!data.name) data.name = structuredData.name;
            if (!data.price) data.price = structuredData.offers?.price;
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
    }

    // Try to get data from product form
    if (!data.id || !data.variantId) {
      const productForm = element.closest('form[action*="/cart/add"]');
      if (productForm) {
        const variantInput = productForm.querySelector('input[name="id"]');
        if (variantInput && !data.variantId) {
          data.variantId = variantInput.value;
        }
      }
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
    trackLinkClick: trackLinkClick,
    trackCheckoutStart: trackCheckoutStart,
    trackCartUpdate: trackCartUpdate
  };

})(); 