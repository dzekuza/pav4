import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
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
// import NewLanding from "./pages/NewLanding";
// import NewSearch from "./pages/NewSearch";

const queryClient = new QueryClient();

const App = () => (
  <>
    <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <UrlRedirectHandler />
            <Routes>
              <Route path="/" element={<Index />} />
              {/* <Route path="/new-landing" element={<NewLanding />} />
              <Route path="/new-search" element={<NewSearch />} /> */}
              <Route
                path="/search/:requestId/:slug"
                element={<SearchResults />}
              />
              <Route path="/new-search/:requestId/:slug" element={<NewSearchResults />} />
              <Route path="/history" element={<History />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/business/register" element={<BusinessRegistration />} />
              <Route path="/admin/business" element={<BusinessManagement />} />
              <Route path="/business-login" element={<BusinessLogin />} />
              <Route path="/business/dashboard" element={<BusinessDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </>
);

export default App;
