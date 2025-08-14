import { useParams, Link, useNavigate } from "@remix-run/react";
import { useFindOne } from "@gadgetinc/react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Badge,
  Box,
  Divider,
  Spinner,
} from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import { api } from "../api";

export default function CheckoutDetail() {
  const params = useParams();
  const checkoutId = params.id!;
  const navigate = useNavigate();

  const [{ data: checkout, fetching, error }] = useFindOne(api.shopifyCheckout, checkoutId, {
    select: {
      id: true,
      email: true,
      totalPrice: true,
      currency: true,
      createdAt: true,
      completedAt: true,
      processingStatus: true,
      customerLocale: true,
      phone: true,
      name: true,
      buyerAcceptsMarketing: true,
      token: true,
    },
  });

  if (fetching) {
    return (
      <Box padding="400">
        <InlineStack gap="200" align="center">
          <Spinner size="small" />
          <Text as="span" variant="bodyMd">
            Loading checkout details...
          </Text>
        </InlineStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding="400">
        <Card>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">
              Error Loading Checkout
            </Text>
            <Text as="p" variant="bodyMd" tone="critical">
              {error.toString()}
            </Text>
            <Button
              onClick={() => navigate('/checkouts')}
              icon={ArrowLeftIcon}
              variant="primary"
            >
              Back to Checkouts
            </Button>
          </BlockStack>
        </Card>
      </Box>
    );
  }

  if (!checkout) {
    return (
      <Box padding="400">
        <Card>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">
              Checkout Not Found
            </Text>
            <Text as="p" variant="bodyMd">
              The checkout with ID {checkoutId} could not be found.
            </Text>
            <Button
              onClick={() => navigate('/checkouts')}
              icon={ArrowLeftIcon}
              variant="primary"
            >
              Back to Checkouts
            </Button>
          </BlockStack>
        </Card>
      </Box>
    );
  }

  const formatCurrency = (amount: string | null | undefined, currency: string | null | undefined) => {
    if (!amount || amount === "") return "N/A";
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(parsedAmount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || dateString === "") return "N/A";
    
    // Type guard for date validation
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    
    return date.toLocaleString();
  };

  const getProcessingStatusBadge = (status: string | null | undefined) => {
    const statusMap: Record<string, "success" | "attention" | "info"> = {
      complete: "success",
      processing: "attention",
      pending: "info",
    };
    
    if (!status || status === "") {
      return (
        <Badge tone="info">
          Unknown
        </Badge>
      );
    }
    
    return (
      <Badge tone={statusMap[status] || "info"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Box padding="400">
      <BlockStack gap="400">
        {/* Header with back button */}
        <InlineStack gap="200" align="start">
          <Button
            onClick={() => navigate('/checkouts')}
            icon={ArrowLeftIcon}
            variant="tertiary"
          >
            Back to Checkouts
          </Button>
        </InlineStack>

        {/* Main checkout information */}
        <Card>
          <BlockStack gap="400">
            <InlineStack gap="400" align="space-between" blockAlign="start">
              <BlockStack gap="200">
                <Text as="h1" variant="headingLg">
                  Checkout Details
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  ID: {checkout.id}
                </Text>
              </BlockStack>
              {checkout.processingStatus && (
                <div>{getProcessingStatusBadge(checkout.processingStatus)}</div>
              )}
            </InlineStack>

            <Divider />

            {/* Customer Information */}
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Customer Information
              </Text>
              <BlockStack gap="200">
                {checkout.email && (
                  <InlineStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Email:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.email}
                    </Text>
                  </InlineStack>
                )}
                {checkout.phone && (
                  <InlineStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Phone:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.phone}
                    </Text>
                  </InlineStack>
                )}
                {checkout.name && (
                  <InlineStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Name:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.name}
                    </Text>
                  </InlineStack>
                )}
                {checkout.customerLocale && (
                  <InlineStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Locale:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.customerLocale}
                    </Text>
                  </InlineStack>
                )}
              </BlockStack>
            </BlockStack>

            <Divider />

            {/* Order Summary */}
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Order Summary
              </Text>
              <BlockStack gap="200">
                {checkout.totalPrice && (
                  <InlineStack gap="200" align="space-between">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Total:
                    </Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {formatCurrency(checkout.totalPrice, checkout.currency)}
                    </Text>
                  </InlineStack>
                )}
                {checkout.currency && (
                  <InlineStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Currency:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.currency}
                    </Text>
                  </InlineStack>
                )}
              </BlockStack>
            </BlockStack>

            <Divider />

            {/* Additional Details */}
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Additional Details
              </Text>
              <BlockStack gap="200">
                <InlineStack gap="200">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    Created:
                  </Text>
                  <Text as="span" variant="bodyMd">
                    {formatDate(checkout.createdAt)}
                  </Text>
                </InlineStack>
                {checkout.completedAt && (
                  <InlineStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Completed:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {formatDate(checkout.completedAt)}
                    </Text>
                  </InlineStack>
                )}

                {checkout.token && (
                  <InlineStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Token:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.token}
                    </Text>
                  </InlineStack>
                )}
                {checkout.buyerAcceptsMarketing !== null && (
                  <InlineStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Accepts Marketing:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.buyerAcceptsMarketing ? "Yes" : "No"}
                    </Text>
                  </InlineStack>
                )}
              </BlockStack>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Box>
  );
}