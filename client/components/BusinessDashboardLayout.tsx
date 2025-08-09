import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SearchHeader } from '@/components/SearchHeader';
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
  Home
} from 'lucide-react';

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
      const response = await fetch('/api/business/auth/stats', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('BusinessDashboardLayout - Received data:', data);
        console.log('BusinessDashboardLayout - Stats:', data.stats);
        setStats(data.stats);
      } else if (response.status === 401) {
        navigate('/business-login');
        return;
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch business statistics",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      await fetch('/api/business/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/business-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <img src="/pagebg.png" alt="" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-100" />
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
              <p className="text-white/80">Unable to load business statistics.</p>
              <Button onClick={() => navigate('/business-login')} className="mt-4 rounded-full bg-white text-black border border-black/10 hover:bg-white/90">
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <SearchHeader showBackButton={false} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{stats.name}</h1>
            <p className="text-white/70">{stats.domain}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex space-x-2 mb-8 border-b border-white/10">
          <Button
            variant={isActiveRoute('/business/dashboard') ? "default" : "ghost"}
            onClick={() => navigate('/business/dashboard')}
            className="flex items-center text-white"
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={isActiveRoute('/business/dashboard/activity') ? "default" : "ghost"}
            onClick={() => navigate('/business/dashboard/activity')}
            className="flex items-center text-white"
          >
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </Button>
          <Button
            variant={isActiveRoute('/business/dashboard/integrate') ? "default" : "ghost"}
            onClick={() => navigate('/business/dashboard/integrate')}
            className="flex items-center text-white"
          >
            <Code className="mr-2 h-4 w-4" />
            Integrate
          </Button>
          <Button
            variant={isActiveRoute('/business/dashboard/analytics') ? "default" : "ghost"}
            onClick={() => navigate('/business/dashboard/analytics')}
            className="flex items-center text-white"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant={isActiveRoute('/business/dashboard/settings') ? "default" : "ghost"}
            onClick={() => navigate('/business/dashboard/settings')}
            className="flex items-center text-white"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          <Outlet context={{ stats }} />
        </div>
      </div>
    </div>
  );
} 