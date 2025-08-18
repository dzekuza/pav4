export const run: ActionRun = async ({ params, logger, api, connections }) => {
  logger.info("Starting testCollector action");

  try {
    // Create test event data
    const testEventData = {
      eventType: "page_view" as const,
      sessionId: "test_session_123",
      path: "/test-page",
      occurredAt: new Date(),
      userAgent: "Test Browser",
      shop: {
        _link: "75941839177"
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

    // Call the event.create action directly
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

    return {
      success: false,
      message: "Failed to create test event",
      error: error.message
    };
  }
};
