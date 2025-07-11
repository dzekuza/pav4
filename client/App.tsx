import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import History from "./pages/History";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import { UrlRedirectHandler } from "./components/UrlRedirectHandler";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { initializeUserTracking } from "@/lib/userTracking";

const queryClient = new QueryClient();

// Initialize user tracking
initializeUserTracking();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CurrencyProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UrlRedirectHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/search/:requestId/:slug"
              element={<SearchResults />}
            />
            <Route path="/history" element={<History />} />
            <Route path="/favorites" element={<Favorites />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CurrencyProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
