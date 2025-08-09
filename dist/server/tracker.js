// Main tracking script for affiliate tracking
(function () {
  'use strict';

  // Get business and affiliate IDs from script tag
  const script = document.currentScript || document.querySelector('script[src*="tracker.js"]');
  const businessId = script ? script.getAttribute('data-business-id') : null;
  const affiliateId = script ? script.getAttribute('data-affiliate-id') : null;
  const platform = script ? script.getAttribute('data-platform') : 'universal';

  // Configuration
  const config = {
    apiUrl: 'https://paaav.vercel.app/api',
    businessId: businessId,
    affiliateId: affiliateId,
    platform: platform,
    sessionId: generateSessionId(),
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    timestamp: Date.now()
  };

  // Generate unique session ID
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Send tracking data to API
  function sendTrackingData(eventType, data) {
    const trackingData = {
      event_type: eventType,
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      platform: config.platform,
      session_id: config.sessionId,
      user_agent: config.userAgent,
      referrer: config.referrer,
      timestamp: Date.now(),
      url: window.location.href,
      data: data
    };

    // Send to our API
    fetch(config.apiUrl + '/track-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData)
    }).catch(error => {
      console.log('Tracking error:', error);
    });
  }

  // Track page view
  function trackPageView() {
    sendTrackingData('page_view', {
      page_title: document.title,
      page_url: window.location.href
    });
  }

  // Track purchase click
  function trackPurchaseClick(productData) {
    sendTrackingData('purchase_click', {
      product_id: productData.product_id,
      product_name: productData.product_name,
      price: productData.price,
      currency: productData.currency || 'USD'
    });
  }

  // Track product view
  function trackProductView(productData) {
    sendTrackingData('product_view', {
      product_id: productData.product_id,
      product_name: productData.product_name,
      price: productData.price,
      currency: productData.currency || 'USD'
    });
  }

  // Track add to cart
  function trackAddToCart(productData) {
    sendTrackingData('add_to_cart', {
      product_id: productData.product_id,
      product_name: productData.product_name,
      price: productData.price,
      currency: productData.currency || 'USD'
    });
  }

  // Track conversion (purchase completed)
  function trackConversion(orderData) {
    sendTrackingData('conversion', {
      order_id: orderData.order_id,
      total_amount: orderData.total_amount,
      currency: orderData.currency || 'USD',
      products: orderData.products || []
    });
  }

  // Listen for clicks on common e-commerce elements
  document.addEventListener('click', function (e) {
    const target = e.target;

    // Track "Buy Now" buttons
    if (target.matches('[data-track="buy-now"], .buy-now, .purchase-now, [class*="buy"], [class*="purchase"]')) {
      const productId = target.getAttribute('data-product-id') || target.closest('[data-product-id]')?.getAttribute('data-product-id');
      const productName = target.getAttribute('data-product-name') || target.closest('[data-product-name]')?.getAttribute('data-product-name');
      const price = target.getAttribute('data-price') || target.closest('[data-price]')?.getAttribute('data-price');

      trackPurchaseClick({
        product_id: productId,
        product_name: productName,
        price: price
      });
    }

    // Track "View Product" links
    if (target.matches('[data-track="view-product"], .product-link, [class*="product"], a[href*="product"]')) {
      const productId = target.getAttribute('data-product-id') || target.closest('[data-product-id]')?.getAttribute('data-product-id');
      const productName = target.getAttribute('data-product-name') || target.closest('[data-product-name]')?.getAttribute('data-product-name');
      const price = target.getAttribute('data-price') || target.closest('[data-price]')?.getAttribute('data-price');

      trackProductView({
        product_id: productId,
        product_name: productName,
        price: price
      });
    }

    // Track "Add to Cart" buttons
    if (target.matches('[data-track="add-to-cart"], .add-to-cart, [class*="cart"], [class*="add"]')) {
      const productId = target.getAttribute('data-product-id') || target.closest('[data-product-id]')?.getAttribute('data-product-id');
      const productName = target.getAttribute('data-product-name') || target.closest('[data-product-name]')?.getAttribute('data-product-name');
      const price = target.getAttribute('data-price') || target.closest('[data-price]')?.getAttribute('data-price');

      trackAddToCart({
        product_id: productId,
        product_name: productName,
        price: price
      });
    }
  });

  // Track page views
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }

  // Expose tracking functions globally
  window.trackEvent = function (eventType, data) {
    switch (eventType) {
      case 'purchase_click':
        trackPurchaseClick(data);
        break;
      case 'product_view':
        trackProductView(data);
        break;
      case 'add_to_cart':
        trackAddToCart(data);
        break;
      case 'conversion':
        trackConversion(data);
        break;
      default:
        sendTrackingData(eventType, data);
    }
  };

  // Log that tracking is active
  console.log('Affiliate tracking active for business:', config.businessId, 'affiliate:', config.affiliateId);

})(); 