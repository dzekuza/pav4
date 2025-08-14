import { AutoTable } from "@gadgetinc/react/auto/polaris";
import { Page, Card, BlockStack, Text, Badge, InlineStack } from "@shopify/polaris";
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

    // Check for pavlo4 referral
    if (sourceUrl && sourceUrl.includes('pavlo4.netlify.app')) {
      return {
        text: 'Pavlo4 Price Comparison',
        tone: 'attention' as const,
        isPavlo: true
      };
    }

    // If we have source information, show it
    if (sourceName) {
      return {
        text: sourceName,
        tone: 'info' as const,
        isPavlo: false
      };
    }

    if (sourceUrl) {
      try {
        const url = new URL(sourceUrl);
        return {
          text: url.hostname,
          tone: 'info' as const,
          isPavlo: false
        };
      } catch {
        return {
          text: sourceUrl,
          tone: 'info' as const,
          isPavlo: false
        };
      }
    }

    if (sourceIdentifier) {
      return {
        text: sourceIdentifier,
        tone: 'info' as const,
        isPavlo: false
      };
    }

    // No source information available
    return {
      text: 'Direct',
      tone: 'subdued' as const,
      isPavlo: false
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
                  const { text, tone, isPavlo } = getReferralSourceInfo(record);
                  return (
                    <InlineStack gap="200" align="start">
                      <Badge tone={tone}>{text}</Badge>
                      {isPavlo && (
                        <Badge tone="warning" size="small">⭐ Pavlo4</Badge>
                      )}
                    </InlineStack>
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