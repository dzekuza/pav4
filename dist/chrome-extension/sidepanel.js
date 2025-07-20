// Side Panel JavaScript for PriceHunt Extension
class PriceHuntSidePanel {
  constructor() {
    this.currentUrl = '';
    this.detectedProduct = null;
    this.selectedCountry = 'de'; // Default to Germany
    this.init();
  }

  async init() {
    console.log('PriceHunt Side Panel initialized');
    
    // Load saved country preference
    await this.loadCountryPreference();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize the panel
    await this.initializePanel();
  }

  async loadCountryPreference() {
    try {
      const result = await chrome.storage.sync.get(['selectedCountry']);
      if (result.selectedCountry) {
        this.selectedCountry = result.selectedCountry;
        document.getElementById('countrySelect').value = this.selectedCountry;
      }
    } catch (error) {
      console.error('Error loading country preference:', error);
    }
  }

  async saveCountryPreference() {
    try {
      await chrome.storage.sync.set({ selectedCountry: this.selectedCountry });
    } catch (error) {
      console.error('Error saving country preference:', error);
    }
  }

  setupEventListeners() {
    // Country selection
    document.getElementById('countrySelect').addEventListener('change', (e) => {
      this.selectedCountry = e.target.value;
      this.saveCountryPreference();
      console.log('Country changed to:', this.selectedCountry);
    });

    // Search button
    document.getElementById('searchBtn').addEventListener('click', () => {
      this.handleSearch(false);
    });

    // Similar products button
    document.getElementById('similarBtn').addEventListener('click', () => {
      this.handleSearch(true);
    });

    // Quick actions
    document.getElementById('openApp').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://pavlo4.netlify.app' });
    });

    document.getElementById('viewHistory').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://pavlo4.netlify.app/history' });
    });

    // Footer links
    document.getElementById('settingsLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });

    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://pavlo4.netlify.app/help' });
    });
  }

  async initializePanel() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        this.showNoProduct();
        return;
      }

      this.currentUrl = tab.url;
      console.log('Current URL:', this.currentUrl);

      // Check if it's a supported site
      if (!this.isSupportedSite(this.currentUrl)) {
        this.showNoProduct();
        return;
      }

      // Update page info
      document.getElementById('pageUrl').textContent = this.currentUrl;

      // Try to detect product
      await this.detectProduct();
    } catch (error) {
      console.error('Error initializing panel:', error);
      this.showNoProduct();
    }
  }

  isSupportedSite(url) {
    const supportedDomains = [
      'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.ca', 'amazon.com.au', 'amazon.co.jp',
      'ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.it', 'ebay.es', 'ebay.ca', 'ebay.com.au',
      'walmart.com', 'walmart.ca',
      'target.com',
      'bestbuy.com', 'bestbuy.ca',
      'apple.com', 'apple.co.uk', 'apple.de', 'apple.fr', 'apple.it', 'apple.es', 'apple.ca', 'apple.com.au', 'apple.co.jp',
      'playstation.com', 'playstation.co.uk', 'playstation.de', 'playstation.fr', 'playstation.it', 'playstation.es', 'playstation.ca', 'playstation.com.au', 'playstation.co.jp',
      'newegg.com', 'newegg.ca',
      'costco.com', 'costco.ca',
      'livelarq.com', 'larq.com',
      'sonos.com', 'sonos.co.uk', 'sonos.de', 'sonos.fr', 'sonos.it', 'sonos.es', 'sonos.ca', 'sonos.com.au', 'sonos.co.jp'
    ];

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check exact domain matches
      if (supportedDomains.includes(hostname)) {
        return true;
      }
      
      // Check for subdomain matches (e.g., www.amazon.com)
      const domainParts = hostname.split('.');
      if (domainParts.length >= 2) {
        const mainDomain = domainParts.slice(-2).join('.');
        if (supportedDomains.includes(mainDomain)) {
          return true;
        }
      }
      
      // Check for e-commerce patterns
      const ecommercePatterns = [
        /shop\./,
        /store\./,
        /buy\./,
        /product/,
        /item/,
        /purchase/
      ];
      
      return ecommercePatterns.some(pattern => pattern.test(url));
    } catch (error) {
      console.error('Error checking supported site:', error);
      return false;
    }
  }

  async detectProduct() {
    try {
      console.log('Detecting product from current page...');
      
      // Send message to content script to detect product
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectProduct' });
      
      if (response && response.success && response.product) {
        this.detectedProduct = response.product;
        console.log('Product detected:', this.detectedProduct);
        
        // Update UI
        document.getElementById('pageTitle').textContent = this.detectedProduct.title;
        document.getElementById('searchBtn').disabled = false;
        document.getElementById('similarBtn').disabled = false;
        
        // Hide no product message
        document.getElementById('noProduct').style.display = 'none';
        document.getElementById('currentPage').style.display = 'block';
      } else {
        console.log('No product detected');
        this.showNoProduct();
      }
    } catch (error) {
      console.error('Error detecting product:', error);
      this.showNoProduct();
    }
  }

  showNoProduct() {
    document.getElementById('currentPage').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    document.getElementById('similarResults').style.display = 'none';
    document.getElementById('noProduct').style.display = 'block';
  }

  async handleSearch(findSimilar = false) {
    if (!this.detectedProduct) {
      console.error('No product detected');
      return;
    }

    const searchBtn = document.getElementById('searchBtn');
    const similarBtn = document.getElementById('similarBtn');
    const loader = document.getElementById('loader');
    const similarLoader = document.getElementById('similarLoader');

    try {
      // Show loading state
      if (findSimilar) {
        similarBtn.classList.add('loading');
        similarLoader.style.display = 'inline-block';
        similarBtn.disabled = true;
      } else {
        searchBtn.classList.add('loading');
        loader.style.display = 'inline-block';
        searchBtn.disabled = true;
      }

      console.log(`Searching for ${findSimilar ? 'similar' : 'price comparison'} products...`);
      console.log('Selected country:', this.selectedCountry);

      // Make API request
      const response = await fetch('https://pavlo4.netlify.app/api/n8n-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: this.currentUrl,
          fromExtension: true,
          findSimilar: findSimilar,
          gl: this.selectedCountry
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Display results
      if (findSimilar) {
        this.displaySimilarResults(data);
      } else {
        this.displayPriceResults(data);
      }

    } catch (error) {
      console.error('Search error:', error);
      this.showError(error.message);
    } finally {
      // Hide loading state
      if (findSimilar) {
        similarBtn.classList.remove('loading');
        similarLoader.style.display = 'none';
        similarBtn.disabled = false;
      } else {
        searchBtn.classList.remove('loading');
        loader.style.display = 'none';
        searchBtn.disabled = false;
      }
    }
  }

  displayPriceResults(data) {
    const resultsDiv = document.getElementById('results');
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');

    // Hide other sections
    document.getElementById('similarResults').style.display = 'none';
    document.getElementById('noProduct').style.display = 'none';

    // Clear previous results
    resultsList.innerHTML = '';

    if (data.suggestions && data.suggestions.length > 0) {
      resultsCount.textContent = `${data.suggestions.length} results`;
      
      data.suggestions.forEach(suggestion => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
          <div class="result-title">${suggestion.title || 'Product'}</div>
          <div class="result-price">${suggestion.standardPrice || suggestion.discountPrice || 'Price not available'}</div>
          <div class="result-store">
            <div class="result-store-icon"></div>
            ${suggestion.site || suggestion.merchant || 'Unknown store'}
          </div>
        `;
        
        if (suggestion.link) {
          resultItem.addEventListener('click', () => {
            chrome.tabs.create({ url: suggestion.link });
          });
        }
        
        resultsList.appendChild(resultItem);
      });
    } else {
      resultsCount.textContent = '0 results';
      resultsList.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 20px;">No price comparisons found</div>';
    }

    resultsDiv.style.display = 'block';
  }

  displaySimilarResults(data) {
    const resultsDiv = document.getElementById('similarResults');
    const resultsList = document.getElementById('similarResultsList');
    const resultsCount = document.getElementById('similarResultsCount');

    // Hide other sections
    document.getElementById('results').style.display = 'none';
    document.getElementById('noProduct').style.display = 'none';

    // Clear previous results
    resultsList.innerHTML = '';

    if (data.suggestions && data.suggestions.length > 0) {
      resultsCount.textContent = `${data.suggestions.length} similar products`;
      
      data.suggestions.forEach(suggestion => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
          <div class="result-title">${suggestion.title || 'Similar Product'}</div>
          <div class="result-price">${suggestion.standardPrice || suggestion.discountPrice || 'Price not available'}</div>
          <div class="result-store">
            <div class="result-store-icon"></div>
            ${suggestion.site || suggestion.merchant || 'Unknown store'}
          </div>
        `;
        
        if (suggestion.link) {
          resultItem.addEventListener('click', () => {
            chrome.tabs.create({ url: suggestion.link });
          });
        }
        
        resultsList.appendChild(resultItem);
      });
    } else {
      resultsCount.textContent = '0 similar products';
      resultsList.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 20px;">No similar products found</div>';
    }

    resultsDiv.style.display = 'block';
  }

  showError(message) {
    const resultsDiv = document.getElementById('results');
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');

    resultsCount.textContent = 'Error';
    resultsList.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px;">${message}</div>`;
    resultsDiv.style.display = 'block';
  }
}

// Initialize the side panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PriceHuntSidePanel();
}); 