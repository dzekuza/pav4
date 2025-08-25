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
    // Try to extract order details from page elements
    const orderIdElement = document.querySelector('[data-order-id], .order-id, .order-number');
    const orderTotalElement = document.querySelector('.order-total, .total-amount, [data-order-total]');
    const orderItems = document.querySelectorAll('.order-item, .line-item, [data-line-item]');
    
    const orderId = orderIdElement ? orderIdElement.textContent.trim() : 
                   getUrlParameter('order_id') || getUrlParameter('id') || 'unknown';
    
    const orderTotal = orderTotalElement ? orderTotalElement.textContent.trim() : '0';
    
    const items = Array.from(orderItems).map(item => {
      const titleElement = item.querySelector('.item-title, .product-title');
      const priceElement = item.querySelector('.item-price, .price');
      const quantityElement = item.querySelector('.item-quantity, .quantity');
      
      return {
        title: titleElement ? titleElement.textContent.trim() : 'Unknown Item',
        price: priceElement ? priceElement.textContent.trim() : '0',
        quantity: quantityElement ? parseInt(quantityElement.textContent.trim()) : 1
      };
    });
    
    return {
      orderId: orderId,
      total: orderTotal,
      items: items.length > 0 ? items : null
    };
  }
  
  // Helper function to get checkout step information
  function getCheckoutStep() {
    const path = window.location.pathname;
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/checkout')) return 'checkout';
    if (path.includes('/thank_you') || path.includes('/orders/')) return 'thank_you';
    return 'unknown';
  }
  
  // Send event to iPick
  function sendEvent(eventType, eventData = {}) {
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
      } else {
        console.warn(`⚠️ iPick: Failed to send ${eventType} event`);
      }
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
    const orderInfo = getOrderInfo();
    
    sendEvent('purchase_complete', {
      orderId: orderInfo.orderId,
      totalAmount: orderInfo.total,
      currency: 'EUR',
      items: orderInfo.items,
      checkoutStep: 'completed'
    });
  }
  
  // Initialize tracking
  function initTracking() {
    console.log('🚀 iPick tracking script initialized');
    
    // Track page view on load
    trackPageView();
    
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
