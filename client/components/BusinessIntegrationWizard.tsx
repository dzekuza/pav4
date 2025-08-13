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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null,
  );
  const [scriptPlatform, setScriptPlatform] = useState<Platform | null>(
    null,
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [copiedScript, setCopiedScript] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

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
        setSelectedPlatform(platforms.find((p) => p.id === "shopify-simple") || null);
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
      setScriptPlatform(platforms.find((p) => p.id === "shopify-simple") || null);
    }
  }, [scriptPlatform]);

  const platforms: Platform[] = [
    {
      id: "shopify-simple",
      name: "Shopify (Simple)",
      description:
        "One-line script integration for basic tracking",
      icon: "🛍️",
      features: [
        "Simple one-line script",
        "Automatic enhanced loading",
        "AJAX cart support",
        "Comprehensive debugging",
        "Debug functions",
      ],
      get scriptTemplate() {
        return `<!-- PriceHunt Shopify Integration -->
<script src="https://pavlo4.netlify.app/shopify-tracker-loader.js" data-business-id="${business?.id || "YOUR_BUSINESS_ID"}" data-affiliate-id="${business?.affiliateId || "YOUR_AFFILIATE_ID"}" data-debug="true"></script>
<!-- End PriceHunt Shopify Integration -->`;
      },
    },
    {
      id: "shopify",
      name: "Shopify (Web Pixel)",
      description:
        "Advanced web pixel integration for enhanced checkout tracking",
      icon: "🛍️",
      features: [
        "Web Pixels API support",
        "Enhanced checkout tracking",
        "Complete event coverage",
        "Rich data extraction",
        "SKU and barcode tracking",
        "Address and payment data",
        "Discount code tracking",
      ],
      get scriptTemplate() {
        return `// Copy this code into your web pixel extension
import {register} from '@shopify/web-pixels-extension';

register(({analytics}) => {
  // Configuration
  const config = {
    apiUrl: "https://pavlo4.netlify.app/.netlify/functions/track-event",
    businessId: "${business?.id || "YOUR_BUSINESS_ID"}",
    affiliateId: "${business?.affiliateId || "YOUR_AFFILIATE_ID"}",
    apiKey: "16272754ed68cbdcb55e8f579703d92e"
  };

  // Extract business ID and affiliate ID from URL parameters
  function extractBusinessId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('business_id') || 
           urlParams.get('utm_source') || 
           config.businessId;
  }

  function extractAffiliateId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('affiliate_id') || 
           urlParams.get('utm_medium') || 
           config.affiliateId;
  }

  // Generate unique session ID
  function generateSessionId() {
    return \`webpixel_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }

  // Send tracking data to our API
  function sendTrackingData(eventType, data) {
    const businessId = extractBusinessId();
    const affiliateId = extractAffiliateId();
    
    const trackingData = {
      event_type: eventType,
      business_id: businessId,
      affiliate_id: affiliateId,
      platform: "shopify",
      session_id: generateSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: Date.now(),
      url: window.location.href,
      page_title: document.title,
      data: {
        ...data,
        shop_domain: window.location.hostname,
        source: "shopify-web-pixel"
      }
    };

    // Send to our API
    fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${config.apiKey}\`
      },
      body: JSON.stringify(trackingData),
      keepalive: true
    })
    .then(response => {
      if (response.ok) {
        console.log(\`[PriceHunt Web Pixel] \${eventType} event sent successfully\`);
        return response.json();
      } else {
        throw new Error(\`HTTP \${response.status}\`);
      }
    })
    .catch(error => {
      console.error(\`[PriceHunt Web Pixel] Failed to send \${eventType} event:\`, error);
    });
  }

  // Track page viewed events
  analytics.subscribe('page_viewed', (event) => {
    console.log('[PriceHunt Web Pixel] Page viewed event:', event);
    
    const pageData = {
      page_title: event.data.page.title,
      page_url: event.data.page.url,
      page_type: event.data.page.type,
      page_id: event.data.page.id
    };

    // Add cart data if available
    if (event.data.cart) {
      pageData.cart = {
        id: event.data.cart.id,
        total_price: event.data.cart.totalPrice?.amount,
        currency: event.data.cart.totalPrice?.currencyCode,
        item_count: event.data.cart.lineItems?.length || 0
      };
    }

    // Add customer data if available
    if (event.data.customer) {
      pageData.customer = {
        id: event.data.customer.id,
        email: event.data.customer.email,
        first_name: event.data.customer.firstName,
        last_name: event.data.customer.lastName
      };
    }

    sendTrackingData('page_view', pageData);
  });

  // Track product viewed events
  analytics.subscribe('product_viewed', (event) => {
    console.log('[PriceHunt Web Pixel] Product viewed event:', event);
    
    const product = event.data.product;
    const productData = {
      product_id: product.id,
      product_name: product.title,
      product_type: product.productType,
      vendor: product.vendor,
      price: product.price?.amount,
      currency: product.price?.currencyCode,
      compare_at_price: product.compareAtPrice?.amount,
      available: product.availableForSale,
      tags: product.tags,
      category: product.productType
    };

    // Add variant data if available
    if (event.data.variant) {
      const variant = event.data.variant;
      productData.variant = {
        id: variant.id,
        title: variant.title,
        price: variant.price?.amount,
        compare_at_price: variant.compareAtPrice?.amount,
        available: variant.availableForSale,
        sku: variant.sku,
        barcode: variant.barcode
      };
    }

    sendTrackingData('product_view', productData);
  });

  // Track add to cart events
  analytics.subscribe('product_added_to_cart', (event) => {
    console.log('[PriceHunt Web Pixel] Product added to cart event:', event);
    
    const product = event.data.product;
    const variant = event.data.variant;
    
    const cartData = {
      product_id: product.id,
      product_name: product.title,
      product_type: product.productType,
      vendor: product.vendor,
      variant_id: variant.id,
      variant_title: variant.title,
      price: variant.price?.amount,
      currency: variant.price?.currencyCode,
      quantity: event.data.quantity,
      total_price: (parseFloat(variant.price?.amount || 0) * event.data.quantity).toString()
    };

    // Add cart context if available
    if (event.data.cart) {
      cartData.cart = {
        id: event.data.cart.id,
        total_price: event.data.cart.totalPrice?.amount,
        item_count: event.data.cart.lineItems?.length || 0
      };
    }

    sendTrackingData('add_to_cart', cartData);
  });

  // Track checkout started events
  analytics.subscribe('checkout_started', (event) => {
    console.log('[PriceHunt Web Pixel] Checkout started event:', event);
    
    const checkout = event.data.checkout;
    
    const checkoutData = {
      checkout_id: checkout.id,
      total_price: checkout.totalPrice?.amount,
      currency: checkout.totalPrice?.currencyCode,
      subtotal_price: checkout.subtotalPrice?.amount,
      total_tax: checkout.totalTax?.amount,
      total_discounts: checkout.totalDiscounts?.amount,
      item_count: checkout.lineItems?.length || 0,
      email: checkout.email,
      phone: checkout.phone,
      customer_id: checkout.customer?.id
    };

    // Extract line items
    if (checkout.lineItems) {
      checkoutData.items = checkout.lineItems.map(item => ({
        product_id: item.product?.id,
        variant_id: item.variant?.id,
        title: item.title,
        quantity: item.quantity,
        price: item.cost?.totalAmount?.amount,
        discount: item.discountAllocations?.[0]?.amount
      }));
    }

    // Extract discount codes
    if (checkout.discountApplications) {
      checkoutData.discount_codes = checkout.discountApplications
        .filter(discount => discount.type === 'DISCOUNT_CODE')
        .map(discount => discount.title);
    }

    sendTrackingData('checkout_start', checkoutData);
  });

  // Track checkout completed events (most important!)
  analytics.subscribe('checkout_completed', (event) => {
    console.log('[PriceHunt Web Pixel] Checkout completed event:', event);
    
    const checkout = event.data.checkout;
    
    const orderData = {
      checkout_id: checkout.id,
      order_id: checkout.order?.id,
      total_price: checkout.totalPrice?.amount,
      currency: checkout.totalPrice?.currencyCode,
      subtotal_price: checkout.subtotalPrice?.amount,
      total_tax: checkout.totalTax?.amount,
      total_discounts: checkout.totalDiscounts?.amount,
      item_count: checkout.lineItems?.length || 0,
      email: checkout.email,
      phone: checkout.phone,
      customer_id: checkout.customer?.id,
      shipping_address: checkout.shippingAddress ? {
        first_name: checkout.shippingAddress.firstName,
        last_name: checkout.shippingAddress.lastName,
        address1: checkout.shippingAddress.address1,
        address2: checkout.shippingAddress.address2,
        city: checkout.shippingAddress.city,
        province: checkout.shippingAddress.province,
        country: checkout.shippingAddress.country,
        zip: checkout.shippingAddress.zip
      } : null,
      billing_address: checkout.billingAddress ? {
        first_name: checkout.billingAddress.firstName,
        last_name: checkout.billingAddress.lastName,
        address1: checkout.billingAddress.address1,
        address2: checkout.billingAddress.address2,
        city: checkout.billingAddress.city,
        province: checkout.billingAddress.province,
        country: checkout.billingAddress.country,
        zip: checkout.billingAddress.zip
      } : null
    };

    // Extract line items
    if (checkout.lineItems) {
      orderData.items = checkout.lineItems.map(item => ({
        product_id: item.product?.id,
        variant_id: item.variant?.id,
        title: item.title,
        quantity: item.quantity,
        price: item.cost?.totalAmount?.amount,
        discount: item.discountAllocations?.[0]?.amount,
        sku: item.variant?.sku,
        barcode: item.variant?.barcode
      }));
    }

    // Extract discount codes
    if (checkout.discountApplications) {
      orderData.discount_codes = checkout.discountApplications
        .filter(discount => discount.type === 'DISCOUNT_CODE')
        .map(discount => discount.title);
    }

    // Extract payment information
    if (checkout.paymentTerms) {
      orderData.payment_terms = checkout.paymentTerms;
    }

    sendTrackingData('purchase_complete', orderData);
  });

  // Track cart viewed events
  analytics.subscribe('cart_viewed', (event) => {
    console.log('[PriceHunt Web Pixel] Cart viewed event:', event);
    
    const cart = event.data.cart;
    
    const cartData = {
      cart_id: cart.id,
      total_price: cart.totalPrice?.amount,
      currency: cart.totalPrice?.currencyCode,
      subtotal_price: cart.subtotalPrice?.amount,
      total_tax: cart.totalTax?.amount,
      total_discounts: cart.totalDiscounts?.amount,
      item_count: cart.lineItems?.length || 0
    };

    // Extract line items
    if (cart.lineItems) {
      cartData.items = cart.lineItems.map(item => ({
        product_id: item.product?.id,
        variant_id: item.variant?.id,
        title: item.title,
        quantity: item.quantity,
        price: item.cost?.totalAmount?.amount
      }));
    }

    sendTrackingData('cart_view', cartData);
  });

  // Track collection viewed events
  analytics.subscribe('collection_viewed', (event) => {
    console.log('[PriceHunt Web Pixel] Collection viewed event:', event);
    
    const collection = event.data.collection;
    
    const collectionData = {
      collection_id: collection.id,
      collection_title: collection.title,
      collection_handle: collection.handle,
      collection_description: collection.description,
      products_count: collection.productsCount
    };

    sendTrackingData('collection_view', collectionData);
  });

  // Track search events
  analytics.subscribe('search_submitted', (event) => {
    console.log('[PriceHunt Web Pixel] Search submitted event:', event);
    
    const searchData = {
      search_term: event.data.searchTerm,
      results_count: event.data.resultsCount
    };

    sendTrackingData('search', searchData);
  });

  console.log('[PriceHunt Web Pixel] Web pixel registered successfully with comprehensive event tracking');
});`;
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
<script src="https://pavlo4.netlify.app/woocommerce-tracker.js" data-business-id="${business?.id || "YOUR_BUSINESS_ID"}" data-affiliate-id="${business?.affiliateId || "YOUR_AFFILIATE_ID"}"></script>
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
<script src="https://pavlo4.netlify.app/magento-tracker.js" data-business-id="${business?.id || "YOUR_BUSINESS_ID"}" data-affiliate-id="${business?.affiliateId || "YOUR_AFFILIATE_ID"}"></script>
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
<script src="https://pavlo4.netlify.app/tracker.js" data-business-id="${business?.id || "YOUR_BUSINESS_ID"}" data-affiliate-id="${business?.affiliateId || "YOUR_AFFILIATE_ID"}"></script>
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

  const generateVerificationToken = async () => {
    if (!domain.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      console.log("Generating verification token for domain:", domain.trim());
      const response = await fetch("/api/domain-verification/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessId: business.id,
          domain: domain.trim(),
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        setVerificationToken(data.verificationToken);
        if (data.isVerified) {
          toast({
            title: "Domain Already Verified",
            description: "Your domain is already verified and ready to use.",
          });
        } else if (data.isExisting) {
          toast({
            title: "Existing Token Found",
            description:
              "Using your existing verification token. No need to add a new DNS record.",
          });
        } else {
          toast({
            title: "Verification Token Generated",
            description:
              "Please add the TXT record to your domain DNS settings",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate verification token",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating verification token:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate verification token";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyDomain = async () => {
    if (!verificationToken) {
      toast({
        title: "Error",
        description: "Please generate a verification token first",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      console.log(
        "Verifying domain:",
        domain.trim(),
        "with token:",
        verificationToken,
      );
      const response = await fetch("/api/domain-verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessId: business.id,
          domain: domain.trim(),
          verificationToken,
        }),
      });

      console.log("Verification response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Verification response data:", data);

      if (data.success) {
        toast({
          title: "Domain Verified!",
          description: "Your domain has been successfully verified",
        });
        // Move to next step
        setCurrentStep(2);
      } else {
        toast({
          title: "Verification Failed",
          description:
            data.error || "Please check your DNS settings and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying domain:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify domain";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

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
        description: "No website domain found. Please verify your domain first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    
    try {
      const websiteUrl = domain.startsWith("http") ? domain : `https://${domain}`;
      
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
          description: "The tracking script is properly installed and working on your website.",
        });
        
        // Add a success result
        setTestResults([{
          timestamp: new Date().toISOString(),
          event: "Script Verification",
          details: "Tracking script found and verified on website",
          status: "success" as const,
        }]);
      } else {
        toast({
          title: "❌ Script Not Found",
          description: data.error || "The tracking script was not found on your website. Please install it and try again.",
          variant: "destructive",
        });
        
        // Add an error result
        setTestResults([{
          timestamp: new Date().toISOString(),
          event: "Script Verification",
          details: data.error || "Script not found on website",
          status: "error" as const,
        }]);
      }
    } catch (error) {
      console.error("Error testing script presence:", error);
      toast({
        title: "Error",
        description: "Failed to test script presence. Please check your domain and try again.",
        variant: "destructive",
      });
      
      // Add an error result
      setTestResults([{
        timestamp: new Date().toISOString(),
        event: "Script Verification",
        details: "Failed to test script presence",
        status: "error" as const,
      }]);
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
        return business.domainVerified || (domain && verificationToken);
      case 2:
        return selectedPlatform !== null;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceedToNext()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
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
      description: "Your tracking integration has been successfully set up. Redirecting to dashboard...",
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
      const websiteUrl = business.domain.startsWith("http") ? business.domain : `https://${business.domain}`;
      
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
          description: data.error || "Unable to verify tracking script on your website.",
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

  return (
    <div className="space-y-6 text-white">
      {/* Show different content based on verification status */}
      {business.domainVerified === true ? (
        // Verified Business - Show Status Dashboard
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Integration Status</h2>
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
                <h4 className="font-medium text-white mb-3">📋 Business Information:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                  <div>
                    <span className="font-medium text-white">Business Name:</span> {business?.name}
                  </div>
                  <div>
                    <span className="font-medium text-white">Website:</span> {business?.domain}
                  </div>
                  <div>
                    <span className="font-medium text-white">Business ID:</span> {business?.id}
                  </div>
                  <div>
                    <span className="font-medium text-white">Affiliate ID:</span> {business?.affiliateId}
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white">🔗 Connection Status</h4>
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
                    <span className="text-sm text-white/80">Domain Verified</span>
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

              {/* Your Script Section */}
              <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white">📜 Your Script</h4>
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
                          Test Script
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (scriptPlatform) {
                          navigator.clipboard.writeText(scriptPlatform.scriptTemplate);
                          toast({
                            title: "Script Copied!",
                            description: "Your tracking script has been copied to clipboard",
                          });
                        }
                      }}
                      disabled={!scriptPlatform}
                      className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Script
                    </Button>
                  </div>
                </div>

                {/* Platform Selection for Script */}
                <div className="mb-4">
                  <Label className="text-white text-sm mb-2 block">Select Platform:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: "shopify-simple", name: "Shopify Simple", icon: "🛍️" },
                      { id: "shopify", name: "Shopify Web Pixel", icon: "🛍️" },
                      { id: "woocommerce", name: "WooCommerce", icon: "🛒" },
                      { id: "magento", name: "Magento", icon: "🏢" },
                      { id: "custom", name: "Custom", icon: "🌐" }
                    ].map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => setScriptPlatform(platforms.find(p => p.id === platform.id) || null)}
                        className={`p-2 rounded-lg border text-sm transition-all ${
                          scriptPlatform?.id === platform.id
                            ? "border-white bg-white/10 text-white"
                            : "border-white/10 hover:border-white/20 bg-white/5 text-white/70 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{platform.icon}</span>
                          <span>{platform.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {scriptPlatform && (
                  <>
                    <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-4">
                      <pre className="text-xs overflow-x-auto text-white">
                        <code>{scriptPlatform.scriptTemplate}</code>
                      </pre>
                    </div>

                    <div className="text-sm text-white/70 space-y-2">
                      <p><strong>Need to re-add your script?</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Copy the script above</li>
                        <li>Add it to your website's &lt;head&gt; section</li>
                        {scriptPlatform.id === "shopify" && (
                          <li>For Shopify: Add to theme.liquid file in your theme</li>
                        )}
                        {scriptPlatform.id === "woocommerce" && (
                          <li>For WooCommerce: Add to header.php or use a plugin</li>
                        )}
                        {scriptPlatform.id === "magento" && (
                          <li>For Magento: Add to default_head_blocks.xml</li>
                        )}
                        {scriptPlatform.id === "custom" && (
                          <li>For Custom: Add to your main HTML template</li>
                        )}
                      </ul>
                      <p className="mt-3 text-xs">
                        <strong>Tip:</strong> The script automatically loads enhanced tracking features and debugging tools.
                      </p>
                    </div>

                    {/* Test Results Display */}
                    {testResults.length > 0 && (
                      <div className="mt-4 border border-white/10 bg-white/5 rounded-lg p-4">
                        <h6 className="font-medium text-white mb-3">Script Test Results:</h6>
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
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">⚡ Quick Actions</h4>
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
                    onClick={() => window.location.href = "/business/dashboard/analytics"}
                    className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = "/business/dashboard/activity"}
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
              <h2 className="text-2xl font-bold text-white">Integration Setup</h2>
              <p className="text-white/70">
                Set up tracking for your website in 4 simple steps
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
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
                    ? "Verify Domain"
                    : step === 2
                      ? "Choose Platform"
                      : step === 3
                        ? "Add Script"
                        : "Test Tracking"}
                </span>
                {step < 4 && (
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
          {/* Step 1: Domain Verification */}
          {currentStep === 1 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5" />
              Verify Domain Ownership
            </CardTitle>
            <CardDescription className="text-white/80">
              Verify that you own the domain where you'll install the tracking
              script
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {business.domainVerified ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Domain Already Verified!
                </h3>
                <p className="text-white/70 mb-4">
                  Your domain <strong>{business.domain}</strong> has been
                  verified and is ready for integration.
                </p>
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                >
                  Continue to Platform Selection
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="domain" className="text-white">
                      Website Domain
                    </Label>
                    <Input
                      id="domain"
                      type="text"
                      placeholder="example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <p className="text-sm text-white/70 mt-1">
                      Enter your domain without http:// or https:// (e.g.,
                      mysite.com)
                    </p>
                  </div>

                  <Button
                    onClick={generateVerificationToken}
                    disabled={isVerifying || !domain.trim()}
                    className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Token...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Generate Verification Token
                      </>
                    )}
                  </Button>
                </div>

                {verificationToken && (
                  <div className="border border-white/10 bg-white/5 rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">
                        📋 DNS Verification Instructions:
                      </h4>
                      <ol className="text-sm text-white/80 space-y-2">
                        <li>
                          1. Log into your domain registrar or DNS provider
                        </li>
                        <li>2. Add a new TXT record to your domain</li>
                        <li>3. Use the following values:</li>
                      </ol>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-white">
                            Record Type:
                          </span>
                          <div className="text-white/80">TXT</div>
                        </div>
                        <div>
                          <span className="font-medium text-white">
                            Name/Host:
                          </span>
                          <div className="text-white/80">
                            @ (or leave empty)
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-white">Value:</span>
                          <div className="text-white/80 font-mono text-xs break-all">
                            pricehunt-verification={verificationToken}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-white">TTL:</span>
                          <div className="text-white/80">300 (or default)</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={verifyDomain}
                        disabled={isVerifying}
                        className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verify Domain
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setVerificationToken("")}
                        className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                      >
                        Generate New Token
                      </Button>
                    </div>

                    <div className="border border-yellow-500/20 bg-yellow-500/10 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <div className="text-sm text-white/80">
                          <p className="font-medium text-white mb-1">
                            Important Notes:
                          </p>
                          <ul className="space-y-1">
                            <li>
                              • DNS changes can take up to 24 hours to propagate
                            </li>
                            <li>
                              • Most DNS providers update within 5-30 minutes
                            </li>
                            <li>
                              • Make sure to add the TXT record exactly as shown
                            </li>
                            <li>
                              • You can verify the record using online DNS
                              lookup tools
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Platform Selection */}
      {currentStep === 2 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Store className="h-5 w-5" />
              Choose Your Platform
            </CardTitle>
            <CardDescription className="text-white/80">
              Select the platform your website is built on to get the
              appropriate tracking script
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
                          <div key={index} className="flex items-center gap-2">
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

      {/* Step 3: Script Generation */}
      {currentStep === 3 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Code className="h-5 w-5" />
              Add Tracking Script
            </CardTitle>
            <CardDescription className="text-white/80">
              Copy the tracking script and add it to your website
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
                  <span className="font-medium text-white">Business Name:</span>{" "}
                  {business?.name}
                </div>
                <div>
                  <span className="font-medium text-white">Website:</span>{" "}
                  {domain || business?.domain}
                </div>
                <div>
                  <span className="font-medium text-white">Business ID:</span>{" "}
                  {business?.id}
                </div>
                <div>
                  <span className="font-medium text-white">Affiliate ID:</span>{" "}
                  {business?.affiliateId}
                </div>
              </div>
            </div>

            {selectedPlatform && (
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
                    <li>1. Copy the simplified script above</li>
                    <li>2. Add it to your website's &lt;head&gt; section</li>
                    <li>
                      3. For Shopify: Add to theme.liquid file in your theme
                    </li>
                    <li>
                      4. For WooCommerce: Add to header.php or use a plugin
                    </li>
                    <li>5. For Magento: Add to default_head_blocks.xml</li>
                    <li>6. For Custom: Add to your main HTML template</li>
                    <li>
                      7. The loader will automatically fetch the full tracking
                      script
                    </li>
                    <li>
                      8. <strong>For Shopify:</strong> Consider using Web Pixels API for enhanced checkout tracking
                    </li>
                  </ol>
                </div>

                <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-2">
                    ⚠️ Important Notes:
                  </h5>
                  <ul className="text-sm text-white/80 space-y-1">
                    <li>• Simple one-line script - no complex code needed</li>
                    <li>• Automatically loads enhanced tracking features</li>
                    <li>
                      • Tracks product views, cart additions, and purchases
                    </li>
                    <li>• Enhanced debugging available in browser console</li>
                    <li>• Use PriceHuntDebug functions for testing</li>
                    <li>• Make sure to test the script after installation</li>
                    <li>
                      • Contact support if you need help with installation
                    </li>
                  </ul>
                </div>

                {/* Test Script Button */}
                <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="font-medium text-white mb-1">
                        🧪 Test Your Script
                      </h5>
                      <p className="text-sm text-white/70">
                        Verify that the tracking script is properly installed and working on your website
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const websiteUrl = domain.startsWith("http") ? domain : `https://${domain}`;
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
                    <p><strong>What this test does:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Checks if the tracking script is loaded on your website</li>
                      <li>Verifies script functionality and configuration</li>
                      <li>Confirms business ID and affiliate ID are correct</li>
                      <li>Provides detailed feedback on script status</li>
                    </ul>
                    <p className="mt-3 text-xs">
                      <strong>Tip:</strong> Make sure you've added the script to your website before testing.
                    </p>
                  </div>

                  {/* Test Results Display */}
                  {testResults.length > 0 && (
                    <div className="mt-4 border border-white/10 bg-white/5 rounded-lg p-4">
                      <h6 className="font-medium text-white mb-3">Test Results:</h6>
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Testing */}
      {currentStep === 4 && (
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
            onClick={currentStep === 4 ? finishSetup : nextStep}
            disabled={!canProceedToNext()}
            className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            {currentStep === 4 ? "Finish Setup" : "Next Step"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
