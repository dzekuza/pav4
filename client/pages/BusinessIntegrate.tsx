import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Store
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BusinessIntegrate() {
  const navigate = useNavigate();
  const { business, isBusinessLoading, isBusiness } = useBusinessAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [scripts, setScripts] = useState([
    {
      id: 1,
      name: 'Universal Tracking Script',
      description: 'Basic script to track page visits and user interactions across all platforms',
      code: `<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://pavlo4.netlify.app/tracker.js';
  script.async = true;
  script.setAttribute('data-business-id', '${business?.id || 'YOUR_BUSINESS_ID'}');
  script.setAttribute('data-affiliate-id', '${business?.affiliateId || 'YOUR_AFFILIATE_ID'}');
  document.head.appendChild(script);
})();
</script>`,
      installed: false,
      platform: 'Universal'
    },
    {
      id: 2,
      name: 'Shopify Tracking Script',
      description: 'Enhanced script for Shopify stores with purchase tracking and conversion monitoring',
      code: `<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://pavlo4.netlify.app/shopify-tracker.js';
  script.async = true;
  script.setAttribute('data-business-id', '${business?.id || 'YOUR_BUSINESS_ID'}');
  script.setAttribute('data-affiliate-id', '${business?.affiliateId || 'YOUR_AFFILIATE_ID'}');
  script.setAttribute('data-platform', 'shopify');
  document.head.appendChild(script);
})();
</script>`,
      installed: false,
      platform: 'Shopify'
    },
    {
      id: 3,
      name: 'WooCommerce Tracking Script',
      description: 'WordPress WooCommerce integration for tracking purchases and user behavior',
      code: `<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://pavlo4.netlify.app/woocommerce-tracker.js';
  script.async = true;
  script.setAttribute('data-business-id', '${business?.id || 'YOUR_BUSINESS_ID'}');
  script.setAttribute('data-affiliate-id', '${business?.affiliateId || 'YOUR_AFFILIATE_ID'}');
  script.setAttribute('data-platform', 'woocommerce');
  document.head.appendChild(script);
})();
</script>`,
      installed: false,
      platform: 'WooCommerce'
    },
    {
      id: 4,
      name: 'Magento Tracking Script',
      description: 'Enterprise e-commerce tracking for Magento stores with advanced analytics',
      code: `<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://pavlo4.netlify.app/magento-tracker.js';
  script.async = true;
  script.setAttribute('data-business-id', '${business?.id || 'YOUR_BUSINESS_ID'}');
  script.setAttribute('data-affiliate-id', '${business?.affiliateId || 'YOUR_AFFILIATE_ID'}');
  script.setAttribute('data-platform', 'magento');
  document.head.appendChild(script);
})();
</script>`,
      installed: false,
      platform: 'Magento'
    },
    {
      id: 5,
      name: 'Custom Event Tracking',
      description: 'Track custom events like "Buy Now" clicks, "View Product" actions, and conversions',
      code: `<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://pavlo4.netlify.app/event-tracker.js';
  script.async = true;
  script.setAttribute('data-business-id', '${business?.id || 'YOUR_BUSINESS_ID'}');
  script.setAttribute('data-affiliate-id', '${business?.affiliateId || 'YOUR_AFFILIATE_ID'}');
  document.head.appendChild(script);
  
  // Track "Buy Now" clicks
  document.addEventListener('click', function(e) {
    if (e.target.matches('[data-track="buy-now"], .buy-now, .add-to-cart')) {
      window.trackEvent('purchase_click', {
        product_id: e.target.getAttribute('data-product-id'),
        product_name: e.target.getAttribute('data-product-name'),
        price: e.target.getAttribute('data-price')
      });
    }
  });
  
  // Track "View Product" clicks
  document.addEventListener('click', function(e) {
    if (e.target.matches('[data-track="view-product"], .product-link')) {
      window.trackEvent('product_view', {
        product_id: e.target.getAttribute('data-product-id'),
        product_name: e.target.getAttribute('data-product-name')
      });
    }
  });
})();
</script>`,
      installed: false,
      platform: 'Custom'
    }
  ]);

  // Redirect to business login if not authenticated
  useEffect(() => {
    if (!isBusinessLoading && !isBusiness) {
      navigate('/business-login');
    }
  }, [isBusinessLoading, isBusiness, navigate]);

  // Show loading while checking authentication
  if (isBusinessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isBusiness) {
    return null;
  }

  const copyToClipboard = async (text: string, scriptName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${scriptName} code copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const installScript = (scriptId: number) => {
    setScripts(scripts.map(script =>
      script.id === scriptId ? { ...script, installed: true } : script
    ));
    toast({
      title: "Script Installed",
      description: "The script has been marked as installed",
    });
  };

  const connectToNewPage = () => {
    navigate('/business/connect');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'shopify':
        return <Store className="h-4 w-4" />;
      case 'woocommerce':
        return <ShoppingCart className="h-4 w-4" />;
      case 'magento':
        return <Store className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors = {
      'shopify': 'bg-green-100 text-green-800',
      'woocommerce': 'bg-blue-100 text-blue-800',
      'magento': 'bg-orange-100 text-orange-800',
      'universal': 'bg-purple-100 text-purple-800',
      'custom': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge variant="secondary" className={colors[platform.toLowerCase() as keyof typeof colors] || colors.custom}>
        {getPlatformIcon(platform)}
        <span className="ml-1">{platform}</span>
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Business Integration
          </h1>
          <p className="text-gray-600">
            Add tracking scripts to your website to track sales and commissions
          </p>
        </div>

        {/* Business Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">Business ID</h3>
                <p className="text-sm text-gray-600">{business?.id || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Business Name</h3>
                <p className="text-sm text-gray-600">{business?.name || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Domain</h3>
                <p className="text-sm text-gray-600">{business?.domain || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Affiliate ID</h3>
                <p className="text-sm text-gray-600">{business?.affiliateId || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Status</h3>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="connect">Connect</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Overview</CardTitle>
                <CardDescription>
                  Track your integration progress and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">5</div>
                    <div className="text-sm text-gray-600">Available Scripts</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Installed Scripts</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">Connected Pages</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scripts Tab */}
          <TabsContent value="scripts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Available Scripts
                </CardTitle>
                <CardDescription>
                  Find and install tracking scripts for your website. These scripts will track user interactions and send data to our platform when users click "Buy Now" or "View Product" buttons.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scripts.map((script) => (
                    <div key={script.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{script.name}</h3>
                            {getPlatformBadge(script.platform)}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{script.description}</p>
                          <div className="p-3 bg-gray-100 rounded text-sm font-mono text-xs overflow-x-auto">
                            <pre>{script.code}</pre>
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            <p>• Tracks user interactions and purchase events</p>
                            <p>• Sends data to: https://pavlo4.netlify.app/api/track</p>
                            <p>• Business ID: {business?.id || 'YOUR_BUSINESS_ID'}</p>
                            <p>• Affiliate ID: {business?.affiliateId || 'YOUR_AFFILIATE_ID'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(script.code, script.name)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant={script.installed ? "default" : "outline"}
                            onClick={() => installScript(script.id)}
                            disabled={script.installed}
                          >
                            {script.installed ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Installed
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                Install
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connect Tab */}
          <TabsContent value="connect" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Connect New Page
                </CardTitle>
                <CardDescription>
                  Connect additional pages or domains to your business account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Connect New Page
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add tracking to additional pages or domains
                    </p>
                    <Button onClick={connectToNewPage} className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Connect Page
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Connected Pages</h3>
                    <div className="text-sm text-gray-600">
                      No pages connected yet. Use the button above to add your first page.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <CardDescription>
                  Configure your integration preferences and tracking options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tracking Configuration</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Enable conversion tracking</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Enable click tracking</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Enable analytics</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Track "Buy Now" clicks</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Track "View Product" clicks</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Commission Settings</h3>
                    <div className="text-sm text-gray-600">
                      Current commission rate: <span className="font-medium">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/business/dashboard" className="block text-blue-600 hover:text-blue-800">
                → Business Dashboard
              </a>
              <a href="/business/activity" className="block text-blue-600 hover:text-blue-800">
                → Business Activity
              </a>
              <a href="/" className="block text-blue-600 hover:text-blue-800">
                → Home Page
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 