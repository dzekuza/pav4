// Shopify Pixel Script for ipick.io Event Tracking
(function () {
  "use strict";

  // Configuration
  const config = {
    apiUrl: "https://pavlo4.netlify.app/.netlify/functions/track-event",
    businessId: "1", // Will be set by Shopify
    affiliateId: "shopify-pixel",
    platform: "shopify",
    sessionId: generateSessionId(),
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    timestamp: Date.now(),
  };

  // Generate unique session ID
  function generateSessionId() {
    return "shopify_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
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
      page_title: document.title,
      data: {
        ...data,
        shop_domain: window.Shopify?.shop || window.location.hostname,
        source: "shopify-pixel"
      }
    };

    // Send to our API
    fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 16272754ed68cbdcb55e8f579703d92e"
      },
      body: JSON.stringify(trackingData),
    }).catch((error) => {
      console.log("Shopify pixel tracking error:", error);
    });
  }

  // Track page view
  function trackPageView() {
    sendTrackingData("page_view", {
      page_title: document.title,
      page_url: window.location.href,
      page_type: getPageType()
    });
  }

  // Get Shopify page type
  function getPageType() {
    const path = window.location.pathname;
    if (path.includes('/products/')) return 'product';
    if (path.includes('/collections/')) return 'collection';
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/checkout')) return 'checkout';
    if (path.includes('/account')) return 'account';
    if (path === '/' || path === '') return 'home';
    return 'other';
  }

  // Track product view
  function trackProductView() {
    // Extract product data from Shopify page
    const productData = extractProductData();
    if (productData) {
      sendTrackingData("product_view", productData);
    }
  }

  // Track add to cart
  function trackAddToCart() {
    const productData = extractProductData();
    if (productData) {
      sendTrackingData("add_to_cart", productData);
    }
  }

  // Track purchase
  function trackPurchase() {
    const orderData = extractOrderData();
    if (orderData) {
      sendTrackingData("purchase_complete", orderData);
    }
  }

  // Extract product data from Shopify page
  function extractProductData() {
    try {
      // Try to get data from Shopify's product JSON
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

      // Fallback: extract from meta tags
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

      return null;
    } catch (error) {
      console.log("Error extracting product data:", error);
      return null;
    }
  }

  // Extract order data from checkout/thank you page
  function extractOrderData() {
    try {
      // Check if we're on a thank you page
      if (window.location.pathname.includes('/thank_you') || 
          window.location.pathname.includes('/orders/') ||
          document.title.includes('Thank you')) {
        
        // Try to extract order data from page
        const orderMatch = window.location.pathname.match(/\/orders\/(\d+)/);
        const orderId = orderMatch ? orderMatch[1] : null;
        
        // Look for order total in page content
        const priceElements = document.querySelectorAll('[class*="price"], [class*="total"], [class*="amount"]');
        let totalAmount = null;
        
        for (let element of priceElements) {
          const text = element.textContent;
          const priceMatch = text.match(/[\$€£¥]?[\d,]+\.?\d*/);
          if (priceMatch) {
            totalAmount = priceMatch[0];
            break;
          }
        }

        return {
          order_id: orderId,
          total_amount: totalAmount,
          currency: 'USD',
          page_url: window.location.href
        };
      }
      
      return null;
    } catch (error) {
      console.log("Error extracting order data:", error);
      return null;
    }
  }

  // Initialize tracking
  function initTracking() {
    // Track page view
    trackPageView();

    // Track product view if on product page
    if (getPageType() === 'product') {
      trackProductView();
    }

    // Track purchase if on thank you page
    if (window.location.pathname.includes('/thank_you') || 
        window.location.pathname.includes('/orders/')) {
      trackPurchase();
    }

    // Listen for add to cart events
    document.addEventListener('click', function(e) {
      const target = e.target;
      
      // Track add to cart clicks
      if (target.matches('[name="add"], .add-to-cart, [class*="add"], [class*="cart"]')) {
        setTimeout(() => {
          trackAddToCart();
        }, 100);
      }
    });

    // Listen for form submissions (checkout)
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.matches('[action*="checkout"], [action*="cart"]')) {
        sendTrackingData("checkout_start", {
          form_action: form.action,
          page_url: window.location.href
        });
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTracking);
  } else {
    initTracking();
  }

  // Expose tracking function globally
  window.ipickTrack = function(eventType, data) {
    sendTrackingData(eventType, data);
  };

  console.log("Shopify pixel tracking initialized for ipick.io");
})();
