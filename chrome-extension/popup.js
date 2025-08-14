// Popup functionality for PriceHunt Chrome Extension
class PriceHuntPopup {
  constructor() {
    this.currentTab = null;
    this.productInfo = null;

    // Immediately ensure current page section is visible
    this.forceShowCurrentPage();

    this.init();
  }

  async init() {
    await this.getCurrentTab();
    this.setupEventListeners();

    // Ensure current page section is visible by default
    this.showCurrentPageSection();

    // Force show current page section after a short delay to ensure it's visible
    setTimeout(() => this.showCurrentPageSection(), 100);

    await this.detectProduct();
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    this.currentTab = tab;
  }

  setupEventListeners() {
    // Force show current page section
    this.forceShowCurrentPage();

    // Detect URL button
    document.getElementById("detectBtn").addEventListener("click", () => {
      this.detectUrl();
    });

    // Search button
    document.getElementById("searchBtn").addEventListener("click", () => {
      this.searchPrices();
    });

    // Similar product button
    document.getElementById("similarBtn").addEventListener("click", () => {
      this.findSimilarProducts();
    });

    // Open app button
    document.getElementById("openApp").addEventListener("click", () => {
      chrome.tabs.create({ url: "https://ipick.io" });
    });

    // View history button
    document.getElementById("viewHistory").addEventListener("click", () => {
      chrome.tabs.create({ url: "https://ipick.io/history" });
    });

    // Clear cache button (if exists)
    const clearCacheBtn = document.getElementById("clearCache");
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener("click", () => {
        this.clearCache();
      });
    }

