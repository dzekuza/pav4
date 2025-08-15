import { useGadget } from "@gadgetinc/react-shopify-app-bridge";
import { useLoaderData, Outlet } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Page, Card, Text, Box, Banner, Button } from "@shopify/polaris";
import { NavMenu } from "../components/NavMenu";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { useEffect, useState } from "react";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  return json({
    gadgetConfig: context.gadgetConfig,
  });
};

export default function() {
  const { isAuthenticated, loading, error } = useGadget();
  const [authDebug, setAuthDebug] = useState({
    attempts: 0,
    lastCheck: null as Date | null,
    errors: [] as string[]
  });

  // Debug logging for authentication issues
  useEffect(() => {
    console.log('🔐 Authentication Debug:', {
      isAuthenticated,
      loading,
      error: error?.message,
      timestamp: new Date().toISOString()
    });

    setAuthDebug(prev => ({
      attempts: prev.attempts + 1,
      lastCheck: new Date(),
      errors: error ? [...prev.errors, error.message] : prev.errors
    }));
  }, [isAuthenticated, loading, error]);

  // Retry mechanism for authentication
  useEffect(() => {
    if (!isAuthenticated && !loading && authDebug.attempts < 3) {
      const timer = setTimeout(() => {
        console.log('🔄 Retrying authentication...');
        // Force a re-render to retry authentication
        window.location.reload();
      }, 2000 * (authDebug.attempts + 1)); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, authDebug.attempts]);

  if (loading) {
    console.log('⏳ Loading authentication state...');
    return <FullPageSpinner />;
  }

  if (error) {
    console.error('❌ Authentication error:', error);
    return (
      <Page>
        <Card padding="500">
          <Banner tone="critical" title="Authentication Error">
            <p>Failed to authenticate with Shopify: {error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Retry Authentication
            </Button>
          </Banner>
        </Card>
      </Page>
    );
  }

  if (isAuthenticated) {
    console.log('✅ Authentication successful');
    return (
      <>
        <NavMenu />
        <Outlet />
      </>
    );
  }

  console.log('❌ Not authenticated, showing unauthenticated state');
  return <Unauthenticated authDebug={authDebug} />;
}

const Unauthenticated = ({ authDebug }: { authDebug: any }) => {
  const { gadgetConfig } = useLoaderData<typeof loader>();

  return (
    <Page>
      <div style={{ height: "80px" }}>
        <Card padding="500">
          <Text variant="headingLg" as="h1">
            App must be viewed in the Shopify Admin
          </Text>
          <Box paddingBlockStart="200">
            <Text variant="bodyLg" as="p">
              Edit this page:{" "}
              <a
                href={`/edit/${gadgetConfig.environment}/files/web/routes/_app.tsx`}
              >
                web/routes/_app.tsx
              </a>
            </Text>
          </Box>
          
          {/* Debug information */}
          <Box paddingBlockStart="400">
            <Banner tone="info" title="Debug Information">
              <p>Authentication attempts: {authDebug.attempts}</p>
              <p>Last check: {authDebug.lastCheck?.toISOString()}</p>
              {authDebug.errors.length > 0 && (
                <div>
                  <p>Recent errors:</p>
                  <ul>
                    {authDebug.errors.slice(-3).map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Banner>
          </Box>
        </Card>
      </div>
    </Page>
  );
};
