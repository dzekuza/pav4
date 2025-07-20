// Background service worker for PriceHunt Chrome Extension
class PriceHuntBackground {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
      // Set up context menus after installation
      this.setupContextMenus();
    });

    // Tab updates to detect product pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });

    // Action button click (when popup is disabled)
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    // Context menu clicks
    if (chrome.contextMenus && chrome.contextMenus.onClicked) {
      chrome.contextMenus.onClicked.addListener((info, tab) => {
        this.handleContextMenuClick(info, tab);
      });
    }
  }

  setupContextMenus() {
    chrome.contextMenus.create({
      id: "searchPrices",
      title: "Search prices with PriceHunt",
      contexts: ["page", "link"],
      documentUrlPatterns: [
        "*://*.amazon.com/*",
        "*://*.ebay.com/*",
        "*://*.walmart.com/*",
        "*://*.target.com/*",
        "*://*.bestbuy.com/*",
        "*://*.apple.com/*",
        "*://*.playstation.com/*",
        "*://*.newegg.com/*",
        "*://*.costco.com/*",
      ],
    });

    chrome.contextMenus.create({
      id: "openPriceHunt",
      title: "Open PriceHunt",
      contexts: ["page"],
    });
  }

  handleInstallation(details) {
    if (details.reason === "install") {
      // First time installation
      this.setDefaultSettings();
      chrome.tabs.create({
        url: "https://pavlo4.netlify.app?welcome=extension",
      });
    } else if (details.reason === "update") {
      // Extension update
      console.log("PriceHunt extension updated");
    }
  }

  async setDefaultSettings() {
    const defaultSettings = {
      autoDetect: true,
      notifications: true,
      priceThreshold: 10, // Minimum savings to show notification
      supportedStores: [
        "amazon.com",
        "ebay.com",
        "walmart.com",
        "target.com",
        "bestbuy.com",
        "apple.com",
        "playstation.com",
        "newegg.com",
        "costco.com",
      ],
    };

    await chrome.storage.sync.set({ settings: defaultSettings });
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    // Only process when page is completely loaded
    if (changeInfo.status !== "complete" || !tab.url) return;

    const settings = await this.getSettings();
    if (!settings.autoDetect) return;

    // Check if this is a supported e-commerce site
    if (this.isSupportedSite(tab.url)) {
      // Update badge to indicate supported site
      chrome.action.setBadgeText({
        tabId: tabId,
        text: "💰",
      });

      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: "#7c3aed",
      });

      // Try to inject content script if not already present
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["content.js"],
        });
      } catch (error) {
        // Content script might already be injected
        console.log("Content script injection skipped:", error.message);
      }
    } else {
      // Clear badge for unsupported sites
      chrome.action.setBadgeText({
        tabId: tabId,
        text: "",
      });
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case "productDetected":
          await this.handleProductDetected(request.product, sender.tab);
          sendResponse({ success: true });
          break;

        case "searchPrices":
          const results = await this.searchPrices(request.url);
          sendResponse({ success: true, results });
          break;

        case "getSettings":
          const settings = await this.getSettings();
          sendResponse({ success: true, settings });
          break;

        case "updateSettings":
          await chrome.storage.sync.set({ settings: request.settings });
          sendResponse({ success: true });
          break;

        case "clearHistory":
          await this.clearSearchHistory();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error("Error handling message:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleProductDetected(product, tab) {
    const settings = await this.getSettings();

    if (settings.notifications) {
      // Update badge with product indicator
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: "🎯",
      });

      // Store detected product for quick access
      await chrome.storage.local.set({
        [`product_${tab.id}`]: {
          product,
          url: tab.url,
          timestamp: Date.now(),
        },
      });
    }
  }

  async searchPrices(url) {
    try {
      const response = await fetch("https://pavlo4.netlify.app/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          fromExtension: true,
        }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error("Failed to fetch price comparison");
      }
    } catch (error) {
      console.error("Error searching prices:", error);
      throw error;
    }
  }

  handleActionClick(tab) {
    // Open PriceHunt with the current URL if it's a product page
    if (this.isSupportedSite(tab.url)) {
      // Extract just the product URL without the domain prefix
      const productUrl = tab.url;
      chrome.tabs.create({
        url: `https://pavlo4.netlify.app/${encodeURIComponent(productUrl)}`,
      });
    } else {
      chrome.tabs.create({
        url: "https://pavlo4.netlify.app",
      });
    }
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case "searchPrices":
        const targetUrl = info.linkUrl || info.pageUrl;
        chrome.tabs.create({
          url: `https://pavlo4.netlify.app/${encodeURIComponent(targetUrl)}`,
        });
        break;

      case "openPriceHunt":
        chrome.tabs.create({
          url: "https://pavlo4.netlify.app",
        });
        break;
    }
  }

  async getSettings() {
    const result = await chrome.storage.sync.get("settings");
    return result.settings || (await this.getDefaultSettings());
  }

  async getDefaultSettings() {
    const defaultSettings = {
      autoDetect: true,
      notifications: true,
      priceThreshold: 10,
      supportedStores: [
        "amazon.com",
        "ebay.com",
        "walmart.com",
        "target.com",
        "bestbuy.com",
        "apple.com",
        "playstation.com",
        "newegg.com",
        "costco.com",
      ],
    };

    await chrome.storage.sync.set({ settings: defaultSettings });
    return defaultSettings;
  }

  async clearSearchHistory() {
    const items = await chrome.storage.local.get(null);
    const historyKeys = Object.keys(items).filter(
      (key) => key.startsWith("search_") || key.startsWith("product_"),
    );

    if (historyKeys.length > 0) {
      await chrome.storage.local.remove(historyKeys);
    }
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

  // Utility method to show notifications
  async showNotification(title, message, url = null) {
    const settings = await this.getSettings();
    if (!settings.notifications) return;

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: title,
      message: message,
    });
  }
}

// Initialize the background service worker
new PriceHuntBackground();
