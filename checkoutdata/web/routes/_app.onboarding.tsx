import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  ProgressBar,
  Icon,
  Badge,
  Checkbox,
  TextField,
  Select,
  Divider,
  Box,
  Banner,
} from "@shopify/polaris";
import {
  SecurityIcon,
  LockIcon,
  AnalyticsBarHorizontalIcon,
  CheckIcon,
} from "@shopify/polaris-icons";
import { useGlobalAction, useSession } from "@gadgetinc/react";
import { api } from "../api";

export async function loader({ context }: LoaderFunctionArgs) {
  const session = await context.api.currentSession.get();
  const shop = session?.shop;
  
  return {
    shopDomain: shop?.domain || "",
    merchantEmail: shop?.email || "",
    shopName: shop?.name || "",
  };
}

export default function OnboardingPage() {
  const { shopDomain, merchantEmail, shopName } = useLoaderData<typeof loader>();
  const session = useSession(api);
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    businessDomain: shopDomain,
    merchantEmail: merchantEmail,
    merchantName: shopName,
    isTrackingEnabled: true,
    trackingScope: "full",
    notificationPreferences: {
      emailReports: true,
      webhookNotifications: false,
      analytics: true,
    },
    consentGiven: false,
    dataProcessingConsent: false,
    thirdPartyConsent: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [{ data, error, fetching }, initializeUserAuthorization] = useGlobalAction(api.initializeUserAuthorization);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 2:
        if (!formData.consentGiven) {
          newErrors.consentGiven = "You must consent to data tracking to continue";
        }
        if (!formData.dataProcessingConsent) {
          newErrors.dataProcessingConsent = "Data processing consent is required";
        }
        break;
      case 3:
        if (!formData.businessDomain) {
          newErrors.businessDomain = "Business domain is required";
        }
        if (!formData.merchantEmail) {
          newErrors.merchantEmail = "Email address is required";
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [field]: value,
      },
    }));
  };

  const handleComplete = async () => {
    if (!validateStep(3)) return;
    
    try {
      await initializeUserAuthorization({
        businessDomain: formData.businessDomain,
        merchantEmail: formData.merchantEmail,
        merchantName: formData.merchantName,
        isTrackingEnabled: formData.isTrackingEnabled,
        trackingScope: formData.trackingScope,
        notificationPreferences: formData.notificationPreferences,
      });
      
      // Show success and redirect
      shopify.toast.show("Setup completed successfully!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Setup failed:", error);
    }
  };

  const renderWelcomeStep = () => (
    <BlockStack gap="600">
      <BlockStack gap="400">
        <Text as="h1" variant="headingLg" alignment="center">
          Welcome to CheckoutData!
        </Text>
        <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
          Your intelligent checkout tracking and analytics solution
        </Text>
      </BlockStack>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Why CheckoutData?
          </Text>
          <BlockStack gap="300">
            <InlineStack gap="300" align="start">
              <Icon source={AnalyticsBarHorizontalIcon} />
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Advanced Analytics
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Understand customer behavior and optimize conversions
                </Text>
              </BlockStack>
            </InlineStack>
            
            <InlineStack gap="300" align="start">
              <Icon source={SecurityIcon} />
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Privacy Compliant
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  GDPR and CCPA compliant tracking with full transparency
                </Text>
              </BlockStack>
            </InlineStack>
            
            <InlineStack gap="300" align="start">
              <Icon source={LockIcon} />
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Secure & Reliable
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Enterprise-grade security with 99.9% uptime guarantee
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </BlockStack>
      </Card>

      <InlineStack gap="200" align="center">
        <Badge tone="info">✓ SOC 2 Type II Certified</Badge>
        <Badge tone="info">✓ ISO 27001 Compliant</Badge>
        <Badge tone="info">✓ GDPR Ready</Badge>
      </InlineStack>
    </BlockStack>
  );

  const renderAuthorizationStep = () => (
    <BlockStack gap="600">
      <BlockStack gap="400">
        <Text as="h1" variant="headingLg">
          Data Tracking Authorization
        </Text>
        <Text as="p" variant="bodyLg" tone="subdued">
          We believe in transparency. Here's exactly what we track and why.
        </Text>
      </BlockStack>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            What We Track
          </Text>
          <BlockStack gap="300">
            <Box>
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Checkout Events
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Cart additions, checkout starts, completions, and abandonments to help you understand conversion funnels.
              </Text>
            </Box>
            
            <Box>
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Customer Journey Data
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Page views, product interactions, and navigation patterns to optimize user experience.
              </Text>
            </Box>
            
            <Box>
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Order Analytics
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Order values, product performance, and customer segments for business insights.
              </Text>
            </Box>
          </BlockStack>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Your Consent
          </Text>
          
          <BlockStack gap="300">
            <Checkbox
              label="I consent to CheckoutData tracking customer behavior on my store"
              checked={formData.consentGiven}
              onChange={(checked) => handleFieldChange("consentGiven", checked)}
              error={errors.consentGiven}
            />
            
            <Checkbox
              label="I consent to the processing of customer data for analytics purposes"
              checked={formData.dataProcessingConsent}
              onChange={(checked) => handleFieldChange("dataProcessingConsent", checked)}
              error={errors.dataProcessingConsent}
            />
            
            <Checkbox
              label="I consent to data sharing with trusted third-party analytics partners (optional)"
              checked={formData.thirdPartyConsent}
              onChange={(checked) => handleFieldChange("thirdPartyConsent", checked)}
            />
          </BlockStack>

          {(errors.consentGiven || errors.dataProcessingConsent) && (
            <Banner tone="critical">
              <Text as="p" variant="bodyMd">
                Please provide the required consents to continue with setup.
              </Text>
            </Banner>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
  );

  const renderBusinessSetupStep = () => (
    <BlockStack gap="600">
      <BlockStack gap="400">
        <Text as="h1" variant="headingLg">
          Business Setup
        </Text>
        <Text as="p" variant="bodyLg" tone="subdued">
          Let's configure your tracking preferences and contact information.
        </Text>
      </BlockStack>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Business Information
          </Text>
          
          <TextField
            label="Business Domain"
            value={formData.businessDomain}
            onChange={(value) => handleFieldChange("businessDomain", value)}
            error={errors.businessDomain}
            helpText="Your primary business domain (e.g., mystore.com)"
            autoComplete="off"
          />
          
          <TextField
            label="Contact Email"
            type="email"
            value={formData.merchantEmail}
            onChange={(value) => handleFieldChange("merchantEmail", value)}
            error={errors.merchantEmail}
            helpText="We'll send important updates to this email"
            autoComplete="email"
          />
          
          <TextField
            label="Contact Name"
            value={formData.merchantName}
            onChange={(value) => handleFieldChange("merchantName", value)}
            helpText="Your name or business contact name"
            autoComplete="name"
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Tracking Preferences
          </Text>
          
          <Select
            label="Tracking Scope"
            options={[
              { label: "Basic Tracking (Orders and checkouts only)", value: "basic" },
              { label: "Full Tracking (Complete customer journey)", value: "full" },
              { label: "Analytics Only (Aggregated data)", value: "analytics_only" },
            ]}
            value={formData.trackingScope}
            onChange={(value) => handleFieldChange("trackingScope", value)}
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Notification Preferences
          </Text>
          
          <BlockStack gap="300">
            <Checkbox
              label="Email Reports (Weekly analytics summaries)"
              checked={formData.notificationPreferences.emailReports}
              onChange={(checked) => handleNotificationChange("emailReports", checked)}
            />
            
            <Checkbox
              label="Webhook Notifications (Real-time event notifications)"
              checked={formData.notificationPreferences.webhookNotifications}
              onChange={(checked) => handleNotificationChange("webhookNotifications", checked)}
            />
            
            <Checkbox
              label="Analytics Insights (Monthly performance insights)"
              checked={formData.notificationPreferences.analytics}
              onChange={(checked) => handleNotificationChange("analytics", checked)}
            />
          </BlockStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );

  const renderReviewStep = () => (
    <BlockStack gap="600">
      <BlockStack gap="400">
        <Text as="h1" variant="headingLg">
          Review & Complete Setup
        </Text>
        <Text as="p" variant="bodyLg" tone="subdued">
          Please review your settings before completing the setup.
        </Text>
      </BlockStack>

      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Setup Summary
          </Text>
          
          <BlockStack gap="300">
            <InlineStack gap="200" align="space-between">
              <Text as="p" variant="bodyMd" fontWeight="semibold">Business Domain:</Text>
              <Text as="p" variant="bodyMd">{formData.businessDomain}</Text>
            </InlineStack>
            
            <InlineStack gap="200" align="space-between">
              <Text as="p" variant="bodyMd" fontWeight="semibold">Contact Email:</Text>
              <Text as="p" variant="bodyMd">{formData.merchantEmail}</Text>
            </InlineStack>
            
            <InlineStack gap="200" align="space-between">
              <Text as="p" variant="bodyMd" fontWeight="semibold">Tracking Scope:</Text>
              <Text as="p" variant="bodyMd">
                {formData.trackingScope === "basic" && "Basic Tracking"}
                {formData.trackingScope === "full" && "Full Tracking"}
                {formData.trackingScope === "analytics_only" && "Analytics Only"}
              </Text>
            </InlineStack>
            
            <Divider />
            
            <Text as="p" variant="bodyMd" fontWeight="semibold">Active Notifications:</Text>
            <BlockStack gap="200">
              {formData.notificationPreferences.emailReports && (
                <InlineStack gap="200" align="start">
                  <Icon source={CheckIcon} tone="success" />
                  <Text as="p" variant="bodyMd">Email Reports</Text>
                </InlineStack>
              )}
              {formData.notificationPreferences.webhookNotifications && (
                <InlineStack gap="200" align="start">
                  <Icon source={CheckIcon} tone="success" />
                  <Text as="p" variant="bodyMd">Webhook Notifications</Text>
                </InlineStack>
              )}
              {formData.notificationPreferences.analytics && (
                <InlineStack gap="200" align="start">
                  <Icon source={CheckIcon} tone="success" />
                  <Text as="p" variant="bodyMd">Analytics Insights</Text>
                </InlineStack>
              )}
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </Card>

      {error && (
        <Banner tone="critical">
          <Text as="p" variant="bodyMd">
            Setup failed: {error.toString()}
          </Text>
        </Banner>
      )}

      {data && (
        <Banner tone="success">
          <Text as="p" variant="bodyMd">
            Setup completed successfully! Redirecting to dashboard...
          </Text>
        </Banner>
      )}
    </BlockStack>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderWelcomeStep();
      case 2:
        return renderAuthorizationStep();
      case 3:
        return renderBusinessSetupStep();
      case 4:
        return renderReviewStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <Page
      title="App Setup"
      subtitle="Let's get you set up with CheckoutData"
      compactTitle
    >
      <BlockStack gap="600">
        <Card>
          <BlockStack gap="400">
            <InlineStack gap="400" align="space-between">
              <Text as="h3" variant="headingSm">
                Step {currentStep} of {totalSteps}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {Math.round(progress)}% complete
              </Text>
            </InlineStack>
            <ProgressBar progress={progress} size="small" />
          </BlockStack>
        </Card>

        {renderStepContent()}

        <Card>
          <InlineStack gap="300" align="end">
            {currentStep > 1 && (
              <Button
                onClick={handlePrevious}
                disabled={fetching}
              >
                Previous
              </Button>
            )}
            
            {currentStep < totalSteps && (
              <Button
                variant="primary"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
            
            {currentStep === totalSteps && (
              <Button
                variant="primary"
                onClick={handleComplete}
                loading={fetching}
              >
                Complete Setup
              </Button>
            )}
          </InlineStack>
        </Card>
      </BlockStack>
    </Page>
  );
}