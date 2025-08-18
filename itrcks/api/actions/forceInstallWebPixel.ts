import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const shopId = params.shopId;
  
  logger.info(`Starting forced Web Pixel installation for shop: ${shopId}`);
  
  try {
    // Look up the shop by ID
    logger.info(`Looking up shop with ID: ${shopId}`);
    const shop = await api.shopifyShop.findOne(shopId, {
      select: {
        id: true,
        name: true,
        myshopifyDomain: true,
        domain: true
      }
    });
    
    logger.info(`Found shop: ${shop.name} (${shop.myshopifyDomain})`);
    
    // Get the Shopify client for this specific shop
    logger.info(`Getting Shopify client for shop ${shopId}`);
    const shopify = await connections.shopify.forShopId(shopId);
    
    if (!shopify) {
      throw new Error(`Could not get Shopify client for shop ${shopId}`);
    }
    
    // Get the current app URL for the collector endpoint
    const appUrl = connections.shopify.currentAppUrl || "https://itrcks--development.gadget.app";
    const collectorUrl = `${appUrl}/collector`;
    
    // Define the complete Web Pixel JavaScript code for tracking
    const webPixelJavaScript = `
      (function() {
        console.log('iPick Analytics Web Pixel loaded');
        
        // Configuration
        const COLLECTOR_URL = '${collectorUrl}';
        const SHOP_ID = '${shopId}';
        
        // Utility function to send events
        function sendEvent(eventData) {
          try {
            const payload = {
              ...eventData,
              shopId: SHOP_ID,
              occurredAt: new Date().toISOString(),
              sessionId: analytics.customer?.id || 'anonymous_' + Date.now(),
              userAgent: navigator.userAgent,
              ipAddress: null // Will be detected server-side
            };
            
            console.log('Sending event:', payload);
            
            fetch(COLLECTOR_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
            }).catch(error => {
              console.error('Failed to send event:', error);
            });
          } catch (error) {
            console.error('Error preparing event:', error);
          }
        }
        
        // Track page views
        analytics.subscribe('page_viewed', function(event) {
          sendEvent({
            eventType: 'page_view',
            path: event.context.document.location.pathname,
            rawData: {
              url: event.context.document.location.href,
              referrer: event.context.document.referrer,
              title: event.context.document.title
            }
          });
        });
        
        // Track product views
        analytics.subscribe('product_viewed', function(event) {
          sendEvent({
            eventType: 'product_view',
            path: event.context.document.location.pathname,
            productId: event.data?.productVariant?.product?.id?.toString(),
            variantId: event.data?.productVariant?.id?.toString(),
            rawData: {
              product: event.data?.productVariant?.product,
              variant: event.data?.productVariant,
              url: event.context.document.location.href
            }
          });
        });
        
        // Track add to cart
        analytics.subscribe('product_added_to_cart', function(event) {
          const cartLine = event.data?.cartLine;
          sendEvent({
            eventType: 'add_to_cart',
            path: event.context.document.location.pathname,
            productId: cartLine?.merchandise?.product?.id?.toString(),
            variantId: cartLine?.merchandise?.id?.toString(),
            quantity: cartLine?.quantity,
            value: cartLine?.cost?.totalAmount?.amount ? parseFloat(cartLine.cost.totalAmount.amount) : null,
            currency: cartLine?.cost?.totalAmount?.currencyCode,
            cartToken: event.data?.checkout?.token,
            rawData: {
              cartLine: cartLine,
              checkout: event.data?.checkout
            }
          });
        });
        
        // Track checkout started
        analytics.subscribe('checkout_started', function(event) {
          const checkout = event.data?.checkout;
          sendEvent({
            eventType: 'begin_checkout',
            path: event.context.document.location.pathname,
            checkoutId: checkout?.order?.id?.toString(),
            value: checkout?.totalPrice?.amount ? parseFloat(checkout.totalPrice.amount) : null,
            currency: checkout?.totalPrice?.currencyCode,
            cartToken: checkout?.token,
            rawData: {
              checkout: checkout
            }
          });
        });
        
        // Track checkout completed
        analytics.subscribe('checkout_completed', function(event) {
          const checkout = event.data?.checkout;
          sendEvent({
            eventType: 'checkout_completed',
            path: event.context.document.location.pathname,
            orderId: checkout?.order?.id?.toString(),
            checkoutId: checkout?.order?.id?.toString(),
            value: checkout?.totalPrice?.amount ? parseFloat(checkout.totalPrice.amount) : null,
            currency: checkout?.totalPrice?.currencyCode,
            cartToken: checkout?.token,
            rawData: {
              checkout: checkout,
              order: checkout?.order
            }
          });
        });
        
        console.log('iPick Analytics Web Pixel initialized successfully');
      })();
    `;
    
    // Define the Web Pixel creation mutation
    const webPixelCreateMutation = `
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
    
    // Define the Web Pixel settings with the complete JavaScript code
    const webPixelVariables = {
      webPixel: {
        settings: {
          accountID: shopId
        }
      }
    };
    
    logger.info(`Creating Web Pixel with account ID: ${shopId}`);
    
    // Install the Web Pixel using the Shopify client
    const result = await shopify.graphql(webPixelCreateMutation, webPixelVariables);
    
    logger.info(`Web Pixel creation result:`, result);
    
    // Check for GraphQL errors
    if (result.data?.webPixelCreate?.userErrors && result.data.webPixelCreate.userErrors.length > 0) {
      const errors = result.data.webPixelCreate.userErrors;
      logger.error(`Web Pixel creation failed with errors:`, errors);
      
      return {
        success: false,
        errors: errors,
        shopId: shopId,
        shopName: shop.name,
        message: `Failed to create Web Pixel: ${errors.map(e => e.message).join(', ')}`
      };
    }
    
    const webPixel = result.data?.webPixelCreate?.webPixel;
    
    if (!webPixel) {
      logger.error(`Web Pixel creation returned no pixel data`);
      return {
        success: false,
        shopId: shopId,
        shopName: shop.name,
        message: "Web Pixel creation returned no pixel data",
        fullResult: result
      };
    }
    
    logger.info(`Successfully created Web Pixel with ID: ${webPixel.id}`);
    
    return {
      success: true,
      shopId: shopId,
      shopName: shop.name,
      webPixelId: webPixel.id,
      webPixelSettings: webPixel.settings,
      collectorUrl: collectorUrl,
      message: `Successfully installed Web Pixel on shop ${shop.name}`
    };
    
  } catch (error) {
    logger.error(`Failed to install Web Pixel for shop ${shopId}:`, error);
    
    // Return error details for debugging instead of throwing
    return {
      success: false,
      shopId: shopId,
      error: error.message,
      stack: error.stack,
      message: `Failed to install Web Pixel for shop ${shopId}: ${error.message}`
    };
  }
};

export const params = {
  shopId: { type: "string", required: true }
};

export const options: ActionOptions = {
  returnType: true,
  timeoutMS: 60000 // 1 minute timeout
};
