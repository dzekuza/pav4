import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { BusinessAuthProvider } from "@/hooks/use-auth";
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
const BusinessRegistration = lazy(() => import("./components/BusinessRegistration").then(m => ({ default: m.BusinessRegistration })));
const BusinessManagement = lazy(() => import("./pages/BusinessManagement").then(m => ({ default: m.BusinessManagement })));
const BusinessLogin = lazy(() => import("./pages/BusinessLogin"));
const BusinessDashboardLayout = lazy(() => import("./components/BusinessDashboardLayout"));
const BusinessDashboardHome = lazy(() => import("./pages/BusinessDashboardHome"));
const BusinessActivityDashboard = lazy(() => import("./pages/BusinessActivityDashboard"));
const BusinessIntegrateDashboard = lazy(() => import("./pages/BusinessIntegrateDashboard"));
const BusinessAnalyticsDashboard = lazy(() => import("./pages/BusinessAnalyticsDashboard"));
const BusinessSettingsDashboard = lazy(() => import("./pages/BusinessSettingsDashboard"));
const BusinessIntegrate = lazy(() => import("./pages/BusinessIntegrate"));
const BusinessActivity = lazy(() => import("./pages/BusinessActivity"));
const BusinessConnect = lazy(() => import("./pages/BusinessConnect"));
import { initializeTracking } from "@/lib/tracking";
// import NewLanding from "./pages/NewLanding";
// import NewSearch from "./pages/NewSearch";

const queryClient = new QueryClient();

// Initialize tracking on app load
initializeTracking();

// Create router with future flags to suppress warnings
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <UrlRedirectHandler />
        <Suspense fallback={null}>
          <DemoLanding />
        </Suspense>
      </>
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
        <Suspense fallback={null}>
          <NewSearchResults />
        </Suspense>
      </>
    ),
  },
  { path: "/history", element: <Suspense fallback={null}><History /></Suspense> },
  { path: "/demo-landing", element: <Suspense fallback={null}><DemoLanding /></Suspense> },
  { path: "/favorites", element: <Suspense fallback={null}><Favorites /></Suspense> },
  { path: "/login", element: <Suspense fallback={null}><Login /></Suspense> },
  { path: "/admin", element: <Suspense fallback={null}><Admin /></Suspense> },
  { path: "/admin-login", element: <Suspense fallback={null}><AdminLogin /></Suspense> },
  { path: "/business/register", element: <Suspense fallback={null}><BusinessRegistration /></Suspense> },
  { path: "/admin/business", element: <Suspense fallback={null}><BusinessManagement /></Suspense> },
  { path: "/business-login", element: <Suspense fallback={null}><BusinessLogin /></Suspense> },
  {
    path: "/business/dashboard",
    element: <Suspense fallback={null}><BusinessDashboardLayout /></Suspense>,
    children: [
      { index: true, element: <Suspense fallback={null}><BusinessDashboardHome /></Suspense> },
      { path: "activity", element: <Suspense fallback={null}><BusinessActivityDashboard /></Suspense> },
      { path: "integrate", element: <Suspense fallback={null}><BusinessIntegrateDashboard /></Suspense> },
      { path: "analytics", element: <Suspense fallback={null}><BusinessAnalyticsDashboard /></Suspense> },
      { path: "settings", element: <Suspense fallback={null}><BusinessSettingsDashboard /></Suspense> },
    ],
  },
  // Legacy routes for backward compatibility
  { path: "/business/integrate", element: <Suspense fallback={null}><BusinessIntegrate /></Suspense> },
  { path: "/business-integrate", element: <Suspense fallback={null}><BusinessIntegrate /></Suspense> },
  { path: "/business/activity", element: <Suspense fallback={null}><BusinessActivity /></Suspense> },
  { path: "/business/connect", element: <Suspense fallback={null}><BusinessConnect /></Suspense> },
  { path: "*", element: <Suspense fallback={null}><NotFound /></Suspense> },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  } as any,
});

const App = () => (
  <>
    {/* <StagewiseToolbar config={{ plugins: [ReactPlugin] }} /> */}
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

export default App;
