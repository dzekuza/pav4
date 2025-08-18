import { useFindMany } from "@gadgetinc/react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Layout,
  Page,
  Text,
} from "@shopify/polaris";
import { api } from "../api";

export default function Index() {
  const [{ data: events, fetching: eventsFetching, error: eventsError }] = useFindMany(api.event, { first: 250 });
  const [{ data: orders, fetching: ordersFetching, error: ordersError }] = useFindMany(api.order, { first: 250 });
  const [{ data: clicks, fetching: clicksFetching, error: clicksError }] = useFindMany(api.click, { first: 250 });
  const [{ data: aggregates, fetching: aggregatesFetching, error: aggregatesError }] = useFindMany(api.aggregate, { first: 250 });

  // Debug logging
  console.log("Events data:", events, "fetching:", eventsFetching, "error:", eventsError);
  console.log("Orders data:", orders, "fetching:", ordersFetching, "error:", ordersError);
  console.log("Clicks data:", clicks, "fetching:", clicksFetching, "error:", clicksError);
  console.log("Aggregates data:", aggregates, "fetching:", aggregatesFetching, "error:", aggregatesError);

  const isLoading = eventsFetching || ordersFetching || clicksFetching || aggregatesFetching;
  const hasErrors = eventsError || ordersError || clicksError || aggregatesError;

  const getDisplayValue = (data: any, fetching: boolean, error: any) => {
    if (error) return "Error";
    if (fetching) return "...";
    return data?.length || 0;
  };

  return (
    <Page title="ipick Tracker - Analytics Overview">
      <Layout>
        {/* Hero Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingLg" as="h1">
                Welcome to ipick Tracker
              </Text>
              <Text variant="bodyMd" as="p">
                Track customer interactions, monitor click-through rates, and analyze order attribution 
                across your Shopify store. Get comprehensive insights into your customers' journey 
                from first click to final purchase.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* KPI Cards */}
        <Layout.Section>
          {hasErrors && (
            <Card tone="critical">
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Error Loading Data
                </Text>
                <Text variant="bodyMd" as="p">
                  {eventsError && `Events: ${eventsError.toString()}`}
                  {ordersError && ` Orders: ${ordersError.toString()}`}
                  {clicksError && ` Clicks: ${clicksError.toString()}`}
                  {aggregatesError && ` Aggregates: ${aggregatesError.toString()}`}
                </Text>
              </BlockStack>
            </Card>
          )}
          <InlineStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Total Events
                </Text>
                <Text variant="heading2xl" as="p">
                  {getDisplayValue(events, eventsFetching, eventsError)}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Customer interactions tracked
                  {events?.length === 250 && " (250+ records)"}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Attributed Orders
                </Text>
                <Text variant="heading2xl" as="p">
                  {getDisplayValue(orders, ordersFetching, ordersError)}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Orders with click attribution
                  {orders?.length === 250 && " (250+ records)"}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Click Tracking
                </Text>
                <Text variant="heading2xl" as="p">
                  {getDisplayValue(clicks, clicksFetching, clicksError)}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Unique clicks tracked
                  {clicks?.length === 250 && " (250+ records)"}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Daily Reports
                </Text>
                <Text variant="heading2xl" as="p">
                  {getDisplayValue(aggregates, aggregatesFetching, aggregatesError)}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Daily aggregate records
                  {aggregates?.length === 250 && " (250+ records)"}
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
          {isLoading && (
            <Card>
              <BlockStack gap="200">
                <Text variant="bodyMd" as="p">
                  Loading analytics data...
                </Text>
              </BlockStack>
            </Card>
          )}
        </Layout.Section>

        {/* Navigation Cards */}
        <Layout.Section>
          <InlineStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  View Events
                </Text>
                <Text variant="bodyMd" as="p">
                  Monitor all customer interactions including page views, product views, 
                  cart additions, and checkout events across your store.
                </Text>
                <Box>
                  <Button variant="primary" size="large">
                    View All Events
                  </Button>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  View Orders
                </Text>
                <Text variant="bodyMd" as="p">
                  Analyze order attribution data to understand which clicks 
                  and interactions led to successful conversions.
                </Text>
                <Box>
                  <Button variant="primary" size="large">
                    View Order Attribution
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <InlineStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  View Clicks
                </Text>
                <Text variant="bodyMd" as="p">
                  Track click-through data including source URLs, destination pages, 
                  IP addresses, and user agents for comprehensive traffic analysis.
                </Text>
                <Box>
                  <Button variant="primary" size="large">
                    View Click Tracking
                  </Button>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  Daily Aggregates
                </Text>
                <Text variant="bodyMd" as="p">
                  Review daily rollup statistics including session counts, 
                  product views, and other key metrics aggregated by date.
                </Text>
                <Box>
                  <Button variant="primary" size="large">
                    View Daily Reports
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
