import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React, { lazy, Suspense, useState, useEffect } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { BusinessAuthProvider } from "@/hooks/use-auth";
import { NeonAuthProvider } from "@/components/auth/NeonAuthProvider";
import LoadingSkeleton from "@/components/ui/loading-skeleton";

import { initializeTracking } from "@/lib/tracking";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            <h2>Something went wrong</h2>
            <p>
              We're having trouble loading this page. Please try refreshing.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#007bff",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details style={{ marginTop: "20px", textAlign: "left" }}>
                <summary>Error Details</summary>
                <pre
                  style={{
                    background: "#f8f9fa",
                    padding: "10px",
                    borderRadius: "5px",
                    overflow: "auto",
                  }}
                >
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

const Index = lazy(() => import("./pages/Index"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const History = lazy(() => import("./pages/History"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DemoLanding = lazy(() => import("./pages/DemoLanding"));
import { UrlRedirectHandler } from "./components/UrlRedirectHandler";
const NewSearchResults = lazy(() => import("./pages/NewSearchResults"));
const BusinessRegistration = lazy(() =>
  import("./components/BusinessRegistration").then((m) => ({
    default: m.BusinessRegistration,
  })),
);
const BusinessManagement = lazy(() =>
  import("./pages/BusinessManagement").then((m) => ({
    default: m.BusinessManagement,
  })),
);
const BusinessLogin = lazy(() => import("./pages/BusinessLogin"));
const BusinessDashboardLayout = lazy(() =>
  import("./components/BusinessDashboardLayout").then((m) => ({
    default: m.default,
  })),
);
const BusinessDashboardHome = lazy(
  () => import("./pages/BusinessDashboardHome"),
);
const BusinessActivityDashboard = lazy(
  () => import("./pages/BusinessActivityDashboard"),
);
const BusinessIntegrateDashboard = lazy(
  () => import("./pages/BusinessIntegrateDashboard"),
);
const BusinessAnalyticsDashboard = lazy(
  () => import("./pages/BusinessAnalyticsDashboard"),
);
const BusinessSettingsDashboard = lazy(
  () => import("./pages/BusinessSettingsDashboard"),
);
const BusinessProductsDashboard = lazy(
  () => import("./pages/BusinessProductsDashboard"),
);
const BusinessAttributionDashboard = lazy(
  () => import("./pages/BusinessAttributionDashboard"),
);
const DashboardSelector = lazy(() => import("./components/DashboardSelector"));
const JourneyDashboard = lazy(() => import("./pages/JourneyDashboard"));
const Browse = lazy(() => import("./pages/Browse"));
const Landing2 = lazy(() => import("./pages/Landing2"));
const BusinessIntegrate = lazy(() => import("./pages/BusinessIntegrate"));
const BusinessActivity = lazy(() => import("./pages/BusinessActivity"));
const BusinessConnect = lazy(() => import("./pages/BusinessConnect"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TrackingTest = lazy(() => import("./pages/TrackingTest"));
const RealTrackingTest = lazy(() => import("./pages/RealTrackingTest"));

const queryClient = new QueryClient();

// Create router with future flags to suppress warnings
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <>
          <UrlRedirectHandler />
          <Suspense fallback={<LoadingSkeleton variant="landing" />}>
            <DemoLanding />
          </Suspense>
        </>
      ),
    },

    {
      path: "/https://*",
      element: (
        <>
          <UrlRedirectHandler />
          <Suspense fallback={<LoadingSkeleton variant="default" />}>
            <div>Processing URL...</div>
          </Suspense>
        </>
      ),
    },
    {
      path: "/http://*",
      element: (
        <>
          <UrlRedirectHandler />
          <Suspense fallback={<LoadingSkeleton variant="default" />}>
            <div>Processing URL...</div>
          </Suspense>
        </>
      ),
    },
    {
      path: "/browse",
      element: (
        <Suspense fallback={<LoadingSkeleton variant="default" />}>
          <Browse />
        </Suspense>
      ),
    },
    {
      path: "/browse/:category",
      element: (
        <Suspense fallback={<LoadingSkeleton variant="default" />}>
          <Browse />
        </Suspense>
      ),
    },
    {
      path: "/landing2",
      element: (
        <Suspense fallback={<LoadingSkeleton variant="landing" />}>
          <Landing2 />
        </Suspense>
      ),
    },
    {
      path: "/search/:requestId/:slug",
      element: (
        <>
          <UrlRedirectHandler />
          <Suspense fallback={null}>
            <SearchResults />
          </Suspense>
        </>
      ),
    },
    {
      path: "/new-search/:requestId/:slug",
      element: (
        <>
          <UrlRedirectHandler />
          <Suspense fallback={<LoadingSkeleton variant="default" />}>
            <NewSearchResults />
          </Suspense>
        </>
      ),
    },
    {
      path: "/history",
      element: (
        <Suspense fallback={null}>
          <History />
        </Suspense>
      ),
    },
    {
      path: "/demo-landing",
      element: (
        <Suspense fallback={null}>
          <DemoLanding />
        </Suspense>
      ),
    },
    {
      path: "/favorites",
      element: (
        <Suspense fallback={null}>
          <Favorites />
        </Suspense>
      ),
    },
    {
      path: "/login",
      element: (
        <Suspense fallback={null}>
          <Login />
        </Suspense>
      ),
    },
    {
      path: "/admin",
      element: (
        <Suspense fallback={null}>
          <Admin />
        </Suspense>
      ),
    },
    {
      path: "/admin-login",
      element: (
        <Suspense fallback={null}>
          <AdminLogin />
        </Suspense>
      ),
    },
    {
      path: "/business/register",
      element: (
        <Suspense fallback={null}>
          <BusinessRegistration />
        </Suspense>
      ),
    },
    {
      path: "/admin/business",
      element: (
        <Suspense fallback={null}>
          <BusinessManagement />
        </Suspense>
      ),
    },
    {
      path: "/business-login",
      element: (
        <Suspense fallback={null}>
          <BusinessLogin />
        </Suspense>
      ),
    },
    {
      path: "/reset-password",
      element: (
        <Suspense fallback={null}>
          <ResetPassword />
        </Suspense>
      ),
    },
    {
      path: "/tracking-test",
      element: (
        <Suspense fallback={null}>
          <TrackingTest />
        </Suspense>
      ),
    },
    {
      path: "/real-tracking-test",
      element: (
        <Suspense fallback={null}>
          <RealTrackingTest />
        </Suspense>
      ),
    },
    {
      path: "/business/dashboard",
      element: (
        <Suspense fallback={null}>
          <DashboardSelector />
        </Suspense>
      ),
    },
    {
      path: "/business/dashboard/checkout",
      element: (
        <Suspense fallback={null}>
          <BusinessDashboardLayout />
        </Suspense>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={null}>
              <BusinessDashboardHome />
            </Suspense>
          ),
        },
        {
          path: "activity",
          element: (
            <ErrorBoundary>
              <Suspense fallback={null}>
                <BusinessActivityDashboard />
              </Suspense>
            </ErrorBoundary>
          ),
        },
        {
          path: "integrate",
          element: (
            <Suspense fallback={null}>
              <BusinessIntegrateDashboard />
            </Suspense>
          ),
        },
        {
          path: "analytics",
          element: (
            <Suspense fallback={null}>
              <BusinessAnalyticsDashboard />
            </Suspense>
          ),
        },
        {
          path: "products",
          element: (
            <Suspense fallback={null}>
              <BusinessProductsDashboard />
            </Suspense>
          ),
        },
        {
          path: "settings",
          element: (
            <Suspense fallback={null}>
              <BusinessSettingsDashboard />
            </Suspense>
          ),
        },
        {
          path: "attribution",
          element: (
            <Suspense fallback={null}>
              <BusinessAttributionDashboard />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "/business/dashboard/journey",
      element: (
        <Suspense fallback={null}>
          <JourneyDashboard />
        </Suspense>
      ),
    },
    // Legacy routes for backward compatibility
    {
      path: "/business/integrate",
      element: (
        <Suspense fallback={null}>
          <BusinessIntegrate />
        </Suspense>
      ),
    },
    {
      path: "/business-integrate",
      element: (
        <Suspense fallback={null}>
          <BusinessIntegrate />
        </Suspense>
      ),
    },
    {
      path: "/business/activity",
      element: (
        <Suspense fallback={null}>
          <BusinessActivity />
        </Suspense>
      ),
    },
    {
      path: "/business/connect",
      element: (
        <Suspense fallback={null}>
          <BusinessConnect />
        </Suspense>
      ),
    },
    {
      path: "*",
      element: (
        <Suspense fallback={null}>
          <NotFound />
        </Suspense>
      ),
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    } as any,
  },
);

const App = () => {
  useEffect(() => {
    // Initialize tracking
    initializeTracking();
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <BusinessAuthProvider>
              <NeonAuthProvider>
                <Toaster />
                <Sonner />
                <Suspense fallback={null}>
                  <RouterProvider router={router} />
                </Suspense>
              </NeonAuthProvider>
            </BusinessAuthProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;
