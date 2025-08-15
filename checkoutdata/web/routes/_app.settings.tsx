import React, { useState, useCallback, useEffect } from "react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  TextField,
  Checkbox,
  RadioButton,
  Banner,
  Spinner,
  Box,
  Divider,
  Badge,
  Link,
} from "@shopify/polaris";
import { useFindFirst, useAction, useSession } from "@gadgetinc/react";
import { api } from "../api";

export default function Settings() {
  const session = useSession(api);
  const [{ data: userAuth, fetching: fetchingAuth, error: authError }, refetchAuth] = useFindFirst(
    api.userAuthorization,
    {
      filter: {
        shop: { equals: session?.shopId },
      },
    }
  );

  const [{ data: updateData, fetching: updating, error: updateError }, updateAuthorization] = useAction(
    api.userAuthorization.update
  );
  const [{ data: createData, fetching: creating, error: createError }, createAuthorization] = useAction(
    api.userAuthorization.create
  );
  const [{ data: deleteData, fetching: deleting, error: deleteError }, deleteAuthorization] = useAction(
    api.userAuthorization.delete
  );

  // Form state
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);
  const [trackingScope, setTrackingScope] = useState("full");
  const [businessDomain, setBusinessDomain] = useState("");
  const [merchantEmail, setMerchantEmail] = useState("");
  const [notificationPreferences, setNotificationPreferences] = useState({
    orderUpdates: true,
    marketingEmails: false,
    analyticsReports: true,
    securityAlerts: true,
  });

  // Banner state
  const [successBanner, setSuccessBanner] = useState("");
  const [errorBanner, setErrorBanner] = useState("");

  // Initialize form state when data loads
  useEffect(() => {
    if (userAuth) {
      setIsTrackingEnabled(userAuth.isTrackingEnabled ?? true);
      setTrackingScope(userAuth.trackingScope ?? "full");
      setBusinessDomain(userAuth.businessDomain ?? "");
      setMerchantEmail(userAuth.merchantEmail ?? "");
      
      if (userAuth.notificationPreferences) {
        setNotificationPreferences({
          ...notificationPreferences,
          ...userAuth.notificationPreferences,
        });
      }
    }
  }, [userAuth]);

  // Clear banners after some time
  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => setSuccessBanner(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  useEffect(() => {
    if (errorBanner) {
      const timer = setTimeout(() => setErrorBanner(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorBanner]);

  // Handle successful operations
  useEffect(() => {
    if (updateData) {
      setSuccessBanner("Settings updated successfully!");
      refetchAuth();
    }
  }, [updateData]);

  useEffect(() => {
    if (createData) {
      setSuccessBanner("Authorization created successfully!");
      refetchAuth();
    }
  }, [createData]);

  const handleSaveSettings = useCallback(async () => {
    try {
      const authData = {
        isTrackingEnabled,
        trackingScope,
        businessDomain,
        merchantEmail,
        notificationPreferences,
        shop: { _link: session?.shopId },
      };

      if (userAuth?.id) {
        await updateAuthorization({
          id: userAuth.id,
          ...authData,
        });
      } else {
        await createAuthorization(authData);
      }
    } catch (error) {
      setErrorBanner("Failed to save settings. Please try again.");
    }
  }, [
    isTrackingEnabled,
    trackingScope,
    businessDomain,
    merchantEmail,
    notificationPreferences,
    session?.shopId,
    userAuth?.id,
    updateAuthorization,
    createAuthorization,
  ]);

  const handleRevokeConsent = useCallback(async () => {
    if (userAuth?.id) {
      try {
        await deleteAuthorization({ id: userAuth.id });
        setSuccessBanner("Consent revoked successfully. All tracking has been disabled.");
        refetchAuth();
      } catch (error) {
        setErrorBanner("Failed to revoke consent. Please try again.");
      }
    }
  }, [userAuth?.id, deleteAuthorization]);

  const handleDownloadData = useCallback(() => {
    if (userAuth) {
      const dataToDownload = {
        merchantName: userAuth.merchantName,
        merchantEmail: userAuth.merchantEmail,
        businessDomain: userAuth.businessDomain,
        trackingId: userAuth.trackingId,
        consentGivenAt: userAuth.consentGivenAt,
        trackingScope: userAuth.trackingScope,
        isTrackingEnabled: userAuth.isTrackingEnabled,
        notificationPreferences: userAuth.notificationPreferences,
      };
      
      const dataStr = JSON.stringify(dataToDownload, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tracking-data-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setSuccessBanner("Data downloaded successfully!");
    }
  }, [userAuth]);

  const isLoading = fetchingAuth || updating || creating || deleting;
  const hasError = authError || updateError || createError || deleteError;

  if (fetchingAuth && !userAuth) {
    return (
      <Page title="Settings">
        <Box padding="400">
          <InlineStack gap="200" align="center">
            <Spinner size="small" />
            <Text as="span" variant="bodyMd">Loading settings...</Text>
          </InlineStack>
        </Box>
      </Page>
    );
  }

  return (
    <Page title="Settings" subtitle="Manage your tracking preferences and data">
      <BlockStack gap="500">
        {successBanner && (
          <Banner tone="success" onDismiss={() => setSuccessBanner("")}>
            <Text as="p" variant="bodyMd">{successBanner}</Text>
          </Banner>
        )}
        
        {errorBanner && (
          <Banner tone="critical" onDismiss={() => setErrorBanner("")}>
            <Text as="p" variant="bodyMd">{errorBanner}</Text>
          </Banner>
        )}

        {hasError && !errorBanner && (
          <Banner tone="warning">
            <Text as="p" variant="bodyMd">
              There was an issue loading your settings. Some features may not work correctly.
            </Text>
          </Banner>
        )}

        {/* Authorization Status Section */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Authorization Status</Text>
            
            {userAuth ? (
              <BlockStack gap="300">
                <InlineStack gap="200" align="start">
                  <Badge tone={userAuth.isTrackingEnabled ? "success" : "attention"}>
                    {userAuth.isTrackingEnabled ? "Active" : "Disabled"}
                  </Badge>
                  {userAuth.revokedAt && (
                    <Badge tone="critical">Revoked</Badge>
                  )}
                </InlineStack>
                
                <InlineStack gap="400" wrap={false}>
                  <Box minWidth="150px">
                    <Text as="dt" variant="bodyMd" fontWeight="medium">Consent Given:</Text>
                  </Box>
                  <Box>
                    <Text as="dd" variant="bodyMd">
                      {userAuth.consentGivenAt 
                        ? new Date(userAuth.consentGivenAt).toLocaleDateString()
                        : "Not available"}
                    </Text>
                  </Box>
                </InlineStack>
                
                <InlineStack gap="400" wrap={false}>
                  <Box minWidth="150px">
                    <Text as="dt" variant="bodyMd" fontWeight="medium">Tracking ID:</Text>
                  </Box>
                  <Box>
                    <Text as="dd" variant="bodyMd" fontFamily="mono">
                      {userAuth.trackingId || "Not assigned"}
                    </Text>
                  </Box>
                </InlineStack>
                
                <InlineStack gap="400" wrap={false}>
                  <Box minWidth="150px">
                    <Text as="dt" variant="bodyMd" fontWeight="medium">Current Scope:</Text>
                  </Box>
                  <Box>
                    <Badge tone="info">
                      {userAuth.trackingScope || "Not set"}
                    </Badge>
                  </Box>
                </InlineStack>
              </BlockStack>
            ) : (
              <Text as="p" variant="bodyMd" tone="subdued">
                No authorization record found. Create your preferences below to get started.
              </Text>
            )}
          </BlockStack>
        </Card>

        {/* Tracking Preferences Section */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Tracking Preferences</Text>
            
            <Checkbox
              label="Enable tracking"
              helpText="Allow collection of customer journey and analytics data"
              checked={isTrackingEnabled}
              onChange={setIsTrackingEnabled}
              disabled={isLoading}
            />
            
            {isTrackingEnabled && (
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">Tracking Scope</Text>
                
                <BlockStack gap="200">
                  <RadioButton
                    label="Basic tracking"
                    helpText="Essential tracking for core functionality only"
                    checked={trackingScope === "basic"}
                    id="basic"
                    name="trackingScope"
                    onChange={() => setTrackingScope("basic")}
                    disabled={isLoading}
                  />
                  <RadioButton
                    label="Full tracking"
                    helpText="Complete customer journey tracking with detailed analytics"
                    checked={trackingScope === "full"}
                    id="full"
                    name="trackingScope"
                    onChange={() => setTrackingScope("full")}
                    disabled={isLoading}
                  />
                  <RadioButton
                    label="Analytics only"
                    helpText="Anonymous analytics data without personal information"
                    checked={trackingScope === "analytics_only"}
                    id="analytics_only"
                    name="trackingScope"
                    onChange={() => setTrackingScope("analytics_only")}
                    disabled={isLoading}
                  />
                </BlockStack>
              </BlockStack>
            )}
            
            <TextField
              label="Business Domain"
              helpText="Your main business website domain"
              value={businessDomain}
              onChange={setBusinessDomain}
              placeholder="example.com"
              disabled={isLoading}
              autoComplete="off"
            />
            
            <TextField
              label="Merchant Email"
              type="email"
              helpText="Email address for important notifications"
              value={merchantEmail}
              onChange={setMerchantEmail}
              disabled={isLoading}
              autoComplete="email"
            />
          </BlockStack>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Notification Preferences</Text>
            
            <BlockStack gap="200">
              <Checkbox
                label="Order updates"
                helpText="Receive notifications about order processing and fulfillment"
                checked={notificationPreferences.orderUpdates}
                onChange={(checked) => 
                  setNotificationPreferences(prev => ({...prev, orderUpdates: checked}))
                }
                disabled={isLoading}
              />
              <Checkbox
                label="Marketing emails"
                helpText="Receive promotional emails and product updates"
                checked={notificationPreferences.marketingEmails}
                onChange={(checked) => 
                  setNotificationPreferences(prev => ({...prev, marketingEmails: checked}))
                }
                disabled={isLoading}
              />
              <Checkbox
                label="Analytics reports"
                helpText="Receive weekly analytics summaries and insights"
                checked={notificationPreferences.analyticsReports}
                onChange={(checked) => 
                  setNotificationPreferences(prev => ({...prev, analyticsReports: checked}))
                }
                disabled={isLoading}
              />
              <Checkbox
                label="Security alerts"
                helpText="Receive notifications about account security events"
                checked={notificationPreferences.securityAlerts}
                onChange={(checked) => 
                  setNotificationPreferences(prev => ({...prev, securityAlerts: checked}))
                }
                disabled={isLoading}
              />
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Data Management Section */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Data Management</Text>
            
            <Text as="p" variant="bodyMd" tone="subdued">
              Manage your data and privacy settings. You can download a copy of your data or 
              revoke consent to stop all tracking.
            </Text>
            
            <InlineStack gap="300" wrap>
              <Button
                onClick={handleDownloadData}
                disabled={!userAuth || isLoading}
                accessibilityLabel="Download your tracking data"
              >
                Download My Data
              </Button>
              
              <Button
                variant="secondary"
                tone="critical"
                onClick={handleRevokeConsent}
                disabled={!userAuth || isLoading}
                accessibilityLabel="Revoke tracking consent"
              >
                Revoke Consent
              </Button>
            </InlineStack>
            
            <Divider />
            
            <InlineStack gap="300" align="start">
              <Link url="/privacy-policy" external>
                Privacy Policy
              </Link>
              <Link url="/terms-of-service" external>
                Terms of Service
              </Link>
              <Link url="/data-processing-agreement" external>
                Data Processing Agreement
              </Link>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Save Button */}
        <InlineStack gap="300" align="end">
          <Button
            variant="primary"
            onClick={handleSaveSettings}
            loading={updating || creating}
            disabled={isLoading}
          >
            Save Settings
          </Button>
        </InlineStack>
      </BlockStack>
    </Page>
  );
}