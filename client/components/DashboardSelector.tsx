import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { SearchHeader } from "./SearchHeader";
import {
  ShoppingCart,
  Route,
  ArrowRight,
  CheckCircle,
  Clock,
  LogOut,
} from "lucide-react";

interface BusinessInfo {
  name: string;
  domain: string;
  email: string;
}

export default function DashboardSelector() {
  const navigate = useNavigate();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      const response = await fetch("/api/business/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.business) {
          setBusinessInfo(data.business);
        }
      } else if (response.status === 401) {
        // Redirect to login if not authenticated
        navigate("/business-login");
        return;
      }
    } catch (error) {
      console.error("Error fetching business info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/business/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/business-login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCheckoutDashboard = () => {
    navigate("/business/dashboard/checkout");
  };

  const handleJourneyDashboard = () => {
    navigate("/business/dashboard/journey");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader showBackButton={false} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <img
        src="/pagebg.png"
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100"
      />
      <SearchHeader showBackButton={false} />

      <div className="container mx-auto px-4 py-8">
        {/* Header with Logout */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {businessInfo?.name || "Business"}!
            </h1>
            <p className="text-gray-300">Choose your dashboard experience</p>
            {businessInfo?.domain && (
              <Badge variant="secondary" className="mt-2">
                {businessInfo.domain}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Dashboard Options */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Checkout Dashboard */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-xl text-white">
                Checkout Dashboard
              </CardTitle>
              <CardDescription className="text-gray-300">
                Full Shopify integration with real-time analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Real Shopify data</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Order tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Revenue analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Customer insights</span>
                </div>
              </div>

              <Button
                onClick={handleCheckoutDashboard}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:bg-blue-700 transition-colors"
              >
                <span>Enter Checkout Dashboard</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Journey Dashboard */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center">
                <Route className="h-8 w-8 text-purple-400" />
              </div>
              <CardTitle className="text-xl text-white">
                Journey Dashboard
              </CardTitle>
              <CardDescription className="text-gray-300">
                New analytics with mock data for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span>Mock statistics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span>New features testing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span>Enhanced analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span>Development mode</span>
                </div>
              </div>

              <Button
                onClick={handleJourneyDashboard}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white group-hover:bg-purple-700 transition-colors"
              >
                <span>Enter Journey Dashboard</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                About the Dashboards
              </h3>
              <p className="text-gray-300 text-sm">
                <strong>Checkout Dashboard:</strong> Your current dashboard with
                full Shopify integration and real data.
                <br />
                <strong>Journey Dashboard:</strong> A new dashboard environment
                for testing enhanced analytics features with mock data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
