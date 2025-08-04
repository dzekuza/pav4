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
import { UrlRedirectHandler } from "./components/UrlRedirectHandler";
import NewSearchResults from "./pages/NewSearchResults";
import { BusinessRegistration } from "./components/BusinessRegistration";
import { BusinessManagement } from "./pages/BusinessManagement";
import BusinessLogin from "./pages/BusinessLogin";
import BusinessDashboard from "./pages/BusinessDashboard";
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import ReactPlugin from '@stagewise-plugins/react';
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
        <Index />
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
    element: <BusinessDashboard />,
  },
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
    <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
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
