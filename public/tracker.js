// PriceHunt Sales Tracking Script
// Sellers embed this script on their website to track sales

(function () {
    'use strict';

    // Configuration
    let config = {
        storeId: null,
        userSessionId: null,
        productId: null,
        apiUrl: 'https://pavlo4.netlify.app/api/sales/track', // Your app's API
        debug: false
    };

    // Initialize tracker
    window.trackerInit = function (options) {
        config = { ...config, ...options };

        if (config.debug) {
            console.log('PriceHunt Tracker initialized:', config);
        }

        // Start listening for events
        listenForEvents();
    };

    // Listen for purchase events
    function listenForEvents() {
        // Method 1: Listen for form submissions (common for purchases)
        document.addEventListener('submit', handleFormSubmit);

        // Method 2: Listen for button clicks (Add to Cart, Buy Now, etc.)
        document.addEventListener('click', handleButtonClick);

        // Method 3: Listen for URL changes (for SPA sites)
        if (window.history && window.history.pushState) {
            const originalPushState = window.history.pushState;
            window.history.pushState = function () {
                originalPushState.apply(this, arguments);
                checkForPurchaseConfirmation();
            };
        }

        // Method 4: Listen for localStorage/sessionStorage changes
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
            originalSetItem.apply(this, arguments);
            if (key.includes('order') || key.includes('purchase') || key.includes('cart')) {
                checkForPurchaseData(key, value);
            }
        };

        // Method 5: Check for purchase confirmation on page load
        setTimeout(checkForPurchaseConfirmation, 2000);
    }

    // Handle form submissions (checkout forms)
    function handleFormSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);

        // Check if this looks like a purchase form
        const isPurchaseForm = isPurchaseFormCheck(form, formData);

        if (isPurchaseForm) {
            if (config.debug) {
                console.log('Purchase form detected:', form);
            }

            // Track the purchase attempt
            trackEvent('purchase_attempt', {
                formAction: form.action,
                formMethod: form.method,
                formData: Object.fromEntries(formData)
            });
        }
    }

    // Handle button clicks (Add to Cart, Buy Now, etc.)
    function handleButtonClick(event) {
        const button = event.target;
        const buttonText = button.textContent.toLowerCase();
        const buttonClass = button.className.toLowerCase();
        const buttonId = button.id.toLowerCase();

        // Check if this looks like a purchase button
        const isPurchaseButton = isPurchaseButtonCheck(button, buttonText, buttonClass, buttonId);

        if (isPurchaseButton) {
            if (config.debug) {
                console.log('Purchase button clicked:', button);
            }

            trackEvent('purchase_button_click', {
                buttonText: button.textContent,
                buttonClass: button.className,
                buttonId: button.id
            });
        }
    }

    // Check for purchase confirmation on current page
    function checkForPurchaseConfirmation() {
        // Look for common purchase confirmation indicators
        const indicators = [
            'thank you',
            'order confirmation',
            'purchase complete',
            'order received',
            'payment successful',
            'order #',
            'confirmation',
            'success'
        ];

        const pageText = document.body.textContent.toLowerCase();
        const pageUrl = window.location.href.toLowerCase();
        const pageTitle = document.title.toLowerCase();

        // Check if any indicators are present
        const hasConfirmation = indicators.some(indicator =>
            pageText.includes(indicator) ||
            pageUrl.includes(indicator) ||
            pageTitle.includes(indicator)
        );

        if (hasConfirmation) {
            if (config.debug) {
                console.log('Purchase confirmation detected on page');
            }

            // Extract order details
            const orderDetails = extractOrderDetails();

            if (orderDetails) {
                trackPurchase(orderDetails);
            }
        }
    }

    // Check for purchase data in storage
    function checkForPurchaseData(key, value) {
        try {
            const data = JSON.parse(value);

            // Look for order/purchase data
            if (data.orderId || data.order_id || data.purchaseId || data.purchase_id) {
                if (config.debug) {
                    console.log('Purchase data found in storage:', data);
                }

                trackPurchase({
                    orderId: data.orderId || data.order_id || data.purchaseId || data.purchase_id,
                    amount: data.amount || data.total || data.price,
                    currency: data.currency || 'USD',
                    productId: data.productId || data.product_id,
                    productName: data.productName || data.product_name
                });
            }
        } catch (e) {
            // Not JSON data, ignore
        }
    }

    // Extract order details from the page
    function extractOrderDetails() {
        // Try to find order ID in various places
        const orderId = findOrderId();
        const amount = findAmount();
        const currency = findCurrency();
        const productInfo = findProductInfo();

        if (orderId) {
            return {
                orderId: orderId,
                amount: amount,
                currency: currency || 'USD',
                productId: productInfo.id,
                productName: productInfo.name,
                productUrl: window.location.href
            };
        }

        return null;
    }

    // Find order ID on the page
    function findOrderId() {
        // Common selectors for order IDs
        const selectors = [
            '[data-order-id]',
            '[data-orderid]',
            '.order-id',
            '.orderId',
            '#order-id',
            '#orderId',
            '[class*="order"]',
            '[id*="order"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const orderId = element.textContent.trim() || element.getAttribute('data-order-id') || element.getAttribute('data-orderid');
                if (orderId) return orderId;
            }
        }

        // Try to find in page text
        const pageText = document.body.textContent;
        const orderMatch = pageText.match(/order[:\s#]*([A-Z0-9\-]+)/i);
        if (orderMatch) return orderMatch[1];

        return null;
    }

    // Find amount on the page
    function findAmount() {
        // Common selectors for amounts
        const selectors = [
            '[data-amount]',
            '[data-price]',
            '.amount',
            '.price',
            '.total',
            '.cost'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const amount = element.textContent.trim();
                const numericAmount = extractNumericAmount(amount);
                if (numericAmount) return numericAmount;
            }
        }

        return null;
    }

    // Find currency on the page
    function findCurrency() {
        const pageText = document.body.textContent;
        const currencyMatch = pageText.match(/[\$€£¥₹₽₿]|USD|EUR|GBP|JPY|INR|RUB|BTC/i);
        if (currencyMatch) return currencyMatch[0];
        return 'USD';
    }

    // Find product information
    function findProductInfo() {
        // Try to find product info in meta tags
        const productName = document.querySelector('meta[property="og:title"]')?.content ||
            document.querySelector('meta[name="title"]')?.content ||
            document.title;

        const productId = document.querySelector('meta[property="og:url"]')?.content ||
            document.querySelector('link[rel="canonical"]')?.href ||
            window.location.href;

        return {
            name: productName || 'Unknown Product',
            id: productId || window.location.href
        };
    }

    // Helper functions
    function isPurchaseFormCheck(form, formData) {
        const formAction = form.action.toLowerCase();
        const formMethod = form.method.toLowerCase();
        const formClass = form.className.toLowerCase();
        const formId = form.id.toLowerCase();

        // Check for common purchase form indicators
        const purchaseIndicators = [
            'checkout',
            'payment',
            'order',
            'purchase',
            'buy',
            'cart',
            'billing'
        ];

        return purchaseIndicators.some(indicator =>
            formAction.includes(indicator) ||
            formClass.includes(indicator) ||
            formId.includes(indicator)
        );
    }

    function isPurchaseButtonCheck(button, text, className, id) {
        const purchaseKeywords = [
            'buy',
            'purchase',
            'order',
            'checkout',
            'add to cart',
            'add to bag',
            'buy now',
            'order now',
            'proceed to checkout',
            'complete order',
            'place order'
        ];

        return purchaseKeywords.some(keyword =>
            text.includes(keyword) ||
            className.includes(keyword) ||
            id.includes(keyword)
        );
    }

    function extractNumericAmount(text) {
        const match = text.match(/[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
        }
        return null;
    }

    // Track a generic event
    function trackEvent(eventType, data) {
        if (!config.storeId) {
            console.warn('PriceHunt Tracker: storeId not configured');
            return;
        }

        const eventData = {
            event: eventType,
            storeId: config.storeId,
            userSessionId: config.userSessionId,
            productId: config.productId,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ...data
        };

        if (config.debug) {
            console.log('Tracking event:', eventData);
        }

        // Send to your API
        fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        }).catch(error => {
            if (config.debug) {
                console.error('Failed to track event:', error);
            }
        });
    }

    // Track a purchase
    function trackPurchase(orderDetails) {
        if (!config.storeId) {
            console.warn('PriceHunt Tracker: storeId not configured');
            return;
        }

        const purchaseData = {
            orderId: orderDetails.orderId,
            businessId: config.storeId, // This should be the business ID
            productUrl: orderDetails.productUrl || window.location.href,
            productTitle: orderDetails.productName,
            productPrice: orderDetails.amount,
            currency: orderDetails.currency,
            retailer: window.location.hostname,
            sessionId: config.userSessionId,
            referrer: document.referrer,
            utmSource: getUrlParameter('utm_source'),
            utmMedium: getUrlParameter('utm_medium'),
            utmCampaign: getUrlParameter('utm_campaign')
        };

        if (config.debug) {
            console.log('Tracking purchase:', purchaseData);
        }

        // Send to your API
        fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(purchaseData)
        }).then(response => response.json())
            .then(data => {
                if (config.debug) {
                    console.log('Purchase tracked successfully:', data);
                }
            }).catch(error => {
                if (config.debug) {
                    console.error('Failed to track purchase:', error);
                }
            });
    }

    // Helper function to get URL parameters
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Auto-initialize if config is already set
    if (window.trackerConfig) {
        trackerInit(window.trackerConfig);
    }

    // Expose tracker for manual use
    window.PriceHuntTracker = {
        init: trackerInit,
        trackEvent: trackEvent,
        trackPurchase: trackPurchase
    };

})(); 