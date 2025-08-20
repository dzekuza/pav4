import { BlockStack, Card, Page, Text, InlineStack, Box, Badge } from "@shopify/polaris";
import { AutoTable } from "@gadgetinc/react/auto/polaris";
import { useFindMany, useSession } from "@gadgetinc/react";
import { api } from "../api";

export default function Events() {
  // Get current authenticated session and shop
  const session = useSession(api, {
    select: {
      id: true,
      shop: {
        id: true,
        name: true,
        myshopifyDomain: true
      }
    }
  });
  const currentShop = session?.shop;

  // Fetch event data for summary statistics, filtered by current shop
  const [{ data: eventData, fetching: eventsFetching, error: eventsError }] = useFindMany(api.event, {
    first: 250,
    filter: currentShop ? {
      shopId: {
        equals: currentShop.id
      }
    } : undefined,
    select: {
      id: true,
      eventType: true,
      occurredAt: true,
      value: true,
    },
  });

  // Calculate summary statistics
  const totalEvents = eventData?.length || 0;
  const eventTypeBreakdown = eventData?.reduce((acc: Record<string, number>, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {}) || {};

  const totalValue = eventData?.reduce((sum, event) => {
    return sum + (event.value || 0);
  }, 0) || 0;

  const recentEvents = eventData?.filter(event => {
    const eventDate = new Date(event.occurredAt);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return eventDate > oneDayAgo;
  }).length || 0;

  // Handle authentication and loading states
  if (!session || !currentShop) {
    return (
      <Page title="Event Tracking">
        <Card>
          <Text as="p" variant="bodyMd">
            Loading shop data...
          </Text>
        </Card>
      </Page>
    );
  }

  if (eventsError) {
    return (
      <Page title="Event Tracking">
        <Card>
          <Text as="p" variant="bodyMd">
            Error loading event data: {eventsError.toString()}
          </Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Event Tracking">
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Customer Behavior Analytics
            </Text>
            <Text as="p" variant="bodyMd">
              Track and analyze customer interactions across your store to understand behavior patterns and optimize the customer experience.
            </Text>
            <Box paddingBlockStart="200">
              <Text as="p" variant="bodyMd">
                Showing data for: <strong>{currentShop.name}</strong> ({currentShop.myshopifyDomain})
              </Text>
            </Box>
          </BlockStack>
        </Card>

        {/* Summary Statistics */}
        <InlineStack gap="400">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Total Events</Text>
              {eventsFetching ? (
                <Text as="p" variant="bodyMd">Loading...</Text>
              ) : (
                <Text as="p" variant="headingLg">{totalEvents.toLocaleString()}</Text>
              )}
            </BlockStack>
          </Card>
          
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Recent Activity (24h)</Text>
              {eventsFetching ? (
                <Text as="p" variant="bodyMd">Loading...</Text>
              ) : (
                <Text as="p" variant="headingLg">{recentEvents.toLocaleString()}</Text>
              )}
            </BlockStack>
          </Card>
          
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Total Value</Text>
              {eventsFetching ? (
                <Text as="p" variant="bodyMd">Loading...</Text>
              ) : (
                <Text as="p" variant="headingLg">${totalValue.toFixed(2)}</Text>
              )}
            </BlockStack>
          </Card>
        </InlineStack>

        {/* Event Types Breakdown */}
        {!eventsFetching && Object.keys(eventTypeBreakdown).length > 0 && (
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Event Types</Text>
              <InlineStack gap="200" wrap={false}>
                {Object.entries(eventTypeBreakdown).map(([eventType, count]) => (
                  <Badge key={eventType}>
                    {eventType}: {count}
                  </Badge>
                ))}
              </InlineStack>
            </BlockStack>
          </Card>
        )}

        <Card>
          <AutoTable
            model={api.event}
            live={true}
            filter={currentShop ? {
              shopId: {
                equals: currentShop.id
              }
            } : undefined}
            columns={[
              {
                header: "Event Type",
                field: "eventType"
              },
              {
                header: "Occurred At",
                render: ({ record }) => {
                  const date = new Date(record.occurredAt);
                  return (
                    <Text as="span" variant="bodyMd">
                      {date.toLocaleDateString()} {date.toLocaleTimeString()}
                    </Text>
                  );
                }
              },
              {
                header: "Session ID",
                render: ({ record }) => (
                  <Text as="span" variant="bodyMd">
                    {record.sessionId ? record.sessionId.substring(0, 8) + "..." : "-"}
                  </Text>
                )
              },
              {
                header: "Path",
                field: "path"
              },
              {
                header: "Click Attribution",
                render: ({ record }) => (
                  <Text as="span" variant="bodyMd">
                    {record.click ? `Click ID: ${record.click.clickId || record.click.id}` : "-"}
                  </Text>
                )
              },
              {
                header: "Shop",
                field: "shop.name"
              },
              {
                header: "Product",
                render: ({ record }) => (
                  <Text as="span" variant="bodyMd">
                    {record.productId ? `Product: ${record.productId}` : "-"}
                  </Text>
                )
              },
              {
                header: "Variant",
                render: ({ record }) => (
                  <Text as="span" variant="bodyMd">
                    {record.variantId ? `Variant: ${record.variantId}` : "-"}
                  </Text>
                )
              },
              {
                header: "Value",
                render: ({ record }) => (
                  <Text as="span" variant="bodyMd">
                    {record.value ? `$${record.value.toFixed(2)}` : "-"}
                  </Text>
                )
              },
              {
                header: "Quantity",
                render: ({ record }) => (
                  <Text as="span" variant="bodyMd">
                    {record.quantity || "-"}
                  </Text>
                )
              },
              {
                header: "User Agent",
                render: ({ record }) => {
                  if (!record.userAgent) return <Text as="span" variant="bodyMd">-</Text>;
                  
                  // Extract browser info from user agent
                  const userAgent = record.userAgent;
                  let browserInfo = "Unknown";
                  
                  if (userAgent.includes("Chrome")) browserInfo = "Chrome";
                  else if (userAgent.includes("Firefox")) browserInfo = "Firefox";
                  else if (userAgent.includes("Safari")) browserInfo = "Safari";
                  else if (userAgent.includes("Edge")) browserInfo = "Edge";
                  
                  return (
                    <Text as="span" variant="bodyMd">
                      {browserInfo}
                    </Text>
                  );
                }
              }
            ]}
          />
        </Card>
      </BlockStack>
    </Page>
  );
}