import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { SearchHeader } from "../components/SearchHeader";
import BusinessAnalyticsDashboard from "../components/BusinessAnalyticsDashboard";
import BusinessMyPageDashboard from "../components/BusinessMyPageDashboard";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  LogOut,
  Settings,
  Package,
  AlertTriangle,
  CheckCircle,
  Globe,
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
  totalCheckouts?: number;
  totalAddToCart?: number;
  cartToPurchaseRate?: number;
  logo?: string | null;
  domainVerified?: boolean;
  trackingVerified?: boolean;
  availableFeatures?: string[];
  domainVerificationRequired?: boolean;
}

export default function BusinessDashboard() {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'basic' | 'analytics' | 'mypage'>('basic');
  const navigate = useNavigate();
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
        setStats(data.stats);
      } else if (response.status === 401) {
        // Redirect to login if not authenticated
        navigate("/business-login");
        return;
      } else if (response.status === 403) {
        // Domain verification required but not verified
        const errorData = await response.json();
        toast({
          title: "Domain Verification Required",
          description: errorData.message || "Domain verification is required for analytics access.",
          variant: "destructive",
        });
        // Still show dashboard but with limited features
        setStats({
          id: 0,
          name: "Business Dashboard",
          domain: "",
          affiliateId: "",
          totalVisits: 0,
          totalPurchases: 0,
          totalRevenue: 0,
          adminCommissionRate: 0,
          projectedFee: 0,
          averageOrderValue: 0,
          conversionRate: 0,
          domainVerified: false,
          trackingVerified: false,
          availableFeatures: ["dashboard_access", "profile_management"],
          domainVerificationRequired: true,
        });
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

  const handleDomainVerification = () => {
    navigate("/business/dashboard/integrate");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader showBackButton={false} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
      <div className="min-h-screen bg-background">
        <SearchHeader showBackButton={false} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                Unable to load business statistics.
              </p>
              <Button
                onClick={() => navigate("/business-login")}
                className="mt-4"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isDomainVerified = stats?.domainVerified || false;
  const isTrackingVerified = stats?.trackingVerified || false;
  const domainVerificationRequired = stats?.domainVerificationRequired || false;

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <img
        src="/pagebg.png"
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100"
      />
      <SearchHeader showBackButton={false} />

      <div className="container mx-auto px-4 py-8">
        {/* Domain Verification Status Banner */}
        {!isDomainVerified && (
          <Card className="mb-6 border-yellow-500/20 bg-yellow-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-500">
                    Domain Verification Recommended
                  </h3>
                  <p className="text-sm text-yellow-400/80">
                    Verify your domain to unlock enhanced features and accurate tracking.
                  </p>
                </div>
                <Button
                  onClick={handleDomainVerification}
                  variant="outline"
                  size="sm"
                  className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Verify Domain
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Domain Verification Success Banner */}
        {isDomainVerified && (
          <Card className="mb-6 border-green-500/20 bg-green-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-500">
                    Domain Verified Successfully
                  </h3>
                  <p className="text-sm text-green-400/80">
                    You have access to all features including advanced analytics and tracking.
                  </p>
                </div>
                <Badge variant="outline" className="border-green-500 text-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{stats?.name || 'Business Dashboard'}</h1>
            <p className="text-white/70">{stats?.domain || ''}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant={isDomainVerified ? "default" : "secondary"}
                className={isDomainVerified ? "bg-green-500" : "bg-yellow-500"}
              >
                <Globe className="mr-1 h-3 w-3" />
                {isDomainVerified ? "Domain Verified" : "Domain Not Verified"}
              </Badge>
              {isTrackingVerified && (
                <Badge variant="default" className="bg-blue-500">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Tracking Verified
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/business/dashboard/activity")}
              className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
            >
              User Activity
            </Button>
            <Button
              onClick={() => navigate("/business/dashboard/integrate")}
              className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
            >
              Integrate
            </Button>
            <Button
              onClick={() => navigate("/business/dashboard/products")}
              className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
            >
              <Package className="mr-2 h-4 w-4" />
              Products
            </Button>
            <Button
              onClick={() => setActiveTab('mypage')}
              className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              My Page
            </Button>
            <Button
              onClick={() => navigate("/business/dashboard/settings")}
              className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button
              onClick={handleLogout}
              className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Visits
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.totalVisits || 0).toLocaleString()}
              </div>
              <p className="text-xs text-white/80">
                Users who visited your products
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Purchases
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.totalPurchases || 0).toLocaleString()}
              </div>
              <p className="text-xs text-white/80">Successful purchases made</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats?.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-white/80">Total sales revenue</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.conversionRate || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-white/80">Visit to purchase ratio</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Checkouts
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.totalCheckouts || 0).toLocaleString()}
              </div>
              <p className="text-xs text-white/80">Completed checkouts</p>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Limited Access Notice */}
        {!isDomainVerified && domainVerificationRequired && (
          <Card className="mb-6 border-orange-500/20 bg-orange-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-500">
                    Limited Access Mode
                  </h3>
                  <p className="text-sm text-orange-400/80">
                    Some features are limited. Verify your domain to unlock full access to analytics and tracking features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'bg-white text-black'
                  : 'text-white hover:text-white/80'
              }`}
            >
              Basic Stats
            </button>
            {(isDomainVerified || !domainVerificationRequired) && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-white text-black'
                    : 'text-white hover:text-white/80'
                }`}
              >
                Enhanced Analytics
              </button>
            )}
            <button
              onClick={() => setActiveTab('mypage')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'mypage'
                  ? 'bg-white text-black'
                  : 'text-white hover:text-white/80'
              }`}
            >
              My Page
            </button>
          </div>
        </div>

        {/* Enhanced Analytics Dashboard */}
        {activeTab === 'analytics' && (isDomainVerified || !domainVerificationRequired) && (
          <BusinessAnalyticsDashboard businessDomain={stats?.domain || ''} />
        )}

        {/* My Page Dashboard */}
        {activeTab === 'mypage' && (
          <BusinessMyPageDashboard businessDomain={stats?.domain || ''} />
        )}

        {/* Basic Statistics - Only show if domain is verified or verification not required */}
        {activeTab === 'basic' && (isDomainVerified || !domainVerificationRequired) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-white">Revenue Analysis</CardTitle>
                <CardDescription className="text-white/80">
                  Detailed breakdown of your business performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white">
                    Average Order Value
                  </span>
                  <span className="text-sm font-bold text-white">
                    ${(stats?.averageOrderValue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white">
                    Commission Rate
                  </span>
                  <Badge variant="outline" className="text-white border-white/30">
                    {stats?.adminCommissionRate || 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white">
                    Projected Fee
                  </span>
                  <span className="text-sm font-bold text-white">
                    ${(stats?.projectedFee || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white">
                    Total Checkouts
                  </span>
                  <span className="text-sm font-bold text-white">
                    {(stats.totalCheckouts || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white">
                    Add to Cart Events
                  </span>
                  <span className="text-sm font-bold text-white">
                    {(stats.totalAddToCart || 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
                <CardDescription className="text-white/80">
                  Key performance indicators for your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      Total Visits
                    </span>
                    <span className="text-sm text-white">
                      {(stats?.totalVisits || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(((stats?.totalVisits || 0) / 1000) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      Total Purchases
                    </span>
                    <span className="text-sm text-white">
                      {(stats?.totalPurchases || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(((stats?.totalPurchases || 0) / 100) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      Conversion Rate
                    </span>
                    <span className="text-sm text-white">
                      {(stats?.conversionRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min(stats?.conversionRate || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      Total Checkouts
                    </span>
                    <span className="text-sm text-white">
                      {(stats.totalCheckouts || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(((stats.totalCheckouts || 0) / Math.max(stats.totalVisits, 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      Add to Cart
                    </span>
                    <span className="text-sm text-white">
                      {(stats.totalAddToCart || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(((stats.totalAddToCart || 0) / Math.max(stats.totalVisits, 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      Cart to Purchase Rate
                    </span>
                    <span className="text-sm text-white">
                      {(stats.cartToPurchaseRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min(stats.cartToPurchaseRate || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-white">Checkout Analytics</CardTitle>
                <CardDescription className="text-white/80">
                  Detailed checkout and conversion funnel analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      Checkout Completion Rate
                    </span>
                    <span className="text-sm text-white">
                      {stats.totalVisits > 0 ? ((stats.totalCheckouts || 0) / stats.totalVisits * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(stats.totalVisits > 0 ? ((stats.totalCheckouts || 0) / stats.totalVisits * 100) : 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      Add to Cart Rate
                    </span>
                    <span className="text-sm text-white">
                      {stats.totalVisits > 0 ? ((stats.totalAddToCart || 0) / stats.totalVisits * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(stats.totalVisits > 0 ? ((stats.totalAddToCart || 0) / stats.totalVisits * 100) : 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">
                      Cart Abandonment Rate
                    </span>
                    <span className="text-sm text-white">
                      {(stats.totalAddToCart || 0) > 0 ? (((stats.totalAddToCart || 0) - (stats.totalCheckouts || 0)) / (stats.totalAddToCart || 0) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((stats.totalAddToCart || 0) > 0 ? (((stats.totalAddToCart || 0) - (stats.totalCheckouts || 0)) / (stats.totalAddToCart || 0) * 100) : 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-white">
                        {(stats.totalAddToCart || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-white/80">Add to Cart</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">
                        {(stats.totalCheckouts || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-white/80">Checkouts</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
