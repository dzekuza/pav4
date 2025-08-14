import { AutoTable } from "@gadgetinc/react/auto/polaris";
import { Page, Card, BlockStack, Text } from "@shopify/polaris";
import { Link } from "@remix-run/react";
import { api } from "../api";

export default function CheckoutsIndex() {
  return (
    <Page fullWidth>
      <BlockStack gap="500">
        <Text as="h1" variant="headingXl">
          Checkouts
        </Text>
        
        <Card>
          <AutoTable
            model={api.shopifyCheckout}
            columns={[
              "id",
              "email", 
              "totalPrice",
              "createdAt",
              "processingStatus",
              "completedAt"
            ]}
            onClick={(record) => {
              // Navigate to individual checkout detail page
              window.location.href = `/checkouts/${record.id}`;
            }}
          />
        </Card>
      </BlockStack>
    </Page>
  );
}