/**
 * PriceHunt Simplified Shopify Tracker Loader
 *
 * This is a lightweight loader that businesses can easily add to their sites.
 * It dynamically loads the full enhanced tracking script and handles initialization.
 */

(function () {
  "use strict";

  // Prevent multiple loader initializations
  if (window.PriceHuntLoaderInitialized) {
    console.log("[PriceHunt] Loader already initialized, skipping...");
    return;
  }
  window.PriceHuntLoaderInitialized = true;

  // Get configuration from script tag
  const script =
    document.currentScript ||
    document.querySelector('script[src*="shopify-tracker-loader.js"]');
  let businessId = script?.getAttribute("data-business-id");
  let affiliateId = script?.getAttribute("data-affiliate-id");
  const debug = script?.getAttribute("data-debug") === "true";

  // Try to get from URL parameters as fallback
  if (!businessId) {
    const urlParams = new URLSearchParams(window.location.search);
    businessId = urlParams.get('utm_source') || urlParams.get('business_id');
  }
  if (!affiliateId) {
    const urlParams = new URLSearchParams(window.location.search);
    affiliateId = urlParams.get('utm_medium') || urlParams.get('affiliate_id');
  }

  // Validate required parameters
  if (!businessId || !affiliateId) {
    console.error(
      "[PriceHunt] Missing required parameters: data-business-id and data-affiliate-id",
    );
    console.error("[PriceHunt] Current values:", { businessId, affiliateId });
    return;
  }

  console.log(
    "[PriceHunt] Loading enhanced tracking for business:",
    businessId,
  );

  // Create and load the enhanced script
  function loadEnhancedTracker() {
    const enhancedScript = document.createElement("script");
    enhancedScript.src =
      "https://pavlo4.netlify.app/shopify-tracker-enhanced.js";
    enhancedScript.setAttribute("data-business-id", businessId);
    enhancedScript.setAttribute("data-affiliate-id", affiliateId);
    if (debug) {
      enhancedScript.setAttribute("data-debug", "true");
    }

    // Add load event listener
    enhancedScript.onload = function () {
      console.log("[PriceHunt] Enhanced tracker loaded successfully");

      // Initialize tracking when DOM is ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeTracking);
      } else {
        initializeTracking();
      }
    };

    enhancedScript.onerror = function () {
      console.error("[PriceHunt] Failed to load enhanced tracker");
    };

    // Insert the script
    document.head.appendChild(enhancedScript);
  }

  // Initialize tracking with enhanced features
  function initializeTracking() {
    console.log("[PriceHunt] Initializing enhanced tracking...");

    // Wait for Shopify to be ready
    function waitForShopify() {
      if (window.Shopify && window.Shopify.theme) {
        console.log("[PriceHunt] Shopify theme detected");

        // Track product view if on product page
        if (window.Shopify.theme.product && window.PriceHuntTracker) {
          window.PriceHuntTracker.track("product_view", {
            product_id: window.Shopify.theme.product.id,
            product_name: window.Shopify.theme.product.title,
            product_price: window.Shopify.theme.product.price,
            product_variant_id:
              window.Shopify.theme.product.selected_or_first_available_variant
                ?.id,
            product_type: window.Shopify.theme.product.type,
            product_vendor: window.Shopify.theme.product.vendor,
          });
        }

        // Setup enhanced cart tracking
        setupEnhancedCartTracking();
      } else {
        console.log("[PriceHunt] Waiting for Shopify to load...");
        setTimeout(waitForShopify, 500);
      }
    }

    // Enhanced cart tracking setup
    function setupEnhancedCartTracking() {
      console.log("[PriceHunt] Setting up enhanced cart tracking...");

      // Track form submissions
      document.addEventListener("submit", function (e) {
        const form = e.target;
        if (form.action.includes("/cart/add") || form.action.includes("cart")) {
          const formData = new FormData(form);
          const productId = formData.get("id");
          const quantity = formData.get("quantity") || 1;

          if (window.PriceHuntTracker && productId) {
            window.PriceHuntTracker.track("add_to_cart", {
              product_id: productId,
              product_name:
                window.Shopify.theme.product?.title || "Unknown Product",
              product_price: window.Shopify.theme.product?.price || "0",
              quantity: quantity,
            });
          }
        }
      });

      // Track button clicks
      document.addEventListener("click", function (e) {
        const target = e.target;
        const targetText = target.textContent?.toLowerCase() || "";

        // Check for add to cart buttons
        const isAddToCartButton =
          target.matches('[data-action*="add"], [data-action*="cart"]') ||
          target.matches(".add-to-cart, .cart-button, .buy-button") ||
          target.matches('button[type="submit"]') ||
          targetText.includes("add to cart") ||
          targetText.includes("buy now") ||
          targetText.includes("add to bag") ||
          targetText.includes("purchase") ||
          target.closest('form[action*="/cart/add"]');

        if (isAddToCartButton && window.PriceHuntTracker) {
          let productData = {
            product_id:
              target.getAttribute("data-product-id") ||
              target.getAttribute("data-id") ||
              target
                .closest("[data-product-id]")
                ?.getAttribute("data-product-id"),
            product_name:
              target.getAttribute("data-product-name") ||
              target.getAttribute("data-title") ||
              window.Shopify.theme.product?.title,
            product_price:
              target.getAttribute("data-price") ||
              window.Shopify.theme.product?.price,
            quantity: target.getAttribute("data-quantity") || 1,
          };

          window.PriceHuntTracker.track("add_to_cart", productData);
        }

        // Track product link clicks
        if (
          (target.matches('a[href*="/products/"]') ||
            target.closest('a[href*="/products/"]')) &&
          window.PriceHuntTracker
        ) {
          const link = target.href
            ? target
            : target.closest('a[href*="/products/"]');
          window.PriceHuntTracker.track("product_click", {
            product_url: link.href,
            product_name: target.textContent?.trim() || "Product Link",
          });
        }
      });

      // Track AJAX cart updates
      if (
        window.Shopify &&
        window.Shopify.theme &&
        window.Shopify.theme.cart &&
        window.Shopify.theme.cart.addItem
      ) {
        const originalAddItem = window.Shopify.theme.cart.addItem;
        window.Shopify.theme.cart.addItem = function (...args) {
          const result = originalAddItem.apply(this, args);
          if (result && result.then && window.PriceHuntTracker) {
            result.then(function (item) {
              window.PriceHuntTracker.track("add_to_cart", {
                product_id: item.product_id,
                product_name: item.product_title,
                product_price: item.price,
                product_variant_id: item.variant_id,
                quantity: item.quantity,
              });
            });
          }
          return result;
        };
      }

      // Track checkout initiation
      document.addEventListener("click", function (e) {
        const target = e.target;
        const href = target.href || target.getAttribute("href") || "";

        if (
          (href.includes("/checkout") ||
            (href.includes("/cart") &&
              target.textContent.toLowerCase().includes("checkout"))) &&
          window.PriceHuntTracker
        ) {
          window.PriceHuntTracker.track("checkout_start", {
            checkout_url: href,
            referrer: window.location.href,
          });
        }
      });
    }

    // Start the tracking
    waitForShopify();

    // Expose debug functions
    window.PriceHuntDebug = {
      getTrackerStatus: function () {
        return {
          trackerLoaded: !!window.PriceHuntTracker,
          shopifyLoaded: !!(window.Shopify && window.Shopify.theme),
          productData: window.Shopify?.theme?.product || null,
          config: window.PriceHuntTracker?.getConfig?.() || null,
        };
      },

      testEvent: function (eventType, data) {
        if (window.PriceHuntTracker) {
          window.PriceHuntTracker.track(eventType, data);
          console.log("[PriceHunt] Test event sent:", eventType, data);
          return true;
        } else {
          console.error("[PriceHunt] Tracker not available");
          return false;
        }
      },

      getEventsSent: function () {
        return window.PriceHuntTracker?.getEventsSent?.() || [];
      },
    };

    console.log("[PriceHunt] Enhanced tracking initialized successfully");
  }

  // Start loading
  loadEnhancedTracker();
})();
