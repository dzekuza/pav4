import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  trackProductClick, 
  trackCustomEvent, 
  createShopifyTrackingUrl,
  generateAffiliateLink 
} from "@/lib/tracking";

const TrackingTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testProductClick = async () => {
    setIsLoading(true);
    try {
      const product = {
        id: 'test_123',
        title: 'Test Wireless Headphones',
        name: 'Test Wireless Headphones',
        price: '29.99 EUR',
        url: 'https://test-shopify-store.myshopify.com/product/test-product',
        retailer: 'Test Store'
      };

      addResult('Testing product click tracking...');
      
      const result = await trackProductClick(product, 'test-shopify-store.myshopify.com');
      
      if (result.success) {
        addResult(`✅ Product click tracked successfully! Target URL: ${result.targetUrl}`);
      } else {
        addResult('❌ Product click tracking failed');
      }
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCustomEvent = async () => {
    setIsLoading(true);
    try {
      addResult('Testing custom event tracking...');
      
      const success = await trackCustomEvent('test_event', {
        testData: 'This is a test event',
        timestamp: new Date().toISOString()
      }, 'test-shopify-store.myshopify.com');
      
      if (success) {
        addResult('✅ Custom event tracked successfully!');
      } else {
        addResult('❌ Custom event tracking failed');
      }
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testShopifyTrackingUrl = () => {
    try {
      addResult('Testing Shopify tracking URL generation...');
      
      const originalUrl = 'https://test-shopify-store.myshopify.com/product/test-product';
      const trackingUrl = createShopifyTrackingUrl(originalUrl, 'test-shopify-store.myshopify.com', {
        id: 'test_123',
        name: 'Test Product',
        price: '29.99',
        category: 'Electronics'
      });
      
      addResult(`✅ Tracking URL generated: ${trackingUrl}`);
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testAffiliateLink = () => {
    try {
      addResult('Testing affiliate link generation...');
      
      const originalUrl = 'https://amazon.com/product/test';
      const affiliateUrl = generateAffiliateLink(
        originalUrl, 
        'amazon', 
        'test-shopify-store.myshopify.com',
        'Test Product'
      );
      
      addResult(`✅ Affiliate URL generated: ${affiliateUrl}`);
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tracking System Test</h1>
          <p className="text-gray-600">
            Test the enhanced tracking functionality for ipick.io Shopify integration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Product Click Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test the enhanced product click tracking with Shopify integration
              </p>
              <Button 
                onClick={testProductClick} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Product Click'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Event Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test custom event tracking to the Shopify system
              </p>
              <Button 
                onClick={testCustomEvent} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Custom Event'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shopify Tracking URL</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test Shopify-specific tracking URL generation
              </p>
              <Button 
                onClick={testShopifyTrackingUrl} 
                disabled={isLoading}
                className="w-full"
              >
                Test Tracking URL
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Affiliate Link Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test enhanced affiliate link generation
              </p>
              <Button 
                onClick={testAffiliateLink} 
                disabled={isLoading}
                className="w-full"
              >
                Test Affiliate Link
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Results</CardTitle>
              <Button variant="outline" size="sm" onClick={clearResults}>
                Clear Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center">No test results yet. Run a test to see results here.</p>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Integration Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default">✅</Badge>
              <span>Enhanced tracking functions added to lib/tracking.ts</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✅</Badge>
              <span>ProductCard component updated with new tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✅</Badge>
              <span>ComparisonGrid supports businessDomain prop</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✅</Badge>
              <span>Shopify webhook endpoints configured</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✅</Badge>
              <span>UTM parameter generation enhanced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingTest;
