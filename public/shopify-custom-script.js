// PriceHunt Shopify Custom Tracking Enhancements
// Add this script AFTER the main shopify-tracker.js script in theme.liquid

(function() {
  'use strict';
  
  // Wait for the main tracker to be available
  function waitForTracker() {
    if (window.PriceHuntTracker) {
      initCustomTracking();
    } else {
      setTimeout(waitForTracker, 100);
    }
  }
  
  function initCustomTracking() {
    console.log('[PriceHunt] Custom tracking initialized');
    
    // Enhanced add to cart detection for Shopify themes
    enhanceAddToCartTracking();
    
    // Enhanced product view tracking
    enhanceProductViewTracking();
    
    // Enhanced link click tracking
    enhanceLinkClickTracking();
    
    // Track Shopify-specific events
    trackShopifyEvents();
  }
  
  function enhanceAddToCartTracking() {
    // Listen for Shopify's native add to cart events
    document.addEventListener('DOMContentLoaded', function() {
      // Common Shopify add to cart selectors
      const addToCartSelectors = [
        '[data-action="add-to-cart"]',
        '.add-to-cart',
        '[class*="cart"]',
        '[class*="add"]',
        'button[type="submit"]',
        'input[type="submit"]',
        '[data-testid*="add-to-cart"]',
        '[aria-label*="add to cart"]',
        '[title*="add to cart"]',
        '.btn-add-to-cart',
        '.product-form__submit',
        '.product-form__cart-submit',
        '.add-to-cart-btn',
        '.cart-btn',
        '.buy-now-btn'
      ];
      
      // Add click listeners to all add to cart buttons
      addToCartSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(button => {
          button.addEventListener('click', function(e) {
            console.log('[PriceHunt] Add to cart button clicked:', button);
            
            // Extract product data from the button or its context
            const productData = extractProductDataFromContext(button);
            
            window.PriceHuntTracker.track('add_to_cart', {
              product_id: productData.id,
              product_name: productData.name,
              product_price: productData.price,
              product_variant_id: productData.variantId,
              quantity: productData.quantity || 1
            });
          });
        });
      });
    });
  }
  
  function enhanceProductViewTracking() {
    // Track product views on product pages
    if (window.Shopify && window.Shopify.theme && window.Shopify.theme.product) {
      const product = window.Shopify.theme.product;
      
      window.PriceHuntTracker.track('product_view', {
        product_id: product.id,
        product_name: product.title,
        product_price: product.price,
        product_variant_id: product.selected_or_first_available_variant?.id
      });
    }
  }
  
  function enhanceLinkClickTracking() {
    // Track all link clicks for navigation analysis
    document.addEventListener('click', function(e) {
      if (e.target.tagName === 'A' && e.target.href) {
        const link = e.target;
        
        // Don't track internal navigation or external links
        if (link.href.includes(window.location.hostname) || 
            link.href.startsWith('mailto:') || 
            link.href.startsWith('tel:')) {
          return;
        }
        
        console.log('[PriceHunt] External link clicked:', link.href);
        
        window.PriceHuntTracker.track('link_click', {
          link_url: link.href,
          link_text: link.textContent.trim(),
          link_type: 'external'
        });
      }
    });
  }
  
  function trackShopifyEvents() {
    // Listen for Shopify's cart events
    document.addEventListener('cart:updated', function(e) {
      console.log('[PriceHunt] Cart updated event:', e.detail);
      
      window.PriceHuntTracker.track('cart_update', {
        cart_total: e.detail.total_price,
        item_count: e.detail.item_count,
        items: e.detail.items
      });
    });
    
    document.addEventListener('cart:added', function(e) {
      console.log('[PriceHunt] Product added to cart event:', e.detail);
      
      window.PriceHuntTracker.track('add_to_cart', {
        product_id: e.detail.id,
        product_name: e.detail.title,
        product_price: e.detail.price,
        product_variant_id: e.detail.variant_id,
        quantity: e.detail.quantity
      });
    });
    
    // Listen for checkout events
    document.addEventListener('checkout:started', function(e) {
      console.log('[PriceHunt] Checkout started event:', e.detail);
      
      window.PriceHuntTracker.track('checkout_start', {
        cart_total: e.detail.total_price,
        item_count: e.detail.item_count
      });
    });
  }
  
  function extractProductDataFromContext(element) {
    let data = {
      id: null,
      name: null,
      price: null,
      variantId: null,
      quantity: 1
    };
    
    // Try to get data from the element itself
    data.id = element.getAttribute('data-product-id') || 
              element.getAttribute('data-id');
    
    data.name = element.getAttribute('data-product-name') ||
                element.getAttribute('data-title');
    
    data.price = element.getAttribute('data-price');
    
    data.variantId = element.getAttribute('data-variant-id') ||
                     element.getAttribute('data-variant');
    
    // Try to get data from parent elements
    const parent = element.closest('[data-product-id], .product-item, .product-card');
    if (parent) {
      if (!data.id) data.id = parent.getAttribute('data-product-id');
      if (!data.name) data.name = parent.getAttribute('data-product-name');
      if (!data.price) data.price = parent.getAttribute('data-price');
      if (!data.variantId) data.variantId = parent.getAttribute('data-variant-id');
    }
    
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
    
    // Try to get quantity from form
    const form = element.closest('form');
    if (form) {
      const quantityInput = form.querySelector('input[name="quantity"]');
      if (quantityInput) {
        data.quantity = parseInt(quantityInput.value) || 1;
      }
    }
    
    return data;
  }
  
  // Start the custom tracking
  waitForTracker();
  
})();
