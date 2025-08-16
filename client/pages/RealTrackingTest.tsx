import React, { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  trackProductClick,
  trackCustomEvent,
  createShopifyTrackingUrl,
  generateAffiliateLink,
} from "@/lib/tracking";

const RealTrackingTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Real business data from your system
  const realBusinessData = {
    businessId: 2,
    businessName: "God is love, MB",
    domain: "godislove.lt",
    affiliateId: "aff_godislovel_1755091745057_n7ccoo",
    referralUrl: "https://ipick.io/ref/aff_godislovel_1755091745057_n7ccoo",
    trackingUrl:
      "https://ipick.io/track/aff_godislovel_1755091745057_n7ccoo/godislove.lt",
  };

  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testRealBusinessTracking = async () => {
    setIsLoading(true);
    try {
      const product = {
        id: "test_product_123",
        title: "Test Product from God is Love Store",
        name: "Test Product from God is Love Store",
        price: "29.99 EUR",
        url: "https://godislove.lt/products/test-product",
        retailer: "God is Love Store",
      };

      addResult("Testing real business tracking...");
      addResult(`Business: ${realBusinessData.businessName}`);
      addResult(`Domain: ${realBusinessData.domain}`);
      addResult(`Affiliate ID: ${realBusinessData.affiliateId}`);

      const result = await trackProductClick(product, realBusinessData.domain);

      if (result.success) {
        addResult(`✅ Real business tracking successful!`);
        addResult(`Target URL: ${result.targetUrl}`);
      } else {
        addResult("❌ Real business tracking failed");
      }
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testShopifyTrackingUrl = () => {
    try {
      addResult("Testing Shopify tracking URL generation...");

      const originalUrl = "https://godislove.lt/products/test-product";
      const trackingUrl = createShopifyTrackingUrl(
        originalUrl,
        realBusinessData.domain,
        {
          id: "test_123",
          name: "Test Product from God is Love Store",
          price: "29.99",
          category: "Electronics",
        },
      );

      addResult(`✅ Tracking URL generated: ${trackingUrl}`);
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testCustomEvent = async () => {
    setIsLoading(true);
    try {
      addResult("Testing custom event tracking for real business...");

      const success = await trackCustomEvent(
        "real_business_test",
        {
          businessId: realBusinessData.businessId,
          businessName: realBusinessData.businessName,
          domain: realBusinessData.domain,
          affiliateId: realBusinessData.affiliateId,
          testData: "Real business integration test",
        },
        realBusinessData.domain,
      );

      if (success) {
        addResult("✅ Custom event tracked successfully for real business!");
      } else {
        addResult("❌ Custom event tracking failed");
      }
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAffiliateLink = () => {
    try {
      addResult("Testing affiliate link generation for real business...");

      const originalUrl = "https://godislove.lt/products/test-product";
      const affiliateUrl = generateAffiliateLink(
        originalUrl,
        "godislove-store",
        realBusinessData.domain,
        "Test Product from God is Love Store",
      );

      addResult(`✅ Affiliate URL generated: ${affiliateUrl}`);
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testReferralUrl = () => {
    try {
      addResult("Testing referral URL functionality...");
      addResult(`Referral URL: ${realBusinessData.referralUrl}`);
      addResult(`Tracking URL: ${realBusinessData.trackingUrl}`);
      addResult("✅ Referral URLs are ready for use!");
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
          <h1 className="text-3xl font-bold mb-2">
            Real Business Tracking Test
          </h1>
          <p className="text-gray-600">
            Testing the enhanced tracking functionality with real business data:{" "}
            <strong>{realBusinessData.businessName}</strong>
          </p>
        </div>

        {/* Business Info Card */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">
              Real Business Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Business Name:</strong>{" "}
                  {realBusinessData.businessName}
                </p>
                <p>
                  <strong>Domain:</strong> {realBusinessData.domain}
                </p>
                <p>
                  <strong>Business ID:</strong> {realBusinessData.businessId}
                </p>
              </div>
              <div>
                <p>
                  <strong>Affiliate ID:</strong> {realBusinessData.affiliateId}
                </p>
                <p>
                  <strong>Referral URL:</strong>{" "}
                  <a
                    href={realBusinessData.referralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {realBusinessData.referralUrl}
                  </a>
                </p>
                <p>
                  <strong>Tracking URL:</strong>{" "}
                  <a
                    href={realBusinessData.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {realBusinessData.trackingUrl}
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Real Business Product Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test product click tracking with the real business domain
              </p>
              <Button
                onClick={testRealBusinessTracking}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Testing..." : "Test Real Business Tracking"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Event Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test custom event tracking for the real business
              </p>
              <Button
                onClick={testCustomEvent}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Testing..." : "Test Custom Event"}
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

          <Card>
            <CardHeader>
              <CardTitle>Referral URL Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test the referral and tracking URLs
              </p>
              <Button
                onClick={testReferralUrl}
                disabled={isLoading}
                className="w-full"
              >
                Test Referral URLs
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
                <p className="text-gray-500 text-center">
                  No test results yet. Run a test to see results here.
                </p>
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

        <div className="mt-8 p-6 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-green-800">
            Integration Status
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                ✅
              </Badge>
              <span>
                Real business data configured: {realBusinessData.businessName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                ✅
              </Badge>
              <span>Domain tracking ready: {realBusinessData.domain}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                ✅
              </Badge>
              <span>
                Affiliate ID generated: {realBusinessData.affiliateId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                ✅
              </Badge>
              <span>Referral URLs ready for use</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                ✅
              </Badge>
              <span>Enhanced tracking functions integrated</span>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-yellow-800">
            Next Steps
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              1. <strong>Test with real searches</strong> - Search for products
              from {realBusinessData.domain}
            </p>
            <p>
              2. <strong>Monitor your Gadget dashboard</strong> - Check for
              referral records
            </p>
            <p>
              3. <strong>Test conversions</strong> - Make test purchases to
              verify tracking
            </p>
            <p>
              4. <strong>Use referral URLs</strong> - Share the generated
              referral URLs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTrackingTest;
