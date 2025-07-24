import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy } from "lucide-react";

const SCRIPTS = {
  shopify: {
    label: "Shopify",
    code: `<!-- Start Affiliate script -->
<script>
const params = new URLSearchParams(window.location.search);
const trackUser = params.get("track_user");
if (trackUser) {
  fetch("https://pavlo4.netlify.app/api/track-sale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: trackUser,
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
add_action('woocommerce_thankyou', 'track_user_purchase', 10, 1);
function track_user_purchase($order_id) {
  $order = wc_get_order($order_id);
  $track_user = $_COOKIE['track_user'] ?? $_GET['track_user'] ?? null;

  if ($track_user) {
    wp_remote_post('https://pavlo4.netlify.app/api/track-sale', [
      'method' => 'POST',
      'body'   => json_encode([
        'user'    => $track_user,
        'orderId' => $order_id,
        'amount'  => $order->get_total(),
        'domain'  => $_SERVER['HTTP_HOST']
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
  const trackUser = new URLSearchParams(window.location.search).get("track_user") || localStorage.getItem("track_user");
  if (trackUser) localStorage.setItem("track_user", trackUser);

  if (window.location.href.includes("thank-you")) {
    fetch("https://pavlo4.netlify.app/api/track-sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: trackUser,
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
    "Save and publish your changes."
  ],
  woocommerce: [
    "Log in to your WordPress admin dashboard.",
    "Go to Appearance > Theme File Editor or use a custom plugin for code snippets.",
    "Paste the PHP code below into your theme's functions.php or a custom plugin.",
    "Save the file and test a purchase to ensure tracking works."
  ],
  custom: [
    "Copy the script below.",
    "Paste it into your thank you or order confirmation page, just before </body>.",
    "Make sure your page exposes orderId and orderAmount as global JS variables if possible.",
    "Test a purchase to ensure tracking works."
  ]
};

export default function BusinessIntegrate() {
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
      const res = await fetch("https://pavlo4.netlify.app/api/track-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: "test-user",
          orderId: "test-order-" + Math.floor(Math.random() * 10000),
          amount: "1.23",
          domain: window.location.hostname
        })
      });
      if (res.ok) {
        setTestResult({ success: true, message: "Test successful! Tracking endpoint is working." });
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
    <div className="max-w-2xl mx-auto py-8">
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
  return (
    <div className="mt-4">
      <Button size="sm" variant="secondary" onClick={onTest} disabled={testing}>
        {testing ? "Testing..." : "Test Connection"}
      </Button>
      {result && (
        <div className={`mt-2 text-sm ${result.success ? "text-green-600" : "text-red-600"}`}>{result.message}</div>
      )}
    </div>
  );
} 