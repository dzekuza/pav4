/**
 * PriceHunt Shopify Tracker - Head Script
 * 
 * This script should be added to the <head> section of your Shopify theme.
 * It initializes the tracking configuration and loads the main tracking script.
 * 
 * Usage: Add this script to your theme.liquid file in the <head> section
 */

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.PriceHuntHeadInitialized) {
    return;
  }
  window.PriceHuntHeadInitialized = true;
  
  // Configuration object
  window.PriceHuntConfig = {
    businessId: null,
    affiliateId: null,
    debug: false,
    initialized: false
  };
  
  // Get configuration from script tag attributes
  const script = document.currentScript || document.querySelector('script[src*="shopify-tracker-head.js"]');
  if (script) {
    window.PriceHuntConfig.businessId = script.getAttribute('data-business-id');
    window.PriceHuntConfig.affiliateId = script.getAttribute('data-affiliate-id');
    window.PriceHuntConfig.debug = script.getAttribute('data-debug') === 'true';
  }
  
  // Fallback to URL parameters
  if (!window.PriceHuntConfig.businessId) {
    const urlParams = new URLSearchParams(window.location.search);
    window.PriceHuntConfig.businessId = urlParams.get('utm_source') || urlParams.get('business_id');
  }
  if (!window.PriceHuntConfig.affiliateId) {
    const urlParams = new URLSearchParams(window.location.search);
    window.PriceHuntConfig.affiliateId = urlParams.get('utm_medium') || urlParams.get('affiliate_id');
  }
  
  // Validate configuration
  if (!window.PriceHuntConfig.businessId || !window.PriceHuntConfig.affiliateId) {
    console.error('[PriceHunt] Missing required configuration: business-id and affiliate-id');
    return;
  }
  
  if (window.PriceHuntConfig.debug) {
    console.log('[PriceHunt] Head script loaded with config:', window.PriceHuntConfig);
  }
  
  // Create data layer for tracking events
  window.PriceHuntDataLayer = window.PriceHuntDataLayer || [];
  
  // Push initial configuration to data layer
  window.PriceHuntDataLayer.push({
    'event': 'pricehunt_init',
    'business_id': window.PriceHuntConfig.businessId,
    'affiliate_id': window.PriceHuntConfig.affiliateId,
    'timestamp': Date.now()
  });
  
  // Function to push events to data layer
  window.PriceHuntPush = function(eventData) {
    window.PriceHuntDataLayer.push(eventData);
    if (window.PriceHuntConfig.debug) {
      console.log('[PriceHunt] Event pushed to data layer:', eventData);
    }
  };
  
  // Mark head script as ready
  window.PriceHuntHeadReady = true;
  
  if (window.PriceHuntConfig.debug) {
    console.log('[PriceHunt] Head script initialization complete');
  }
})();
