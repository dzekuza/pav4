// iPick Tracking Script
// This script should be added to beautyday.lt to track user interactions

(function() {
  'use strict';
  
  // Configuration
  const IPICK_ENDPOINT = 'https://ipick.io/api/track-event';
  const AFFILIATE_ID = 'aff_beautydayl_1756154229316_i8kgfy';
  const BUSINESS_ID = '4'; // Numeric business ID for beautyday.lt
  
  // Helper function to get URL parameters
  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  
  // Helper function to get product information
  function getProductInfo() {
    // Try to get product info from Shopify's global variables
    if (window.Shopify && window.Shopify.theme) {
      const product = window.Shopify.theme.product;
      if (product) {
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          currency: window.Shopify.currency.active
        };
      }
    }
    
    // Fallback: try to extract from page elements
    const productTitle = document.querySelector('h1[class*="product"], .product-title, h1');
    const priceElement = document.querySelector('.price, [class*="price"], .product-price');
    
    return {
      title: productTitle ? productTitle.textContent.trim() : 'Unknown Product',
      price: priceElement ? priceElement.textContent.trim() : '0',
      currency: 'EUR' // Default for beautyday.lt
    };
  }
  
  // Helper function to get cart information
  function getCartInfo() {
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cart) {
      return {
        total: window.Shopify.theme.cart.total_price,
        item_count: window.Shopify.theme.cart.item_count,
        currency: window.Shopify.currency.active
      };
    }
    return null;
  }
  
  // Helper function to get order information from thank you page
  function getOrderInfo() {
    console.log('🔍 iPick: Looking for order information...');
    
    // Try multiple selectors for order ID
    const orderIdSelectors = [
      '[data-order-id]',
      '.order-id', 
      '.order-number',
      '[data-order-number]',
      '.order__number',
      '.order__id',
      'h1',
      '.page-title'
    ];
    
    let orderId = null;
    for (const selector of orderIdSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        // Look for order number pattern
        const orderMatch = text.match(/order[:\s#]*([A-Z0-9-]+)/i);
        if (orderMatch) {
          orderId = orderMatch[1];
          console.log('✅ iPick: Found order ID:', orderId, 'using selector:', selector);
          break;
        }
      }
    }
    
    // Try URL parameters
    if (!orderId) {
      orderId = getUrlParameter('order_id') || getUrlParameter('id') || getUrlParameter('order');
      if (orderId) {
        console.log('✅ iPick: Found order ID from URL:', orderId);
      }
    }
    
    // Try to extract from page text
    if (!orderId) {
      const pageText = document.body.textContent;
      const orderMatch = pageText.match(/order[:\s#]*([A-Z0-9-]+)/i);
      if (orderMatch) {
        orderId = orderMatch[1];
        console.log('✅ iPick: Found order ID from page text:', orderId);
      }
    }
    
    // Try to get order total
    const totalSelectors = [
      '.order-total',
      '.total-amount', 
      '[data-order-total]',
      '.order__total',
      '.total',
      '.amount'
    ];
    
    let orderTotal = '0';
    for (const selector of totalSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        const amountMatch = text.match(/[\d,]+\.?\d*/);
        if (amountMatch) {
          orderTotal = amountMatch[0].replace(',', '');
          console.log('✅ iPick: Found order total:', orderTotal, 'using selector:', selector);
          break;
        }
      }
    }
    
    // Try to get order items
    const itemSelectors = [
      '.order-item',
      '.line-item', 
      '[data-line-item]',
      '.order__item',
      '.item'
    ];
    
    const items = [];
    for (const selector of itemSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(item => {
          const titleElement = item.querySelector('.item-title, .product-title, .title');
          const priceElement = item.querySelector('.item-price, .price, .amount');
          const quantityElement = item.querySelector('.item-quantity, .quantity, .qty');
          
          if (titleElement) {
            items.push({
              title: titleElement.textContent.trim(),
              price: priceElement ? priceElement.textContent.trim() : '0',
              quantity: quantityElement ? parseInt(quantityElement.textContent.trim()) : 1
            });
          }
        });
        break;
      }
    }
    
    const result = {
      orderId: orderId || 'unknown',
      total: orderTotal,
      items: items.length > 0 ? items : null
    };
    
    console.log('📋 iPick: Order info extracted:', result);
    return result;
  }
  
  // Helper function to get checkout step information
  function getCheckoutStep() {
    const path = window.location.pathname;
    const url = window.location.href;
    
    console.log('🔍 iPick: Analyzing checkout step for path:', path);
    
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/checkout')) return 'checkout';
    if (path.includes('/thank_you') || path.includes('/orders/') || path.includes('/thank-you')) return 'thank_you';
    if (path.includes('/order/') && (path.includes('/thank') || url.includes('thank'))) return 'thank_you';
    
    // Check for thank you indicators in page content
    const thankYouIndicators = [
      '.thank-you',
      '.order-success', 
      '.order-confirmation',
      '.success-message'
    ];
    
    for (const selector of thankYouIndicators) {
      if (document.querySelector(selector)) {
        console.log('✅ iPick: Found thank you indicator:', selector);
        return 'thank_you';
      }
    }
    
    return 'unknown';
  }
  
  // Send event to iPick
  function sendEvent(eventType, eventData = {}) {
    console.log(`📤 iPick: Sending ${eventType} event:`, eventData);
    
    const payload = {
      event_type: eventType,
      business_id: BUSINESS_ID,
      affiliate_id: AFFILIATE_ID,
      platform: 'shopify',
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      data: eventData
    };
    
    console.log('📦 iPick: Full payload:', payload);
    
    // Send to iPick endpoint
    fetch(IPICK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (response.ok) {
        console.log(`✅ iPick: ${eventType} event sent successfully`);
        return response.json();
      } else {
        console.warn(`⚠️ iPick: Failed to send ${eventType} event, status:`, response.status);
        return response.text().then(text => {
          console.warn('Response text:', text);
          throw new Error(`HTTP ${response.status}: ${text}`);
        });
      }
    })
    .then(data => {
      console.log(`✅ iPick: ${eventType} event response:`, data);
    })
    .catch(error => {
      console.error(`❌ iPick: Error sending ${eventType} event:`, error);
    });
  }
  
  // Generate or get session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('ipick_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('ipick_session_id', sessionId);
    }
    return sessionId;
  }
  
  // Track page view
  function trackPageView() {
    const productInfo = getProductInfo();
    const checkoutStep = getCheckoutStep();
    
    sendEvent('page_view', {
      pageType: checkoutStep === 'cart' ? 'cart' : 
                checkoutStep === 'checkout' ? 'checkout' : 
                checkoutStep === 'thank_you' ? 'thank_you' : 'product',
      productTitle: productInfo.title,
      productPrice: productInfo.price,
      currency: productInfo.currency,
      checkoutStep: checkoutStep
    });
  }
  
  // Track product view
  function trackProductView() {
    const productInfo = getProductInfo();
    
    console.log('👁️ iPick: Tracking product view');
    
    sendEvent('product_view', {
      productTitle: productInfo.title,
      productPrice: productInfo.price,
      currency: productInfo.currency,
      productId: productInfo.id || null,
      productUrl: window.location.href,
      productCategory: productInfo.category || null
    });
  }
  
  // Track add to cart
  function trackAddToCart() {
    const productInfo = getProductInfo();
    const cartInfo = getCartInfo();
    
    sendEvent('add_to_cart', {
      productTitle: productInfo.title,
      productPrice: productInfo.price,
      currency: productInfo.currency,
      cartTotal: cartInfo ? cartInfo.total : null,
      cartItemCount: cartInfo ? cartInfo.item_count : null,
      productId: productInfo.id || null
    });
  }
  
  // Track initiate checkout
  function trackInitiateCheckout() {
    const cartInfo = getCartInfo();
    
    sendEvent('checkout', {
      cartTotal: cartInfo ? cartInfo.total : null,
      cartItemCount: cartInfo ? cartInfo.item_count : null,
      currency: cartInfo ? cartInfo.currency : 'EUR',
      checkoutStep: 'initiated'
    });
  }
  
  // Track checkout step progress
  function trackCheckoutStep(step) {
    const cartInfo = getCartInfo();
    
    sendEvent('checkout_step', {
      step: step,
      cartTotal: cartInfo ? cartInfo.total : null,
      cartItemCount: cartInfo ? cartInfo.item_count : null,
      currency: cartInfo ? cartInfo.currency : 'EUR'
    });
  }
  
  // Track purchase complete
  function trackPurchaseComplete() {
    console.log('💰 iPick: Tracking purchase completion');
    
    const orderInfo = getOrderInfo();
    
    // Send both purchase_complete and purchase events for compatibility
    const purchaseData = {
      orderId: orderInfo.orderId,
      totalAmount: orderInfo.total,
      currency: 'EUR',
      items: orderInfo.items,
      checkoutStep: 'completed'
    };
    
    // Send purchase_complete event
    sendEvent('purchase_complete', purchaseData);
    
    // Also send purchase event as fallback
    sendEvent('purchase', purchaseData);
    
    // Send conversion event as well
    sendEvent('conversion', {
      ...purchaseData,
      conversionType: 'purchase'
    });
  }
  
  // Initialize tracking
  function initTracking() {
    console.log('🚀 iPick tracking script initialized');
    
    // Track page view on load
    trackPageView();
    
    // Track product view if on product page
    if (window.location.pathname.includes('/products/')) {
      trackProductView();
    }
    
    // Track add to cart button clicks
    document.addEventListener('click', function(e) {
      const target = e.target.closest('button[name="add"], .add-to-cart, [data-add-to-cart]');
      if (target) {
        setTimeout(() => {
          trackAddToCart();
        }, 1000); // Small delay to ensure cart is updated
      }
    });
    
    // Track checkout initiation
    document.addEventListener('click', function(e) {
      const target = e.target.closest('a[href*="/cart"], button[href*="/cart"], .cart-link');
      if (target) {
        trackInitiateCheckout();
      }
    });
    
    // Track checkout step progress
    const checkoutStep = getCheckoutStep();
    if (checkoutStep === 'checkout') {
      // Track checkout step based on URL or page content
      if (window.location.pathname.includes('/checkout/contact')) {
        trackCheckoutStep('contact_info');
      } else if (window.location.pathname.includes('/checkout/shipping')) {
        trackCheckoutStep('shipping_method');
      } else if (window.location.pathname.includes('/checkout/payment')) {
        trackCheckoutStep('payment_method');
      } else {
        trackCheckoutStep('checkout_started');
      }
    }
    
    // Track purchase completion (on thank you page)
    if (checkoutStep === 'thank_you' || 
        document.querySelector('.order-success, .thank-you, .order-confirmation')) {
      console.log('💰 iPick: Detected thank you page, tracking purchase');
      trackPurchaseComplete();
    }
    
    // Additional purchase detection for Shopify
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.order) {
      console.log('💰 iPick: Shopify order object detected, tracking purchase');
      trackPurchaseComplete();
    }
    
    // Check for order confirmation in page title
    if (document.title.toLowerCase().includes('thank') || 
        document.title.toLowerCase().includes('order') ||
        document.title.toLowerCase().includes('confirmation')) {
      console.log('💰 iPick: Order confirmation detected in page title, tracking purchase');
      trackPurchaseComplete();
    }
    
    // Check for order confirmation in URL
    if (window.location.href.toLowerCase().includes('thank') || 
        window.location.href.toLowerCase().includes('order') ||
        window.location.href.toLowerCase().includes('confirmation')) {
      console.log('💰 iPick: Order confirmation detected in URL, tracking purchase');
      trackPurchaseComplete();
    }
  }
  
  // Start tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
  
})();
