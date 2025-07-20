// Options page functionality for PriceHunt Chrome Extension
class PriceHuntOptions {
  constructor() {
    this.settings = null;
    this.stores = [
      { name: "Amazon", logo: "🛒", domain: "amazon.com" },
      { name: "eBay", logo: "🛍️", domain: "ebay.com" },
      { name: "Walmart", logo: "🏪", domain: "walmart.com" },
      { name: "Target", logo: "🎯", domain: "target.com" },
      { name: "Best Buy", logo: "⚡", domain: "bestbuy.com" },
      { name: "Apple", logo: "🍎", domain: "apple.com" },
      { name: "PlayStation", logo: "🎮", domain: "playstation.com" },
      { name: "Newegg", logo: "💻", domain: "newegg.com" },
      { name: "Costco", logo: "📦", domain: "costco.com" },
    ];
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.populateStores();
    this.updateUI();
    this.showSaveStatus("Settings loaded");
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get("settings");
      this.settings = result.settings || this.getDefaultSettings();
    } catch (error) {
      console.error("Error loading settings:", error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
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
  }

  setupEventListeners() {
    // Auto-detect toggle
    const autoDetectToggle = document.getElementById("autoDetect");
    autoDetectToggle.addEventListener("change", (e) => {
      this.updateSetting("autoDetect", e.target.checked);
    });

    // Notifications toggle
    const notificationsToggle = document.getElementById("notifications");
    notificationsToggle.addEventListener("change", (e) => {
      this.updateSetting("notifications", e.target.checked);
    });

    // Price threshold input
    const priceThresholdInput = document.getElementById("priceThreshold");
    priceThresholdInput.addEventListener("input", (e) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1) {
        this.updateSetting("priceThreshold", value);
      }
    });

    // Clear history button
    const clearHistoryBtn = document.getElementById("clearHistory");
    clearHistoryBtn.addEventListener("click", () => {
      this.clearHistory();
    });

    // Store toggles will be added dynamically
  }

  populateStores() {
    const storesGrid = document.getElementById("storesGrid");
    storesGrid.innerHTML = "";

    this.stores.forEach((store) => {
      const storeItem = this.createStoreItem(store);
      storesGrid.appendChild(storeItem);
    });
  }

  createStoreItem(store) {
    const isEnabled = this.settings.supportedStores.includes(store.domain);

    const storeItem = document.createElement("div");
    storeItem.className = "store-item";
    storeItem.innerHTML = `
            <div class="store-info">
                <div class="store-logo">${store.logo}</div>
                <div class="store-name">${store.name}</div>
            </div>
            <label class="toggle">
                <input type="checkbox" ${isEnabled ? "checked" : ""} data-store="${store.domain}">
                <span class="toggle-slider"></span>
            </label>
        `;

    // Add event listener for store toggle
    const toggle = storeItem.querySelector('input[type="checkbox"]');
    toggle.addEventListener("change", (e) => {
      this.updateStoreEnabled(store.domain, e.target.checked);
    });

    return storeItem;
  }

  updateUI() {
    // Update form controls with current settings
    document.getElementById("autoDetect").checked = this.settings.autoDetect;
    document.getElementById("notifications").checked =
      this.settings.notifications;
    document.getElementById("priceThreshold").value =
      this.settings.priceThreshold;

    // Update version number
    const manifestData = chrome.runtime.getManifest();
    document.getElementById("version").textContent = manifestData.version;
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await this.saveSettings();
    this.showSaveStatus("Settings saved");
  }

  async updateStoreEnabled(storeDomain, enabled) {
    if (enabled) {
      if (!this.settings.supportedStores.includes(storeDomain)) {
        this.settings.supportedStores.push(storeDomain);
      }
    } else {
      this.settings.supportedStores = this.settings.supportedStores.filter(
        (domain) => domain !== storeDomain,
      );
    }

    await this.saveSettings();
    this.showSaveStatus("Store preferences updated");
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.settings });

      // Notify background script of settings change
      chrome.runtime.sendMessage({
        action: "updateSettings",
        settings: this.settings,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      this.showSaveStatus("Error saving settings", true);
    }
  }

  async clearHistory() {
    try {
      // Show confirmation
      if (
        !confirm(
          "Are you sure you want to clear your search history? This action cannot be undone.",
        )
      ) {
        return;
      }

      // Clear history via background script
      const response = await chrome.runtime.sendMessage({
        action: "clearHistory",
      });

      if (response.success) {
        this.showSaveStatus("Search history cleared");
      } else {
        throw new Error(response.error || "Failed to clear history");
      }
    } catch (error) {
      console.error("Error clearing history:", error);
      this.showSaveStatus("Error clearing history", true);
    }
  }

  showSaveStatus(message, isError = false) {
    const statusElement = document.getElementById("saveStatus");

    statusElement.textContent = message;
    statusElement.className = isError ? "save-status error" : "save-status";

    if (isError) {
      statusElement.style.color = "#dc2626";
    } else {
      statusElement.style.color = "#059669";
    }

    // Add fade in animation
    statusElement.classList.add("fade-in");

    // Clear animation class after it completes
    setTimeout(() => {
      statusElement.classList.remove("fade-in");
    }, 300);

    // Clear status after 3 seconds
    clearTimeout(this.statusTimeout);
    this.statusTimeout = setTimeout(() => {
      if (!isError) {
        statusElement.textContent = "Settings saved automatically";
        statusElement.style.color = "#059669";
      }
    }, 3000);
  }

  // Utility methods
  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = "pricehunt-settings.json";
    link.click();

    this.showSaveStatus("Settings exported");
  }

  async importSettings(file) {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);

      // Validate imported settings
      if (this.validateSettings(importedSettings)) {
        this.settings = { ...this.getDefaultSettings(), ...importedSettings };
        await this.saveSettings();
        this.updateUI();
        this.populateStores();
        this.showSaveStatus("Settings imported successfully");
      } else {
        throw new Error("Invalid settings file");
      }
    } catch (error) {
      console.error("Error importing settings:", error);
      this.showSaveStatus("Error importing settings", true);
    }
  }

  validateSettings(settings) {
    // Basic validation of settings structure
    return (
      typeof settings === "object" &&
      typeof settings.autoDetect === "boolean" &&
      typeof settings.notifications === "boolean" &&
      typeof settings.priceThreshold === "number" &&
      Array.isArray(settings.supportedStores)
    );
  }

  // Add keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + S to save (though we auto-save)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        this.showSaveStatus("Settings are saved automatically");
      }

      // Ctrl/Cmd + E to export
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        this.exportSettings();
      }
    });
  }
}

// Initialize options page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PriceHuntOptions();
});

// Handle settings import via drag and drop
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  body.addEventListener("dragover", (e) => {
    e.preventDefault();
    body.style.opacity = "0.7";
  });

  body.addEventListener("dragleave", (e) => {
    e.preventDefault();
    body.style.opacity = "1";
  });

  body.addEventListener("drop", (e) => {
    e.preventDefault();
    body.style.opacity = "1";

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/json") {
      // Handle settings import
      console.log("Settings file dropped");
    }
  });
});
