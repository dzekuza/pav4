export const run: ActionRun = async ({ params, logger, api, connections }) => {
  logger.info("Starting testCollector action");

  try {
    // Get the current shop ID from connections
    const shopId = connections.shopify.currentShopId;
    
    // Create test event data with proper parameter structure
    const testEventData = {
      eventType: "page_view",
      sessionId: "test_session_123",
      path: "/test-page",
      occurredAt: new Date(),
      userAgent: "Test Browser",
      shop: {
        _link: shopId
      },
      rawData: {
        test: true,
        page: {
          title: "Test Page",
          url: "/test-page"
        },
        timestamp: new Date().toISOString(),
        source: "testCollector"
      }
    };

    logger.info("Test event data created:", testEventData);

    // Call the event.create action with proper parameter structure
    const result = await api.event.create(testEventData);

    logger.info("Event created successfully:", { id: result.id });

    return {
      success: true,
      message: "Test event created successfully",
      eventId: result.id,
      eventData: testEventData
    };

  } catch (error) {
    logger.error("Error in testCollector:", error);

    // Properly handle unknown error type
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: "Failed to create test event",
      error: errorMessage
    };
  }
};