    // Keyboard shortcut for cache clearing (Ctrl+Shift+C)
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        this.clearCache();
      }
    });

    // Settings link
    document.getElementById("settingsLink").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });

    // Help link
    document.getElementById("helpLink").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: "https://ipick.io" });
    });
  }

  async detectUrl() {
    if (!this.currentTab) {
      console.log("No current tab available");
      return;
    }

    const detectBtn = document.getElementById("detectBtn");
    const detectLoader = document.getElementById("detectLoader");

    // Show loading state
    detectBtn.classList.add("loading");
    detectBtn.disabled = true;

    try {
      console.log("Manually detecting product on:", this.currentTab.url);

      // Always show the current page section
      this.showCurrentPageSection();

      // Always show the current page URL
      document.getElementById("pageTitle").textContent = "Detecting product...";
      document.getElementById("pageUrl").textContent = this.currentTab.url;

      // Check if site is supported
      if (!this.isSupportedSite(this.currentTab.url)) {
        console.log("Site not supported:", this.currentTab.url);
        this.showNoProduct();
        return;
      }

      // Send message to content script to detect product
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: "detectProduct",
      });

      console.log("Content script response:", response);

      if (response && response.product) {
        this.productInfo = response.product;
        console.log("Product detected:", this.productInfo);
        this.showProductDetected();
      } else {
        console.log("No product detected in response");
        this.showNoProduct();
      }
    } catch (error) {
      console.error("Error detecting product:", error);
      // Try to inject content script if it's not already loaded
      try {
        console.log("Attempting to inject content script...");
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTab.id },
          files: ["content.js"],
        });

        // Retry detection after a short delay
        setTimeout(async () => {
          try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
              action: "detectProduct",
            });

            if (response && response.product) {
              this.productInfo = response.product;
              console.log(
                "Product detected after injection:",
                this.productInfo,
              );
              this.showProductDetected();
            } else {
              console.log("No product detected after injection");
              this.showNoProduct();
            }
          } catch (retryError) {
            console.error("Error in retry detection:", retryError);
            this.showNoProduct();
          }
        }, 1000);
      } catch (injectError) {
        console.error("Error injecting content script:", injectError);
        this.showNoProduct();
      }
    } finally {
      // Remove loading state
      detectBtn.classList.remove("loading");
      detectBtn.disabled = false;
    }
  }

  async detectProduct() {
    if (!this.currentTab) {
      console.log("No current tab available");
      this.showNoProduct();
      return;
    }

    // Always show the current page section
    this.showCurrentPageSection();

    // Always show the current page URL
    document.getElementById("pageTitle").textContent = "Detecting product...";
    document.getElementById("pageUrl").textContent = this.currentTab.url;
    console.log("Attempting to detect product on:", this.currentTab.url);

    // Check if site is supported
    if (!this.isSupportedSite(this.currentTab.url)) {
      console.log("Site not supported:", this.currentTab.url);
      this.showNoProduct();
      return;
    }

    try {
      // Send message to content script to detect product
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: "detectProduct",
      });

      console.log("Content script response:", response);

      if (response && response.product) {
        this.productInfo = response.product;
        console.log("Product detected:", this.productInfo);
        this.showProductDetected();
      } else {
        console.log("No product detected in response");
        this.showNoProduct();
      }
    } catch (error) {
      console.error("Error detecting product:", error);
      // Try to inject content script if it's not already loaded
      try {
        console.log("Attempting to inject content script...");
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTab.id },
          files: ["content.js"],
        });

        // Retry detection
        setTimeout(() => this.detectProduct(), 1000);
      } catch (injectError) {
        console.error("Error injecting content script:", injectError);
        this.showNoProduct();
      }
    }
  }

  showProductDetected() {
    const pageTitle = document.getElementById("pageTitle");
    const searchBtn = document.getElementById("searchBtn");
    const similarBtn = document.getElementById("similarBtn");

    pageTitle.textContent = this.productInfo.title || "Product detected";
    searchBtn.disabled = false;
    similarBtn.disabled = false;
    searchBtn.textContent = "Compare Prices";
    similarBtn.textContent = "Find Similar";

    // Show current page section and hide others
    this.showCurrentPageSection();
    document.getElementById("results").classList.add("hidden");
    document.getElementById("similarResults").classList.add("hidden");
    document.getElementById("noProduct").classList.add("hidden");

    console.log("Product detected, buttons enabled");
  }

  showNoProduct() {
    // Show current page URL even if no product is detected
    const pageTitle = document.getElementById("pageTitle");
    const pageUrl = document.getElementById("pageUrl");

    if (this.currentTab) {
      pageTitle.textContent = "No product detected";
      pageUrl.textContent = this.currentTab.url;
    }

    // Disable buttons
    const searchBtn = document.getElementById("searchBtn");
    const similarBtn = document.getElementById("similarBtn");

    if (searchBtn) searchBtn.disabled = true;
    if (similarBtn) similarBtn.disabled = true;

    // Always show current page section and hide others
    this.showCurrentPageSection();
    document.getElementById("results").classList.add("hidden");
    document.getElementById("similarResults").classList.add("hidden");
    document.getElementById("noProduct").classList.add("hidden");
  }

  showCurrentPageSection() {
    // Ensure current page section is always visible
    const currentPage = document.getElementById("currentPage");
    if (currentPage) {
      // Remove hidden class and ensure visibility
      currentPage.classList.remove("hidden");
      currentPage.style.display = "block";
      currentPage.style.visibility = "visible";
      currentPage.style.opacity = "1";

      // Also ensure the container is visible
      const container = currentPage.closest(".container");
      if (container) {
        container.style.display = "block";
      }
    }
  }

  forceShowCurrentPage() {
    // Force remove hidden class from current page section
    const currentPage = document.getElementById("currentPage");
    if (currentPage) {
      currentPage.classList.remove("hidden");
      currentPage.style.display = "block";
      currentPage.style.visibility = "visible";
      currentPage.style.opacity = "1";
      currentPage.style.position = "static";
      currentPage.style.height = "auto";
      currentPage.style.overflow = "visible";
    }
  }

  async clearCache() {
    try {
      // Show loading state on button
      const clearCacheBtn = document.getElementById("clearCache");
      const originalText = clearCacheBtn.innerHTML;
      clearCacheBtn.innerHTML =
        '<span class="action-icon">⏳</span><span>Clearing...</span>';
      clearCacheBtn.disabled = true;

      // Show loading message
      this.showMessage("Clearing cache...", "info");

      // Use background script to clear cache comprehensively
      const response = await chrome.runtime.sendMessage({
        action: "clearCache",
      });

      if (response.success) {
        // Reset extension state
        this.productInfo = null;
        this.currentTab = null;

        // Clear any displayed results
        const resultsList = document.getElementById("resultsList");
        const similarResultsList =
          document.getElementById("similarResultsList");
        if (resultsList) resultsList.innerHTML = "";
        if (similarResultsList) similarResultsList.innerHTML = "";

        // Hide results sections
        const resultsSection = document.getElementById("results");
        const similarResultsSection = document.getElementById("similarResults");
        if (resultsSection) resultsSection.classList.add("hidden");
        if (similarResultsSection)
          similarResultsSection.classList.add("hidden");

        // Reset page title and URL
        const pageTitle = document.getElementById("pageTitle");
        const pageUrl = document.getElementById("pageUrl");
        if (pageTitle) pageTitle.textContent = "Detecting product...";
        if (pageUrl && this.currentTab)
          pageUrl.textContent = this.currentTab.url;

        // Disable buttons
        const searchBtn = document.getElementById("searchBtn");
        const similarBtn = document.getElementById("similarBtn");
        if (searchBtn) searchBtn.disabled = true;
        if (similarBtn) similarBtn.disabled = true;

        // Show success message
        this.showMessage("Cache cleared successfully!", "success");

        // Re-detect product
        await this.detectProduct();
      } else {
        throw new Error(response.error || "Failed to clear cache");
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      this.showMessage("Failed to clear cache", "error");
    } finally {
      // Reset button state
      if (clearCacheBtn) {
        clearCacheBtn.innerHTML = originalText;
        clearCacheBtn.disabled = false;
      }
    }
  }

  showMessage(message, type = "info") {
    // Create or update message element
    let messageEl = document.getElementById("message");
    if (!messageEl) {
      messageEl = document.createElement("div");
      messageEl.id = "message";
      messageEl.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 15px;
        border-radius: 5px;
        color: white;
        font-size: 12px;
        z-index: 1000;
        transition: opacity 0.3s;
      `;
      document.body.appendChild(messageEl);
    }

    messageEl.textContent = message;
    messageEl.style.backgroundColor =
      type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6";
    messageEl.style.opacity = "1";

    // Auto-hide after 3 seconds
    setTimeout(() => {
      messageEl.style.opacity = "0";
    }, 3000);
  }

  async searchPrices() {
    if (!this.productInfo) return;

    const searchBtn = document.getElementById("searchBtn");
    const loader = document.getElementById("loader");

    // Show loading state
    searchBtn.classList.add("loading");
    searchBtn.disabled = true;

    try {
      // Send the current URL to PriceHunt for analysis
      const response = await fetch("https://ipick.io/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: this.currentTab.url,
          fromExtension: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.displayResults(data);

        // Save to search history
        await this.saveToHistory({
          url: this.currentTab.url,
          product: this.productInfo,
          results: data,
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error("Failed to fetch price comparison");
      }
    } catch (error) {
      console.error("Error searching prices:", error);
      this.showError("Failed to compare prices. Please try again.");
    } finally {
      searchBtn.classList.remove("loading");
      searchBtn.disabled = false;
    }
  }

  async findSimilarProducts() {
    if (!this.productInfo) return;

    const similarBtn = document.getElementById("similarBtn");
    const similarLoader = document.getElementById("similarLoader");

    // Show loading state
    similarBtn.classList.add("loading");
    similarBtn.disabled = true;

    try {
      // Send the current URL to PriceHunt for similar products analysis
      const response = await fetch("https://ipick.io/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: this.currentTab.url,
          fromExtension: true,
          findSimilar: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.displaySimilarResults(data);

        // Save to search history
        await this.saveToHistory({
          url: this.currentTab.url,
          product: this.productInfo,
          similarResults: data,
          timestamp: new Date().toISOString(),
          type: "similar",
        });
      } else {
        throw new Error("Failed to fetch similar products");
      }
    } catch (error) {
      console.error("Error finding similar products:", error);
      this.showSimilarError(
        "Failed to find similar products. Please try again.",
      );
    } finally {
      similarBtn.classList.remove("loading");
      similarBtn.disabled = false;
    }
  }

  displayResults(data) {
    const resultsSection = document.getElementById("results");
    const resultsList = document.getElementById("resultsList");
    const resultsCount = document.getElementById("resultsCount");

    // Hide similar results if they're showing
    document.getElementById("similarResults").classList.add("hidden");

    // Show results section
    resultsSection.style.display = "block";
    resultsSection.classList.add("fade-in");

    // Clear previous results
    resultsList.innerHTML = "";

    if (data.suggestions && data.suggestions.length > 0) {
      resultsCount.textContent = `${data.suggestions.length} results`;

      data.suggestions.forEach((suggestion) => {
        const resultItem = this.createResultItem(suggestion);
        resultsList.appendChild(resultItem);
      });
    } else {
      resultsCount.textContent = "0 results";
      resultsList.innerHTML =
        '<div class="no-results">No alternative prices found.</div>';
    }
  }

  displaySimilarResults(data) {
    const similarResultsSection = document.getElementById("similarResults");
    const similarResultsList = document.getElementById("similarResultsList");
    const similarResultsCount = document.getElementById("similarResultsCount");

    // Hide price comparison results if they're showing
    document.getElementById("results").classList.add("hidden");

    // Show similar results section
    similarResultsSection.style.display = "block";
    similarResultsSection.classList.add("fade-in");

    // Clear previous results
    similarResultsList.innerHTML = "";

    if (data.suggestions && data.suggestions.length > 0) {
      similarResultsCount.textContent = `${data.suggestions.length} similar products`;

      data.suggestions.forEach((suggestion) => {
        const similarItem = this.createSimilarItem(suggestion);
        similarResultsList.appendChild(similarItem);
      });
    } else {
      similarResultsCount.textContent = "0 similar products";
      similarResultsList.innerHTML =
        '<div class="no-results">No similar products found.</div>';
    }
  }

  createResultItem(alternative) {
    const item = document.createElement("div");
    item.className = "result-item";
    item.style.cursor = "pointer";

    const storeName = this.extractStoreName(
      alternative.link || alternative.url,
    );
    const price =
      alternative.standardPrice ||
      alternative.discountPrice ||
      alternative.price ||
      "Price not available";

    item.innerHTML = `
            <div class="result-store">${storeName}</div>
            <div class="result-price">${price}</div>
        `;

    item.addEventListener("click", () => {
      chrome.tabs.create({ url: alternative.link || alternative.url });
    });

    return item;
  }

  createSimilarItem(suggestion) {
    const item = document.createElement("div");
    item.className = "similar-item";

    const storeName = this.extractStoreName(suggestion.link);
    const price =
      suggestion.standardPrice ||
      suggestion.discountPrice ||
      suggestion.price ||
      "Price not available";
    const image = suggestion.image || "/placeholder.svg";

    item.innerHTML = `
            <img src="${image}" alt="${suggestion.title}" class="similar-item-image" onerror="this.src='/placeholder.svg'">
            <div class="similar-item-content">
                <div class="similar-item-title">${suggestion.title}</div>
                <div class="similar-item-price">${price}</div>
                <div class="similar-item-store">${storeName}</div>
            </div>
        `;

    item.addEventListener("click", () => {
      chrome.tabs.create({ url: suggestion.link });
    });

    return item;
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

  async saveToHistory(searchData) {
    try {
      await chrome.storage.local.set({
        [`search_${Date.now()}`]: searchData,
      });
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  }

  showError(message) {
    const resultsList = document.getElementById("resultsList");
    resultsList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #dc2626;">
                <div style="margin-bottom: 8px;">⚠️</div>
                <div>${message}</div>
            </div>
        `;
    document.getElementById("results").style.display = "block";
  }

  showSimilarError(message) {
    const similarResultsList = document.getElementById("similarResultsList");
    similarResultsList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #dc2626;">
                <div style="margin-bottom: 8px;">⚠️</div>
                <div>${message}</div>
            </div>
        `;
    document.getElementById("similarResults").style.display = "block";
  }

  isSupportedSite(url) {
    if (!url) return false;

    // Check if it's a valid URL
    try {
      const urlObj = new URL(url);

      // Allow any e-commerce site, not just predefined ones
      // Most e-commerce sites have product pages with common patterns
      const pathname = urlObj.pathname.toLowerCase();

      // Common e-commerce patterns that indicate a product page
      const productPatterns = [
        "/product/",
        "/products/",
        "/shop/",
        "/item/",
        "/p/",
        "/dp/",
        "/itm/",
        "/ip/",
        "/buy/",
        "/purchase/",
        "/bottle/",
        "/headphones/",
        "/keyboard/",
        "/speaker/",
        "/purification/",
        "/en-us/shop/",
        "/en-eu/products/",
      ];

      // Check if the URL contains any product patterns
      const hasProductPattern = productPatterns.some((pattern) =>
        pathname.includes(pattern),
      );

      // Also check for common e-commerce domains as a fallback
      const commonEcommerceDomains = [
        "amazon.com",
        "ebay.com",
        "walmart.com",
        "target.com",
        "bestbuy.com",
        "apple.com",
        "playstation.com",
        "newegg.com",
        "costco.com",
        "sonos.com",
        "livelarq.com",
        "shopify.com",
        "etsy.com",
        "wayfair.com",
        "home depot",
        "lowes.com",
      ];

      const isKnownDomain = commonEcommerceDomains.some((domain) =>
        urlObj.hostname.toLowerCase().includes(domain),
      );

      // Allow if it has product patterns OR is a known e-commerce domain
      return hasProductPattern || isKnownDomain;
    } catch (error) {
      console.error("Error parsing URL:", error);
      return false;
    }
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PriceHuntPopup();
});
