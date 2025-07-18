// Popup functionality for PriceHunt Chrome Extension
class PriceHuntPopup {
  constructor() {
    this.currentTab = null;
    this.productInfo = null;
    this.init();
  }

  async init() {
    await this.getCurrentTab();
    this.setupEventListeners();
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
    // Search button
    document.getElementById("searchBtn").addEventListener("click", () => {
      this.searchPrices();
    });

    // Open app button
    document.getElementById("openApp").addEventListener("click", () => {
      chrome.tabs.create({ url: "http://localhost:8080" });
    });

    // View history button
    document.getElementById("viewHistory").addEventListener("click", () => {
      chrome.tabs.create({ url: "http://localhost:8080/history" });
    });

    // Settings link
    document.getElementById("settingsLink").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });

    // Help link
    document.getElementById("helpLink").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: "http://localhost:8080" });
    });
  }

  async detectProduct() {
    if (!this.currentTab || !this.isSupportedSite(this.currentTab.url)) {
      this.showNoProduct();
      return;
    }

    // Update UI to show detection in progress
    document.getElementById("pageTitle").textContent = "Detecting product...";
    document.getElementById("pageUrl").textContent = this.currentTab.url;

    try {
      // Send message to content script to detect product
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: "detectProduct",
      });

      if (response && response.product) {
        this.productInfo = response.product;
        this.showProductDetected();
      } else {
        this.showNoProduct();
      }
    } catch (error) {
      console.error("Error detecting product:", error);
      // Try to inject content script if it's not already loaded
      try {
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

    pageTitle.textContent = this.productInfo.title || "Product detected";
    searchBtn.disabled = false;
    searchBtn.textContent = "Compare Prices";
  }

  showNoProduct() {
    document.getElementById("currentPage").style.display = "none";
    document.getElementById("noProduct").style.display = "block";
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
      const response = await fetch("http://localhost:8080/api/scrape", {
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

  displayResults(data) {
    const resultsSection = document.getElementById("results");
    const resultsList = document.getElementById("resultsList");
    const resultsCount = document.getElementById("resultsCount");

    // Show results section
    resultsSection.style.display = "block";
    resultsSection.classList.add("fade-in");

    // Clear previous results
    resultsList.innerHTML = "";

    if (data.alternatives && data.alternatives.length > 0) {
      resultsCount.textContent = `${data.alternatives.length} results`;

      data.alternatives.forEach((alternative) => {
        const resultItem = this.createResultItem(alternative);
        resultsList.appendChild(resultItem);
      });
    } else {
      resultsCount.textContent = "0 results";
      resultsList.innerHTML =
        '<div class="no-results">No alternative prices found.</div>';
    }
  }

  createResultItem(alternative) {
    const item = document.createElement("div");
    item.className = "result-item";
    item.style.cursor = "pointer";

    const storeName = this.extractStoreName(alternative.url);
    const savings = alternative.savings ? `Save ${alternative.savings}` : "";

    item.innerHTML = `
            <div class="result-store">${storeName}</div>
            <div class="result-price">${alternative.price}</div>
            ${savings ? `<div class="result-savings">${savings}</div>` : ""}
        `;

    item.addEventListener("click", () => {
      chrome.tabs.create({ url: alternative.url });
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

  isSupportedSite(url) {
    if (!url) return false;

    const supportedDomains = [
      "amazon.com",
      "ebay.com",
      "walmart.com",
      "target.com",
      "bestbuy.com",
      "apple.com",
      "playstation.com",
      "newegg.com",
      "costco.com",
    ];

    return supportedDomains.some((domain) => url.includes(domain));
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PriceHuntPopup();
});
