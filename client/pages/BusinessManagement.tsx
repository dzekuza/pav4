import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { BusinessStatsModal } from '../components/BusinessStatsModal';

interface Business {
  id: number;
  name: string;
  domain: string;
  website: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  isVerified: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  country?: string;
  category?: string;
  commission: number;
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  adminCommissionRate: number;
  createdAt: string;
  updatedAt: string;
}

interface BusinessStats {
  totalBusinesses: number;
  activeBusinesses: number;
  verifiedBusinesses: number;
}

export function BusinessManagement() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinesses();
    fetchStats();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/admin/business', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch businesses",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/business/stats', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleToggleActive = async (businessId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/business/${businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Business ${isActive ? 'deactivated' : 'activated'} successfully`,
        });
        fetchBusinesses();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: "Failed to update business status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating business status:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const handleVerify = async (businessId: number) => {
    try {
      const response = await fetch(`/api/admin/business/${businessId}/verify`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Business verified successfully",
        });
        fetchBusinesses();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: "Failed to verify business",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying business:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCommission = async (businessId: number, currentRate: number) => {
    const newRate = prompt(`Enter new commission rate (current: ${currentRate}%):`, currentRate.toString());
    
    if (!newRate || isNaN(parseFloat(newRate))) {
      return;
    }

    const rate = parseFloat(newRate);
    if (rate < 0 || rate > 100) {
      toast({
        title: "Invalid Rate",
        description: "Commission rate must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/business/${businessId}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ adminCommissionRate: rate }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Commission rate updated to ${rate}%`,
        });
        fetchBusinesses();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: "Failed to update commission rate",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (businessId: number) => {
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/business/${businessId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Business deleted successfully",
        });
        fetchBusinesses();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete business",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Business Management</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBusinesses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Verified Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedBusinesses}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Businesses List */}
      <div className="space-y-4">
        {businesses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No businesses registered yet.</p>
            </CardContent>
          </Card>
        ) : (
          businesses.map((business) => (
            <Card key={business.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {business.logo && (
                        <img 
                          src={business.logo} 
                          alt={business.name}
                          className="w-6 h-6 rounded"
                        />
                      )}
                      {business.name}
                    </CardTitle>
                    <CardDescription>
                      {business.domain} • {business.website}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {business.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {business.isVerified ? (
                      <Badge variant="default">Verified</Badge>
                    ) : (
                      <Badge variant="outline">Unverified</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {business.description && (
                  <p className="text-sm text-gray-600 mb-4">{business.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {business.category && (
                    <div>
                      <span className="font-medium">Category:</span> {business.category}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Admin Commission:</span> {business.adminCommissionRate}%
                  </div>
                  {business.country && (
                    <div>
                      <span className="font-medium">Country:</span> {business.country}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Registered:</span> {new Date(business.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 p-4 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">Total Visits:</span> {business.totalVisits.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Total Purchases:</span> {business.totalPurchases.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Total Revenue:</span> ${business.totalRevenue.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Conversion Rate:</span> {business.totalVisits > 0 ? ((business.totalPurchases / business.totalVisits) * 100).toFixed(1) : 0}%
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Business URL Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-700">Domain:</span> 
                      <span className="ml-2 font-mono text-blue-600">{business.domain}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Website:</span> 
                      <a href={business.website} target="_blank" rel="noopener noreferrer" 
                         className="ml-2 text-blue-600 hover:text-blue-800 underline">
                        {business.website}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant={business.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(business.id, business.isActive)}
                  >
                    {business.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  
                  {!business.isVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerify(business.id)}
                    >
                      Verify
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateCommission(business.id, business.adminCommissionRate)}
                  >
                    Set Commission
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBusiness(business);
                      setIsStatsModalOpen(true);
                    }}
                  >
                    View Stats
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(business.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Business Stats Modal */}
      {selectedBusiness && (
        <BusinessStatsModal
          business={{
            id: selectedBusiness.id,
            name: selectedBusiness.name,
            domain: selectedBusiness.domain,
            website: selectedBusiness.website,
            totalVisits: selectedBusiness.totalVisits,
            totalPurchases: selectedBusiness.totalPurchases,
            totalRevenue: selectedBusiness.totalRevenue,
            adminCommissionRate: selectedBusiness.adminCommissionRate,
            projectedFee: (selectedBusiness.totalRevenue * selectedBusiness.adminCommissionRate) / 100,
            averageOrderValue: selectedBusiness.totalPurchases > 0 ? selectedBusiness.totalRevenue / selectedBusiness.totalPurchases : 0,
            conversionRate: selectedBusiness.totalVisits > 0 ? (selectedBusiness.totalPurchases / selectedBusiness.totalVisits) * 100 : 0,
          }}
          isOpen={isStatsModalOpen}
          onClose={() => {
            setIsStatsModalOpen(false);
            setSelectedBusiness(null);
          }}
        />
      )}
    </div>
  );
} 