import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { BusinessAuthProvider } from "@/hooks/use-auth";
import LoadingSkeleton from "@/components/ui/loading-skeleton";

import { initializeTracking } from "@/lib/tracking";

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
const BusinessDashboardLayout = lazy(
  () => import("./components/BusinessDashboardLayout"),
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
const Browse = lazy(() => import("./pages/Browse"));
const Landing2 = lazy(() => import("./pages/Landing2"));
const BusinessIntegrate = lazy(() => import("./pages/BusinessIntegrate"));
const BusinessActivity = lazy(() => import("./pages/BusinessActivity"));
const BusinessConnect = lazy(() => import("./pages/BusinessConnect"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

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
      path: "/business/dashboard",
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
            <Suspense fallback={null}>
              <BusinessActivityDashboard />
            </Suspense>
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
      ],
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
              <Toaster />
              <Sonner />
              <Suspense fallback={null}>
                <RouterProvider router={router} />
              </Suspense>
            </BusinessAuthProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;
