import { RouteHandler } from "gadget-server";

const route: RouteHandler<{ Body: { shopId: string } }> = async ({ request, reply, api, logger }) => {
  try {
    const { shopId } = request.body;
    
    logger.info("Starting force Web Pixel installation", { shopId });

    // Call the forceInstallWebPixel global action
    const result = await api.forceInstallWebPixel({ shopId });
    
    logger.info("Force Web Pixel installation completed", { 
      shopId, 
      success: result.success,
      hasErrors: result.errors?.length > 0
    });

    // Return the result as JSON
    await reply.send({
      success: result.success,
      result: result.result,
      errors: result.errors
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error("Error during force Web Pixel installation", { 
      error: errorMessage,
      shopId: request.body?.shopId 
    });

    await reply.code(500).send({
      success: false,
      error: "Internal server error",
      message: errorMessage
    });
  }
};

// Set route options with JSON schema validation
route.options = {
  schema: {
    body: {
      type: "object",
      properties: {
        shopId: { type: "string" }
      },
      required: ["shopId"]
    }
  }
};

export default route;