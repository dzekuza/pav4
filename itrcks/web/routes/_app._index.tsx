import { useFindMany, useFindFirst } from "@gadgetinc/react";
import { useGadget } from "@gadgetinc/react-shopify-app-bridge";
import { useNavigate } from "@remix-run/react";
import {
  Badge,
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
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useGadget();
  const [{ data: shop, fetching: shopFetching, error: shopError }] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      name: true,
      domain: true,
      myshopifyDomain: true,
      createdAt: true,
      shopifyCreatedAt: true,
      planDisplayName: true,
    },
  });
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

  const getConnectionStatus = () => {
    if (authLoading || shopFetching) {
      return {
        badge: <Badge tone="info">Loading</Badge>,
        title: "Checking Connection...",
        message: "Verifying your Shopify connection status.",
      };
    }

    if (shopError) {
      return {
        badge: <Badge tone="critical">Error</Badge>,
        title: "Connection Error",
        message: `Unable to verify connection: ${shopError.message}`,
      };
    }

    if (!isAuthenticated || !shop) {
      return {
        badge: <Badge tone="critical">Disconnected</Badge>,
        title: "Not Connected to Shopify",
        message: "Your app is not properly connected to Shopify. Please reinstall the app or contact support if this issue persists.",
      };
    }

    return {
      badge: <Badge tone="success">Connected</Badge>,
      title: "Connected to Shopify",
      message: `Successfully connected to ${shop.name || shop.myshopifyDomain}`,
      shop: shop,
    };
  };

  const connectionStatus = getConnectionStatus();

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

        {/* Connection Status Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="space-between">
                <InlineStack gap="300" align="start">
                  <Text variant="headingMd" as="h2">
                    Shopify Connection Status
                  </Text>
                  {connectionStatus.badge}
                </InlineStack>
              </InlineStack>
              
              <BlockStack gap="300">
                <Text variant="bodyLg" as="p">
                  {connectionStatus.title}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  {connectionStatus.message}
                </Text>
                
                {connectionStatus.shop && (
                  <BlockStack gap="200">
                    <InlineStack gap="400">
                      <Box>
                        <Text variant="bodySm" as="p">
                          <strong>Shop:</strong> {connectionStatus.shop.name || 'N/A'}
                        </Text>
                      </Box>
                      <Box>
                        <Text variant="bodySm" as="p">
                          <strong>Domain:</strong> {connectionStatus.shop.domain || connectionStatus.shop.myshopifyDomain || 'N/A'}
                        </Text>
                      </Box>
                      <Box>
                        <Text variant="bodySm" as="p">
                          <strong>Plan:</strong> {connectionStatus.shop.planDisplayName || 'N/A'}
                        </Text>
                      </Box>
                    </InlineStack>
                    <InlineStack gap="400">
                      <Box>
                        <Text variant="bodySm" as="p">
                          <strong>Shop ID:</strong> {connectionStatus.shop.id}
                        </Text>
                      </Box>
                      <Box>
                        <Text variant="bodySm" as="p">
                          <strong>Connected:</strong> {connectionStatus.shop.createdAt ? new Date(connectionStatus.shop.createdAt).toLocaleDateString() : 'N/A'}
                        </Text>
                      </Box>
                    </InlineStack>
                  </BlockStack>
                )}
                
                {(!isAuthenticated || !shop) && !authLoading && !shopFetching && (
                  <Box>
                    <Text variant="bodySm" as="p" tone="subdued">
                      <strong>Troubleshooting:</strong> If you're seeing this message, try refreshing the page or reinstalling the app from your Shopify admin. 
                      Make sure you're accessing this app from within your Shopify admin panel.
                    </Text>
                  </Box>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* KPI Cards */}
        <Layout.Section>
          {hasErrors && (
            <Card>
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
                  <Button 
                    variant="primary" 
                    size="large"
                    onClick={() => navigate("/events")}
                  >
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
                  <Button 
                    variant="primary" 
                    size="large"
                    onClick={() => navigate("/orders")}
                  >
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
                  <Button 
                    variant="primary" 
                    size="large"
                    onClick={() => navigate("/clicks")}
                  >
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
                  <Button 
                    variant="primary" 
                    size="large"
                    onClick={() => navigate("/reports")}
                  >
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
