<!-- PriceHunt Enhanced Integration for godislove.lt -->
<script src="https://paaav.vercel.app/shopify-tracker-enhanced.js" data-business-id="3" data-affiliate-id="aff_godislovelt_1754470536768" data-debug="true"></script>
<script>
// Enhanced tracking for godislove.lt
document.addEventListener('DOMContentLoaded', function() {
    console.log('[PriceHunt] Enhanced integration loaded for godislove.lt');
    
    // Wait for Shopify to be ready
    function waitForShopify() {
        if (window.Shopify && window.Shopify.theme) {
            console.log('[PriceHunt] Shopify theme detected:', window.Shopify.theme);
            
            // Check for product data
            if (window.Shopify.theme.product) {
                console.log('[PriceHunt] Product data found:', window.Shopify.theme.product);
                
                // Track product view with enhanced data
                if (window.PriceHuntTracker) {
                    window.PriceHuntTracker.track('product_view', {
                        product_id: window.Shopify.theme.product.id,
                        product_name: window.Shopify.theme.product.title,
                        product_price: window.Shopify.theme.product.price,
                        product_variant_id: window.Shopify.theme.product.selected_or_first_available_variant?.id,
                        product_type: window.Shopify.theme.product.type,
                        product_vendor: window.Shopify.theme.product.vendor
                    });
                }
            }
            
            // Enhanced add to cart tracking
            setupEnhancedCartTracking();
            
        } else {
            console.log('[PriceHunt] Waiting for Shopify to load...');
            setTimeout(waitForShopify, 500);
        }
    }
    
    function setupEnhancedCartTracking() {
        console.log('[PriceHunt] Setting up enhanced cart tracking...');
        
        // Track all form submissions that might be add to cart
        document.addEventListener('submit', function(e) {
            const form = e.target;
            console.log('[PriceHunt] Form submitted:', form.action, form);
            
            if (form.action.includes('/cart/add') || form.action.includes('cart')) {
                console.log('[PriceHunt] Cart form detected');
                
                // Extract product data from form
                const formData = new FormData(form);
                const productId = formData.get('id');
                const quantity = formData.get('quantity') || 1;
                
                console.log('[PriceHunt] Form data:', { productId, quantity });
                
                if (window.PriceHuntTracker && productId) {
                    window.PriceHuntTracker.track('add_to_cart', {
                        product_id: productId,
                        product_name: window.Shopify.theme.product?.title || 'Unknown Product',
                        product_price: window.Shopify.theme.product?.price || '0',
                        quantity: quantity,
                        form_action: form.action
                    });
                }
            }
        });
        
        // Track button clicks more comprehensively
        document.addEventListener('click', function(e) {
            const target = e.target;
            const targetText = target.textContent?.toLowerCase() || '';
            
            console.log('[PriceHunt] Click detected:', target, targetText);
            
            // Check for various add to cart button patterns
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
                console.log('[PriceHunt] Add to cart button clicked:', target);
                
                if (window.PriceHuntTracker) {
                    // Extract product data
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
                    
                    console.log('[PriceHunt] Extracted product data:', productData);
                    
                    window.PriceHuntTracker.track('add_to_cart', productData);
                }
            }
            
            // Track product link clicks
            if (target.matches('a[href*="/products/"]') || target.closest('a[href*="/products/"]')) {
                console.log('[PriceHunt] Product link clicked:', target);
                
                if (window.PriceHuntTracker) {
                    const link = target.href ? target : target.closest('a[href*="/products/"]');
                    window.PriceHuntTracker.track('product_click', {
                        product_url: link.href,
                        product_name: target.textContent?.trim() || 'Product Link'
                    });
                }
            }
        });
        
        // Track AJAX cart updates if available
        if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cart) {
            console.log('[PriceHunt] Shopify cart API detected');
            
            // Override cart.addItem if it exists
            if (window.Shopify.theme.cart.addItem) {
                const originalAddItem = window.Shopify.theme.cart.addItem;
                window.Shopify.theme.cart.addItem = function(...args) {
                    console.log('[PriceHunt] Shopify cart.addItem called:', args);
                    
                    const result = originalAddItem.apply(this, args);
                    if (result && result.then) {
                        result.then(function(item) {
                            console.log('[PriceHunt] Cart item added successfully:', item);
                            
                            if (window.PriceHuntTracker) {
                                window.PriceHuntTracker.track('add_to_cart', {
                                    product_id: item.product_id,
                                    product_name: item.product_title,
                                    product_price: item.price,
                                    product_variant_id: item.variant_id,
                                    quantity: item.quantity
                                });
                            }
                        }).catch(function(error) {
                            console.error('[PriceHunt] Cart add item error:', error);
                        });
                    }
                    
                    return result;
                };
            }
        }
        
        // Track checkout initiation
        document.addEventListener('click', function(e) {
            const target = e.target;
            const href = target.href || target.getAttribute('href') || '';
            
            if (href.includes('/checkout') || href.includes('/cart') && target.textContent.toLowerCase().includes('checkout')) {
                console.log('[PriceHunt] Checkout initiated:', target);
                
                if (window.PriceHuntTracker) {
                    window.PriceHuntTracker.track('checkout_start', {
                        checkout_url: href,
                        referrer: window.location.href
                    });
                }
            }
        });
    }
    
    // Start the enhanced tracking
    waitForShopify();
    
    // Additional debugging
    console.log('[PriceHunt] Enhanced integration setup complete');
    console.log('[PriceHunt] Available tracker functions:', Object.keys(window.PriceHuntTracker || {}));
    
    // Expose debug functions
    window.PriceHuntDebug = {
        getTrackerStatus: function() {
            return {
                trackerLoaded: !!window.PriceHuntTracker,
                shopifyLoaded: !!(window.Shopify && window.Shopify.theme),
                productData: window.Shopify?.theme?.product || null,
                config: window.PriceHuntTracker?.getConfig?.() || null
            };
        },
        
        testEvent: function(eventType, data) {
            if (window.PriceHuntTracker) {
                window.PriceHuntTracker.track(eventType, data);
                console.log('[PriceHunt] Test event sent:', eventType, data);
                return true;
            } else {
                console.error('[PriceHunt] Tracker not available');
                return false;
            }
        },
        
        getEventsSent: function() {
            return window.PriceHuntTracker?.getEventsSent?.() || [];
        }
    };
});
</script>
<!-- End PriceHunt Enhanced Integration for godislove.lt -->
