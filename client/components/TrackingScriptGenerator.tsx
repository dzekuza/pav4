import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Copy, Check, ExternalLink, Code, Settings } from 'lucide-react';

interface TrackingScriptGeneratorProps {
  businessId: string;
  affiliateId: string;
  businessName: string;
}

export const TrackingScriptGenerator: React.FC<TrackingScriptGeneratorProps> = ({
  businessId,
  affiliateId,
  businessName
}) => {
  const [platform, setPlatform] = useState('shopify');
  const [debugMode, setDebugMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState('script');

  const generateScript = () => {
    const debugAttr = debugMode ? ' data-debug="true"' : '';
    
    if (platform === 'shopify') {
      return `<script 
  src="https://paaav.vercel.app/shopify-tracker.js" 
  data-business-id="${businessId}" 
  data-affiliate-id="${affiliateId}"${debugAttr}>
</script>`;
    } else if (platform === 'woocommerce') {
      return `<script 
  src="https://paaav.vercel.app/woocommerce-tracker.js" 
  data-business-id="${businessId}" 
  data-affiliate-id="${affiliateId}"${debugAttr}>
</script>`;
    } else if (platform === 'magento') {
      return `<script 
  src="https://paaav.vercel.app/magento-tracker.js" 
  data-business-id="${businessId}" 
  data-affiliate-id="${affiliateId}"${debugAttr}>
</script>`;
    } else {
      return `<script 
  src="https://paaav.vercel.app/tracker.js" 
  data-business-id="${businessId}" 
  data-affiliate-id="${affiliateId}" 
  data-platform="${platform}"${debugAttr}>
</script>`;
    }
  };

  const generateInstallationInstructions = () => {
    switch (platform) {
      case 'shopify':
        return [
          '1. Go to your Shopify admin panel',
          '2. Navigate to Online Store > Themes',
          '3. Click "Actions" > "Edit code" on your active theme',
          '4. Open the theme.liquid file (usually in the Layout folder)',
          '5. Find the closing </head> tag',
          '6. Paste the tracking script just before the </head> tag',
          '7. Click "Save" to apply the changes',
          '8. Test the tracking by visiting your store and checking the browser console'
        ];
      case 'woocommerce':
        return [
          '1. Go to your WordPress admin panel',
          '2. Navigate to Appearance > Theme Editor',
          '3. Select your active theme',
          '4. Open the header.php file',
          '5. Find the closing </head> tag',
          '6. Paste the tracking script just before the </head> tag',
          '7. Click "Update File" to save changes',
          '8. Test the tracking by visiting your store'
        ];
      case 'magento':
        return [
          '1. Go to your Magento admin panel',
          '2. Navigate to Content > Design > Configuration',
          '3. Click "Edit" on your active theme',
          '4. Go to the "HTML Head" section',
          '5. Add the tracking script to the "Scripts and Style Sheets" field',
          '6. Click "Save Configuration"',
          '7. Clear the cache (System > Cache Management)',
          '8. Test the tracking by visiting your store'
        ];
      default:
        return [
          '1. Add the tracking script to your website\'s <head> section',
          '2. Make sure it loads before any other scripts',
          '3. Test the tracking by visiting your website',
          '4. Check the browser console for any errors'
        ];
    }
  };

  const generateTestInstructions = () => {
    return [
      '1. Add the tracking script to your website',
      '2. Open your website in a browser',
      '3. Open the browser developer tools (F12)',
      '4. Go to the Console tab',
      '5. Look for tracking messages starting with "Tracking event:"',
      '6. Test by clicking on products, adding to cart, or completing purchases',
      '7. Check your business dashboard to see the tracking data'
    ];
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateScript());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openTestPage = () => {
    const testUrl = platform === 'shopify' 
      ? 'https://paaav.vercel.app/shopify-test.html'
      : 'https://paaav.vercel.app/test-tracking.html';
    window.open(testUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Tracking Script Generator
          </CardTitle>
          <CardDescription>
            Generate the tracking script for {businessName} to monitor affiliate performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">E-commerce Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shopify">Shopify</SelectItem>
                <SelectItem value="woocommerce">WooCommerce</SelectItem>
                <SelectItem value="magento">Magento</SelectItem>
                <SelectItem value="universal">Universal (Other)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Debug Mode */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="debug-mode"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="debug-mode">Enable debug mode (shows tracking logs in console)</Label>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 border-b">
            <button
              onClick={() => setSelectedTab('script')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                selectedTab === 'script'
                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tracking Script
            </button>
            <button
              onClick={() => setSelectedTab('instructions')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                selectedTab === 'instructions'
                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Installation
            </button>
            <button
              onClick={() => setSelectedTab('testing')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                selectedTab === 'testing'
                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Testing
            </button>
          </div>

          {/* Script Tab */}
          {selectedTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Generated Tracking Script</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openTestPage}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Test Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <Textarea
                  value={generateScript()}
                  readOnly
                  className="font-mono text-sm h-32 resize-none"
                />
                <Badge className="absolute top-2 right-2" variant="secondary">
                  {platform}
                </Badge>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> Add this script to your website's &lt;head&gt; section. 
                  The script will automatically track page views, product clicks, add-to-cart events, and purchases.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Instructions Tab */}
          {selectedTab === 'instructions' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Installation Steps for {platform.charAt(0).toUpperCase() + platform.slice(1)}:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {generateInstallationInstructions().map((step, index) => (
                    <li key={index} className="text-gray-700">{step}</li>
                  ))}
                </ol>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> After installation, it may take a few minutes for tracking data to appear in your dashboard.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Testing Tab */}
          {selectedTab === 'testing' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Testing Your Tracking Script:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {generateTestInstructions().map((step, index) => (
                    <li key={index} className="text-gray-700">{step}</li>
                  ))}
                </ol>
              </div>

              <div className="flex space-x-2">
                <Button onClick={openTestPage} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Test Page
                </Button>
                <Button variant="outline" onClick={() => setDebugMode(true)} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Enable Debug Mode
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Debug Mode:</strong> When enabled, the tracking script will log all events to the browser console, 
                  making it easier to verify that tracking is working correctly.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Business ID:</span>
              <Badge variant="outline" className="ml-2">{businessId}</Badge>
            </div>
            <div>
              <span className="font-medium">Affiliate ID:</span>
              <Badge variant="outline" className="ml-2">{affiliateId}</Badge>
            </div>
            <div>
              <span className="font-medium">Platform:</span>
              <Badge variant="outline" className="ml-2">{platform}</Badge>
            </div>
            <div>
              <span className="font-medium">Debug Mode:</span>
              <Badge variant={debugMode ? "default" : "secondary"} className="ml-2">
                {debugMode ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 