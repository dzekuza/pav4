import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { BusinessStatsModal } from '../components/BusinessStatsModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock, Eye, EyeOff, Globe } from 'lucide-react';

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
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
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

  const handleUpdatePassword = async () => {
    if (!selectedBusiness) return;

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    // Check for password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      toast({
        title: "Weak Password",
        description: "Password must contain uppercase, lowercase, and number",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch(`/api/admin/business/${selectedBusiness.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Business password updated successfully",
        });
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
        setSelectedBusiness(null);
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
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
                      setShowStatsModal(true);
                    }}
                  >
                    View Stats
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBusiness(business);
                      setShowPasswordModal(true);
                    }}
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Update Password
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
      {selectedBusiness && showStatsModal && (
        <BusinessStatsModal
          business={selectedBusiness}
          onClose={() => {
            setShowStatsModal(false);
            setSelectedBusiness(null);
          }}
        />
      )}

      {/* Password Update Modal */}
      {selectedBusiness && showPasswordModal && (
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Password for {selectedBusiness.name}</DialogTitle>
              <DialogDescription>
                Set a new password for this business account. The password must be at least 8 characters long and contain uppercase, lowercase, and a number.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setSelectedBusiness(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 