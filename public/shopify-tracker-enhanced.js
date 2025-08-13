// PriceHunt Enhanced Shopify Integration
(function () {
  "use strict";

  // Configuration
  const config = {
    businessId: null,
    affiliateId: null,
    debug: false,
    endpoint: null,
    sessionId: generateSessionId(),
    pageLoadTime: Date.now(),
    eventsSent: [],
  };

  // Initialize tracking
  function init() {
    // Get configuration from script tag
    const script =
      document.currentScript ||
      document.querySelector('script[src*="shopify-tracker"]');
    if (script) {
      config.businessId = script.getAttribute("data-business-id");
      config.affiliateId = script.getAttribute("data-affiliate-id");
      config.debug = script.getAttribute("data-debug") === "true";
      config.endpoint = script.getAttribute("data-endpoint") || "https://pavlo4.netlify.app/.netlify/functions/track-event";
    }

    // Try to get from URL parameters as fallback
    if (!config.businessId) {
      const urlParams = new URLSearchParams(window.location.search);
      config.businessId = urlParams.get('utm_source') || urlParams.get('business_id');
    }
    if (!config.affiliateId) {
      const urlParams = new URLSearchParams(window.location.search);
      config.affiliateId = urlParams.get('utm_medium') || urlParams.get('affiliate_id');
    }

    // Validate required parameters
    if (!config.businessId || !config.affiliateId) {
      log("Error: Missing required parameters (business-id or affiliate-id)", "error");
      log("Current config:", config);
      return;
    }

    log("PriceHunt Enhanced Shopify Tracker initialized for " + window.location.hostname);
    log("Config:", config);

    // Send page view event
    sendEvent({
      event_type: "page_view",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      url: window.location.href,
      data: {
        page_title: document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
      },
      timestamp: config.pageLoadTime,
    });

    // Set up event listeners
    setupEventListeners();

    // Check for product data and send product view
    checkForProductData();

    // Set up mutation observer for dynamic content
    setupMutationObserver();

    // Check for purchase completion
    if (trackPurchaseCompletion()) {
      log("Purchase completion tracked on page load", "success");
    }
  }

  // Generate unique session ID
  function generateSessionId() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  // Logging function
  function log(message, level = "info") {
    if (config.debug) {
      const prefix = "[PriceHunt Tracker]";
      const timestamp = new Date().toISOString();
      switch (level) {
        case "error":
          console.error(prefix, `[${timestamp}]`, message);
          break;
        case "warn":
          console.warn(prefix, `[${timestamp}]`, message);
          break;
        default:
          console.log(prefix, `[${timestamp}]`, message);
      }
    }
  }

  // Check for product data and send product view
  function checkForProductData() {
    log("Checking for product data...");

    // Try multiple methods to get product data
    let productData = null;

    // Method 1: Shopify theme object
    if (
      window.Shopify &&
      window.Shopify.theme &&
      window.Shopify.theme.product
    ) {
      productData = window.Shopify.theme.product;
      log("Found product via Shopify.theme.product:", productData);
    }

    // Method 2: Meta tags
    if (!productData) {
      const productIdMeta = document.querySelector(
        'meta[property="product:price:amount"]',
      );
      if (productIdMeta) {
        productData = {
          id: document
            .querySelector('meta[property="product:price:currency"]')
            ?.getAttribute("content"),
          title: document.title,
          price: productIdMeta.getAttribute("content"),
        };
        log("Found product via meta tags:", productData);
      }
    }

    // Method 3: JSON-LD structured data
    if (!productData) {
      const jsonLdScripts = document.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data["@type"] === "Product") {
            productData = {
              id: data.sku || data.gtin || data["@id"],
              title: data.name,
              price: data.offers?.price,
            };
            log("Found product via JSON-LD:", productData);
            break;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }

    // Method 4: Product form data
    if (!productData) {
      const productForm = document.querySelector('form[action*="/cart/add"]');
      if (productForm) {
        const productIdInput = productForm.querySelector('input[name="id"]');
        const productTitle = document.querySelector(
          '.product-title, h1, [class*="product"] h1',
        );
        if (productIdInput) {
          productData = {
            id: productIdInput.value,
            title: productTitle?.textContent?.trim() || document.title,
            price: null,
          };
          log("Found product via form:", productData);
        }
      }
    }

    if (productData) {
      const eventData = {
        event_type: "product_view",
        business_id: config.businessId,
        affiliate_id: config.affiliateId,
        session_id: config.sessionId,
        url: window.location.href,
        data: {
          product_id: productData.id,
          product_name: productData.title,
          product_price: productData.price,
          product_variant_id: productData.variant_id || productData.id,
        },
        timestamp: Date.now(),
      };

      sendEvent(eventData);
    } else {
      log("No product data found on this page", "warn");
    }
  }

  // Track purchase completion
  function trackPurchaseCompletion() {
    // Check for purchase completion indicators
    const purchaseIndicators = [
      // Shopify checkout completion
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/thank_you'),
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/thank-you'),
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/complete'),
      
      // Order confirmation pages
      window.location.pathname.includes('/orders/'),
      window.location.pathname.includes('/order/'),
      
      // Thank you pages
      window.location.pathname.includes('/thank-you'),
      window.location.pathname.includes('/thank_you'),
      window.location.pathname.includes('/success'),
      window.location.pathname.includes('/complete'),
      
      // Check for order confirmation in page content
      document.title.toLowerCase().includes('order confirmation'),
      document.title.toLowerCase().includes('thank you'),
      document.title.toLowerCase().includes('purchase complete'),
    ];

    if (purchaseIndicators.some(indicator => indicator)) {
      log("Purchase completion detected", "info");
      
      // Extract order information
      let orderData = {};
      
      // Try to get order ID from URL
      const urlMatch = window.location.pathname.match(/\/orders?\/([^\/]+)/);
      if (urlMatch) {
        orderData.order_id = urlMatch[1];
      }
      
      // Try to get order information from page content
      const orderElements = document.querySelectorAll('[data-order-id], [data-order-number], .order-id, .order-number');
      if (orderElements.length > 0) {
        orderData.order_id = orderData.order_id || orderElements[0].textContent.trim();
      }
      
      // Try to get total amount from page
      const totalElements = document.querySelectorAll('[data-total], .total, .order-total, .amount');
      if (totalElements.length > 0) {
        const totalText = totalElements[0].textContent.trim();
        const amountMatch = totalText.match(/[\d,]+\.?\d*/);
        if (amountMatch) {
          orderData.total_amount = parseFloat(amountMatch[0].replace(/,/g, ''));
        }
      }
      
      // Send purchase completion event
      sendEvent({
        event_type: "purchase_complete",
        business_id: config.businessId,
        affiliate_id: config.affiliateId,
        session_id: config.sessionId,
        url: window.location.href,
        data: {
          ...orderData,
          platform: "shopify"
        },
        timestamp: Date.now(),
      });
      
      // Also send sale data to business dashboard
      if (orderData.order_id && orderData.total_amount) {
        sendSaleData(orderData);
      }
      
      return true;
    }
    
    return false;
  }

  // Send sale data to business dashboard
  function sendSaleData(orderData) {
    const saleData = {
      businessId: config.businessId,
      orderId: orderData.order_id,
      amount: orderData.total_amount,
      domain: window.location.hostname,
      customerId: null // Could be extracted if available
    };

    // Send to track-sale endpoint
    fetch("https://pavlo4.netlify.app/api/track-sale", {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": window.location.origin,
      },
      body: JSON.stringify(saleData),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to send sale data: " + response.status);
      }
      return response.json();
    })
    .then(data => {
      log("Sale data sent successfully", "success");
      log("Sale response:", data);
    })
    .catch(error => {
      log("Failed to send sale data: " + error.message, "error");
    });
  }

  // Set up event listeners
  function setupEventListeners() {
    log("Setting up event listeners...");

    // Track add to cart events
    document.addEventListener("click", function (e) {
      const target = e.target;

      // Check for add to cart buttons
      if (isAddToCartButton(target)) {
        log("Add to cart button clicked:", target);
        trackAddToCart(target);
      }

      // Check for product clicks
      if (isProductLink(target)) {
        log("Product link clicked:", target);
        trackProductClick(target);
      }
    });

    // Track form submissions (checkout)
    document.addEventListener("submit", function (e) {
      if (isCheckoutForm(e.target)) {
        log("Checkout form submitted:", e.target);
        trackCheckoutStart(e.target);
      }
    });

    // Track AJAX add to cart (for dynamic cart updates)
    if (window.Shopify && window.Shopify.onCartUpdate) {
      window.Shopify.onCartUpdate = function (cart) {
        log("Cart updated via Shopify API:", cart);
        trackCartUpdate(cart);
      };
    }

    // Shopify-specific cart tracking
    if (window.Shopify && window.Shopify.theme) {
      // Track cart changes via Shopify's cart API
      if (window.Shopify.theme.cart) {
        const originalAddItem = window.Shopify.theme.cart.addItem;
        if (originalAddItem) {
          window.Shopify.theme.cart.addItem = function (...args) {
            log("Shopify cart.addItem called with args:", args);
            const result = originalAddItem.apply(this, args);
            result
              .then(function (item) {
                log("Shopify cart.addItem success:", item);
                trackAddToCartSuccess(item);
              })
              .catch(function (error) {
                log("Shopify cart.addItem error:", error);
              });
            return result;
          };
        }
      }
    }

    log("Event listeners setup complete");
  }

  // Set up mutation observer for dynamic content
  function setupMutationObserver() {
    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach(function (node) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check for new add to cart buttons
                const addToCartButtons =
                  node.querySelectorAll &&
                  node.querySelectorAll(
                    '[data-action="add-to-cart"], .add-to-cart, [class*="cart"], [class*="add"]',
                  );
                if (addToCartButtons) {
                  addToCartButtons.forEach(function (button) {
                    log("New add to cart button detected:", button);
                  });
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      log("Mutation observer setup complete");
    }

    // Set up periodic checkout completion check for dynamic checkout flows
    if (window.location.pathname.includes('/checkouts/')) {
      log("Setting up periodic checkout completion check...");
      
      // Check every 5 seconds for checkout completion
      const checkoutCheckInterval = setInterval(function() {
        // Check if we're still on a checkout page
        if (!window.location.pathname.includes('/checkouts/')) {
          clearInterval(checkoutCheckInterval);
          return;
        }
        
        // Check for completion indicators
        const completionIndicators = [
          document.querySelector('.checkout-success'),
          document.querySelector('.order-confirmation'),
          document.querySelector('[data-checkout-complete]'),
          document.querySelector('.thank-you'),
          document.querySelector('.order-received')
        ];
        
        if (completionIndicators.some(indicator => indicator !== null)) {
          log("Checkout completion detected via periodic check");
          clearInterval(checkoutCheckInterval);
          trackCheckoutCompletion();
        }
      }, 5000);
      
      // Also check on page visibility change (user returns to tab)
      document.addEventListener('visibilitychange', function() {
        if (!document.hidden && window.location.pathname.includes('/checkouts/')) {
          log("Page became visible, checking for checkout completion...");
          trackPurchaseCompletion();
        }
      });
    }
  }

  // Check if element is an add to cart button
  function isAddToCartButton(element) {
    const selectors = [
      '[data-action="add-to-cart"]',
      ".add-to-cart",
      '[class*="cart"]',
      '[class*="add"]',
      'button[type="submit"]',
      'input[type="submit"]',
      "[data-product-add]",
      "[data-add-to-cart]",
      '[data-action*="add"]',
      '[data-action*="cart"]',
    ];

    const textContent = element.textContent.toLowerCase();
    const hasAddToCartText =
      textContent.includes("add to cart") ||
      textContent.includes("buy now") ||
      textContent.includes("add to bag") ||
      textContent.includes("add to basket");

    const matchesSelector = selectors.some((selector) =>
      element.matches(selector),
    );
    const isInForm = element.closest('form[action*="/cart/add"]');

    return matchesSelector || hasAddToCartText || isInForm;
  }

  // Check if element is a product link
  function isProductLink(element) {
    const href = element.href || element.getAttribute("href");
    if (!href) return false;

    return (
      href.includes("/products/") ||
      element.closest('a[href*="/products/"]') ||
      element.closest(".product-item") ||
      element.closest('[class*="product"]')
    );
  }

  // Check if form is checkout form
  function isCheckoutForm(form) {
    return (
      form.action.includes("checkout") ||
      form.action.includes("cart") ||
      form.getAttribute("data-action") === "checkout"
    );
  }

  // Track add to cart event
  function trackAddToCart(button) {
    const productData = extractProductData(button);
    log("Extracted product data for add to cart:", productData);

    const eventData = {
      event_type: "add_to_cart",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      url: window.location.href,
      data: {
        product_id: productData.id,
        product_name: productData.name,
        product_price: productData.price,
        product_variant_id: productData.variantId,
        quantity: productData.quantity || 1,
      },
      timestamp: Date.now(),
    };

    sendEvent(eventData);
  }

  // Track successful add to cart (from Shopify API)
  function trackAddToCartSuccess(item) {
    const eventData = {
      event_type: "add_to_cart",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      url: window.location.href,
      data: {
        product_id: item.product_id,
        product_name: item.product_title,
        product_price: item.price,
        product_variant_id: item.variant_id,
        quantity: item.quantity,
      },
      timestamp: Date.now(),
    };

    sendEvent(eventData);
  }

  // Track product click
  function trackProductClick(link) {
    const productData = extractProductData(link);

    const eventData = {
      event_type: "product_click",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      url: link.href || link.getAttribute("href"),
      data: {
        product_id: productData.id,
        product_name: productData.name,
        product_price: productData.price,
      },
      timestamp: Date.now(),
    };

    sendEvent(eventData);
  }

  // Track checkout start
  function trackCheckoutStart(form) {
    const eventData = {
      event_type: "checkout_start",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      url: window.location.href,
      data: {
        form_action: form.action,
      },
      timestamp: Date.now(),
    };

    sendEvent(eventData);
  }

  // Track checkout completion
  function trackCheckoutCompletion() {
    const eventData = {
      event_type: "checkout_complete",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      url: window.location.href,
      data: {
        checkout_id: window.location.pathname.split('/').pop(),
        page_title: document.title,
        checkout_url: window.location.href
      },
      timestamp: Date.now(),
    };

    log("Tracking checkout completion:", eventData);
    sendEvent(eventData);
  }

  // Track cart update
  function trackCartUpdate(cart) {
    const eventData = {
      event_type: "cart_update",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      url: window.location.href,
      data: {
        cart_total: cart.total_price,
        item_count: cart.item_count,
      },
      timestamp: Date.now(),
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
      quantity: 1,
    };

    log("Extracting product data from element:", element);

    // Try to get data from data attributes
    data.id =
      element.getAttribute("data-product-id") ||
      element.getAttribute("data-id") ||
      element.closest("[data-product-id]")?.getAttribute("data-product-id");

    data.name =
      element.getAttribute("data-product-name") ||
      element.getAttribute("data-title") ||
      element.closest("[data-product-name]")?.getAttribute("data-product-name");

    data.price =
      element.getAttribute("data-price") ||
      element.closest("[data-price]")?.getAttribute("data-price");

    data.variantId =
      element.getAttribute("data-variant-id") ||
      element.getAttribute("data-variant") ||
      element.closest("[data-variant-id]")?.getAttribute("data-variant-id");

    // Try to get data from Shopify global object
    if (
      window.Shopify &&
      window.Shopify.theme &&
      window.Shopify.theme.product
    ) {
      const product = window.Shopify.theme.product;
      if (!data.id) data.id = product.id;
      if (!data.name) data.name = product.title;
      if (!data.price) data.price = product.price;
      if (!data.variantId)
        data.variantId = product.selected_or_first_available_variant?.id;
    }

    // Try to get data from meta tags
    if (!data.name) {
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTitle) data.name = metaTitle.getAttribute("content");
    }

    if (!data.price) {
      const metaPrice = document.querySelector(
        'meta[property="product:price:amount"]',
      );
      if (metaPrice) data.price = metaPrice.getAttribute("content");
    }

    // Try to get data from JSON-LD structured data
    if (!data.id || !data.name) {
      const jsonLd = document.querySelector(
        'script[type="application/ld+json"]',
      );
      if (jsonLd) {
        try {
          const structuredData = JSON.parse(jsonLd.textContent);
          if (structuredData["@type"] === "Product") {
            if (!data.id) data.id = structuredData.sku || structuredData.gtin;
            if (!data.name) data.name = structuredData.name;
            if (!data.price) data.price = structuredData.offers?.price;
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
    }

    // Try to get data from form inputs
    if (!data.id) {
      const form = element.closest("form");
      if (form) {
        const idInput = form.querySelector('input[name="id"]');
        if (idInput) data.id = idInput.value;
      }
    }

    log("Extracted product data:", data);
    return data;
  }

  // Send event to server
  function sendEvent(eventData) {
    // Prevent duplicate events with better deduplication
    const eventKey = `${eventData.event_type}_${eventData.session_id}_${JSON.stringify(eventData.data)}`;
    if (config.eventsSent.includes(eventKey)) {
      log("Duplicate event detected, skipping: " + eventData.event_type, "warn");
      return;
    }
    config.eventsSent.push(eventKey);
    
    // Keep only last 50 events to prevent memory leaks
    if (config.eventsSent.length > 50) {
      config.eventsSent = config.eventsSent.slice(-50);
    }

    log("Sending event: " + eventData.event_type, "info");
    log("Event data:", eventData);

    // Add CORS mode and better error handling
    fetch(config.endpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit", // Don't send cookies for cross-origin requests
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": window.location.origin,
      },
      body: JSON.stringify(eventData),
    })
      .then((response) => {
        log("Response status: " + response.status);
        log("Response headers: " + JSON.stringify([...response.headers.entries()]));
        
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        log("Event sent successfully: " + eventData.event_type, "success");
        log("Server response:", data);
      })
      .catch((error) => {
        log("Failed to send event: " + error.message, "error");
        
        // Try alternative endpoint if main one fails
        if (config.endpoint.includes('netlify.app')) {
          log("Trying alternative endpoint...", "info");
          const altEndpoint = config.endpoint.replace('/.netlify/functions/track-event', '/api/track-event');
          if (altEndpoint !== config.endpoint) {
            fetch(altEndpoint, {
              method: "POST",
              mode: "cors",
              credentials: "omit",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": window.location.origin,
              },
              body: JSON.stringify(eventData),
            })
            .then(response => {
              log("Alternative endpoint response status: " + response.status);
              if (!response.ok) {
                throw new Error("Alternative endpoint also failed: " + response.status);
              }
              return response.json();
            })
            .then(data => {
              log("Alternative endpoint succeeded: " + eventData.event_type, "success");
              log("Server response:", data);
            })
            .catch(altError => {
              log("Alternative endpoint also failed: " + altError.message, "error");
            });
          }
        }
      });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose tracking functions globally for manual tracking
  window.PriceHuntTracker = {
    track: function (eventType, data) {
      const eventData = {
        event_type: eventType,
        business_id: config.businessId,
        affiliate_id: config.affiliateId,
        session_id: config.sessionId,
        url: window.location.href,
        data: data || {},
        timestamp: Date.now(),
      };
      sendEvent(eventData);
    },

    trackProductView: checkForProductData,
    trackAddToCart: trackAddToCart,
    trackProductClick: trackProductClick,
    trackCheckoutStart: trackCheckoutStart,
    trackCartUpdate: trackCartUpdate,
    trackPurchaseCompletion: trackPurchaseCompletion,

    // Debug functions
    getConfig: function () {
      return { ...config };
    },

    getEventsSent: function () {
      return [...config.eventsSent];
    },
  };
})();
