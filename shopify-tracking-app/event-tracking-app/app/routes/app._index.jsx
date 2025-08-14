import { useEffect } from "react";
import {
  Page,
  Layout,
  LegacyCard,
  Button,
  BlockStack,
  Box,
  Text,
  InlineStack,
  Badge,
  Banner,
  CalloutCard,
  Icon,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { CheckmarkIcon, AnalyticsIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const shopify = useAppBridge();

  return (
    <>
      <TitleBar title="Event Tracking App" />
      <Page>
        <Layout>
          <Layout.Section>
            <Banner
              title="✅ Event Tracking Successfully Installed"
              tone="success"
              icon={CheckmarkIcon}
            >
              <p>Your store is now connected to ipick.io for event tracking and analytics.</p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <LegacyCard>
              <BlockStack gap="400">
                <Box padding="400">
                  <Text variant="headingMd" as="h2">
                    What's Happening Now
                  </Text>
                  <BlockStack gap="300">
                    <InlineStack align="start" gap="300">
                      <Icon source={CheckmarkIcon} tone="success" />
                      <Text as="p">Order completion events are being tracked</Text>
                    </InlineStack>
                    <InlineStack align="start" gap="300">
                      <Icon source={CheckmarkIcon} tone="success" />
                      <Text as="p">Revenue data is being collected</Text>
                    </InlineStack>
                    <InlineStack align="start" gap="300">
                      <Icon source={CheckmarkIcon} tone="success" />
                      <Text as="p">Product purchase analytics are active</Text>
                    </InlineStack>
                  </BlockStack>
                </Box>
              </BlockStack>
            </LegacyCard>
          </Layout.Section>

          <Layout.Section>
            <CalloutCard
              title="View Your Analytics"
              illustration="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              primaryAction={{
                content: "Go to ipick.io Dashboard",
                url: "https://pavlo4.netlify.app/",
                external: true,
              }}
              secondaryAction={{
                content: "Learn More",
                url: "https://ipick.io",
                external: true,
              }}
            >
              <p>
                Access your business analytics, revenue tracking, and customer insights 
                on your ipick.io dashboard. All data is automatically synced from your store.
              </p>
            </CalloutCard>
          </Layout.Section>

          <Layout.Section>
            <LegacyCard>
              <BlockStack gap="400">
                <Box padding="400">
                  <Text variant="headingMd" as="h2">
                    Domain Verification
                  </Text>
                  <Text as="p">
                    To complete setup, verify your domain in your ipick.io dashboard. 
                    This ensures secure data transmission between your store and analytics platform.
                  </Text>
                  <Box paddingBlockStart="400">
                    <Button
                      primary
                      url="https://pavlo4.netlify.app/business/dashboard"
                      external
                    >
                      Complete Domain Verification
                    </Button>
                  </Box>
                </Box>
              </BlockStack>
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}
