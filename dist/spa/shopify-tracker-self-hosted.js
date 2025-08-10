/**
 * PriceHunt Self-Hosted Shopify Tracker
 * 
 * This version can be hosted directly on the business domain to avoid CSP issues.
 * Place this file on your server (e.g., https://godislove.lt/js/pricehunt-tracker.js)
 */

(function() {
    'use strict';
    
    // Configuration - Update these values for your business
    const CONFIG = {
        businessId: '3', // Update this to your business ID
        affiliateId: 'aff_godislovelt_1754470536768', // Update this to your affiliate ID
        debug: true, // Set to false in production
        apiEndpoint: 'https://paaav.vercel.app/api/track-event'
    };
    
    // Generate session ID
    const sessionId = 'ph_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Events sent in this session
    const eventsSent = [];
    
    // Send event to API
    function sendEvent(eventData) {
        if (CONFIG.debug) {
            console.log('[PriceHunt] Sending event:', eventData);
        }
        
        // Add to events sent
        eventsSent.push({
            timestamp: new Date().toISOString(),
            event: eventData.event_type,
            data: eventData
        });
        
        // Send to API
        fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        })
        .then(response => {
            if (response.ok) {
                if (CONFIG.debug) {
                    console.log('[PriceHunt] Event sent successfully:', eventData.event_type);
                }
            } else {
                console.error('[PriceHunt] Failed to send event:', response.status, response.statusText);
            }
        })
        .catch(error => {
            console.error('[PriceHunt] Error sending event:', error);
        });
    }
    
    // Track function
    function track(eventType, data) {
        const eventData = {
            event_type: eventType,
            business_id: CONFIG.businessId,
            affiliate_id: CONFIG.affiliateId,
            session_id: sessionId,
            url: window.location.href,
            page_title: document.title,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            timestamp: Date.now(),
            data: data || {}
        };
        
        sendEvent(eventData);
    }
    
    // Initialize tracking
    function initializeTracking() {
        if (CONFIG.debug) {
            console.log('[PriceHunt] Initializing self-hosted tracking for business:', CONFIG.businessId);
        }
        
        // Track page view
        track('page_view', {
            page_title: document.title,
            page_url: window.location.href
        });
        
        // Wait for Shopify to be ready
        function waitForShopify() {
            if (window.Shopify && window.Shopify.theme) {
                if (CONFIG.debug) {
                    console.log('[PriceHunt] Shopify theme detected');
                }
                
                // Track product view if on product page
                if (window.Shopify.theme.product) {
                    if (CONFIG.debug) {
                        console.log('[PriceHunt] Product data found:', window.Shopify.theme.product);
                    }
                    
                    track('product_view', {
                        product_id: window.Shopify.theme.product.id,
                        product_name: window.Shopify.theme.product.title,
                        product_price: window.Shopify.theme.product.price,
                        product_variant_id: window.Shopify.theme.product.selected_or_first_available_variant?.id,
                        product_type: window.Shopify.theme.product.type,
                        product_vendor: window.Shopify.theme.product.vendor
                    });
                }
                
                // Setup enhanced cart tracking
                setupEnhancedCartTracking();
                
            } else {
                if (CONFIG.debug) {
                    console.log('[PriceHunt] Waiting for Shopify to load...');
                }
                setTimeout(waitForShopify, 500);
            }
        }
        
        // Enhanced cart tracking setup
        function setupEnhancedCartTracking() {
            if (CONFIG.debug) {
                console.log('[PriceHunt] Setting up enhanced cart tracking...');
            }
            
            // Track form submissions
            document.addEventListener('submit', function(e) {
                const form = e.target;
                if (form.action.includes('/cart/add') || form.action.includes('cart')) {
                    const formData = new FormData(form);
                    const productId = formData.get('id');
                    const quantity = formData.get('quantity') || 1;
                    
                    if (productId) {
                        track('add_to_cart', {
                            product_id: productId,
                            product_name: window.Shopify.theme.product?.title || 'Unknown Product',
                            product_price: window.Shopify.theme.product?.price || '0',
                            quantity: quantity
                        });
                    }
                }
            });
            
            // Track button clicks
            document.addEventListener('click', function(e) {
                const target = e.target;
                const targetText = target.textContent?.toLowerCase() || '';
                
                // Check for add to cart buttons
                const isAddToCartButton = 
                    target.matches('[data-action*="add"], [data-action*="cart"]') ||
                    target.matches('.add-to-cart, .cart-button, .buy-button') ||
                    target.matches('button[type="submit"]') ||
                    targetText.includes('add to cart') ||
                    targetText.includes('buy now') ||
                    targetText.includes('add to bag') ||
                    targetText.includes('purchase') ||
                    target.closest('form[action*="/cart/add"]');
                
                if (isAddToCartButton) {
                    let productData = {
                        product_id: target.getAttribute('data-product-id') || 
                                   target.getAttribute('data-id') ||
                                   target.closest('[data-product-id]')?.getAttribute('data-product-id'),
                        product_name: target.getAttribute('data-product-name') ||
                                     target.getAttribute('data-title') ||
                                     window.Shopify.theme.product?.title,
                        product_price: target.getAttribute('data-price') ||
                                      window.Shopify.theme.product?.price,
                        quantity: target.getAttribute('data-quantity') || 1
                    };
                    
                    track('add_to_cart', productData);
                }
                
                // Track product link clicks
                if (target.matches('a[href*="/products/"]') || target.closest('a[href*="/products/"]')) {
                    const link = target.href ? target : target.closest('a[href*="/products/"]');
                    track('product_click', {
                        product_url: link.href,
                        product_name: target.textContent?.trim() || 'Product Link'
                    });
                }
            });
            
            // Track AJAX cart updates
            if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cart && window.Shopify.theme.cart.addItem) {
                const originalAddItem = window.Shopify.theme.cart.addItem;
                window.Shopify.theme.cart.addItem = function(...args) {
                    const result = originalAddItem.apply(this, args);
                    if (result && result.then) {
                        result.then(function(item) {
                            track('add_to_cart', {
                                product_id: item.product_id,
                                product_name: item.product_title,
                                product_price: item.price,
                                product_variant_id: item.variant_id,
                                quantity: item.quantity
                            });
                        });
                    }
                    return result;
                };
            }
            
            // Track checkout initiation
            document.addEventListener('click', function(e) {
                const target = e.target;
                const href = target.href || target.getAttribute('href') || '';
                
                if ((href.includes('/checkout') || (href.includes('/cart') && target.textContent.toLowerCase().includes('checkout')))) {
                    track('checkout_start', {
                        checkout_url: href,
                        referrer: window.location.href
                    });
                }
            });
        }
        
        // Start the tracking
        waitForShopify();
        
        // Expose debug functions
        window.PriceHuntDebug = {
            getTrackerStatus: function() {
                return {
                    trackerLoaded: true,
                    shopifyLoaded: !!(window.Shopify && window.Shopify.theme),
                    productData: window.Shopify?.theme?.product || null,
                    config: CONFIG,
                    sessionId: sessionId
                };
            },
            
            testEvent: function(eventType, data) {
                track(eventType, data);
                if (CONFIG.debug) {
                    console.log('[PriceHunt] Test event sent:', eventType, data);
                }
                return true;
            },
            
            getEventsSent: function() {
                return eventsSent;
            },
            
            getConfig: function() {
                return CONFIG;
            }
        };
        
        // Expose track function globally
        window.PriceHuntTracker = {
            track: track,
            getConfig: function() { return CONFIG; },
            getEventsSent: function() { return eventsSent; }
        };
        
        if (CONFIG.debug) {
            console.log('[PriceHunt] Self-hosted tracking initialized successfully');
            console.log('[PriceHunt] Available functions: PriceHuntTracker.track(), PriceHuntDebug.getTrackerStatus()');
        }
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTracking);
    } else {
        initializeTracking();
    }
    
})();
