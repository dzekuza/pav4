import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import { useBusinessAuth } from "@/hooks/use-auth";
import { SearchHeader } from "@/components/SearchHeader";

const SCRIPTS = {
  shopify: {
    label: "Shopify",
    code: `<!-- Start Affiliate script -->
<script>
const params = new URLSearchParams(window.location.search);
const redirectApp = params.get("redirect_app");
if (redirectApp) {
  fetch(window.location.origin + "/api/track-sale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId: redirectApp,
      domain: location.hostname,
      orderId: Shopify.checkout?.order_id,
      amount: Shopify.checkout?.total_price
    })
  });
}
</script>
<!-- End Affiliate script -->`
  },
  woocommerce: {
    label: "WooCommerce (WordPress)",
    code: `<!-- Start Affiliate script -->
add_action('woocommerce_thankyou', 'track_business_purchase', 10, 1);
function track_business_purchase($order_id) {
  $order = wc_get_order($order_id);
  $redirectApp = $_COOKIE['redirect_app'] ?? $_GET['redirect_app'] ?? null;

  if ($redirectApp) {
    wp_remote_post($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/api/track-sale', [
      'method' => 'POST',
      'body'   => json_encode([
        'businessId' => $redirectApp,
        'orderId'    => $order_id,
        'amount'     => $order->get_total(),
        'domain'     => $_SERVER['HTTP_HOST']
      ]),
      'headers' => ['Content-Type' => 'application/json']
    ]);
  }
}
<!-- End Affiliate script -->`
  },
  custom: {
    label: "Custom/Other",
    code: `<!-- Start Affiliate script -->
<script>
(function() {
  const redirectApp = new URLSearchParams(window.location.search).get("redirect_app") || localStorage.getItem("redirect_app");
  if (redirectApp) localStorage.setItem("redirect_app", redirectApp);

  if (window.location.href.includes("thank-you")) {
    fetch(window.location.origin + "/api/track-sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: redirectApp,
        orderId: window.orderId || 'custom-id',
        amount: window.orderAmount || '0.00',
        domain: window.location.hostname
      })
    });
  }
})();
</script>
<!-- End Affiliate script -->`
  }
};

const TUTORIALS = {
  shopify: [
    "Go to your Shopify admin panel.",
    "Navigate to Online Store > Themes > Actions > Edit Code.",
    "Open the 'Checkout' or 'Additional Scripts' section (or add to your thank you page template).",
    "Paste the script below just before </body> or in the custom scripts area.",
    "Save and publish your changes.",
    "Your affiliate ID will be automatically included in product URLs from our platform."
  ],
  woocommerce: [
    "Log in to your WordPress admin dashboard.",
    "Go to Appearance > Theme File Editor or use a custom plugin for code snippets.",
    "Paste the PHP code below into your theme's functions.php or a custom plugin.",
    "Save the file and test a purchase to ensure tracking works.",
    "Your affiliate ID will be automatically included in product URLs from our platform."
  ],
  custom: [
    "Copy the script below.",
    "Paste it into your thank you or order confirmation page, just before </body>.",
    "Make sure your page exposes orderId and orderAmount as global JS variables if possible.",
    "Test a purchase to ensure tracking works.",
    "Your affiliate ID will be automatically included in product URLs from our platform."
  ]
};

export default function BusinessIntegrate() {
  const { business } = useBusinessAuth();
  const [selected, setSelected] = useState<"shopify" | "woocommerce" | "custom">("shopify");
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<null | { success: boolean; message: string }>(null);
  const [testing, setTesting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SCRIPTS[selected].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/track-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business?.affiliateId || "PAV00000001",
          orderId: "order-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          amount: (Math.random() * 100 + 10).toFixed(2), // Random realistic amount between $10-$110
          domain: business?.domain || window.location.hostname,
          customerId: "test-customer-" + Math.floor(Math.random() * 1000) // Optional customer ID
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult({ success: true, message: `Test successful! Sale tracked for ${data.business}.` });
        
        // Mark tracking as verified if test was successful
        try {
          await fetch('/api/business/verify-tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
        } catch (error) {
          console.error('Failed to mark tracking as verified:', error);
        }
      } else {
        setTestResult({ success: false, message: "Test failed. Please check your integration or contact support." });
      }
    } catch (e) {
      setTestResult({ success: false, message: "Network error. Please try again or contact support." });
    } finally {
      setTesting(false);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <SearchHeader showBackButton={false} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Integration Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Integrate Affiliate Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Select your platform and follow the step-by-step instructions to add affiliate/sale tracking to your store. If you need help, contact support.
              </p>
              <Tabs value={selected} onValueChange={v => setSelected(v as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="shopify">Shopify</TabsTrigger>
                  <TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                <TabsContent value="shopify">
                  <TutorialSteps steps={TUTORIALS.shopify} />
                  <IntegrationCode code={SCRIPTS.shopify.code} copied={copied && selected === "shopify"} onCopy={handleCopy} />
                  <TestConnectionButton onTest={handleTest} result={testResult} testing={testing} />
                </TabsContent>
                <TabsContent value="woocommerce">
                  <TutorialSteps steps={TUTORIALS.woocommerce} />
                  <IntegrationCode code={SCRIPTS.woocommerce.code} copied={copied && selected === "woocommerce"} onCopy={handleCopy} />
                  <TestConnectionButton onTest={handleTest} result={testResult} testing={testing} />
                </TabsContent>
                <TabsContent value="custom">
                  <TutorialSteps steps={TUTORIALS.custom} />
                  <IntegrationCode code={SCRIPTS.custom.code} copied={copied && selected === "custom"} onCopy={handleCopy} />
                  <TestConnectionButton onTest={handleTest} result={testResult} testing={testing} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TutorialSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="mb-4 list-decimal list-inside space-y-1 text-sm text-muted-foreground">
      {steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
  );
}

function IntegrationCode({ code, copied, onCopy }: { code: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="relative">
      <pre className="bg-muted rounded p-4 text-xs overflow-x-auto whitespace-pre-wrap mb-2">
        {code}
      </pre>
      <Button size="sm" variant="outline" onClick={onCopy} className="absolute top-2 right-2">
        <Copy className="h-4 w-4 mr-1" />
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}

function TestConnectionButton({ onTest, result, testing }: { onTest: () => void; result: any; testing: boolean }) {
  const { business } = useBusinessAuth();
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Connection Status</span>
        {business?.trackingVerified && (
          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
            ✓ Verified
          </Badge>
        )}
      </div>
      <Button size="sm" variant="secondary" onClick={onTest} disabled={testing}>
        {testing ? "Testing..." : "Test Connection"}
      </Button>
      {result && (
        <div className={`mt-2 text-sm ${result.success ? "text-green-600" : "text-red-600"}`}>{result.message}</div>
      )}
    </div>
  );
} 