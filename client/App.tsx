import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { BusinessAuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import History from "./pages/History";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import DemoLanding from "./pages/DemoLanding";
import { UrlRedirectHandler } from "./components/UrlRedirectHandler";
import NewSearchResults from "./pages/NewSearchResults";
import { BusinessRegistration } from "./components/BusinessRegistration";
import { BusinessManagement } from "./pages/BusinessManagement";
import BusinessLogin from "./pages/BusinessLogin";
import BusinessDashboardLayout from "./components/BusinessDashboardLayout";
import BusinessDashboardHome from "./pages/BusinessDashboardHome";
import BusinessActivityDashboard from "./pages/BusinessActivityDashboard";
import BusinessIntegrateDashboard from "./pages/BusinessIntegrateDashboard";
import BusinessAnalyticsDashboard from "./pages/BusinessAnalyticsDashboard";
import BusinessSettingsDashboard from "./pages/BusinessSettingsDashboard";
import BusinessIntegrate from "./pages/BusinessIntegrate";
import BusinessActivity from "./pages/BusinessActivity";
import BusinessConnect from "./pages/BusinessConnect";
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
        <DemoLanding />
      </>
    ),
  },
  {
    path: "/search/:requestId/:slug",
    element: (
      <>
        <UrlRedirectHandler />
        <SearchResults />
      </>
    ),
  },
  {
    path: "/new-search/:requestId/:slug",
    element: (
      <>
        <UrlRedirectHandler />
        <NewSearchResults />
      </>
    ),
  },
  {
    path: "/history",
    element: <History />,
  },
  {
    path: "/demo-landing",
    element: <DemoLanding />,
  },
  {
    path: "/favorites",
    element: <Favorites />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/admin",
    element: <Admin />,
  },
  {
    path: "/business/register",
    element: <BusinessRegistration />,
  },
  {
    path: "/admin/business",
    element: <BusinessManagement />,
  },
  {
    path: "/business-login",
    element: <BusinessLogin />,
  },
  {
    path: "/business/dashboard",
    element: <BusinessDashboardLayout />,
          children: [
        {
          index: true,
          element: <BusinessDashboardHome />,
        },
        {
          path: "activity",
          element: <BusinessActivityDashboard />,
        },
        {
          path: "integrate",
          element: <BusinessIntegrateDashboard />,
        },
        {
          path: "analytics",
          element: <BusinessAnalyticsDashboard />,
        },
        {
          path: "settings",
          element: <BusinessSettingsDashboard />,
        },
      ],
  },
  // Legacy routes for backward compatibility
  {
    path: "/business/integrate",
    element: <BusinessIntegrate />,
  },
  {
    path: "/business-integrate",
    element: <BusinessIntegrate />,
  },
  {
    path: "/business/activity",
    element: <BusinessActivity />,
  },
  {
    path: "/business/connect",
    element: <BusinessConnect />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
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
            <RouterProvider router={router} />
          </BusinessAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </>
);

export default App;
