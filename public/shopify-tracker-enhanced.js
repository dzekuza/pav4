// PriceHunt Enhanced Shopify Integration for godislove.lt
(function () {
  "use strict";

  // Configuration
  const config = {
    businessId: null,
    affiliateId: null,
    debug: true, // Enable debug mode for troubleshooting
    endpoint: "https://pavlo4.netlify.app/api/track-event",
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
      config.debug = script.getAttribute("data-debug") === "true" || true; // Force debug for troubleshooting
    }

    // Validate required parameters
    if (!config.businessId || !config.affiliateId) {
      log(
        "Error: Missing required parameters (business-id or affiliate-id)",
        "error",
      );
      return;
    }

    log(
      "PriceHunt Enhanced Shopify Tracker initialized for godislove.lt",
      "info",
    );
    log("Config:", {
      businessId: config.businessId,
      affiliateId: config.affiliateId,
    });

    // Track page load
    trackPageView();

    // Set up event listeners
    setupEventListeners();

      // Track initial product data if available
  trackInitialProduct();

  // Set up mutation observer for dynamic content
  setupMutationObserver();

  // Check for purchase completion (thank you page)
  checkForPurchaseCompletion();
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

  // Track page view
  function trackPageView() {
    const eventData = {
      event_type: "page_view",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      timestamp: Date.now(),
    };

    sendEvent(eventData);
  }

  // Track initial product data
  function trackInitialProduct() {
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

  // Check for purchase completion (thank you page)
  function checkForPurchaseCompletion() {
    log("Checking for purchase completion...");
    
    // Check if we're on a thank you/order confirmation page
    const isThankYouPage = 
      window.location.pathname.includes('/thank-you') ||
      window.location.pathname.includes('/order-confirmation') ||
      window.location.pathname.includes('/checkout/thank_you') ||
      window.location.pathname.includes('/checkouts/') && window.location.pathname.includes('/thank-you') ||
      document.title.toLowerCase().includes('thank you') ||
      document.title.toLowerCase().includes('order confirmation') ||
      document.title.toLowerCase().includes('order received');

    if (isThankYouPage) {
      log("Thank you page detected, extracting order data...");
      
      // Extract order data from the page
      const orderData = extractOrderData();
      
      if (orderData.orderId) {
        log("Order data extracted:", orderData);
        trackPurchaseCompletion(orderData);
      } else {
        log("Could not extract order data from thank you page", "warn");
      }
    }
  }

  // Extract order data from thank you page
  function extractOrderData() {
    const orderData = {
      orderId: null,
      totalAmount: null,
      currency: 'EUR', // Default for godislove.lt
      products: []
    };

    // Try multiple selectors to find order ID
    const orderIdSelectors = [
      '.order-number',
      '.order-id',
      '.confirmation-number',
      '[data-order-id]',
      '[data-order-number]',
      '.checkout-success .order-number',
      '.order-confirmation .order-number',
      'h1:contains("Confirmation")',
      '.order-details .order-number'
    ];

    for (const selector of orderIdSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('data-order-id') || element.getAttribute('data-order-number');
        if (text) {
          // Extract order ID from text (remove any prefix/suffix)
          const match = text.match(/([A-Z0-9]{6,})/);
          if (match) {
            orderData.orderId = match[1];
            break;
          }
        }
      }
    }

    // Try to find total amount
    const totalSelectors = [
      '.order-total .price',
      '.total .amount',
      '.checkout-success .total',
      '[data-total]',
      '.order-summary .total',
      '.total-price'
    ];

    for (const selector of totalSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent;
        if (text) {
          // Extract amount from text (e.g., "€1.20" -> 1.20)
          const match = text.match(/[€$]?([0-9]+[.,]?[0-9]*)/);
          if (match) {
            orderData.totalAmount = parseFloat(match[1].replace(',', '.'));
            break;
          }
        }
      }
    }

    // Try to extract product information
    const productElements = document.querySelectorAll('.order-item, .product-item, [data-product-id]');
    productElements.forEach(element => {
      const productName = element.querySelector('.product-name, .item-name')?.textContent?.trim();
      const productPrice = element.querySelector('.product-price, .item-price')?.textContent?.trim();
      
      if (productName) {
        orderData.products.push({
          name: productName,
          price: productPrice
        });
      }
    });

    return orderData;
  }

  // Track purchase completion
  function trackPurchaseCompletion(orderData) {
    const eventData = {
      event_type: "purchase_complete",
      business_id: config.businessId,
      affiliate_id: config.affiliateId,
      session_id: config.sessionId,
      url: window.location.href,
      data: {
        order_id: orderData.orderId,
        total_amount: orderData.totalAmount,
        currency: orderData.currency,
        products: orderData.products,
        page_title: document.title
      },
      timestamp: Date.now(),
    };

    sendEvent(eventData);
    
    // Also send to track-sale endpoint for business dashboard
    sendSaleData(orderData);
  }

  // Send sale data to track-sale endpoint
  function sendSaleData(orderData) {
    const saleData = {
      businessId: config.businessId,
      orderId: orderData.orderId,
      amount: orderData.totalAmount,
      domain: window.location.hostname,
      customerId: null // Could be extracted if available
    };

    log("Sending sale data:", saleData);

    fetch("https://pavlo4.netlify.app/api/track-sale", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saleData),
    })
      .then((response) => {
        log("Sale tracking response status:", response.status);
        if (!response.ok) {
          throw new Error("Sale tracking failed: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        log("Sale tracked successfully:", data);
      })
      .catch((error) => {
        log("Failed to track sale: " + error.message, "error");
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
    // Prevent duplicate events
    const eventKey = `${eventData.event_type}_${eventData.timestamp}`;
    if (config.eventsSent.includes(eventKey)) {
      log("Duplicate event detected, skipping:", eventData.event_type);
      return;
    }
    config.eventsSent.push(eventKey);

    log("Sending event: " + eventData.event_type, "info");
    log("Event data:", eventData);

    fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    })
      .then((response) => {
        log("Response status:", response.status);
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        log("Event sent successfully: " + eventData.event_type, "info");
        log("Server response:", data);
      })
      .catch((error) => {
        log("Failed to send event: " + error.message, "error");
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

    trackPageView: trackPageView,
    trackProductView: trackInitialProduct,
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
