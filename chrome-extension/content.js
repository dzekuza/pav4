// Content script for PriceHunt Chrome Extension
class PriceHuntContentScript {
  constructor() {
    this.productInfo = null;
    this.isDetecting = false;
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.detectProductOnLoad();
    this.observePageChanges();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "detectProduct") {
        this.detectProduct().then((product) => {
          sendResponse({ product });
        });
        return true; // Keep the message channel open
      }
    });
  }

  detectProductOnLoad() {
    // Detect product when page loads
    if (document.readyState === "complete") {
      this.detectProduct();
    } else {
      window.addEventListener("load", () => {
        this.detectProduct();
      });
    }
  }

  observePageChanges() {
    // Observe DOM changes for single-page applications
    const observer = new MutationObserver((mutations) => {
      const hasSignificantChanges = mutations.some(
        (mutation) =>
          mutation.type === "childList" &&
          mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node.classList?.contains("product") ||
                node.tagName === "MAIN" ||
                (typeof node.id === "string" && node.id.includes("product"))),
          ),
      );

      if (hasSignificantChanges) {
        // Debounce product detection
        clearTimeout(this.detectTimeout);
        this.detectTimeout = setTimeout(() => {
          this.detectProduct();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  async detectProduct() {
    if (this.isDetecting) return this.productInfo;

    this.isDetecting = true;
    console.log("Content script: Starting product detection");

    try {
      const hostname = window.location.hostname.toLowerCase();
      console.log("Content script: Detecting on hostname:", hostname);
      let product = null;

      if (hostname.includes("amazon.com")) {
        product = this.detectAmazonProduct();
      } else if (hostname.includes("ebay.com")) {
        product = this.detectEbayProduct();
      } else if (hostname.includes("walmart.com")) {
        product = this.detectWalmartProduct();
      } else if (hostname.includes("target.com")) {
        product = this.detectTargetProduct();
      } else if (hostname.includes("bestbuy.com")) {
        product = this.detectBestBuyProduct();
      } else if (hostname.includes("apple.com")) {
        product = this.detectAppleProduct();
      } else if (hostname.includes("playstation.com")) {
        product = this.detectPlayStationProduct();
      } else if (hostname.includes("newegg.com")) {
        product = this.detectNeweggProduct();
      } else if (hostname.includes("costco.com")) {
        product = this.detectCostcoProduct();
      } else if (
        hostname.includes("livelarq.com") ||
        hostname.includes("larq.com")
      ) {
        console.log("Content script: Using LARQ detection");
        product = this.detectLarqProduct();
      } else if (hostname.includes("sonos.com")) {
        console.log("Content script: Using Sonos detection");
        product = this.detectSonosProduct();
      } else {
        // Generic detection for other e-commerce sites
        console.log("Content script: Using generic detection");
        product = this.detectGenericProduct();
      }

      console.log("Content script: Product detection result:", product);

      if (product && product.title) {
        this.productInfo = {
          ...product,
          url: window.location.href,
          timestamp: Date.now(),
          source: hostname,
        };
        console.log(
          "Content script: Product detected successfully:",
          this.productInfo,
        );
      } else {
        console.log(
          "Content script: No product detected or incomplete product info",
        );
        this.productInfo = null;
      }

      return this.productInfo;
    } catch (error) {
      console.error("Content script: Error during product detection:", error);
      this.productInfo = null;
      return null;
    } finally {
      this.isDetecting = false;
    }
  }

  detectAmazonProduct() {
    const selectors = {
      title:
        '#productTitle, .product-title h1, [data-automation-id="product-title"]',
      price: ".a-price-whole, .a-offscreen, .a-price .a-offscreen",
      image: "#landingImage, .a-dynamic-image, #imgTagWrapperId img",
      rating: '.a-icon-alt, [data-hook="rating-out-of-text"]',
      availability: "#availability span, .a-color-success, .a-color-state",
    };

    return this.extractProductInfo(selectors);
  }

  detectEbayProduct() {
    const selectors = {
      title: '.x-item-title-label, h1[data-testid="x-item-title-label"]',
      price: '.notranslate, [data-testid="x-price-primary"] .notranslate',
      image: '#icImg, [data-testid="ux-image-carousel-item"] img',
      rating: ".reviews .reviews-star-rating, .ebay-star-rating",
      availability: '.u-flL.condText, [data-testid="x-quantity-available"]',
    };

    return this.extractProductInfo(selectors);
  }

  detectWalmartProduct() {
    const selectors = {
      title: '[data-automation-id="product-title"] h1, .prod-ProductTitle',
      price: '[data-automation-id="product-price"] span, .price-current',
      image: '[data-testid="hero-image"] img, .prod-hero-image img',
      rating: '[data-testid="reviews-stars"], .prod-Rating',
      availability:
        '[data-automation-id="fulfillment-badge"], .prod-blitz-copy',
    };

    return this.extractProductInfo(selectors);
  }

  detectTargetProduct() {
    const selectors = {
      title: '[data-test="product-title"] h1, .pdp-product-name h1',
      price: '[data-test="product-price"] span, .sr-only:contains("$")',
      image: '[data-test="hero-image"] img, .slide img',
      rating: '[data-test="rating-stars"], .h-sr-only:contains("stars")',
      availability: '[data-test="badge-fulfillment"], .h-text-red',
    };

    return this.extractProductInfo(selectors);
  }

  detectBestBuyProduct() {
    const selectors = {
      title: '.sku-title h1, [data-testid="product-title"]',
      price: '.pricing-price__range, [data-testid="pricing-price"]',
      image: '.primary-image, [data-testid="product-image"]',
      rating: '.c-ratings-reviews-v4, [data-testid="x-star-rating"]',
      availability:
        '.availability-message, [data-testid="fulfillment-add-to-cart-button"]',
    };

    return this.extractProductInfo(selectors);
  }

  detectAppleProduct() {
    const selectors = {
      title: ".pd-hero-product-title, .hero-headline",
      price: ".current_price, .dimensionprice, .price-current",
      image: ".pd-hero-image img, .hero-image img",
      rating: ".rating-stars, .pdp-product-review-rating",
      availability: ".button-cta, .hero-cta",
    };

    return this.extractProductInfo(selectors);
  }

  detectPlayStationProduct() {
    const selectors = {
      title: ".pdp-product-name h1, .game-title",
      price: ".psw-t-title-m, .price-display__price",
      image: ".media-block img, .game-art img",
      rating: ".star-rating, .psw-star-rating",
      availability: ".psw-button, .add-to-cart",
    };

    return this.extractProductInfo(selectors);
  }

  detectNeweggProduct() {
    const selectors = {
      title: ".product-title, .product-wrap h1",
      price: ".price-current, .product-price .price-was-data",
      image: ".product-view-img-original img, .swiper-zoom-container img",
      rating: ".item-rating, .rating-stars",
      availability: ".product-inventory, .flags-body",
    };

    return this.extractProductInfo(selectors);
  }

  detectCostcoProduct() {
    const selectors = {
      title: ".product-h1, .pdp-product-name",
      price: ".your-price, .price-current",
      image: ".product-image-url img, .main-product-image img",
      rating: ".bizrate-stars, .product-star-rating",
      availability: ".add-to-cart-btn, .product-info-section",
    };

    return this.extractProductInfo(selectors);
  }

  detectLarqProduct() {
    const selectors = {
      title: [
        "h1",
        ".product-title",
        ".product-name",
        '[data-testid="product-title"]',
        ".product-details h1",
        ".product-info h1",
        ".product-header h1",
        ".pdp-title",
        ".product__title",
      ],
      price: [
        ".price",
        ".cost",
        ".amount",
        '[data-testid="price"]',
        ".product-price",
        ".price-current",
        ".price__current",
        ".product__price",
        ".pdp-price",
        ".price-display",
        '[data-testid="price-amount"]',
        ".product-price .amount",
      ],
      image: [
        ".product-image img",
        ".main-image img",
        '[data-testid="product-image"]',
        ".product__image img",
        ".pdp-image img",
        ".product-gallery img",
        ".hero-image img",
        ".product-hero img",
        ".product-image-container img",
      ],
      rating: [
        ".rating",
        ".stars",
        ".review-rating",
        '[data-testid="rating"]',
        ".product-rating",
        ".reviews-rating",
        ".star-rating",
        ".rating-stars",
      ],
      availability: [
        ".availability",
        ".stock",
        ".in-stock",
        '[data-testid="availability"]',
        ".product-availability",
        ".stock-status",
        ".inventory-status",
        ".add-to-cart",
      ],
    };

    return this.extractProductInfoEnhanced(selectors);
  }

  detectSonosProduct() {
    const selectors = {
      title: 'h1, .product-title, .product-name, [data-testid="product-title"]',
      price: '.price, .cost, .amount, [data-testid="price"], .product-price',
      image:
        '.product-image img, .main-image img, [data-testid="product-image"]',
      rating: '.rating, .stars, .review-rating, [data-testid="rating"]',
      availability:
        '.availability, .stock, .in-stock, [data-testid="availability"]',
    };

    return this.extractProductInfo(selectors);
  }

  detectGenericProduct() {
    // Enhanced generic selectors for other e-commerce sites
    const selectors = {
      title: [
        "h1",
        ".product-title",
        ".product-name",
        '[itemprop="name"]',
        '[data-testid="product-title"]',
        ".pdp-title",
        ".product__title",
        ".product-details h1",
        ".product-info h1",
        ".product-header h1",
      ],
      price: [
        ".price",
        ".cost",
        ".amount",
        '[itemprop="price"]',
        '[data-testid="price"]',
        ".product-price",
        ".price-current",
        ".price__current",
        ".product__price",
        ".pdp-price",
        ".price-display",
      ],
      image: [
        ".product-image img",
        ".main-image img",
        '[itemprop="image"]',
        '[data-testid="product-image"]',
        ".product__image img",
        ".pdp-image img",
        ".product-gallery img",
        ".hero-image img",
        ".product-hero img",
      ],
      rating: [
        ".rating",
        ".stars",
        ".review-rating",
        '[itemprop="ratingValue"]',
        '[data-testid="rating"]',
        ".product-rating",
        ".reviews-rating",
        ".star-rating",
      ],
      availability: [
        ".availability",
        ".stock",
        ".in-stock",
        '[itemprop="availability"]',
        '[data-testid="availability"]',
        ".product-availability",
        ".stock-status",
        ".inventory-status",
      ],
    };

    return this.extractProductInfoEnhanced(selectors);
  }

  extractProductInfoEnhanced(selectors) {
    const product = {};

    // Extract title - try multiple selectors
    for (const selector of selectors.title) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        product.title = this.cleanText(titleElement.textContent);
        break;
      }
    }

    // Extract price - try multiple selectors
    for (const selector of selectors.price) {
      const priceElement = document.querySelector(selector);
      if (priceElement && priceElement.textContent.trim()) {
        product.price = this.extractPrice(priceElement.textContent);
        if (product.price) break;
      }
    }

    // Extract image - try multiple selectors
    for (const selector of selectors.image) {
      const imageElement = document.querySelector(selector);
      if (imageElement) {
        product.image =
          imageElement.src || imageElement.getAttribute("data-src");
        if (product.image) break;
      }
    }

    // Extract rating - try multiple selectors
    for (const selector of selectors.rating) {
      const ratingElement = document.querySelector(selector);
      if (ratingElement) {
        product.rating = this.extractRating(
          ratingElement.textContent || ratingElement.getAttribute("aria-label"),
        );
        if (product.rating) break;
      }
    }

    // Extract availability - try multiple selectors
    for (const selector of selectors.availability) {
      const availabilityElement = document.querySelector(selector);
      if (availabilityElement) {
        product.availability = this.cleanText(availabilityElement.textContent);
        if (product.availability) break;
      }
    }

    // Only return if we found at least a title
    return product.title ? product : null;
  }

  extractProductInfo(selectors) {
    const product = {};

    // Extract title
    const titleElement = document.querySelector(selectors.title);
    if (titleElement) {
      product.title = this.cleanText(titleElement.textContent);
    }

    // Extract price
    const priceElement = document.querySelector(selectors.price);
    if (priceElement) {
      product.price = this.extractPrice(priceElement.textContent);
    }

    // Extract image
    const imageElement = document.querySelector(selectors.image);
    if (imageElement) {
      product.image = imageElement.src || imageElement.getAttribute("data-src");
    }

    // Extract rating
    const ratingElement = document.querySelector(selectors.rating);
    if (ratingElement) {
      product.rating = this.extractRating(
        ratingElement.textContent || ratingElement.getAttribute("aria-label"),
      );
    }

    // Extract availability
    const availabilityElement = document.querySelector(selectors.availability);
    if (availabilityElement) {
      product.availability = this.cleanText(availabilityElement.textContent);
    }

    // Only return if we found at least a title
    return product.title ? product : null;
  }

  cleanText(text) {
    return text ? text.trim().replace(/\s+/g, " ").substring(0, 200) : "";
  }

  extractPrice(text) {
    if (!text) return null;

    // Match various price formats
    const priceMatch = text.match(/[\$£€¥₹]\s*[\d,]+\.?\d*/);
    return priceMatch ? priceMatch[0] : null;
  }

  extractRating(text) {
    if (!text) return null;

    // Match rating patterns like "4.5 out of 5" or "4.5 stars"
    const ratingMatch = text.match(
      /(\d+\.?\d*)\s*(?:out of|\/|\s)*\s*(?:5|stars?)/i,
    );
    return ratingMatch ? parseFloat(ratingMatch[1]) : null;
  }

  // Method to create price comparison overlay
  createPriceOverlay(alternatives) {
    // Remove existing overlay
    const existingOverlay = document.getElementById("pricehunt-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    if (!alternatives || alternatives.length === 0) return;

    const overlay = document.createElement("div");
    overlay.id = "pricehunt-overlay";
    overlay.className = "pricehunt-overlay";

    overlay.innerHTML = `
            <div class="pricehunt-overlay-content">
                <div class="pricehunt-overlay-header">
                    <span class="pricehunt-logo">💰 PriceHunt</span>
                    <button class="pricehunt-close" onclick="this.closest('.pricehunt-overlay').remove()">×</button>
                </div>
                <div class="pricehunt-overlay-body">
                    <h3>Better prices found!</h3>
                    <div class="pricehunt-alternatives">
                        ${alternatives
                          .slice(0, 3)
                          .map(
                            (alt) => `
                            <div class="pricehunt-alternative" onclick="window.open('${alt.url}', '_blank')">
                                <span class="pricehunt-store">${this.extractStoreName(alt.url)}</span>
                                <span class="pricehunt-price">${alt.price}</span>
                                ${alt.savings ? `<span class="pricehunt-savings">Save ${alt.savings}</span>` : ""}
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                    <button class="pricehunt-view-all" onclick="window.open('https://ipick.io/${encodeURIComponent(window.location.href)}', '_blank')">
                        View all ${alternatives.length} results
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(overlay);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 10000);
  }

  extractStoreName(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname.includes("amazon")) return "Amazon";
      if (hostname.includes("ebay")) return "eBay";
      if (hostname.includes("walmart")) return "Walmart";
      if (hostname.includes("target")) return "Target";
      if (hostname.includes("bestbuy")) return "Best Buy";
      if (hostname.includes("apple")) return "Apple";
      if (hostname.includes("playstation")) return "PlayStation";
      if (hostname.includes("newegg")) return "Newegg";
      if (hostname.includes("costco")) return "Costco";
      return hostname.replace("www.", "").split(".")[0];
    } catch {
      return "Store";
    }
  }
}

// Initialize the content script
new PriceHuntContentScript();
