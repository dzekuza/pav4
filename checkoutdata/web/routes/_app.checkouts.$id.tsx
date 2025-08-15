import { useParams, Link, useNavigate } from "@remix-run/react";
import { useFindOne } from "@gadgetinc/react";
import { useGadget } from "@gadgetinc/react-shopify-app-bridge";
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
  Banner,
} from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import { api } from "../api";
import { useEffect, useState } from "react";

export default function CheckoutDetail() {
  const params = useParams();
  const checkoutId = params.id!;
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, error: authError } = useGadget();
  const [checkoutStatus, setCheckoutStatus] = useState<{
    status: string;
    tone: 'success' | 'info' | 'critical';
  } | null>(null);

  // Debug logging for authentication and data fetching (without timestamps)
  useEffect(() => {
    console.log('🔍 Checkout Detail Debug:', {
      checkoutId,
      isAuthenticated,
      authLoading,
      authError: authError?.message
    });
  }, [checkoutId, isAuthenticated, authLoading, authError]);

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
      sourceUrl: true,
      sourceName: true,
      sourceIdentifier: true,
    },
  });

  // Calculate checkout status on client-side to avoid hydration mismatch
  useEffect(() => {
    if (checkout) {
      const getCheckoutStatus = () => {
        if (checkout.completedAt) {
          return { status: 'Completed', tone: 'success' as const };
        }
        if (checkout.processingStatus === 'complete') {
          return { status: 'Completed', tone: 'success' as const };
        }
        if (checkout.processingStatus === 'processing') {
          return { status: 'In Progress', tone: 'info' as const };
        }
        // If created more than 24 hours ago and not completed, consider abandoned
        if (checkout.createdAt && typeof checkout.createdAt === 'string') {
          try {
            const createdAt = new Date(checkout.createdAt);
            const hoursOld = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursOld > 24) {
              return { status: 'Abandoned', tone: 'critical' as const };
            }
          } catch (error) {
            console.error('Error parsing checkout creation date:', error);
          }
        }
        return { status: 'In Progress', tone: 'info' as const };
      };
      
      setCheckoutStatus(getCheckoutStatus());
    }
  }, [checkout]);

  // Authentication error handling
  if (authError) {
    return (
      <Box padding="400">
        <Card>
          <Banner tone="critical" title="Authentication Error">
            <p>Failed to authenticate with Shopify: {authError.message}</p>
            <p>This may be due to the Shopify App Bridge context being lost during navigation.</p>
            <Button onClick={() => window.location.reload()}>
              Retry Authentication
            </Button>
          </Banner>
        </Card>
      </Box>
    );
  }

  // Authentication loading
  if (authLoading) {
    return (
      <Box padding="400">
        <InlineStack gap="200" align="center">
          <Spinner size="small" />
          <Text as="span" variant="bodyMd">
            Loading authentication...
          </Text>
        </InlineStack>
      </Box>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Box padding="400">
        <Card>
          <Banner tone="warning" title="Authentication Required">
            <p>You need to be authenticated to view checkout details.</p>
            <p>Redirecting to main app...</p>
          </Banner>
        </Card>
      </Box>
    );
  }

  // Data fetching loading
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

  // Data fetching error
  if (error) {
    return (
      <Box padding="400">
        <Card>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">
              Error Loading Checkout
            </Text>
            <Banner tone="critical" title="Data Fetching Error">
              <p>Failed to load checkout data: {error.toString()}</p>
              <p>This could be due to:</p>
              <ul>
                <li>Authentication issues</li>
                <li>Network connectivity problems</li>
                <li>Checkout ID not found</li>
                <li>API permissions</li>
              </ul>
            </Banner>
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

  // Checkout not found
  if (!checkout) {
    return (
      <Box padding="400">
        <Card>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">
              Checkout Not Found
            </Text>
            <Banner tone="warning" title="Checkout Not Found">
              <p>The checkout with ID {checkoutId} could not be found.</p>
              <p>This could be due to:</p>
              <ul>
                <li>Invalid checkout ID</li>
                <li>Checkout was deleted</li>
                <li>Access permissions</li>
              </ul>
            </Banner>
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
    if (!amount || !currency) return 'N/A';
    
    try {
      const numericAmount = parseFloat(amount);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(numericAmount);
    } catch {
      return `${amount} ${currency}`;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <Box padding="400">
      <BlockStack gap="500">
        {/* Header */}
        <Card>
          <BlockStack gap="400">
            <InlineStack gap="200" align="center">
              <Button
                onClick={() => navigate('/checkouts')}
                icon={ArrowLeftIcon}
                variant="plain"
              />
              <Text as="h1" variant="headingLg">
                Checkout Details
              </Text>
            </InlineStack>
            
            <InlineStack gap="200" align="center">
              <div suppressHydrationWarning>
                {checkoutStatus ? (
                  <Badge tone={checkoutStatus.tone}>{checkoutStatus.status}</Badge>
                ) : (
                  <Badge tone="info">Loading...</Badge>
                )}
              </div>
              <Text as="span" variant="bodyMd">
                ID: {checkout.id}
              </Text>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Customer Information */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Customer Information
            </Text>
            <Divider />
            <InlineStack gap="400" wrap={false}>
              <BlockStack gap="200">
                <Text as="span" variant="bodyMd" fontWeight="medium">
                  Name
                </Text>
                <Text as="span" variant="bodyMd">
                  {checkout.name || 'N/A'}
                </Text>
              </BlockStack>
              <BlockStack gap="200">
                <Text as="span" variant="bodyMd" fontWeight="medium">
                  Email
                </Text>
                <Text as="span" variant="bodyMd">
                  {checkout.email || 'N/A'}
                </Text>
              </BlockStack>
              <BlockStack gap="200">
                <Text as="span" variant="bodyMd" fontWeight="medium">
                  Phone
                </Text>
                <Text as="span" variant="bodyMd">
                  {checkout.phone || 'N/A'}
                </Text>
              </BlockStack>
              <BlockStack gap="200">
                <Text as="span" variant="bodyMd" fontWeight="medium">
                  Locale
                </Text>
                <Text as="span" variant="bodyMd">
                  {checkout.customerLocale || 'N/A'}
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Financial Information */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Financial Information
            </Text>
            <Divider />
            <InlineStack gap="400" wrap={false}>
              <BlockStack gap="200">
                <Text as="span" variant="bodyMd" fontWeight="medium">
                  Total Price
                </Text>
                <Text as="span" variant="bodyMd">
                  {formatCurrency(checkout.totalPrice, checkout.currency)}
                </Text>
              </BlockStack>
              <BlockStack gap="200">
                <Text as="span" variant="bodyMd" fontWeight="medium">
                  Marketing Consent
                </Text>
                <Badge tone={checkout.buyerAcceptsMarketing ? 'success' : 'info'}>
                  {checkout.buyerAcceptsMarketing ? 'Accepts Marketing' : 'No Marketing'}
                </Badge>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Timeline */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Timeline
            </Text>
            <Divider />
            <BlockStack gap="200">
              <InlineStack gap="200" align="center">
                <Text as="span" variant="bodyMd" fontWeight="medium">
                  Created:
                </Text>
                <Text as="span" variant="bodyMd">
                  {formatDate(checkout.createdAt)}
                </Text>
              </InlineStack>
              {checkout.completedAt && (
                <InlineStack gap="200" align="center">
                  <Text as="span" variant="bodyMd" fontWeight="medium">
                    Completed:
                  </Text>
                  <Text as="span" variant="bodyMd">
                    {formatDate(checkout.completedAt)}
                  </Text>
                </InlineStack>
              )}
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Referral Information */}
        {(checkout.sourceUrl || checkout.sourceName || checkout.sourceIdentifier) && (
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Referral Information
              </Text>
              <Divider />
              <BlockStack gap="200">
                {checkout.sourceUrl && (
                  <InlineStack gap="200" align="center">
                    <Text as="span" variant="bodyMd" fontWeight="medium">
                      Source URL:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.sourceUrl}
                    </Text>
                  </InlineStack>
                )}
                {checkout.sourceName && (
                  <InlineStack gap="200" align="center">
                    <Text as="span" variant="bodyMd" fontWeight="medium">
                      Source Name:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.sourceName}
                    </Text>
                  </InlineStack>
                )}
                {checkout.sourceIdentifier && (
                  <InlineStack gap="200" align="center">
                    <Text as="span" variant="bodyMd" fontWeight="medium">
                      Source ID:
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {checkout.sourceIdentifier}
                    </Text>
                  </InlineStack>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Box>
  );
}