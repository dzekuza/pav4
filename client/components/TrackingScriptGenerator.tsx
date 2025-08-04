import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Copy, Check, ExternalLink, Code, Settings } from 'lucide-react';

interface TrackingScriptGeneratorProps {
    businessId: number;
    businessName: string;
    businessDomain: string;
}

export const TrackingScriptGenerator: React.FC<TrackingScriptGeneratorProps> = ({
    businessId,
    businessName,
    businessDomain
}) => {
    const [copied, setCopied] = useState(false);
    const [debugMode, setDebugMode] = useState(false);

    // Generate the tracking script
    const generateTrackingScript = () => {
        const script = `<!-- PriceHunt Sales Tracking Script for ${businessName} -->
<script src="https://pavlo4.netlify.app/tracker.js"></script>
<script>
window.trackerInit({
  storeId: ${businessId},
  userSessionId: '{{USER_SESSION_ID}}', // Replace with actual session ID
  productId: '{{PRODUCT_ID}}', // Replace with actual product ID
  debug: ${debugMode}
});
</script>`;
        return script;
    };

    // Generate the complete HTML example
    const generateHtmlExample = () => {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} - Product Page</title>
    
    <!-- PriceHunt Sales Tracking Script -->
    <script src="https://pavlo4.netlify.app/tracker.js"></script>
    <script>
    window.trackerInit({
        storeId: ${businessId},
        userSessionId: 'user-session-123',
        productId: 'product-456',
        debug: ${debugMode}
    });
    </script>
</head>
<body>
    <h1>Product Title</h1>
    <p>Price: $99.99</p>
    
    <!-- Purchase button - will be automatically tracked -->
    <button onclick="addToCart()">Add to Cart</button>
    <button onclick="buyNow()">Buy Now</button>
    
    <!-- Checkout form - will be automatically tracked -->
    <form action="/checkout" method="POST">
        <input type="text" name="email" placeholder="Email" required>
        <input type="text" name="card" placeholder="Card Number" required>
        <button type="submit">Complete Purchase</button>
    </form>
    
    <script>
    function addToCart() {
        // Your cart logic here
        console.log('Added to cart');
    }
    
    function buyNow() {
        // Your buy now logic here
        console.log('Buy now clicked');
    }
    </script>
</body>
</html>`;
    };

    // Copy to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const trackingScript = generateTrackingScript();
    const htmlExample = generateHtmlExample();

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Sales Tracking Script Generator
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Add this tracking script to your website to automatically track sales and commissions.
                </p>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Configuration */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <h3 className="font-semibold">Configuration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="businessId">Business ID</Label>
                            <Input id="businessId" value={businessId} readOnly />
                        </div>
                        <div>
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input id="businessName" value={businessName} readOnly />
                        </div>
                        <div>
                            <Label htmlFor="businessDomain">Domain</Label>
                            <Input id="businessDomain" value={businessDomain} readOnly />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="debugMode"
                                checked={debugMode}
                                onChange={(e) => setDebugMode(e.target.checked)}
                                className="rounded"
                            />
                            <Label htmlFor="debugMode">Debug Mode (shows tracking logs in console)</Label>
                        </div>
                    </div>
                </div>

                {/* Alert */}
                <Alert>
                    <AlertDescription>
                        <strong>Important:</strong> Replace <code>USER_SESSION_ID</code> and <code>PRODUCT_ID</code> with actual values from your website.
                        The script will automatically detect purchases and send them to our API.
                    </AlertDescription>
                </Alert>

                {/* Tabs */}
                <Tabs defaultValue="script" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="script">Tracking Script</TabsTrigger>
                        <TabsTrigger value="example">HTML Example</TabsTrigger>
                        <TabsTrigger value="test">Test Page</TabsTrigger>
                    </TabsList>

                    <TabsContent value="script" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Copy this script to your website:</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(trackingScript)}
                                className="flex items-center gap-2"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copied!' : 'Copy Script'}
                            </Button>
                        </div>
                        <Textarea
                            value={trackingScript}
                            readOnly
                            className="font-mono text-sm h-32"
                        />
                    </TabsContent>

                    <TabsContent value="example" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Complete HTML example:</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(htmlExample)}
                                className="flex items-center gap-2"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copied!' : 'Copy Example'}
                            </Button>
                        </div>
                        <Textarea
                            value={htmlExample}
                            readOnly
                            className="font-mono text-sm h-96"
                        />
                    </TabsContent>

                    <TabsContent value="test" className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <Label>Test your tracking script:</Label>
                                <p className="text-sm text-muted-foreground">
                                    Create a test page with this script to verify tracking is working.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm">Test Page URL</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Create a test page on your website with the tracking script and visit it to test.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => window.open(`https://${businessDomain}/test-tracking`, '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Visit Test Page
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm">Manual Test</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Test the tracking manually by calling the API directly.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => {
                                                fetch('https://pavlo4.netlify.app/api/sales/track', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        orderId: 'TEST-ORDER-' + Date.now(),
                                                        businessId: businessId,
                                                        productUrl: 'https://example.com/test-product',
                                                        productTitle: 'Test Product',
                                                        productPrice: 99.99,
                                                        retailer: businessDomain
                                                    })
                                                }).then(response => response.json())
                                                    .then(data => {
                                                        console.log('Test sale tracked:', data);
                                                        alert('Test sale tracked successfully!');
                                                    }).catch(error => {
                                                        console.error('Test failed:', error);
                                                        alert('Test failed. Check console for details.');
                                                    });
                                            }}
                                        >
                                            Run Test Sale
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Features */}
                <div className="space-y-4">
                    <h3 className="font-semibold">What the tracking script does:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Auto-detection</Badge>
                                <span className="text-sm">Detects purchase forms and buttons</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Page monitoring</Badge>
                                <span className="text-sm">Monitors for purchase confirmation pages</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Storage tracking</Badge>
                                <span className="text-sm">Tracks localStorage/sessionStorage changes</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">UTM tracking</Badge>
                                <span className="text-sm">Captures UTM parameters automatically</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Session tracking</Badge>
                                <span className="text-sm">Tracks user sessions and referrers</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Error handling</Badge>
                                <span className="text-sm">Graceful error handling and retries</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Implementation Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Copy the tracking script above</li>
                        <li>Add it to the <code>&lt;head&gt;</code> section of your website</li>
                        <li>Replace <code>USER_SESSION_ID</code> with actual user session IDs</li>
                        <li>Replace <code>PRODUCT_ID</code> with actual product IDs</li>
                        <li>Test the implementation using the test page</li>
                        <li>Monitor sales in your business dashboard</li>
                    </ol>
                </div>
            </CardContent>
        </Card>
    );
};

export default TrackingScriptGenerator; 