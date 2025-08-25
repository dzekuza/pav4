import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Play,
  Store,
  Code,
  Shield,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  Activity,
  Globe,
  Settings,
  Plus,
  List,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShopifyOAuthConnect } from "@/components/dashboard/ShopifyOAuthConnect";

interface BusinessStats {
  id: number;
  name: string;
  domain?: string;
  domainVerified?: boolean;
  trackingVerified?: boolean;
  affiliateId: string;
}

interface Platform {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
  scriptTemplate: string;
}

interface TestResult {
  timestamp: string;
  event: string;
  details: string;
  status: "success" | "error" | "pending";
}

interface BusinessIntegrationWizardProps {
  business: BusinessStats;
}

export default function BusinessIntegrationWizard({
  business,
}: BusinessIntegrationWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [domain, setDomain] = useState(business.domain || "");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null,
  );
  const [scriptPlatform, setScriptPlatform] = useState<Platform | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [copiedScript, setCopiedScript] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);

  // Cleanup any running timers on unmount
  useEffect(() => {
    return () => {
      if ((window as any).__ph_pollInterval)
        clearInterval((window as any).__ph_pollInterval);
      if ((window as any).__ph_stopTimeout)
        clearTimeout((window as any).__ph_stopTimeout);
    };
  }, []);

  // Auto-select platform based on domain if possible
  useEffect(() => {
    if (domain && !selectedPlatform) {
      const domainLower = domain.toLowerCase();
      if (
        domainLower.includes("shopify") ||
        domainLower.includes("myshopify.com")
      ) {
        setSelectedPlatform(
          platforms.find((p) => p.id === "shopify") || null,
        );
      } else if (
        domainLower.includes("woocommerce") ||
        domainLower.includes("wordpress")
      ) {
        setSelectedPlatform(
          platforms.find((p) => p.id === "woocommerce") || null,
        );
      } else if (domainLower.includes("magento")) {
        setSelectedPlatform(platforms.find((p) => p.id === "magento") || null);
      }
    }
  }, [domain, selectedPlatform]);

  // Set default script platform
  useEffect(() => {
    if (!scriptPlatform) {
      setScriptPlatform(
        platforms.find((p) => p.id === "shopify") || null,
      );
    }
  }, [scriptPlatform]);

  const platforms: Platform[] = [
    {
      id: "shopify",
      name: "Shopify",
      description: "Complete Shopify integration with OAuth and webhooks",
      icon: "🛍️",
      features: [
        "OAuth authentication",
        "Webhook integration",
        "Real-time order tracking",
        "Enhanced checkout tracking",
        "Complete event coverage",
        "Automatic script installation",
      ],
      get scriptTemplate() {
        return `// Shopify integration is handled through OAuth and webhooks
// No manual script installation required`;
      },
    },
    {
      id: "woocommerce",
      name: "WooCommerce",
      description: "WordPress e-commerce plugin",
      icon: "🛒",
      features: [
        "Product tracking",
        "Purchase tracking",
        "Cart tracking",
        "User behavior",
      ],
      get scriptTemplate() {
        return `<!-- PriceHunt WooCommerce Integration -->
<script src="https://ipick.io/woocommerce-tracker.js" data-business-id="${business?.id || "YOUR_BUSINESS_ID"}" data-affiliate-id="${business?.affiliateId || "YOUR_AFFILIATE_ID"}"></script>
<script>
// WooCommerce-specific tracking
document.addEventListener('DOMContentLoaded', function() {
  // Track product page views
  if (document.querySelector('.woocommerce div.product')) {
    const productName = document.querySelector('.product_title')?.textContent;
    const productPrice = document.querySelector('.price .amount')?.textContent;
    
    window.PriceHuntTracker.track('product_view', {
      product_name: productName,
      product_price: productPrice
    });
  }
  
  // Track add to cart
  document.addEventListener('click', function(e) {
    if (e.target.matches('.single_add_to_cart_button, .add_to_cart_button')) {
      const productName = document.querySelector('.product_title')?.textContent;
      window.PriceHuntTracker.track('add_to_cart', {
        product_name: productName
      });
    }
  });
});
</script>
<!-- End PriceHunt WooCommerce Integration -->`;
      },
    },
    {
      id: "magento",
      name: "Magento",
      description: "Enterprise e-commerce platform",
      icon: "🏢",
      features: [
        "Product tracking",
        "Purchase tracking",
        "Cart tracking",
        "User behavior",
      ],
      get scriptTemplate() {
        return `<!-- PriceHunt Magento Integration -->
<script src="https://ipick.io/magento-tracker.js" data-business-id="${business?.id || "YOUR_BUSINESS_ID"}" data-affiliate-id="${business?.affiliateId || "YOUR_AFFILIATE_ID"}"></script>
<script>
// Magento-specific tracking
document.addEventListener('DOMContentLoaded', function() {
  // Track product page views
  if (document.querySelector('.product-info')) {
    const productName = document.querySelector('.page-title')?.textContent;
    const productPrice = document.querySelector('.price')?.textContent;
    
    window.PriceHuntTracker.track('product_view', {
      product_name: productName,
      product_price: productPrice
    });
  }
  
  // Track add to cart
  document.addEventListener('click', function(e) {
    if (e.target.matches('#product-addtocart-button, .add-to-cart')) {
      const productName = document.querySelector('.page-title')?.textContent;
      window.PriceHuntTracker.track('add_to_cart', {
        product_name: productName
      });
    }
  });
});
</script>
<!-- End PriceHunt Magento Integration -->`;
      },
    },
    {
      id: "custom",
      name: "Custom Website",
      description: "Any website with custom tracking",
      icon: "🌐",
      features: [
        "Basic tracking",
        "Page views",
        "User behavior",
        "Custom events",
      ],
      get scriptTemplate() {
        return `<!-- PriceHunt Custom Integration -->
<script src="https://ipick.io/tracker.js" data-business-id="${business?.id || "YOUR_BUSINESS_ID"}" data-affiliate-id="${business?.affiliateId || "YOUR_AFFILIATE_ID"}"></script>
<script>
// Custom website tracking
document.addEventListener('DOMContentLoaded', function() {
  // Track page views
  window.PriceHuntTracker.track('page_view', {
    page_url: window.location.href,
    page_title: document.title
  });
  
  // Track product clicks (customize selectors for your site)
  document.addEventListener('click', function(e) {
    if (e.target.matches('.product-link, .buy-button, [data-product]')) {
      const productName = e.target.getAttribute('data-product-name') || e.target.textContent;
      window.PriceHuntTracker.track('product_click', {
        product_name: productName
      });
    }
  });
});
</script>
<!-- End PriceHunt Custom Integration -->`;
      },
    },
  ];



  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(true);
      toast({
        title: "Script Copied!",
        description: "Tracking script has been copied to clipboard",
      });
      setTimeout(() => setCopiedScript(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy script to clipboard",
        variant: "destructive",
      });
    }
  };

  const startTesting = async () => {
    if (!domain) {
      toast({
        title: "Error",
        description:
          "No website domain found. Please verify your domain first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResults([]);

    // Start polling for real tracking events
    if ((window as any).__ph_pollInterval)
      clearInterval((window as any).__ph_pollInterval);
    if ((window as any).__ph_stopTimeout)
      clearTimeout((window as any).__ph_stopTimeout);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/tracking-events${business?.id ? `?business_id=${business.id}` : ""}`,
          {
            credentials: "include",
          },
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.events.length > 0) {
            // Convert tracking events to test results
            const newEvents = data.events.map((event: any) => ({
              timestamp: event.timestamp,
              event: event.eventType,
              details: `Event from ${event.url || "unknown page"}`,
              status: "success" as const,
            }));

            setTestResults(newEvents);
          }
        }
      } catch (error) {
        console.error("Error fetching tracking events:", error);
      }
    }, 4000); // Poll every 4 seconds to reduce load
    (window as any).__ph_pollInterval = pollInterval;

    // Stop polling after 30 seconds
    const stopTimeout = setTimeout(() => {
      clearInterval(pollInterval);
      (window as any).__ph_pollInterval = undefined;
      setIsTesting(false);

      if (testResults.length === 0) {
        toast({
          title: "No Events Detected",
          description:
            "No tracking events were detected. Make sure the tracking script is installed on your website.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Testing Complete!",
          description: `Detected ${testResults.length} tracking events from your website.`,
        });
      }
    }, 30000);
    (window as any).__ph_stopTimeout = stopTimeout;
  };

  const testScriptPresence = async () => {
    if (!domain) {
      toast({
        title: "Error",
        description:
          "No website domain found. Please verify your domain first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      const websiteUrl = domain.startsWith("http")
        ? domain
        : `https://${domain}`;

      // Use the existing tracking verification endpoint
      const response = await fetch("/api/business/verify-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          pageUrl: websiteUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "✅ Script Found!",
          description:
            "The tracking script is properly installed and working on your website.",
        });

        // Add a success result
        setTestResults([
          {
            timestamp: new Date().toISOString(),
            event: "Script Verification",
            details: "Tracking script found and verified on website",
            status: "success" as const,
          },
        ]);
      } else {
        toast({
          title: "❌ Script Not Found",
          description:
            data.error ||
            "The tracking script was not found on your website. Please install it and try again.",
          variant: "destructive",
        });

        // Add an error result
        setTestResults([
          {
            timestamp: new Date().toISOString(),
            event: "Script Verification",
            details: data.error || "Script not found on website",
            status: "error" as const,
          },
        ]);
      }
    } catch (error) {
      console.error("Error testing script presence:", error);
      toast({
        title: "Error",
        description:
          "Failed to test script presence. Please check your domain and try again.",
        variant: "destructive",
      });

      // Add an error result
      setTestResults([
        {
          timestamp: new Date().toISOString(),
          event: "Script Verification",
          details: "Failed to test script presence",
          status: "error" as const,
        },
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  const generateTestEvents = async () => {
    try {
      const response = await fetch("/api/test-tracking", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: business?.id }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Test Events Created",
          description:
            data.message ||
            "Test tracking events have been created successfully.",
        });

        // Start polling for the new events
        startTesting();
      } else {
        toast({
          title: "Error",
          description: "Failed to create test events. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating test events:", error);
      toast({
        title: "Error",
        description: "Failed to create test events. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openTestWebsite = () => {
    if (domain) {
      const url = domain.startsWith("http") ? domain : `https://${domain}`;
      window.open(url, "_blank");
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return "completed";
    if (step === currentStep) return "current";
    return "pending";
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== null;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceedToNext()) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const finishSetup = () => {
    // Clear any running timers
    if ((window as any).__ph_pollInterval) {
      clearInterval((window as any).__ph_pollInterval);
      (window as any).__ph_pollInterval = undefined;
    }
    if ((window as any).__ph_stopTimeout) {
      clearTimeout((window as any).__ph_stopTimeout);
      (window as any).__ph_stopTimeout = undefined;
    }

    toast({
      title: "🎉 Setup Complete!",
      description:
        "Your tracking integration has been successfully set up. Redirecting to dashboard...",
    });

    // Show a brief completion state before redirecting
    setTimeout(() => {
      // Redirect to the main business dashboard
      window.location.href = "/business/dashboard";
    }, 2000);
  };

  const checkConnectionStatus = async () => {
    if (!business.domain) {
      setConnectionStatus("disconnected");
      return;
    }

    setIsCheckingConnection(true);

    try {
      const websiteUrl = business.domain.startsWith("http")
        ? business.domain
        : `https://${business.domain}`;

      const response = await fetch("/api/business/verify-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          pageUrl: websiteUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setConnectionStatus("connected");
        toast({
          title: "✅ Connection Verified",
          description: "Your tracking integration is working correctly.",
        });
      } else {
        setConnectionStatus("disconnected");
        toast({
          title: "❌ Connection Failed",
          description:
            data.error || "Unable to verify tracking script on your website.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      setConnectionStatus("disconnected");
      toast({
        title: "Error",
        description: "Failed to check connection status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Check connection status on component mount if business is verified
  useEffect(() => {
    if (business.domainVerified && business.domain) {
      checkConnectionStatus();
    }
  }, [business.domainVerified, business.domain]);

  // Debug logging
  useEffect(() => {
    console.log("Business Integration Wizard - Business Data:", {
      id: business.id,
      name: business.name,
      domain: business.domain,
      domainVerified: business.domainVerified,
      trackingVerified: business.trackingVerified,
    });
  }, [business]);

  // Webhook management functions
  const createWebhook = async () => {
    setIsCreatingWebhook(true);
    try {
      const response = await fetch('/api/shopify/oauth/create-webhook', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Webhook Created",
          description: "Order creation webhook has been created successfully.",
        });
        // Refresh webhooks list
        listWebhooks();
      } else {
        const errorData = await response.json();
        toast({
          title: "❌ Webhook Creation Failed",
          description: errorData.error || "Failed to create webhook.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Error",
        description: "Failed to create webhook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const listWebhooks = async () => {
    setIsLoadingWebhooks(true);
    try {
      const response = await fetch('/api/shopify/oauth/webhooks', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      } else {
        console.error('Failed to load webhooks');
        setWebhooks([]);
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
      setWebhooks([]);
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/shopify/oauth/webhook/${webhookId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "✅ Webhook Deleted",
          description: "Webhook has been deleted successfully.",
        });
        // Refresh webhooks list
        listWebhooks();
      } else {
        const errorData = await response.json();
        toast({
          title: "❌ Webhook Deletion Failed",
          description: errorData.error || "Failed to delete webhook.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Show different content based on verification status */}
      {business.domainVerified === true ? (
        // Verified Business - Show Status Dashboard
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Integration Status
              </h2>
              <p className="text-white/70">
                Monitor your tracking integration and connection status
              </p>
            </div>
          </div>

          {/* Connection Status Card */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5" />
                Connection Status
              </CardTitle>
              <CardDescription className="text-white/80">
                Current status of your tracking integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Information */}
              <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">
                  📋 Business Information:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                  <div>
                    <span className="font-medium text-white">
                      Business Name:
                    </span>{" "}
                    {business?.name}
                  </div>
                  <div>
                    <span className="font-medium text-white">Website:</span>{" "}
                    {business?.domain}
                  </div>
                  <div>
                    <span className="font-medium text-white">Business ID:</span>{" "}
                    {business?.id}
                  </div>
                  <div>
                    <span className="font-medium text-white">
                      Affiliate ID:
                    </span>{" "}
                    {business?.affiliateId}
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white">
                    🔗 Connection Status
                  </h4>
                  <Badge
                    variant={
                      connectionStatus === "connected"
                        ? "default"
                        : connectionStatus === "checking"
                          ? "secondary"
                          : "destructive"
                    }
                    className={
                      connectionStatus === "connected"
                        ? "bg-green-500 text-white"
                        : connectionStatus === "checking"
                          ? "bg-yellow-500 text-white"
                          : "bg-red-500 text-white"
                    }
                  >
                    {connectionStatus === "connected"
                      ? "✅ Connected"
                      : connectionStatus === "checking"
                        ? "⏳ Checking..."
                        : "❌ Disconnected"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white/80">
                      Domain Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {connectionStatus === "connected" ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : connectionStatus === "checking" ? (
                      <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-sm text-white/80">
                      {connectionStatus === "connected"
                        ? "Tracking Script Active"
                        : connectionStatus === "checking"
                          ? "Checking Script Status..."
                          : "Tracking Script Not Found"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    onClick={checkConnectionStatus}
                    disabled={isCheckingConnection}
                    className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                  >
                    {isCheckingConnection ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking Connection...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Shopify OAuth Integration Section */}
              <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white">
                    🔐 Shopify OAuth Connection
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={testScriptPresence}
                      disabled={isTesting}
                      className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        window.open("https://apps.shopify.com", "_blank")
                      }
                      className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      App Store
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Shopify OAuth Component */}
                  <ShopifyOAuthConnect 
                    onConnect={(shop) => {
                      toast({
                        title: "Shopify Connected!",
                        description: `Successfully connected to ${shop}`,
                      });
                    }}
                    onDisconnect={() => {
                      toast({
                        title: "Shopify Disconnected",
                        description: "Your Shopify store has been disconnected",
                      });
                    }}
                  />

                  {/* Shopify App Integration Instructions */}
                  <div className="border border-blue-500/20 bg-blue-500/10 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-3">
                      Shopify App Integration
                    </h5>
                    <div className="text-sm text-white/80 space-y-2">
                      <p>
                        <strong>
                          For the best tracking experience, install our Shopify
                          app:
                        </strong>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>
                          On your Shopify admin panel, navigate to the{" "}
                          <strong>Apps</strong> page
                        </li>
                        <li>
                          Click <strong>"Visit Shopify app store"</strong>
                        </li>
                        <li>
                          Search for <strong>"iPick Price Tracking"</strong>
                        </li>
                        <li>
                          Click <strong>"Add app"</strong>
                        </li>
                        <li>
                          Click <strong>"Install app"</strong> when prompted
                        </li>
                        <li>
                          Press the <strong>"Connect"</strong> button to connect
                          your iPick account
                        </li>
                        <li>When asked, authorize your account</li>
                      </ol>
                      <p className="mt-3 text-xs">
                        <strong>Benefits:</strong> Automatic script
                        installation, enhanced checkout tracking, real-time
                        analytics, and no manual code editing required.
                      </p>
                    </div>
                  </div>

                  {/* Test Results Display */}
                  {testResults.length > 0 && (
                    <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                      <h6 className="font-medium text-white mb-3">
                        Connection Test Results:
                      </h6>
                      <div className="space-y-2">
                        {testResults.map((result, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 border rounded-lg border-white/10 bg-white/5"
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                result.status === "success"
                                  ? "bg-green-400"
                                  : result.status === "error"
                                    ? "bg-red-400"
                                    : "bg-yellow-400"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-white">
                                {result.event}
                              </div>
                              <div className="text-xs text-white/70">
                                {result.details}
                              </div>
                            </div>
                            <div className="text-xs text-white/60">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">
                  ⚡ Quick Actions
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const websiteUrl = business.domain?.startsWith("http")
                        ? business.domain
                        : `https://${business.domain}`;
                      window.open(websiteUrl, "_blank");
                    }}
                    className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Website
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = "/business/dashboard/analytics")
                    }
                    className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = "/business/dashboard/activity")
                    }
                    className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Activity
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        // Unverified Business - Show Setup Wizard
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Integration Setup
              </h2>
              <p className="text-white/70">
                Set up tracking for your website in 4 simple steps
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    getStepStatus(step) === "completed"
                      ? "bg-green-500 text-black"
                      : getStepStatus(step) === "current"
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/60"
                  }`}
                >
                  {getStepStatus(step) === "completed" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step}</span>
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    getStepStatus(step) === "current"
                      ? "text-white"
                      : getStepStatus(step) === "completed"
                        ? "text-green-400"
                        : "text-white/60"
                  }`}
                >
                  {step === 1
                    ? "Choose Platform"
                    : step === 2
                      ? "Integration"
                      : "Test Tracking"}
                </span>
                {step < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-4 ${
                      getStepStatus(step + 1) === "completed"
                        ? "bg-green-500"
                        : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Step content - only show for unverified businesses */}
      {business.domainVerified !== true && (
        <>
          {/* Step 1: Platform Selection */}
          {currentStep === 1 && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Store className="h-5 w-5" />
                  Choose Your Platform
                </CardTitle>
                <CardDescription className="text-white/80">
                  Select the platform your website is built on to get the
                  appropriate integration instructions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {platforms.map((platform) => (
                    <div
                      key={platform.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedPlatform?.id === platform.id
                          ? "border-white bg-white/10"
                          : "border-white/10 hover:border-white/20 bg-white/5"
                      }`}
                      onClick={() => setSelectedPlatform(platform)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{platform.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">
                            {platform.name}
                          </h3>
                          <p className="text-sm text-white/70 mb-2">
                            {platform.description}
                          </p>
                          <div className="space-y-1">
                            {platform.features.map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <CheckCircle className="h-3 w-3 text-green-400" />
                                <span className="text-xs text-white/70">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {selectedPlatform?.id === platform.id && (
                          <CheckCircle className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Integration Instructions */}
          {currentStep === 2 && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Code className="h-5 w-5" />
                  Integration Instructions
                </CardTitle>
                <CardDescription className="text-white/80">
                  Follow the instructions to integrate tracking with your
                  platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Business Info Display */}
                <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">
                    📋 Your Business Information:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                    <div>
                      <span className="font-medium text-white">
                        Business Name:
                      </span>{" "}
                      {business?.name}
                    </div>
                    <div>
                      <span className="font-medium text-white">Website:</span>{" "}
                      {domain || business?.domain}
                    </div>
                    <div>
                      <span className="font-medium text-white">
                        Business ID:
                      </span>{" "}
                      {business?.id}
                    </div>
                    <div>
                      <span className="font-medium text-white">
                        Affiliate ID:
                      </span>{" "}
                      {business?.affiliateId}
                    </div>
                  </div>
                </div>

                {selectedPlatform && (
                  <div className="space-y-4">
                    {selectedPlatform.id === "shopify" ? (
                      // Shopify Integration Instructions
                      <div className="space-y-4">
                        {/* Shopify OAuth Component */}
                        <div className="border border-blue-500/20 bg-blue-500/10 rounded-lg p-4">
                          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                            🔐 Step 1: Connect Shopify Store
                          </h4>
                          <p className="text-sm text-white/80 mb-4">
                            Connect your Shopify store securely using OAuth authentication. 
                            This eliminates the need for manual access tokens and provides 
                            enhanced security and data access.
                          </p>
                          <ShopifyOAuthConnect 
                            onConnect={(shop) => {
                              toast({
                                title: "Shopify Connected!",
                                description: `Successfully connected to ${shop}. You can now proceed to install the app.`,
                              });
                            }}
                            onDisconnect={() => {
                              toast({
                                title: "Shopify Disconnected",
                                description: "Your Shopify store has been disconnected",
                              });
                            }}
                          />
                        </div>

                        {/* Webhook Integration Section */}
                        <div className="border border-green-500/20 bg-green-500/10 rounded-lg p-4">
                          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                            🔗 Step 2: Set Up Webhooks
                          </h4>
                          <p className="text-sm text-white/80 mb-4">
                            Set up webhook-based tracking for real-time order data delivery.
                          </p>

                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium text-white mb-2">
                                Webhook Configuration
                              </h5>
                              <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <span className="font-medium text-white">Webhook URL:</span>
                                    <div className="text-white/80 font-mono text-xs break-all mt-1">
                                      https://ipick.io/api/shopify/webhooks
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-white">App Secret:</span>
                                    <div className="text-white/80 font-mono text-xs break-all mt-1">
                                      54e7fd9b170add3cf80dcc482f8b894a5
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-white mb-2">
                                Webhook Management
                              </h5>
                              <div className="space-y-3">
                                <Button
                                  onClick={createWebhook}
                                  disabled={isCreatingWebhook}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {isCreatingWebhook ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Creating Webhook...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Create Webhook Automatically
                                    </>
                                  )}
                                </Button>
                                
                                <Button
                                  onClick={listWebhooks}
                                  disabled={isLoadingWebhooks}
                                  variant="outline"
                                  className="w-full border-white/20 text-white hover:bg-white/10"
                                >
                                  {isLoadingWebhooks ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      <List className="h-4 w-4 mr-2" />
                                      View Existing Webhooks
                                    </>
                                  )}
                                </Button>
                              </div>
                              
                              {webhooks.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <h6 className="font-medium text-white">Current Webhooks:</h6>
                                  {webhooks.map((webhook) => (
                                    <div key={webhook.id} className="bg-black/20 border border-white/10 rounded p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-white">
                                            {webhook.topic}
                                          </div>
                                          <div className="text-xs text-white/60 break-all">
                                            {webhook.address}
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => deleteWebhook(webhook.id)}
                                          variant="outline"
                                          size="sm"
                                          className="ml-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="border border-blue-500/20 bg-blue-500/10 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                                <div className="text-sm text-white/80">
                                  <p className="font-medium text-white mb-1">
                                    Webhook Benefits:
                                  </p>
                                  <ul className="space-y-1">
                                    <li>• Real-time order data delivery</li>
                                    <li>• No polling required - instant notifications</li>
                                    <li>• Secure HMAC verification</li>
                                    <li>• Automatic retry on failures</li>
                                    <li>• Complete order information</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Testing Section */}
                        <div className="border border-yellow-500/20 bg-yellow-500/10 rounded-lg p-4">
                          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                            🧪 Step 3: Test Integration
                          </h4>
                          <p className="text-sm text-white/80 mb-4">
                            Test your Shopify integration to ensure everything is working correctly.
                          </p>

                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <Button
                                onClick={testScriptPresence}
                                disabled={isTesting}
                                className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                              >
                                {isTesting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Testing...
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Test Connection
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={generateTestEvents}
                                disabled={isTesting}
                                className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                              >
                                <Activity className="h-4 w-4 mr-2" />
                                Generate Test Events
                              </Button>
                            </div>

                            {/* Test Results Display */}
                            {testResults.length > 0 && (
                              <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                                <h6 className="font-medium text-white mb-3">
                                  Test Results:
                                </h6>
                                <div className="space-y-2">
                                  {testResults.map((result, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-3 p-3 border rounded-lg border-white/10 bg-white/5"
                                    >
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          result.status === "success"
                                            ? "bg-green-400"
                                            : result.status === "error"
                                              ? "bg-red-400"
                                              : "bg-yellow-400"
                                        }`}
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm text-white">
                                          {result.event}
                                        </div>
                                        <div className="text-xs text-white/70">
                                          {result.details}
                                        </div>
                                      </div>
                                      <div className="text-xs text-white/60">
                                        {new Date(result.timestamp).toLocaleTimeString()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Other platforms - show script instructions
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">
                            Tracking Script for {selectedPlatform.name}
                          </h4>
                          <Button
                            size="sm"
                            onClick={() =>
                              copyToClipboard(selectedPlatform.scriptTemplate)
                            }
                            className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            {copiedScript ? "Copied!" : "Copy Script"}
                          </Button>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-white">
                          <pre className="text-xs overflow-x-auto">
                            <code>{selectedPlatform.scriptTemplate}</code>
                          </pre>
                        </div>

                        <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                          <h5 className="font-medium text-white mb-2">
                            ✅ Installation Instructions:
                          </h5>
                          <ol className="text-sm text-white/80 space-y-1">
                            <li>1. Copy the script above</li>
                            <li>
                              2. Add it to your website's &lt;head&gt; section
                            </li>
                            <li>
                              3. For WooCommerce: Add to header.php or use a
                              plugin
                            </li>
                            <li>
                              4. For Magento: Add to default_head_blocks.xml
                            </li>
                            <li>
                              5. For Custom: Add to your main HTML template
                            </li>
                            <li>
                              6. The script will automatically load enhanced
                              tracking features
                            </li>
                          </ol>
                        </div>

                        <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                          <h5 className="font-medium text-white mb-2">
                            ⚠️ Important Notes:
                          </h5>
                          <ul className="text-sm text-white/80 space-y-1">
                            <li>• Simple script - no complex code needed</li>
                            <li>
                              • Automatically loads enhanced tracking features
                            </li>
                            <li>
                              • Tracks product views, cart additions, and
                              purchases
                            </li>
                            <li>
                              • Enhanced debugging available in browser console
                            </li>
                            <li>
                              • Make sure to test the script after installation
                            </li>
                            <li>
                              • Contact support if you need help with
                              installation
                            </li>
                          </ul>
                        </div>

                        {/* Test Script Button for non-Shopify platforms */}
                        <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h5 className="font-medium text-white mb-1">
                                🧪 Test Your Script
                              </h5>
                              <p className="text-sm text-white/70">
                                Verify that the tracking script is properly
                                installed and working on your website
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const websiteUrl = domain.startsWith("http")
                                    ? domain
                                    : `https://${domain}`;
                                  window.open(websiteUrl, "_blank");
                                }}
                                disabled={!domain}
                                className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Website
                              </Button>
                              <Button
                                onClick={testScriptPresence}
                                disabled={isTesting}
                                className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                              >
                                {isTesting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Testing...
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Test Script
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="text-sm text-white/70 space-y-2">
                            <p>
                              <strong>What this test does:</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              <li>
                                Checks if the tracking script is loaded on your
                                website
                              </li>
                              <li>
                                Verifies script functionality and configuration
                              </li>
                              <li>
                                Confirms business ID and affiliate ID are
                                correct
                              </li>
                              <li>
                                Provides detailed feedback on script status
                              </li>
                            </ul>
                            <p className="mt-3 text-xs">
                              <strong>Tip:</strong> Make sure you've added the
                              script to your website before testing.
                            </p>
                          </div>

                          {/* Test Results Display */}
                          {testResults.length > 0 && (
                            <div className="mt-4 border border-white/10 bg-white/5 rounded-lg p-4">
                              <h6 className="font-medium text-white mb-3">
                                Test Results:
                              </h6>
                              <div className="space-y-2">
                                {testResults.map((result, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 border rounded-lg border-white/10 bg-white/5"
                                  >
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        result.status === "success"
                                          ? "bg-green-400"
                                          : result.status === "error"
                                            ? "bg-red-400"
                                            : "bg-yellow-400"
                                      }`}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-white">
                                        {result.event}
                                      </div>
                                      <div className="text-xs text-white/70">
                                        {result.details}
                                      </div>
                                    </div>
                                    <div className="text-xs text-white/60">
                                      {new Date(
                                        result.timestamp,
                                      ).toLocaleTimeString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Testing */}
          {currentStep === 3 && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Play className="h-5 w-5" />
                  Test Your Tracking
                </CardTitle>
                <CardDescription className="text-white/80">
                  Verify that tracking is working correctly on your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Test Your Website</Label>
                      <p className="text-sm text-white/70 mb-2">
                        Open your website to test the tracking script
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={openTestWebsite}
                          disabled={!domain}
                          className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open {domain || business?.domain}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={startTesting}
                          disabled={isTesting || !domain}
                          className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {isTesting ? "Testing..." : "Start Test"}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={generateTestEvents}
                          disabled={isTesting}
                          className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Generate Test Events
                        </Button>
                      </div>
                    </div>

                    <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                      <h5 className="font-medium text-white mb-2">
                        ⚠️ Testing Instructions:
                      </h5>
                      <ul className="text-sm text-white/80 space-y-1">
                        <li>• Open your website in a new tab</li>
                        <li>• Browse through different pages</li>
                        <li>• View product pages</li>
                        <li>• Add items to cart</li>
                        <li>• Complete a test purchase</li>
                        <li>• Return here to see tracking results</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <Label>Tracking Events</Label>
                    <p className="text-sm text-white/70 mb-2">
                      Real-time tracking events from your website
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {testResults.length === 0 ? (
                        <div className="text-center py-8 text-white/70">
                          <Activity className="h-8 w-8 mx-auto mb-2 text-white/50" />
                          <p>No tracking events yet</p>
                          <p className="text-xs">
                            Start testing to see events here
                          </p>
                        </div>
                      ) : (
                        testResults.map((result, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 border rounded-lg border-white/10 bg-white/5"
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                result.status === "success"
                                  ? "bg-green-400"
                                  : result.status === "error"
                                    ? "bg-red-400"
                                    : "bg-yellow-400"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-white">
                                {result.event}
                              </div>
                              <div className="text-xs text-white/70">
                                {result.details}
                              </div>
                            </div>
                            <div className="text-xs text-white/60">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {testResults.length > 0 && (
                  <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2">
                      ✅ Tracking Status:
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/80">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Script Loaded</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>User Tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Product Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Purchase Tracking</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Navigation - only show for unverified businesses */}
      {business.domainVerified !== true && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={currentStep === 3 ? finishSetup : nextStep}
            disabled={!canProceedToNext()}
            className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            {currentStep === 3 ? "Finish Setup" : "Next Step"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
