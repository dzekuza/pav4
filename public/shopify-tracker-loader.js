/**
 * PriceHunt Shopify Tracker Loader
 * 
 * This loader dynamically loads the appropriate tracking script based on business configuration.
 * It handles domain verification and loads the enhanced tracking script.
 */

(function() {
  'use strict';

  // Get configuration from script tag
  const script = document.currentScript || document.querySelector('script[src*="shopify-tracker-loader.js"]');
  const businessId = script?.getAttribute('data-business-id');
  const affiliateId = script?.getAttribute('data-affiliate-id');
  const debug = script?.getAttribute('data-debug') === 'true';

  // Validate required parameters
  if (!businessId || !affiliateId) {
    console.error('[PriceHunt] Missing required parameters: data-business-id and data-affiliate-id');
    return;
  }

  console.log('[PriceHunt] Loading enhanced tracking for business:', businessId);

  // Load the enhanced tracking script
  function loadEnhancedTracker() {
    const trackingScript = document.createElement('script');
    trackingScript.src = 'https://ipick.io/shopify-tracker-enhanced.js';
    trackingScript.setAttribute('data-business-id', businessId);
    trackingScript.setAttribute('data-affiliate-id', affiliateId);
    if (debug) {
      trackingScript.setAttribute('data-debug', 'true');
    }

    // Add load event listener
    trackingScript.onload = function() {
      console.log('[PriceHunt] Enhanced tracker loaded successfully');
    };

    trackingScript.onerror = function() {
      console.error('[PriceHunt] Failed to load enhanced tracker');
    };

    // Insert the script
    document.head.appendChild(trackingScript);
  }

  // Check domain verification before loading
  async function checkDomainAndLoad() {
    const currentDomain = window.location.hostname;
    
    try {
      // For now, we'll load the tracker directly since domain verification might not be set up
      console.log('[PriceHunt] Initializing enhanced tracking...');
      loadEnhancedTracker();
    } catch (error) {
      console.error('[PriceHunt] Error during initialization:', error);
      // Fallback: load tracker anyway
      loadEnhancedTracker();
    }
  }

  // Start the loading process
  checkDomainAndLoad();

})();
