import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  User,
  Building2,
  Shield,
  Bell,
  Globe,
  CreditCard,
  Key,
  Eye,
  EyeOff,
  Save,
  Edit,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BusinessStats {
  id: number;
  name: string;
  domain: string;
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  adminCommissionRate: number;
  projectedFee: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface BusinessSettings {
  businessInfo: {
    name: string;
    domain: string;
    email: string;
    phone: string;
    address: string;
    country: string;
    category: string;
    description: string;
  };
  trackingSettings: {
    enableTracking: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
    trackingCode: string;
  };
  commissionSettings: {
    commissionRate: number;
    autoPayout: boolean;
    payoutThreshold: number;
  };
  securitySettings: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
  };
}

export default function BusinessSettingsDashboard() {
  const { stats } = useOutletContext<{ stats: BusinessStats }>();
  const { toast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings>({
    businessInfo: {
      name: stats?.name || '',
      domain: stats?.domain || '',
      email: 'business@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, City, State 12345',
      country: 'United States',
      category: 'E-commerce',
      description: 'Your business description here'
    },
    trackingSettings: {
      enableTracking: true,
      enableNotifications: true,
      enableAnalytics: true,
      trackingCode: 'YOUR_TRACKING_CODE'
    },
    commissionSettings: {
      commissionRate: stats?.adminCommissionRate || 10,
      autoPayout: false,
      payoutThreshold: 100
    },
    securitySettings: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      ipWhitelist: []
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSaveSettings = async (section: string) => {
    setIsLoading(true);
    try {
      if (section === 'Profile') {
        // Call the business profile update endpoint
        const response = await fetch('/api/business/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: settings.businessInfo.name,
            domain: settings.businessInfo.domain,
            email: settings.businessInfo.email,
            phone: settings.businessInfo.phone,
            address: settings.businessInfo.address,
            country: settings.businessInfo.country,
            category: settings.businessInfo.category,
            description: settings.businessInfo.description
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save profile settings');
        }

        const data = await response.json();
        toast({
          title: "Profile Updated",
          description: data.message || "Business profile has been updated successfully.",
        });
      } else {
        // For other sections, simulate API call for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: "Settings Saved",
          description: `${section} settings have been updated successfully.`,
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (section: keyof BusinessSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6 text-white">
      {/* Settings Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Business Settings</h2>
          <p className="text-white/70">
            Manage your business profile, tracking, and security settings
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription className="text-white/80">
                Update your business profile and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={settings.businessInfo.name}
                    onChange={(e) => updateSettings('businessInfo', 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={settings.businessInfo.domain}
                    onChange={(e) => updateSettings('businessInfo', 'domain', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.businessInfo.email}
                    onChange={(e) => updateSettings('businessInfo', 'email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.businessInfo.phone}
                    onChange={(e) => updateSettings('businessInfo', 'phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={settings.businessInfo.address}
                    onChange={(e) => updateSettings('businessInfo', 'address', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={settings.businessInfo.country}
                    onChange={(e) => updateSettings('businessInfo', 'country', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={settings.businessInfo.category}
                    onChange={(e) => updateSettings('businessInfo', 'category', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[140px] px-3 py-2 rounded-md border border-white/10 bg-white/5 text-white placeholder:text-white/60 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-0"
                    value={settings.businessInfo.description}
                    onChange={(e) => updateSettings('businessInfo', 'description', e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={() => handleSaveSettings('Profile')}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Profile Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Settings */}
        <TabsContent value="tracking" className="space-y-4">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5" />
                Tracking Configuration
              </CardTitle>
              <CardDescription className="text-white/80">
                Configure your tracking and analytics settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Track user activity and conversions
                    </p>
                  </div>
                  <Switch
                    checked={settings.trackingSettings.enableTracking}
                    onCheckedChange={(checked) => updateSettings('trackingSettings', 'enableTracking', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for new conversions
                    </p>
                  </div>
                  <Switch
                    checked={settings.trackingSettings.enableNotifications}
                    onCheckedChange={(checked) => updateSettings('trackingSettings', 'enableNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Detailed analytics and reporting
                    </p>
                  </div>
                  <Switch
                    checked={settings.trackingSettings.enableAnalytics}
                    onCheckedChange={(checked) => updateSettings('trackingSettings', 'enableAnalytics', checked)}
                  />
                </div>
              </div>
              <Button 
                onClick={() => handleSaveSettings('Tracking')}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Tracking Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Settings */}
        <TabsContent value="commission" className="space-y-4">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5" />
                Commission Settings
              </CardTitle>
              <CardDescription className="text-white/80">
                Configure your commission rates and payout preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                  <Input
                    id="commission-rate"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.commissionSettings.commissionRate}
                    onChange={(e) => updateSettings('commissionSettings', 'commissionRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout-threshold">Payout Threshold ($)</Label>
                  <Input
                    id="payout-threshold"
                    type="number"
                    min="0"
                    value={settings.commissionSettings.payoutThreshold}
                    onChange={(e) => updateSettings('commissionSettings', 'payoutThreshold', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Payout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically payout when threshold is reached
                  </p>
                </div>
                <Switch
                  checked={settings.commissionSettings.autoPayout}
                  onCheckedChange={(checked) => updateSettings('commissionSettings', 'autoPayout', checked)}
                />
              </div>
              <Button 
                onClick={() => handleSaveSettings('Commission')}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Commission Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-white/80">
                Manage your account security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Switch
                    checked={settings.securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => updateSettings('securitySettings', 'twoFactorAuth', checked)}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="5"
                    max="480"
                    value={settings.securitySettings.sessionTimeout}
                    onChange={(e) => updateSettings('securitySettings', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Change Password</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Current password"
                    />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="New password"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => handleSaveSettings('Security')}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 