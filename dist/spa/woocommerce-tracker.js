// WooCommerce-specific tracking script
(function () {
  'use strict';

  // Load the main tracker first
  const mainScript = document.createElement('script');
  mainScript.src = 'https://paaav.vercel.app/tracker.js';
  mainScript.async = true;
  mainScript.setAttribute('data-business-id', document.currentScript.getAttribute('data-business-id'));
  mainScript.setAttribute('data-affiliate-id', document.currentScript.getAttribute('data-affiliate-id'));
  mainScript.setAttribute('data-platform', 'woocommerce');
  document.head.appendChild(mainScript);

  // WooCommerce-specific tracking
  function initWooCommerceTracking() {
    // Track WooCommerce product page views
    if (document.body.classList.contains('single-product')) {
      const productId = document.querySelector('[data-product_id]')?.getAttribute('data-product_id') ||
        document.querySelector('.product')?.getAttribute('data-product-id');
      const productName = document.querySelector('.product_title')?.textContent ||
        document.querySelector('h1.product_title')?.textContent;
      const priceElement = document.querySelector('.price .amount, .woocommerce-Price-amount');
      const price = priceElement ? priceElement.textContent.replace(/[^\d.,]/g, '') : null;

      if (productId) {
        window.trackEvent('product_view', {
          product_id: productId,
          product_name: productName,
          price: price
        });
      }
    }

    // Track add to cart events
    document.addEventListener('click', function (e) {
      const target = e.target;

      // Track "Add to Cart" buttons
      if (target.matches('.single_add_to_cart_button, .add_to_cart_button, [name="add-to-cart"]')) {
        const productId = target.getAttribute('data-product_id') ||
          target.closest('[data-product_id]')?.getAttribute('data-product_id') ||
          target.closest('.product')?.getAttribute('data-product-id');
        const productName = document.querySelector('.product_title')?.textContent ||
          target.closest('.product')?.querySelector('.product_title')?.textContent;
        const priceElement = document.querySelector('.price .amount, .woocommerce-Price-amount');
        const price = priceElement ? priceElement.textContent.replace(/[^\d.,]/g, '') : null;

        window.trackEvent('add_to_cart', {
          product_id: productId,
          product_name: productName,
          price: price
        });
      }

      // Track "Buy Now" or "Purchase" buttons
      if (target.matches('.buy-now, .purchase-now, [class*="buy"], [class*="purchase"]')) {
        const productId = target.getAttribute('data-product_id') ||
          target.closest('[data-product_id]')?.getAttribute('data-product_id');
        const productName = target.getAttribute('data-product-name') ||
          target.closest('[data-product-name]')?.getAttribute('data-product-name');
        const price = target.getAttribute('data-price') ||
          target.closest('[data-price]')?.getAttribute('data-price');

        window.trackEvent('purchase_click', {
          product_id: productId,
          product_name: productName,
          price: price
        });
      }
    });

    // Track WooCommerce checkout completion
    if (document.body.classList.contains('woocommerce-checkout') ||
      document.body.classList.contains('woocommerce-order-received')) {

      // Try to get order data from WooCommerce
      const orderData = window.wc_checkout_params || {};
      const orderId = document.querySelector('.woocommerce-order-number')?.textContent ||
        document.querySelector('[data-order-id]')?.getAttribute('data-order-id');
      const totalAmount = document.querySelector('.woocommerce-order-total .amount')?.textContent ||
        document.querySelector('.order-total .amount')?.textContent;

      if (orderId) {
        window.trackEvent('conversion', {
          order_id: orderId,
          total_amount: totalAmount,
          currency: 'USD', // WooCommerce default
          products: [] // Could be populated from cart data
        });
      }
    }

    // Track product links in catalog
    document.addEventListener('click', function (e) {
      const target = e.target;

      // Track product links
      if (target.matches('a[href*="/product/"], .woocommerce-loop-product__link, .product a')) {
        const productId = target.getAttribute('data-product_id') ||
          target.closest('[data-product_id]')?.getAttribute('data-product_id');
        const productName = target.querySelector('.woocommerce-loop-product__title')?.textContent ||
          target.getAttribute('data-product-name');

        window.trackEvent('product_view', {
          product_id: productId,
          product_name: productName
        });
      }
    });

    // Track AJAX add to cart (WooCommerce uses AJAX)
    if (window.jQuery) {
      jQuery(document).on('added_to_cart', function (event, fragments, cart_hash, button) {
        const productId = button.getAttribute('data-product_id');
        const productName = button.closest('.product')?.querySelector('.woocommerce-loop-product__title')?.textContent;
        const priceElement = button.closest('.product')?.querySelector('.price .amount');
        const price = priceElement ? priceElement.textContent.replace(/[^\d.,]/g, '') : null;

        window.trackEvent('add_to_cart', {
          product_id: productId,
          product_name: productName,
          price: price
        });
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWooCommerceTracking);
  } else {
    initWooCommerceTracking();
  }

  console.log('WooCommerce tracking initialized');

})(); 