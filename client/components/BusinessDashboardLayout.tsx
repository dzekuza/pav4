import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SearchHeader } from "@/components/SearchHeader";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  LogOut,
  Activity,
  Settings,
  BarChart3,
  Code,
  Home,
  Building2,
  User,
  Package,
} from "lucide-react";

interface BusinessStats {
  id: number;
  name: string;
  domain: string;
  affiliateId: string;
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  adminCommissionRate: number;
  projectedFee: number;
  averageOrderValue: number;
  conversionRate: number;
  logo?: string | null;
}

export default function BusinessDashboardLayout() {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/business/auth/stats", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("BusinessDashboardLayout - Received data:", data);
        console.log("BusinessDashboardLayout - Stats:", data.stats);
        setStats(data.stats);
      } else if (response.status === 401) {
        navigate("/business-login");
        return;
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch business statistics",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
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

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <img
          src="/pagebg.png"
          alt=""
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100"
        />
        <SearchHeader showBackButton={false} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background text-white">
        <SearchHeader showBackButton={false} />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-white/80">
                Unable to load business statistics.
              </p>
              <Button
                onClick={() => navigate("/business-login")}
                className="mt-4 rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <img
        src="/pagebg.png"
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100"
      />
      <SearchHeader showBackButton={false} />
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center mb-6 md:mb-8">
          <div className="flex flex-col gap-3 md:gap-4 min-w-0">
            {/* Logo */}
            {stats.logo ? (
              <img
                src={stats.logo}
                alt={`${stats.name} logo`}
                className="max-h-16 w-auto object-contain"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <div className="h-16 w-16 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white/60" />
              </div>
            )}
            
            {/* Business Info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold text-white truncate">{stats.name}</h1>
              <p className="text-white/70 text-sm md:text-base truncate">{stats.domain}</p>
            </div>
          </div>
          
          {/* Profile Dropdown - Only show on desktop */}
          <div className="hidden md:flex flex-shrink-0 ml-4">
            <ProfileDropdown
              businessName={stats.name}
              businessDomain={stats.domain}
              businessLogo={stats.logo}
              onLogout={handleLogout}
              onNavigate={navigate}
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-2 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/business/dashboard")}
            className={cn(
              "flex items-center rounded-full",
              isActiveRoute("/business/dashboard")
                ? "bg-white text-black border border-black/10 hover:bg-white/90"
                : "text-white hover:bg-white/10",
            )}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/business/dashboard/activity")}
            className={cn(
              "flex items-center rounded-full",
              isActiveRoute("/business/dashboard/activity")
                ? "bg-white text-black border border-black/10 hover:bg-white/90"
                : "text-white hover:bg-white/10",
            )}
          >
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/business/dashboard/integrate")}
            className={cn(
              "flex items-center rounded-full",
              isActiveRoute("/business/dashboard/integrate")
                ? "bg-white text-black border border-black/10 hover:bg-white/90"
                : "text-white hover:bg-white/10",
            )}
          >
            <Code className="mr-2 h-4 w-4" />
            Integrate
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/business/dashboard/analytics")}
            className={cn(
              "flex items-center rounded-full",
              isActiveRoute("/business/dashboard/analytics")
                ? "bg-white text-black border border-black/10 hover:bg-white/90"
                : "text-white hover:bg-white/10",
            )}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/business/dashboard/products")}
            className={cn(
              "flex items-center rounded-full",
              isActiveRoute("/business/dashboard/products")
                ? "bg-white text-black border border-black/10 hover:bg-white/90"
                : "text-white hover:bg-white/10",
            )}
          >
            <Package className="mr-2 h-4 w-4" />
            Products
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/business/dashboard/settings")}
            className={cn(
              "flex items-center rounded-full",
              isActiveRoute("/business/dashboard/settings")
                ? "bg-white text-black border border-black/10 hover:bg-white/90"
                : "text-white hover:bg-white/10",
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Content Area */}
        <div className="space-y-6 pb-20 md:pb-6">
          <Outlet context={{ stats }} />
        </div>
      </div>

      {/* Mobile Navigation - Updated to black background */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-white/20 shadow-lg">
        <div className="flex justify-around items-center py-3 px-4">
          <button
            onClick={() => navigate("/business/dashboard")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200",
              isActiveRoute("/business/dashboard")
                ? "text-white bg-white/20 shadow-sm"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate("/business/dashboard/activity")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200",
              isActiveRoute("/business/dashboard/activity")
                ? "text-white bg-white/20 shadow-sm"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Activity className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Activity</span>
          </button>
          
          <button
            onClick={() => navigate("/business/dashboard/integrate")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200",
              isActiveRoute("/business/dashboard/integrate")
                ? "text-white bg-white/20 shadow-sm"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Code className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Integrate</span>
          </button>
          
          <button
            onClick={() => navigate("/business/dashboard/analytics")}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200",
              isActiveRoute("/business/dashboard/analytics")
                ? "text-white bg-white/20 shadow-sm"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <BarChart3 className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </button>
          
          {/* Profile dropdown in mobile navigation */}
          <div className="flex flex-col items-center justify-center py-2 px-3">
            <ProfileDropdown
              businessName={stats.name}
              businessDomain={stats.domain}
              businessLogo={stats.logo}
              onLogout={handleLogout}
              onNavigate={navigate}
              className="h-5 w-5"
              isMobile={true}
            />
            <span className="text-xs font-medium text-white/70 mt-1">Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
