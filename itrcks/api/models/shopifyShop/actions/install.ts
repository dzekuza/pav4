import { applyParams, save, ActionOptions, assert } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger, api, connections, currentAppUrl }) => {
  applyParams(params, record);
  await save(record);

  // Install App Web Pixel for event tracking
  try {
    logger.info(`Installing App Web Pixel for shop ${record.id}`);
    
    const shopify = await connections.shopify.forShopId(record.id);
    assert(shopify, "Shopify connection not available");
    
    logger.info(`Successfully created Shopify client for shop ${record.id}`);

    // JavaScript code for the web pixel
    const pixelCode = `
      (function() {
        var COLLECTOR_URL = '${currentAppUrl}/collector';
        
        // Utility functions
        function getUrlParam(name) {
          const urlParams = new URLSearchParams(window.location.search);
          return urlParams.get(name);
        }

        function setCookie(name, value, days) {
          const expires = new Date();
          expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
          document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
        }

        function getCookie(name) {
          const nameEQ = name + '=';
          const ca = document.cookie.split(';');
          for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
          }
          return null;
        }

        function generateSessionId() {
          return 'ipick_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        }

        function getSessionId() {
          let sessionId = getCookie('ipick_session_id');
          if (!sessionId) {
            sessionId = generateSessionId();
            setCookie('ipick_session_id', sessionId, 30);
          }
          return sessionId;
        }

        function extractTrackingParameters() {
          const urlParams = new URLSearchParams(window.location.search);
          
          // List of common tracking parameter names to check
          const trackingParams = [
            'ipick_click_id',
            'aff_id',
            'ref_token',
            'click_id',
            'tracking_id',
            'utm_source',
            'utm_campaign',
            'utm_medium',
            'fbclid',
            'gclid'
          ];
          
          for (const param of trackingParams) {
            const value = urlParams.get(param);
            if (value) {
              console.log('iPick: Found tracking parameter', param, '=', value);
              return value;
            }
          }
          
          return null;
        }

        function sendEvent(eventType, eventData) {
          try {
            const clickId = getCookie('ipick_click_id');
            const sessionId = getSessionId();
            
            const payload = {
              eventType: eventType,
              sessionId: sessionId,
              path: window.location.pathname,
              occurredAt: new Date().toISOString(),
              userAgent: navigator.userAgent,
              rawData: eventData || {}
            };

            if (clickId) {
              payload.clickId = clickId;
            }

            fetch(COLLECTOR_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
            }).catch(function(error) {
              console.log('iPick tracking error:', error);
            });
          } catch (error) {
            console.log('iPick sendEvent error:', error);
          }
        }

        function syncClickIdToCart() {
          const clickId = getCookie('ipick_click_id');
          if (!clickId) return;

          // Try to update cart attributes
          if (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) {
            fetch(window.Shopify.routes.root + 'cart/update.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                attributes: {
                  'ipick_click_id': clickId
                }
              })
            }).catch(function(error) {
              console.log('iPick cart sync error:', error);
            });
          }
        }

        // Initialize tracking
        function init() {
          // Extract tracking parameters from URL and convert to ipick_click_id
          const trackingParam = extractTrackingParameters();
          if (trackingParam) {
            setCookie('ipick_click_id', trackingParam, 30);
            console.log('iPick: Set click ID from URL parameter:', trackingParam);
          }

          // Track page view
          sendEvent('page_view', {});

          // Track product views
          if (window.location.pathname.includes('/products/')) {
            const pathParts = window.location.pathname.split('/');
            const productHandle = pathParts[pathParts.indexOf('products') + 1];
            if (productHandle) {
              sendEvent('product_view', {
                productId: productHandle
              });
            }
          }
        }

        // Set up event listeners
        function setupEventListeners() {
          // Add to cart tracking
          document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.action && form.action.includes('/cart/add')) {
              const formData = new FormData(form);
              const variantId = formData.get('id');
              const quantity = formData.get('quantity') || 1;
              
              sendEvent('add_to_cart', {
                variantId: variantId,
                quantity: parseInt(quantity)
              });

              // Sync click ID to cart
              setTimeout(syncClickIdToCart, 100);
            }
          });

          // Checkout tracking
          if (window.Shopify && window.Shopify.Checkout) {
            const checkout = window.Shopify.Checkout;
            
            // Begin checkout
            if (checkout.step === 'contact_information') {
              sendEvent('begin_checkout', {
                checkoutId: checkout.token,
                cartToken: checkout.cart_token
              });
            }

            // Checkout completed
            if (window.location.pathname.includes('/orders/') || 
                (checkout.step === 'thank_you' && checkout.order_id)) {
              sendEvent('checkout_completed', {
                orderId: checkout.order_id,
                checkoutId: checkout.token,
                value: parseFloat(checkout.total_price || 0),
                currency: checkout.currency
              });
            }
          }

          // Checkout abandoned (track when leaving checkout without completing)
          if (window.location.pathname.includes('/checkouts/')) {
            window.addEventListener('beforeunload', function() {
              if (window.Shopify && window.Shopify.Checkout && 
                  window.Shopify.Checkout.step !== 'thank_you') {
                sendEvent('checkout_abandoned', {
                  checkoutId: window.Shopify.Checkout.token,
                  cartToken: window.Shopify.Checkout.cart_token
                });
              }
            });
          }
        }

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            init();
            setupEventListeners();
          });
        } else {
          init();
          setupEventListeners();
        }
      })();
    `;

    // Create the App Web Pixel using Shopify GraphQL API
    const pixelMutation = `
      mutation webPixelCreate($webPixel: WebPixelInput!) {
        webPixelCreate(webPixel: $webPixel) {
          webPixel {
            id
            settings
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const pixelVariables = {
      webPixel: {
        settings: {
          accountID: "ipick-analytics"
        }
      }
    };

    const pixelResponse = await shopify.graphql(pixelMutation, pixelVariables);
    
    // Check if response has the expected structure
    if (!pixelResponse || !pixelResponse.data) {
      logger.error(`Invalid GraphQL response for web pixel creation for shop ${record.id}`);
      throw new Error("Invalid GraphQL response for web pixel creation");
    }

    const webPixelCreate = pixelResponse.data.webPixelCreate;
    if (!webPixelCreate) {
      logger.error(`No webPixelCreate data in response for shop ${record.id}`);
      throw new Error("No webPixelCreate data in GraphQL response");
    }
    
    if (webPixelCreate.userErrors && webPixelCreate.userErrors.length > 0) {
      const errors = webPixelCreate.userErrors;
      logger.error(`Failed to create web pixel for shop ${record.id}: ${errors.map((e: any) => e.message).join(', ')}`);
      throw new Error(`Web pixel creation failed: ${errors.map((e: any) => e.message).join(', ')}`);
    }

    const pixelId = webPixelCreate.webPixel?.id;
    
    if (!pixelId) {
      logger.error(`No pixel ID returned from creation for shop ${record.id}`);
      throw new Error("Failed to get pixel ID from creation response");
    }

    logger.info(`Created web pixel ${pixelId} for shop ${record.id}, now adding JavaScript code`);

    // Add the JavaScript code to the pixel
    const updateMutation = `
      mutation webPixelUpdate($id: ID!, $webPixel: WebPixelUpdateInput!) {
        webPixelUpdate(id: $id, webPixel: $webPixel) {
          webPixel {
            id
            settings
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const updateVariables = {
      id: pixelId,
      webPixel: {
        settings: {
          accountID: "ipick-analytics",
          customCode: pixelCode
        }
      }
    };

    const updateResponse = await shopify.graphql(updateMutation, updateVariables);
    
    // Check if response has the expected structure
    if (!updateResponse || !updateResponse.data) {
      logger.error(`Invalid GraphQL response for web pixel update for shop ${record.id}`);
      throw new Error("Invalid GraphQL response for web pixel update");
    }

    const webPixelUpdate = updateResponse.data.webPixelUpdate;
    if (!webPixelUpdate) {
      logger.error(`No webPixelUpdate data in response for shop ${record.id}`);
      throw new Error("No webPixelUpdate data in GraphQL response");
    }
    
    if (webPixelUpdate.userErrors && webPixelUpdate.userErrors.length > 0) {
      const errors = webPixelUpdate.userErrors;
      logger.error(`Failed to update web pixel ${pixelId} with code for shop ${record.id}: ${errors.map((e: any) => e.message).join(', ')}`);
      throw new Error(`Web pixel update failed: ${errors.map((e: any) => e.message).join(', ')}`);
    }

    logger.info(`Successfully installed App Web Pixel ${pixelId} with tracking code for shop ${record.id}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to install App Web Pixel for shop ${record.id}: ${errorMessage}`);
    // Don't throw the error to prevent shop installation from failing
    // The pixel can be installed manually later if needed
  }
};

export const options: ActionOptions = { actionType: "create" };
