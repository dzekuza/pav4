export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const { shopId } = params;
  
  try {
    logger.info("Starting Web Pixel installation test for shop: " + shopId);
    
    // Get the Shopify client for the specified shop
    const shopify = await connections.shopify.forShopId(shopId);
    
    if (!shopify) {
      throw new Error("Failed to get Shopify client for shop ID: " + shopId);
    }
    
    // Create a basic Web Pixel with minimal settings
    const webPixelMutation = `
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
    
    const variables = {
      webPixel: {
        settings: {
          accountID: "test-account-id"
        }
      }
    };
    
    logger.info("Sending Web Pixel creation request to Shopify");
    
    const response = await shopify.graphql(webPixelMutation, variables);
    
    if (response.webPixelCreate.userErrors && response.webPixelCreate.userErrors.length > 0) {
      const errors = response.webPixelCreate.userErrors;
      logger.error("Shopify returned user errors: " + JSON.stringify(errors));
      return {
        success: false,
        error: "Shopify user errors",
        details: errors,
        shopId: shopId
      };
    }
    
    const webPixel = response.webPixelCreate.webPixel;
    
    if (!webPixel) {
      logger.error("No Web Pixel returned from Shopify");
      return {
        success: false,
        error: "No Web Pixel created",
        shopId: shopId
      };
    }
    
    logger.info("Successfully created Web Pixel with ID: " + webPixel.id);
    
    return {
      success: true,
      webPixelId: webPixel.id,
      settings: webPixel.settings,
      shopId: shopId,
      message: "Web Pixel created successfully"
    };
    
  } catch (error) {
    logger.error("Error during Web Pixel installation test: " + error.message);
    return {
      success: false,
      error: error.message,
      shopId: shopId
    };
  }
};

export const params = {
  shopId: {
    type: "string"
  }
};
