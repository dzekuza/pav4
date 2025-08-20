import type { ActionFunctionArgs } from "@remix-run/node";
import { Card, Link, Page, Text } from '@shopify/polaris';

export async function action({ request }: ActionFunctionArgs) {
  // Handle OPTIONS requests for CORS preflight
  if (request.method === "OPTIONS") {
    const url = new URL(request.url);
    
    // Specifically handle /collector endpoint
    if (url.pathname === "/collector") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }
  }
  
  // For non-OPTIONS requests or non-collector paths, return 404
  throw new Response("Not Found", { status: 404 });
}

export default function() {
  return (
    <Page>
      <Card >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Text variant="heading3xl" as="h2">404</Text>
          <Text variant="headingMd" as="h6">Page Not Found</Text>
          <Link url='/'>Return to Home</Link>
        </div>
      </Card>
    </Page>
  );
}
