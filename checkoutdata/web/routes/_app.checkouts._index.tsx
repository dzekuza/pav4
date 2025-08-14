import { AutoTable } from "@gadgetinc/react/auto/polaris";
import { Page, Card, BlockStack, Text, Badge, InlineStack, Tooltip } from "@shopify/polaris";
import { Link } from "@remix-run/react";
import { api } from "../api";

export default function CheckoutsIndex() {
  const formatDuration = (startDate: string, endDate?: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    }
    return `${diffHours}h`;
  };

  const getCheckoutStatus = (record: any) => {
    if (record.completedAt) {
      return { status: 'Completed', tone: 'success' as const };
    }
    if (record.processingStatus === 'complete') {
      return { status: 'Completed', tone: 'success' as const };
    }
    if (record.processingStatus === 'processing') {
      return { status: 'In Progress', tone: 'info' as const };
    }
    // If created more than 24 hours ago and not completed, consider abandoned
    const createdAt = record.createdAt ? new Date(record.createdAt as string) : new Date();
    const hoursOld = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 24) {
      return { status: 'Abandoned', tone: 'critical' as const };
    }
    return { status: 'In Progress', tone: 'info' as const };
  };

  const getReferralSourceInfo = (record: any) => {
    const sourceUrl = record.sourceUrl as string;
    const sourceName = record.sourceName as string;
    const sourceIdentifier = record.sourceIdentifier as string;

    // Enhanced pavlo4 referral detection - check for multiple variations
    const isPavloReferral = (url: string) => {
      if (!url) return false;
      const lowerUrl = url.toLowerCase();
      return lowerUrl.includes('pavl4') || 
             lowerUrl.includes('pavlo4') || 
             lowerUrl.includes('pavlo4.netlify.app') ||
             lowerUrl.includes('pavl4.netlify.app');
    };

    // Check for pavlo4 referral with enhanced detection
    if (sourceUrl && isPavloReferral(sourceUrl)) {
      return {
        text: 'Pavlo4 Price Comparison',
        tone: 'attention' as const,
        isPavlo: true,
        rawUrl: sourceUrl,
        debugInfo: `Detected from URL: ${sourceUrl}`
      };
    }

    // If we have source information, show it
    if (sourceName) {
      return {
        text: sourceName,
        tone: 'info' as const,
        isPavlo: false,
        rawUrl: sourceUrl || 'N/A',
        debugInfo: `Source Name: ${sourceName}, URL: ${sourceUrl || 'None'}, Identifier: ${sourceIdentifier || 'None'}`
      };
    }

    if (sourceUrl) {
      try {
        const url = new URL(sourceUrl);
        return {
          text: url.hostname,
          tone: 'info' as const,
          isPavlo: false,
          rawUrl: sourceUrl,
          debugInfo: `Hostname from URL: ${url.hostname}, Full URL: ${sourceUrl}`
        };
      } catch {
        return {
          text: sourceUrl,
          tone: 'info' as const,
          isPavlo: false,
          rawUrl: sourceUrl,
          debugInfo: `Invalid URL format: ${sourceUrl}`
        };
      }
    }

    if (sourceIdentifier) {
      return {
        text: sourceIdentifier,
        tone: 'info' as const,
        isPavlo: false,
        rawUrl: 'N/A',
        debugInfo: `Source Identifier: ${sourceIdentifier}, No URL or Name available`
      };
    }

    // No source information available
    return {
      text: 'Direct',
      tone: 'info' as const,
      isPavlo: false,
      rawUrl: 'N/A',
      debugInfo: 'No source information available (direct traffic)'
    };
  };

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
              "currency",
              "phone",
              "name",
              "token",
              "createdAt",
              "completedAt",
              "sourceUrl",
              "sourceName", 
              "sourceIdentifier",
              {
                header: "Checkout Status",
                render: ({ record }) => {
                  const { status, tone } = getCheckoutStatus(record);
                  return <Badge tone={tone}>{status}</Badge>;
                }
              },
              {
                header: "Duration",
                render: ({ record }) => {
                  const duration = formatDuration(
                    record.createdAt as string, 
                    record.completedAt as string | null
                  );
                  return <Text as="span" variant="bodyMd">{duration}</Text>;
                }
              },
              {
                header: "Customer Info",
                render: ({ record }) => {
                  const name = (record.name as string) || 'N/A';
                  const locale = (record.customerLocale as string) || 'N/A';
                  return (
                    <BlockStack gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="medium">{name}</Text>
                      <Text as="span" variant="bodySm" tone="disabled">{locale}</Text>
                    </BlockStack>
                  );
                }
              },
              {
                header: "Marketing Status", 
                render: ({ record }) => {
                  const accepts = record.buyerAcceptsMarketing as boolean;
                  return (
                    <Badge tone={accepts ? 'success' : 'info'}>
                      {accepts ? 'Accepts Marketing' : 'No Marketing'}
                    </Badge>
                  );
                }
              },
              {
                header: "Referral Source",
                render: ({ record }) => {
                  const { text, tone, isPavlo, rawUrl, debugInfo } = getReferralSourceInfo(record);
                  return (
                    <BlockStack gap="100">
                      <InlineStack gap="200" align="start">
                        <Tooltip content={debugInfo}>
                          <Badge tone={tone}>{text}</Badge>
                        </Tooltip>
                        {isPavlo && (
                          <Badge tone="warning" size="small">⭐ Pavlo4</Badge>
                        )}
                      </InlineStack>
                      {rawUrl && rawUrl !== 'N/A' && (
                        <Text as="span" variant="bodySm" tone="subdued">
                          URL: {rawUrl.length > 50 ? `${rawUrl.substring(0, 50)}...` : rawUrl}
                        </Text>
                      )}
                    </BlockStack>
                  );
                }
              },
              {
                header: "Debug: Full Source URL",
                render: ({ record }) => {
                  const sourceUrl = record.sourceUrl as string;
                  const sourceName = record.sourceName as string;
                  const sourceIdentifier = record.sourceIdentifier as string;
                  
                  return (
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm" fontWeight="medium">
                        URL: {sourceUrl || 'None'}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Name: {sourceName || 'None'}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        ID: {sourceIdentifier || 'None'}
                      </Text>
                    </BlockStack>
                  );
                }
              },
              "processingStatus"
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