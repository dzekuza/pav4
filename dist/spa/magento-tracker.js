// Magento-specific tracking script
(function () {
  'use strict';

  // Load the main tracker first
  const mainScript = document.createElement('script');
  mainScript.src = 'https://paaav.vercel.app/tracker.js';
  mainScript.async = true;
  mainScript.setAttribute('data-business-id', document.currentScript.getAttribute('data-business-id'));
  mainScript.setAttribute('data-affiliate-id', document.currentScript.getAttribute('data-affiliate-id'));
  mainScript.setAttribute('data-platform', 'magento');
  document.head.appendChild(mainScript);

  // Magento-specific tracking
  function initMagentoTracking() {
    // Track Magento product page views
    if (document.body.classList.contains('catalog-product-view')) {
      const productId = document.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
        document.querySelector('.product-info')?.getAttribute('data-product-id');
      const productName = document.querySelector('.page-title')?.textContent ||
        document.querySelector('.product-name h1')?.textContent;
      const priceElement = document.querySelector('.price-box .price, .special-price .price');
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
      if (target.matches('.action.primary.tocart, .btn-cart, [data-action="add-to-cart"]')) {
        const productId = target.getAttribute('data-product-id') ||
          target.closest('[data-product-id]')?.getAttribute('data-product-id');
        const productName = document.querySelector('.page-title')?.textContent ||
          target.closest('.product-info')?.querySelector('.page-title')?.textContent;
        const priceElement = document.querySelector('.price-box .price, .special-price .price');
        const price = priceElement ? priceElement.textContent.replace(/[^\d.,]/g, '') : null;

        window.trackEvent('add_to_cart', {
          product_id: productId,
          product_name: productName,
          price: price
        });
      }

      // Track "Buy Now" buttons
      if (target.matches('.action.primary.checkout, .btn-buy-now, [data-action="buy-now"]')) {
        const productId = target.getAttribute('data-product-id') ||
          target.closest('[data-product-id]')?.getAttribute('data-product-id');
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

    // Track Magento checkout completion
    if (document.body.classList.contains('checkout-onepage-success') ||
      document.body.classList.contains('checkout-success')) {

      const orderId = document.querySelector('.checkout-success .order-number')?.textContent ||
        document.querySelector('[data-order-id]')?.getAttribute('data-order-id');
      const totalAmount = document.querySelector('.checkout-success .grand-total .price')?.textContent ||
        document.querySelector('.order-total .price')?.textContent;

      if (orderId) {
        window.trackEvent('conversion', {
          order_id: orderId,
          total_amount: totalAmount,
          currency: 'USD', // Magento default
          products: [] // Could be populated from cart data
        });
      }
    }

    // Track product links in catalog
    document.addEventListener('click', function (e) {
      const target = e.target;

      // Track product links
      if (target.matches('a[href*="/product/"], .product-item-link, .product a')) {
        const productId = target.getAttribute('data-product-id') ||
          target.closest('[data-product-id]')?.getAttribute('data-product-id');
        const productName = target.querySelector('.product-item-name')?.textContent ||
          target.getAttribute('data-product-name');

        window.trackEvent('product_view', {
          product_id: productId,
          product_name: productName
        });
      }
    });

    // Track AJAX add to cart (Magento uses AJAX)
    if (window.jQuery) {
      jQuery(document).on('ajax:addToCart', function (event, data) {
        const productId = data.product_id;
        const productName = data.product_name;
        const price = data.price;

        window.trackEvent('add_to_cart', {
          product_id: productId,
          product_name: productName,
          price: price
        });
      });
    }

    // Track Magento-specific events
    if (window.require) {
      require(['jquery'], function ($) {
        // Track add to cart via Magento's native events
        $(document).on('ajax:addToCart', function (event, data) {
          window.trackEvent('add_to_cart', {
            product_id: data.product_id,
            product_name: data.product_name,
            price: data.price
          });
        });

        // Track checkout success
        $(document).on('checkout:success', function (event, data) {
          window.trackEvent('conversion', {
            order_id: data.order_id,
            total_amount: data.total_amount,
            currency: data.currency || 'USD',
            products: data.products || []
          });
        });
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMagentoTracking);
  } else {
    initMagentoTracking();
  }

  console.log('Magento tracking initialized');

})(); 