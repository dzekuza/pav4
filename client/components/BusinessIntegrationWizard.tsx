import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BusinessStats {
  id: number;
  name: string;
  domain?: string;
  domainVerified?: boolean;
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
  status: 'success' | 'error' | 'pending';
}

interface BusinessIntegrationWizardProps {
  business: BusinessStats;
}

export default function BusinessIntegrationWizard({ business }: BusinessIntegrationWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [domain, setDomain] = useState(business.domain || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [copiedScript, setCopiedScript] = useState(false);

  // Cleanup any running timers on unmount
  useEffect(() => {
    return () => {
      if ((window as any).__ph_pollInterval) clearInterval((window as any).__ph_pollInterval);
      if ((window as any).__ph_stopTimeout) clearTimeout((window as any).__ph_stopTimeout);
    };
  }, []);

  // Auto-select platform based on domain if possible
  useEffect(() => {
    if (domain && !selectedPlatform) {
      const domainLower = domain.toLowerCase();
      if (domainLower.includes('shopify') || domainLower.includes('myshopify.com')) {
        setSelectedPlatform(platforms.find(p => p.id === 'shopify') || null);
      } else if (domainLower.includes('woocommerce') || domainLower.includes('wordpress')) {
        setSelectedPlatform(platforms.find(p => p.id === 'woocommerce') || null);
      } else if (domainLower.includes('magento')) {
        setSelectedPlatform(platforms.find(p => p.id === 'magento') || null);
      }
    }
  }, [domain, selectedPlatform]);

  const platforms: Platform[] = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Modern one-line integration with automatic enhanced tracking',
      icon: '🛍️',
      features: ['Simple one-line script', 'Automatic enhanced loading', 'AJAX cart support', 'Comprehensive debugging', 'Debug functions'],
      get scriptTemplate() {
        return `<!-- PriceHunt Shopify Integration -->
<script src="https://paaav.vercel.app/shopify-tracker-loader.js" data-business-id="${business?.id || 'YOUR_BUSINESS_ID'}" data-affiliate-id="${business?.affiliateId || 'YOUR_AFFILIATE_ID'}" data-debug="true"></script>
<!-- End PriceHunt Shopify Integration -->`;
      }
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: 'WordPress e-commerce plugin',
      icon: '🛒',
      features: ['Product tracking', 'Purchase tracking', 'Cart tracking', 'User behavior'],
      get scriptTemplate() {
        return `<!-- PriceHunt WooCommerce Integration -->
<script src="https://paaav.vercel.app/woocommerce-tracker.js" data-business-id="${business?.id || 'YOUR_BUSINESS_ID'}" data-affiliate-id="${business?.affiliateId || 'YOUR_AFFILIATE_ID'}"></script>
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
      }
    },
    {
      id: 'magento',
      name: 'Magento',
      description: 'Enterprise e-commerce platform',
      icon: '🏢',
      features: ['Product tracking', 'Purchase tracking', 'Cart tracking', 'User behavior'],
      get scriptTemplate() {
        return `<!-- PriceHunt Magento Integration -->
<script src="https://paaav.vercel.app/magento-tracker.js" data-business-id="${business?.id || 'YOUR_BUSINESS_ID'}" data-affiliate-id="${business?.affiliateId || 'YOUR_AFFILIATE_ID'}"></script>
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
      }
    },
    {
      id: 'custom',
      name: 'Custom Website',
      description: 'Any website with custom tracking',
      icon: '🌐',
      features: ['Basic tracking', 'Page views', 'User behavior', 'Custom events'],
      get scriptTemplate() {
        return `<!-- PriceHunt Custom Integration -->
<script src="https://paaav.vercel.app/tracker.js" data-business-id="${business?.id || 'YOUR_BUSINESS_ID'}" data-affiliate-id="${business?.affiliateId || 'YOUR_AFFILIATE_ID'}"></script>
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
      }
    }
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
      console.log('Generating verification token for domain:', domain.trim());
      const response = await fetch('/api/domain-verification/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          businessId: business.id,
          domain: domain.trim()
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setVerificationToken(data.verificationToken);
        toast({
          title: "Verification Token Generated",
          description: "Please add the TXT record to your domain DNS settings",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate verification token",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating verification token:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate verification token";
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
      console.log('Verifying domain:', domain.trim(), 'with token:', verificationToken);
      const response = await fetch('/api/domain-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          businessId: business.id,
          domain: domain.trim(),
          verificationToken
        })
      });

      console.log('Verification response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Verification response data:', data);
      
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
          description: data.error || "Please check your DNS settings and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to verify domain";
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
        description: "No website domain found. Please verify your domain first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResults([]);

    // Start polling for real tracking events
    if ((window as any).__ph_pollInterval) clearInterval((window as any).__ph_pollInterval);
    if ((window as any).__ph_stopTimeout) clearTimeout((window as any).__ph_stopTimeout);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tracking-events${business?.id ? `?business_id=${business.id}` : ''}` , {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.events.length > 0) {
            // Convert tracking events to test results
            const newEvents = data.events.map((event: any) => ({
                timestamp: event.timestamp,
                event: event.eventType,
                details: `Event from ${event.url || 'unknown page'}`,
                status: 'success' as const
            }));

            setTestResults(newEvents);
          }
        }
      } catch (error) {
        console.error('Error fetching tracking events:', error);
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
          description: "No tracking events were detected. Make sure the tracking script is installed on your website.",
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

  const generateTestEvents = async () => {
    try {
      const response = await fetch('/api/test-tracking', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: business?.id })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Test Events Created",
          description: data.message || "Test tracking events have been created successfully.",
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
      console.error('Error generating test events:', error);
      toast({
        title: "Error",
        description: "Failed to create test events. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openTestWebsite = () => {
    if (domain) {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      window.open(url, '_blank');
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
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
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="space-y-6 text-white">
      {/* Stepper Header */}
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              getStepStatus(step) === 'completed' ? 'bg-green-500 text-black' :
              getStepStatus(step) === 'current' ? 'bg-white text-black' :
              'bg-white/10 text-white/60'
            }`}>
              {getStepStatus(step) === 'completed' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{step}</span>
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              getStepStatus(step) === 'current' ? 'text-white' :
              getStepStatus(step) === 'completed' ? 'text-green-400' :
              'text-white/60'
            }`}>
              {step === 1 ? 'Verify Domain' : step === 2 ? 'Choose Platform' : step === 3 ? 'Add Script' : 'Test Tracking'}
            </span>
            {step < 4 && (
              <div className={`w-16 h-0.5 mx-4 ${
                getStepStatus(step + 1) === 'completed' ? 'bg-green-500' : 'bg-white/20'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Domain Verification */}
      {currentStep === 1 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5" />
              Verify Domain Ownership
            </CardTitle>
            <CardDescription className="text-white/80">
              Verify that you own the domain where you'll install the tracking script
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {business.domainVerified ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Domain Already Verified!</h3>
                <p className="text-white/70 mb-4">
                  Your domain <strong>{business.domain}</strong> has been verified and is ready for integration.
                </p>
                <Button onClick={() => setCurrentStep(2)} className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90">
                  Continue to Platform Selection
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="domain" className="text-white">Website Domain</Label>
                    <Input
                      id="domain"
                      type="text"
                      placeholder="example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <p className="text-sm text-white/70 mt-1">
                      Enter your domain without http:// or https:// (e.g., mysite.com)
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
                      <h4 className="font-medium text-white mb-2">📋 DNS Verification Instructions:</h4>
                      <ol className="text-sm text-white/80 space-y-2">
                        <li>1. Log into your domain registrar or DNS provider</li>
                        <li>2. Add a new TXT record to your domain</li>
                        <li>3. Use the following values:</li>
                      </ol>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-white">Record Type:</span>
                          <div className="text-white/80">TXT</div>
                        </div>
                        <div>
                          <span className="font-medium text-white">Name/Host:</span>
                          <div className="text-white/80">@ (or leave empty)</div>
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
                        onClick={() => setVerificationToken('')}
                        className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                      >
                        Generate New Token
                      </Button>
                    </div>

                    <div className="border border-yellow-500/20 bg-yellow-500/10 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <div className="text-sm text-white/80">
                          <p className="font-medium text-white mb-1">Important Notes:</p>
                          <ul className="space-y-1">
                            <li>• DNS changes can take up to 24 hours to propagate</li>
                            <li>• Most DNS providers update within 5-30 minutes</li>
                            <li>• Make sure to add the TXT record exactly as shown</li>
                            <li>• You can verify the record using online DNS lookup tools</li>
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
              Select the platform your website is built on to get the appropriate tracking script
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPlatform?.id === platform.id
                      ? 'border-white bg-white/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                  onClick={() => setSelectedPlatform(platform)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{platform.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{platform.name}</h3>
                      <p className="text-sm text-white/70 mb-2">
                        {platform.description}
                      </p>
                      <div className="space-y-1">
                        {platform.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="text-xs text-white/70">{feature}</span>
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
              <h4 className="font-medium text-white mb-2">📋 Your Business Information:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
                <div>
                  <span className="font-medium text-white">Business Name:</span> {business?.name}
                </div>
                <div>
                  <span className="font-medium text-white">Website:</span> {domain || business?.domain}
                </div>
                <div>
                  <span className="font-medium text-white">Business ID:</span> {business?.id}
                </div>
                <div>
                  <span className="font-medium text-white">Affiliate ID:</span> {business?.affiliateId}
                </div>
              </div>
            </div>

            {selectedPlatform && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Tracking Script for {selectedPlatform.name}</h4>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(selectedPlatform.scriptTemplate)}
                    className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedScript ? 'Copied!' : 'Copy Script'}
                  </Button>
                </div>
                
                <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-white">
                  <pre className="text-xs overflow-x-auto">
                    <code>{selectedPlatform.scriptTemplate}</code>
                  </pre>
                </div>

                <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-2">✅ Installation Instructions:</h5>
                  <ol className="text-sm text-white/80 space-y-1">
                    <li>1. Copy the simplified script above</li>
                    <li>2. Add it to your website's &lt;head&gt; section</li>
                    <li>3. For Shopify: Add to theme.liquid file in your theme</li>
                    <li>4. For WooCommerce: Add to header.php or use a plugin</li>
                    <li>5. For Magento: Add to default_head_blocks.xml</li>
                    <li>6. For Custom: Add to your main HTML template</li>
                    <li>7. The loader will automatically fetch the full tracking script</li>
                  </ol>
                </div>

                <div className="border border-white/10 bg-white/5 rounded-lg p-4">
                  <h5 className="font-medium text-white mb-2">⚠️ Important Notes:</h5>
                  <ul className="text-sm text-white/80 space-y-1">
                    <li>• Simple one-line script - no complex code needed</li>
                    <li>• Automatically loads enhanced tracking features</li>
                    <li>• Tracks product views, cart additions, and purchases</li>
                    <li>• Enhanced debugging available in browser console</li>
                    <li>• Use PriceHuntDebug functions for testing</li>
                    <li>• Make sure to test the script after installation</li>
                    <li>• Contact support if you need help with installation</li>
                  </ul>
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
                    <Button onClick={openTestWebsite} disabled={!domain} className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90">
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
                      {isTesting ? 'Testing...' : 'Start Test'}
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
                  <h5 className="font-medium text-white mb-2">⚠️ Testing Instructions:</h5>
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
                      <p className="text-xs">Start testing to see events here</p>
                    </div>
                  ) : (
                    testResults.map((result, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg border-white/10 bg-white/5">
                        <div className={`w-2 h-2 rounded-full ${
                          result.status === 'success' ? 'bg-green-400' :
                          result.status === 'error' ? 'bg-red-400' :
                          'bg-yellow-400'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-white">{result.event}</div>
                          <div className="text-xs text-white/70">{result.details}</div>
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
                <h5 className="font-medium text-white mb-2">✅ Tracking Status:</h5>
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

      {/* Navigation */}
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
          onClick={nextStep}
          disabled={!canProceedToNext()}
          className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
        >
          {currentStep === 4 ? 'Finish Setup' : 'Next Step'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
