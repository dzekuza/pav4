// Custom event tracking script
(function () {
    'use strict';

    // Load the main tracker first
    const mainScript = document.createElement('script');
    mainScript.src = 'https://pavlo4.netlify.app/tracker.js';
    mainScript.async = true;
    mainScript.setAttribute('data-business-id', document.currentScript.getAttribute('data-business-id'));
    mainScript.setAttribute('data-affiliate-id', document.currentScript.getAttribute('data-affiliate-id'));
    document.head.appendChild(mainScript);

    // Custom event tracking
    function initCustomEventTracking() {

        // Track "Buy Now" clicks with enhanced selectors
        document.addEventListener('click', function (e) {
            const target = e.target;

            // Track "Buy Now" clicks with various selectors
            if (target.matches('[data-track="buy-now"], .buy-now, .purchase-now, [class*="buy"], [class*="purchase"], .btn-buy, .btn-purchase')) {
                const productId = target.getAttribute('data-product-id') ||
                    target.closest('[data-product-id]')?.getAttribute('data-product-id');
                const productName = target.getAttribute('data-product-name') ||
                    target.closest('[data-product-name]')?.getAttribute('data-product-name');
                const price = target.getAttribute('data-price') ||
                    target.closest('[data-price]')?.getAttribute('data-price');

                window.trackEvent('purchase_click', {
                    product_id: productId,
                    product_name: productName,
                    price: price,
                    button_text: target.textContent.trim(),
                    button_class: target.className
                });
            }

            // Track "View Product" clicks
            if (target.matches('[data-track="view-product"], .product-link, [class*="product"], a[href*="product"]')) {
                const productId = target.getAttribute('data-product-id') ||
                    target.closest('[data-product-id]')?.getAttribute('data-product-id');
                const productName = target.getAttribute('data-product-name') ||
                    target.closest('[data-product-name]')?.getAttribute('data-product-name');

                window.trackEvent('product_view', {
                    product_id: productId,
                    product_name: productName,
                    link_text: target.textContent.trim(),
                    link_href: target.href
                });
            }

            // Track "Add to Cart" clicks
            if (target.matches('[data-track="add-to-cart"], .add-to-cart, [class*="cart"], [class*="add"]')) {
                const productId = target.getAttribute('data-product-id') ||
                    target.closest('[data-product-id]')?.getAttribute('data-product-id');
                const productName = target.getAttribute('data-product-name') ||
                    target.closest('[data-product-name]')?.getAttribute('data-product-name');
                const price = target.getAttribute('data-price') ||
                    target.closest('[data-price]')?.getAttribute('data-price');

                window.trackEvent('add_to_cart', {
                    product_id: productId,
                    product_name: productName,
                    price: price,
                    button_text: target.textContent.trim()
                });
            }
        });

        // Track form submissions (for lead generation)
        document.addEventListener('submit', function (e) {
            const form = e.target;
            if (form.matches('[data-track="lead-form"], .contact-form, .newsletter-form')) {
                window.trackEvent('form_submission', {
                    form_id: form.id || form.getAttribute('data-form-id'),
                    form_action: form.action,
                    form_method: form.method
                });
            }
        });

        // Track scroll depth
        let maxScrollDepth = 0;
        document.addEventListener('scroll', function () {
            const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth;

                // Track at 25%, 50%, 75%, 100%
                if (scrollDepth >= 25 && maxScrollDepth < 50) {
                    window.trackEvent('scroll_depth', { depth: 25 });
                } else if (scrollDepth >= 50 && maxScrollDepth < 75) {
                    window.trackEvent('scroll_depth', { depth: 50 });
                } else if (scrollDepth >= 75 && maxScrollDepth < 100) {
                    window.trackEvent('scroll_depth', { depth: 75 });
                } else if (scrollDepth >= 100) {
                    window.trackEvent('scroll_depth', { depth: 100 });
                }
            }
        });

        // Track time on page
        let startTime = Date.now();
        window.addEventListener('beforeunload', function () {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            window.trackEvent('time_on_page', { seconds: timeOnPage });
        });

        // Track external link clicks
        document.addEventListener('click', function (e) {
            const target = e.target;
            if (target.tagName === 'A' && target.hostname !== window.location.hostname) {
                window.trackEvent('external_link_click', {
                    url: target.href,
                    text: target.textContent.trim(),
                    hostname: target.hostname
                });
            }
        });

        // Track video interactions
        document.addEventListener('click', function (e) {
            const target = e.target;
            if (target.matches('video, .video-player, [data-video]')) {
                window.trackEvent('video_interaction', {
                    video_id: target.getAttribute('data-video-id') || target.src,
                    action: 'play'
                });
            }
        });

        // Track social media clicks
        document.addEventListener('click', function (e) {
            const target = e.target;
            if (target.matches('a[href*="facebook"], a[href*="twitter"], a[href*="instagram"], a[href*="linkedin"]')) {
                window.trackEvent('social_media_click', {
                    platform: target.href.includes('facebook') ? 'facebook' :
                        target.href.includes('twitter') ? 'twitter' :
                            target.href.includes('instagram') ? 'instagram' :
                                target.href.includes('linkedin') ? 'linkedin' : 'other',
                    url: target.href
                });
            }
        });

        // Track phone number clicks
        document.addEventListener('click', function (e) {
            const target = e.target;
            if (target.matches('a[href^="tel:"], a[href^="callto:"]')) {
                window.trackEvent('phone_click', {
                    phone_number: target.href.replace(/^(tel:|callto:)/, ''),
                    text: target.textContent.trim()
                });
            }
        });

        // Track email clicks
        document.addEventListener('click', function (e) {
            const target = e.target;
            if (target.matches('a[href^="mailto:"]')) {
                window.trackEvent('email_click', {
                    email: target.href.replace('mailto:', ''),
                    text: target.textContent.trim()
                });
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomEventTracking);
    } else {
        initCustomEventTracking();
    }

    console.log('Custom event tracking initialized');

})(); 