import { AutoTable } from "@gadgetinc/react/auto/polaris";
import { useFindMany, useSession } from "@gadgetinc/react";
import { 
  Page, 
  Card, 
  BlockStack, 
  Text, 
  Badge, 
  InlineStack, 
  Tooltip, 
  Box, 
  Divider,
  Button,
  Select,
  TextField,
  Banner,
  ProgressBar,
  Filters,
  ResourceList
} from "@shopify/polaris";

import { useNavigate } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useState, useMemo } from "react";
import { api } from "../api";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  try {
    // Check if we have a current session
    const session = await context.api.currentSession.get();
    
    if (!session) {
      return json({
        sessionId: null,
        shopId: null,
        shopDomain: null,
        error: "no_session"
      });
    }

    // Check if the session has an associated shop
    if (!session.shopId) {
      return json({
        sessionId: session.id,
        shopId: null,
        shopDomain: null,
        error: "no_shop"
      });
    }

    return json({
      sessionId: session.id,
      shopId: session.shopId,
      shopDomain: session.shop?.domain || null,
      error: null
    });
  } catch (error) {
    return json({
      sessionId: null,
      shopId: null,
      shopDomain: null,
      error: "fetch_error"
    });
  }
};

export default function CheckoutsIndex() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Check for valid session
  const session = useSession(api);

  // Fetch checkout data for statistics
  const [{ data: checkouts, fetching, error }] = useFindMany(api.shopifyCheckout, {
    select: {
      id: true,
      createdAt: true,
      completedAt: true,
      totalPrice: true,
      sourceUrl: true,
      sourceName: true,
      sourceIdentifier: true,
      processingStatus: true,
      buyerAcceptsMarketing: true,
      name: true,
      customerLocale: true,
      email: true
    },
    first: 250
  });

  const formatDuration = (startDate: string | null | undefined, endDate?: string | null) => {
    if (!startDate) return 'Unknown';
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
    if (record.createdAt) {
      const createdAt = new Date(record.createdAt as string);
      const hoursOld = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursOld > 24) {
        return { status: 'Abandoned', tone: 'critical' as const };
      }
    }
    return { status: 'In Progress', tone: 'info' as const };
  };

  const getReferralSourceInfo = (record: any) => {
    const sourceUrl = record.sourceUrl as string | null | undefined;
    const sourceName = record.sourceName as string | null | undefined;
    const sourceIdentifier = record.sourceIdentifier as string | null | undefined;

    // Enhanced iPick referral detection - check for multiple variations
    const isIpickReferral = (url: string) => {
      if (!url) return { isMatch: false, matchedTerm: null };
      const lowerUrl = url.toLowerCase();
      
      // Check for various iPick-related terms
      const ipickTerms = ['ipick.io', 'ipick', 'pavlo4', 'pavlp'];
      
      for (const term of ipickTerms) {
        if (lowerUrl.includes(term)) {
          return { isMatch: true, matchedTerm: term };
        }
      }
      
      return { isMatch: false, matchedTerm: null };
    };

    // Check for iPick referral with enhanced detection
    if (sourceUrl) {
      const referralCheck = isIpickReferral(sourceUrl);
      if (referralCheck.isMatch) {
        return {
          text: 'iPick Price Comparison',
          tone: 'attention' as const,
          isPavlo: true,
          rawUrl: sourceUrl,
          debugInfo: `Detected iPick referral - Term: '${referralCheck.matchedTerm}' in URL: ${sourceUrl}`
        };
      }
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

    return {
      text: 'Unknown',
      tone: 'info' as const,
      isPavlo: false,
      rawUrl: 'N/A',
      debugInfo: 'No source information available'
    };
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!checkouts) return null;

    const totalCheckouts = checkouts.length;
    const completedCheckouts = checkouts.filter(c => 
      c.completedAt || c.processingStatus === 'complete'
    ).length;
    const conversionRate = totalCheckouts > 0 ? (completedCheckouts / totalCheckouts) * 100 : 0;
    
    const totalRevenue = checkouts
      .filter(c => c.completedAt || c.processingStatus === 'complete')
      .reduce((sum, c) => sum + (parseFloat(c.totalPrice as string) || 0), 0);
    
    const averageOrderValue = completedCheckouts > 0 ? totalRevenue / completedCheckouts : 0;
    
    const ipickReferrals = checkouts.filter(c => {
      const sourceUrl = c.sourceUrl as string | null | undefined;
      return sourceUrl && sourceUrl.toLowerCase().includes('ipick.io');
    }).length;

    return {
      totalCheckouts,
      completedCheckouts,
      conversionRate,
      totalRevenue,
      averageOrderValue,
      ipickReferrals,
      abandonedCheckouts: totalCheckouts - completedCheckouts - checkouts.filter(c => c.processingStatus === 'processing').length
    };
  }, [checkouts]);

  // Filter options
  const statusOptions = [
    { label: 'All statuses', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Abandoned', value: 'abandoned' }
  ];

  const sourceOptions = [
    { label: 'All sources', value: 'all' },
    { label: 'iPick referrals', value: 'ipick' },
    { label: 'Other sources', value: 'other' }
  ];

  const dateOptions = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'All time', value: 'all' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Check for session authorization first
  if (!session) {
    return (
      <Page title="Checkout Analytics Dashboard">
        <Card>
          <Box padding="800">
            <Banner tone="critical" title="Authentication Required">
              <BlockStack gap="400">
                <Text as="p">You must be logged in to view checkout data.</Text>
                <InlineStack gap="300">
                  <Button 
                    variant="primary"
                    onClick={() => window.location.href = '/'}
                  >
                    Go to Login
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => window.location.reload()}
                  >
                    Retry Authentication
                  </Button>
                </InlineStack>
              </BlockStack>
            </Banner>
          </Box>
        </Card>
      </Page>
    );
  }

  if (!session.shopId) {
    return (
      <Page title="Checkout Analytics Dashboard">
        <Card>
          <Box padding="800">
            <Banner tone="critical" title="Shop Authorization Required">
              <BlockStack gap="400">
                <Text as="p">
                  No shop is associated with your session. This app must be accessed from within the Shopify Admin.
                </Text>
                <InlineStack gap="300">
                  <Button 
                    variant="primary"
                    onClick={() => window.location.href = '/'}
                  >
                    Return to App Home
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                </InlineStack>
              </BlockStack>
            </Banner>
          </Box>
        </Card>
      </Page>
    );
  }

  if (fetching) {
    return (
      <Page title="Checkout Analytics Dashboard">
        <Card>
          <Box padding="800">
            <InlineStack align="center">
              <Text as="p" variant="bodyMd">Loading checkout data...</Text>
            </InlineStack>
          </Box>
        </Card>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Checkout Analytics Dashboard">
        <Banner tone="critical" title="Error loading data">
          <p>{error.message}</p>
        </Banner>
      </Page>
    );
  }

  // Don't render data components if not properly authorized
  if (!session?.shopId) {
    return (
      <Page title="Checkout Analytics Dashboard">
        <Card>
          <Box padding="800">
            <Banner tone="critical" title="Authorization Required">
              <BlockStack gap="400">
                <Text as="p">
                  You must be properly authenticated with a valid Shopify shop to view checkout data.
                </Text>
                <InlineStack gap="300">
                  <Button 
                    variant="primary"
                    onClick={() => window.location.href = '/'}
                  >
                    Return to App Home
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                </InlineStack>
              </BlockStack>
            </Banner>
          </Box>
        </Card>
      </Page>
    );
  }

  return (
    <Page 
      title="Checkout Analytics Dashboard"
      subtitle="Monitor checkout performance and referral sources"
    >
      <BlockStack gap="600">
        {/* Statistics Overview */}
        {stats && (
          <Card>
            <Box padding="500">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Key Metrics</Text>
                <InlineStack gap="500" wrap={false}>
                  {/* Total Checkouts */}
                  {/* Total Checkouts */}
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="300">
                        <Text as="span" variant="bodySm" tone="subdued">Total Checkouts</Text>
                        <Text as="h3" variant="headingLg">{stats.totalCheckouts}</Text>
                        <ProgressBar progress={100} size="small" />
                      </BlockStack>
                    </Box>
                  </Card>

                  {/* Completed Checkouts */}
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="300">
                        <Text as="span" variant="bodySm" tone="subdued">Completed</Text>
                        <Text as="h3" variant="headingLg">{stats.completedCheckouts}</Text>
                        <ProgressBar 
                          progress={stats.totalCheckouts > 0 ? (stats.completedCheckouts / stats.totalCheckouts) * 100 : 0} 
                          size="small" 
                        />
                      </BlockStack>
                    </Box>
                  </Card>

                  {/* Conversion Rate */}
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="300">
                        <Text as="span" variant="bodySm" tone="subdued">Conversion Rate</Text>
                        <Text as="h3" variant="headingLg">{stats.conversionRate.toFixed(1)}%</Text>
                        <ProgressBar progress={stats.conversionRate} size="small" />
                      </BlockStack>
                    </Box>
                  </Card>

                  {/* Total Revenue */}
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="300">
                        <Text as="span" variant="bodySm" tone="subdued">Total Revenue</Text>
                        <Text as="h3" variant="headingLg">{formatCurrency(stats.totalRevenue)}</Text>
                        <ProgressBar progress={100} size="small" />
                      </BlockStack>
                    </Box>
                  </Card>

                  {/* Average Order Value */}
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="300">
                        <Text as="span" variant="bodySm" tone="subdued">Avg Order Value</Text>
                        <Text as="h3" variant="headingLg">{formatCurrency(stats.averageOrderValue)}</Text>
                        <ProgressBar progress={75} size="small" />
                      </BlockStack>
                    </Box>
                  </Card>

                  {/* iPick Referrals */}
                  <Card>
                    <Box padding="400">
                      <BlockStack gap="300">
                        <Text as="span" variant="bodySm" tone="subdued">iPick Referrals</Text>
                        <InlineStack gap="200" align="start">
                          <Text as="h3" variant="headingLg">{stats.ipickReferrals}</Text>
                          <Badge tone="attention" size="small">⭐</Badge>
                        </InlineStack>
                        <ProgressBar 
                          progress={stats.totalCheckouts > 0 ? (stats.ipickReferrals / stats.totalCheckouts) * 100 : 0} 
                          size="small" 
                        />
                      </BlockStack>
                    </Box>
                  </Card>
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        )}

        {/* Filters and Controls */}
        <Card>
          <Box padding="500">
            <BlockStack gap="400">
              <InlineStack gap="200" align="space-between">
                <Text as="h2" variant="headingMd">Filters & Search</Text>
                <Button variant="tertiary">Advanced Filters</Button>
              </InlineStack>
              
              <InlineStack gap="400" wrap={false}>
                <Box minWidth="200px">
                  <Select
                    label="Status"
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />
                </Box>
                <Box minWidth="200px">
                  <Select
                    label="Source"
                    options={sourceOptions}
                    value={sourceFilter}
                    onChange={setSourceFilter}
                  />
                </Box>
                <Box minWidth="200px">
                  <Select
                    label="Date Range"
                    options={dateOptions}
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </Box>
                <Box minWidth="300px">
                  <TextField
                    label="Search"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by customer name, email..."
                    autoComplete="off"
                  />
                </Box>
              </InlineStack>
            </BlockStack>
          </Box>
        </Card>

        {/* Summary Section */}
        {stats && (
          <InlineStack gap="500">
            <Card>
              <Box padding="500">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Performance Summary</Text>
                  <Divider />
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="space-between">
                      <Text as="span" variant="bodyMd">Completed Checkouts</Text>
                      <Badge tone="success">{stats.completedCheckouts}</Badge>
                    </InlineStack>
                    <InlineStack gap="200" align="space-between">
                      <Text as="span" variant="bodyMd">Abandoned Checkouts</Text>
                      <Badge tone="critical">{stats.abandonedCheckouts}</Badge>
                    </InlineStack>
                    <InlineStack gap="200" align="space-between">
                      <Text as="span" variant="bodyMd">iPick Conversion Rate</Text>
                      <Badge tone="attention">
                        {stats.totalCheckouts > 0 ? ((stats.ipickReferrals / stats.totalCheckouts) * 100).toFixed(1) : 0}%
                      </Badge>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="500">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Recent Activity</Text>
                  <Divider />
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm">
                      Last 24 hours: <Text as="span" variant="bodySm" fontWeight="semibold">
                        {checkouts?.filter(c => {
                          if (!c.createdAt) return false;
                          const createdAt = new Date(c.createdAt as string);
                          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                          return createdAt > yesterday;
                        }).length || 0} new checkouts
                      </Text>
                    </Text>
                    <Text as="p" variant="bodySm">
                      iPick Performance: <Text as="span" variant="bodySm" fontWeight="semibold">
                        {stats.ipickReferrals > 0 ? 'Active' : 'No recent activity'}
                      </Text>
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>
          </InlineStack>
        )}

        {/* Enhanced Checkout Table - Only render when properly authorized */}
        {session?.shopId && (
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <InlineStack gap="200" align="space-between">
                  <Text as="h2" variant="headingMd">All Checkouts</Text>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {checkouts?.length || 0} checkouts found
                  </Text>
                </InlineStack>

                <AutoTable
                  model={api.shopifyCheckout}
                  columns={[
                  {
                    header: "Checkout ID",
                    render: ({ record }: { record: any }) => (
                      <Text as="span" variant="bodySm" fontWeight="medium">
                        #{record.id ? (record.id as string).slice(-8) : 'Unknown'}
                      </Text>
                    )
                  },
                  {
                    header: "Created",
                    render: ({ record }: { record: any }) => {
                      if (!record.createdAt) {
                        return <Text as="span" variant="bodySm">Unknown</Text>;
                      }
                      const date = new Date(record.createdAt as string);
                      return (
                        <BlockStack gap="100">
                          <Text as="span" variant="bodySm">
                            {date.toLocaleDateString()}
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {date.toLocaleTimeString()}
                          </Text>
                        </BlockStack>
                      );
                    }
                  },
                  {
                    header: "Status",
                    render: ({ record }: { record: any }) => {
                      const { status, tone } = getCheckoutStatus(record);
                      return <Badge tone={tone}>{status}</Badge>;
                    }
                  },
                  {
                    header: "Value",
                    render: ({ record }: { record: any }) => {
                      const price = record.totalPrice ? parseFloat(record.totalPrice as string) : 0;
                      return (
                        <Text as="span" variant="bodyMd" fontWeight="medium">
                          {formatCurrency(price)}
                        </Text>
                      );
                    }
                  },
                  {
                    header: "Duration",
                    render: ({ record }: { record: any }) => {
                      const duration = formatDuration(
                        record.createdAt as string | null | undefined, 
                        record.completedAt as string | null | undefined
                      );
                      return <Text as="span" variant="bodySm">{duration}</Text>;
                    }
                  },
                  {
                    header: "Customer",
                    render: ({ record }: { record: any }) => {
                      const name = (record.name as string | null | undefined) || 'N/A';
                      const email = (record.email as string | null | undefined) || '';
                      return (
                        <BlockStack gap="100">
                          <Text as="span" variant="bodySm" fontWeight="medium">
                            {name}
                          </Text>
                          {email && (
                            <Text as="span" variant="bodySm" tone="subdued">
                              {email}
                            </Text>
                          )}
                        </BlockStack>
                      );
                    }
                  },
                  {
                    header: "Referral Source",
                    render: ({ record }: { record: any }) => {
                      const { text, tone, isPavlo, rawUrl } = getReferralSourceInfo(record);
                      return (
                        <BlockStack gap="100">
                          <InlineStack gap="200" align="start">
                            <Badge tone={tone}>{text}</Badge>
                            {isPavlo && (
                              <Badge tone="warning" size="small">⭐ iPick</Badge>
                            )}
                          </InlineStack>
                          {rawUrl && rawUrl !== 'N/A' && (
                            <Text as="span" variant="bodySm" tone="subdued">
                              {rawUrl.length > 30 ? `${rawUrl.substring(0, 30)}...` : rawUrl}
                            </Text>
                          )}
                        </BlockStack>
                      );
                    }
                  }
                ]}
                onClick={({ record }: { record: any }) => {
                  if (record?.id) {
                    navigate(`/checkouts/${record.id}`);
                  }
                }}
              />
            </BlockStack>
          </Box>
        </Card>
        )}

      </BlockStack>
    </Page>
  );
}
