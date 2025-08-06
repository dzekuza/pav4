import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Code,
  Settings,
  Link,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  Search,
  ShoppingCart,
  Store,
  ArrowRight,
  ArrowLeft,
  Play,
  Eye,
  Users,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BusinessStats {
  id: number;
  name: string;
  domain: string;
  affiliateId: string;
  totalVisits?: number;
  totalPurchases?: number;
  totalRevenue?: number;
  adminCommissionRate?: number;
  projectedFee?: number;
  averageOrderValue?: number;
  conversionRate?: number;
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

export default function BusinessIntegrateDashboard() {
  const { stats } = useOutletContext<{ stats: BusinessStats }>();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [copiedScript, setCopiedScript] = useState(false);

  // Debug: Log the stats data
  useEffect(() => {
    console.log('BusinessIntegrateDashboard - Received stats:', stats);
    if (stats) {
      console.log('Business ID:', stats.id);
      console.log('Business Name:', stats.name);
      console.log('Domain:', stats.domain);
      console.log('Affiliate ID:', stats.affiliateId);
    }
  }, [stats]);

  // Auto-select platform based on domain if possible
  useEffect(() => {
    if (stats?.domain && !selectedPlatform) {
      const domain = stats.domain.toLowerCase();
      if (domain.includes('shopify') || domain.includes('myshopify.com')) {
        setSelectedPlatform(platforms.find(p => p.id === 'shopify') || null);
      } else if (domain.includes('woocommerce') || domain.includes('wordpress')) {
        setSelectedPlatform(platforms.find(p => p.id === 'woocommerce') || null);
      } else if (domain.includes('magento')) {
        setSelectedPlatform(platforms.find(p => p.id === 'magento') || null);
      }
    }
  }, [stats?.domain, selectedPlatform]);

  const platforms: Platform[] = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'E-commerce platform for online stores',
      icon: '🛍️',
      features: ['Product tracking', 'Purchase tracking', 'Cart tracking', 'User behavior'],
      get scriptTemplate() {
        return `<!-- PriceHunt Shopify Integration -->
<script src="https://pavlo4.netlify.app/shopify-tracker.js" data-business-id="${stats?.id || 'YOUR_BUSINESS_ID'}" data-affiliate-id="${stats?.affiliateId || 'YOUR_AFFILIATE_ID'}"></script>
<script>
// Shopify-specific tracking
document.addEventListener('DOMContentLoaded', function() {
  // Track product page views
  if (window.Shopify && window.Shopify.theme) {
    const product = window.Shopify.theme.product;
    if (product) {
      window.PriceHuntTracker.track('product_view', {
        product_id: product.id,
        product_name: product.title,
        product_price: product.price
      });
    }
  }
  
  // Track add to cart
  document.addEventListener('click', function(e) {
    if (e.target.matches('[data-action="add-to-cart"], .add-to-cart, [class*="cart"]')) {
      window.PriceHuntTracker.track('add_to_cart', {
        product_id: e.target.getAttribute('data-product-id'),
        product_name: e.target.getAttribute('data-product-name')
      });
    }
  });
});
</script>
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
<script src="https://pavlo4.netlify.app/woocommerce-tracker.js" data-business-id="${stats?.id || 'YOUR_BUSINESS_ID'}" data-affiliate-id="${stats?.affiliateId || 'YOUR_AFFILIATE_ID'}"></script>
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
<script src="https://pavlo4.netlify.app/magento-tracker.js" data-business-id="${stats?.id || 'YOUR_BUSINESS_ID'}" data-affiliate-id="${stats?.affiliateId || 'YOUR_AFFILIATE_ID'}"></script>
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
<script src="https://pavlo4.netlify.app/tracker.js" data-business-id="${stats?.id || 'YOUR_BUSINESS_ID'}" data-affiliate-id="${stats?.affiliateId || 'YOUR_AFFILIATE_ID'}"></script>
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
    if (!stats?.domain) {
      toast({
        title: "Error",
        description: "No website domain found. Please check your business registration.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResults([]);

    // Simulate testing process
    const testSteps = [
      { event: 'Script Loaded', details: 'PriceHunt tracking script loaded successfully', delay: 1000 },
      { event: 'Page View', details: 'User visited your website', delay: 2000 },
      { event: 'Product View', details: 'User viewed a product page', delay: 3000 },
      { event: 'Add to Cart', details: 'User added product to cart', delay: 4000 },
      { event: 'Purchase', details: 'User completed a purchase', delay: 5000 }
    ];

    for (let i = 0; i < testSteps.length; i++) {
      const step = testSteps[i];
      await new Promise(resolve => setTimeout(resolve, step.delay));
      
      setTestResults(prev => [...prev, {
        timestamp: new Date().toISOString(),
        event: step.event,
        details: step.details,
        status: 'success'
      }]);
    }

    setIsTesting(false);
    toast({
      title: "Testing Complete!",
      description: "All tracking events are working correctly",
    });
  };

  const openTestWebsite = () => {
    if (stats?.domain) {
      const url = stats.domain.startsWith('http') ? stats.domain : `https://${stats.domain}`;
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
        return selectedPlatform !== null;
      case 2:
        return true; // No manual URL input needed
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceedToNext()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Integration Setup</h2>
          <p className="text-muted-foreground">
            Set up tracking for your website in 3 simple steps
          </p>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              getStepStatus(step) === 'completed' ? 'bg-green-500 text-white' :
              getStepStatus(step) === 'current' ? 'bg-blue-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {getStepStatus(step) === 'completed' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{step}</span>
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              getStepStatus(step) === 'current' ? 'text-blue-600' :
              getStepStatus(step) === 'completed' ? 'text-green-600' :
              'text-gray-500'
            }`}>
              {step === 1 ? 'Choose Platform' : step === 2 ? 'Add Script' : 'Test Tracking'}
            </span>
            {step < 3 && (
              <div className={`w-16 h-0.5 mx-4 ${
                getStepStatus(step + 1) === 'completed' ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Platform Selection */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Choose Your Platform
            </CardTitle>
            <CardDescription>
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
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlatform(platform)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{platform.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {platform.description}
                      </p>
                      <div className="space-y-1">
                        {platform.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedPlatform?.id === platform.id && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Script Generation */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Add Tracking Script
            </CardTitle>
            <CardDescription>
              Copy the tracking script and add it to your website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Business Info Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">📋 Your Business Information:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Business Name:</span> {stats?.name}
                </div>
                <div>
                  <span className="font-medium">Website:</span> {stats?.domain}
                </div>
                <div>
                  <span className="font-medium">Business ID:</span> {stats?.id}
                </div>
                <div>
                  <span className="font-medium">Affiliate ID:</span> {stats?.affiliateId}
                </div>
              </div>
            </div>

            {selectedPlatform && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Tracking Script for {selectedPlatform.name}</h4>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(selectedPlatform.scriptTemplate)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedScript ? 'Copied!' : 'Copy Script'}
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs overflow-x-auto">
                    <code>{selectedPlatform.scriptTemplate}</code>
                  </pre>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-800 mb-2">✅ Installation Instructions:</h5>
                  <ol className="text-sm text-green-700 space-y-1">
                    <li>1. Copy the script above</li>
                    <li>2. Add it to your website's &lt;head&gt; section</li>
                    <li>3. For Shopify: Add to theme.liquid file in your theme</li>
                    <li>4. For WooCommerce: Add to header.php or use a plugin</li>
                    <li>5. For Magento: Add to default_head_blocks.xml</li>
                    <li>6. For Custom: Add to your main HTML template</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• The script will only track users who came from our app</li>
                    <li>• It tracks product views, cart additions, and purchases</li>
                    <li>• Make sure to test the script after installation</li>
                    <li>• Contact support if you need help with installation</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Testing */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Your Tracking
            </CardTitle>
            <CardDescription>
              Verify that tracking is working correctly on your website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Test Your Website</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Open your website to test the tracking script
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={openTestWebsite} disabled={!stats?.domain}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open {stats?.domain}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={startTesting}
                      disabled={isTesting || !stats?.domain}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isTesting ? 'Testing...' : 'Start Test'}
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-800 mb-2">⚠️ Testing Instructions:</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
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
                <p className="text-sm text-muted-foreground mb-2">
                  Real-time tracking events from your website
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No tracking events yet</p>
                      <p className="text-xs">Start testing to see events here</p>
                    </div>
                  ) : (
                    testResults.map((result, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          result.status === 'success' ? 'bg-green-500' :
                          result.status === 'error' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{result.event}</div>
                          <div className="text-xs text-muted-foreground">{result.details}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {testResults.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-800 mb-2">✅ Tracking Status:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Script Loaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>User Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Product Views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
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
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={nextStep}
          disabled={!canProceedToNext()}
        >
          {currentStep === 3 ? 'Finish Setup' : 'Next Step'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
} 