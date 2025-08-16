import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Trash2,
  Info,
} from "lucide-react";
import { DeleteAccountModal } from "../components/DeleteAccountModal";
import { NotificationSettings } from "../components/NotificationSettings";
import { useToast } from "@/hooks/use-toast";

// Available business categories
const businessCategories = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports",
  "Beauty",
  "Books",
  "Toys",
  "Automotive",
  "Health",
  "Food",
  "Baby & Kids",
  "Pet Supplies",
  "Office & Business",
  "Jewelry & Watches",
  "Tools & Hardware",
  "Music & Instruments",
  "Art & Crafts",
  "Garden & Outdoor",
  "Kitchen & Dining",
  "Bath & Personal Care",
  "Other",
];

// Available countries
const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Slovakia",
  "Slovenia",
  "Croatia",
  "Bulgaria",
  "Romania",
  "Greece",
  "Portugal",
  "Ireland",
  "Luxembourg",
  "Malta",
  "Cyprus",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Other",
];

interface BusinessStats {
  id: number;
  name: string;
  domain: string;
  domainVerified?: boolean;
  trackingVerified?: boolean;
  totalVisits: number;
  totalPurchases: number;
  totalRevenue: number;
  adminCommissionRate: number;
  projectedFee: number;
  averageOrderValue: number;
  conversionRate: number;
  logo?: string | null;
  category?: string;
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
    logo?: string | null;
  };
  trackingSettings: {
    enableTracking: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
    trackingCode: string;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>({
    businessInfo: {
      name: stats?.name || "",
      domain: stats?.domain || "",
      email: "info@godislove.lt", // Default email for the business
      phone: "+1 (555) 123-4567",
      address: "Vilnius",
      country: "United States",
      category: "E-commerce",
      description: "Your business description here",
      logo: stats?.logo || null,
    },
    trackingSettings: {
      enableTracking: true,
      enableNotifications: true,
      enableAnalytics: true,
      trackingCode: "YOUR_TRACKING_CODE",
    },
    securitySettings: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      ipWhitelist: [],
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Update settings when stats change
  useEffect(() => {
    if (stats) {
      setSettings((prev) => ({
        ...prev,
        businessInfo: {
          ...prev.businessInfo,
          name: stats.name || prev.businessInfo.name,
          domain: stats.domain || prev.businessInfo.domain,
          logo: stats.logo || prev.businessInfo.logo,
          // Keep existing category if stats doesn't have one, otherwise use stats category
          category: stats.category || prev.businessInfo.category,
        },
      }));
    }
  }, [stats]);

  const handleSaveSettings = async (section: string) => {
    setIsLoading(true);
    try {
      if (section === "Profile") {
        // Call the business profile update endpoint
        const response = await fetch("/api/business/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: settings.businessInfo.name,
            domain: settings.businessInfo.domain,
            email: settings.businessInfo.email,
            phone: settings.businessInfo.phone,
            address: settings.businessInfo.address,
            country: settings.businessInfo.country,
            category: settings.businessInfo.category,
            description: settings.businessInfo.description,
            logo: settings.businessInfo.logo,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to save profile settings";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // If response is not valid JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error("Invalid response from server");
        }

        // Update local state with the response data
        if (data.business) {
          setSettings((prev) => ({
            ...prev,
            businessInfo: {
              ...prev.businessInfo,
              name: data.business.name,
              domain: data.business.domain,
              email: data.business.email,
              phone: data.business.phone,
              address: data.business.address,
              country: data.business.country,
              category: data.business.category,
              description: data.business.description,
              logo: data.business.logo,
            },
          }));
        }

        toast({
          title: "Profile Updated",
          description:
            data.message || "Business profile has been updated successfully.",
        });
      } else {
        // For other sections, simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast({
          title: "Settings Saved",
          description: `${section} settings have been updated successfully.`,
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (
    section: keyof BusinessSettings,
    field: string,
    value: any,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleLogoUpload = (imageData: string) => {
    updateSettings("businessInfo", "logo", imageData);
  };

  const handleLogoRemove = () => {
    updateSettings("businessInfo", "logo", null);
  };

  return (
    <div className="space-y-6 text-white">
      {/* Settings Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Business Settings
          </h2>
          <p className="text-sm md:text-base text-white/70">
            Manage your business profile, tracking, and security settings
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <div className="overflow-x-auto tabs-scroll-container">
          <TabsList className="flex w-full min-w-max space-x-1 bg-white/5 border border-white/10">
            <TabsTrigger value="profile" className="flex-shrink-0 px-3 md:px-4">
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="tracking"
              className="flex-shrink-0 px-3 md:px-4"
            >
              Tracking
            </TabsTrigger>
            <TabsTrigger
              value="commission"
              className="flex-shrink-0 px-3 md:px-4"
            >
              Commission
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex-shrink-0 px-3 md:px-4"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-shrink-0 px-3 md:px-4"
            >
              Security
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          {/* Logo Upload */}
          <ImageUpload
            currentImage={settings.businessInfo.logo}
            onImageUpload={handleLogoUpload}
            onImageRemove={handleLogoRemove}
            isLoading={isLoading}
            title="Business Logo"
            description="Upload your business logo. This will be displayed on your dashboard and in your business profile."
            maxSize={2}
          />

          {/* Business Information */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={settings.businessInfo.name}
                    onChange={(e) =>
                      updateSettings("businessInfo", "name", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={settings.businessInfo.domain}
                    onChange={(e) =>
                      updateSettings("businessInfo", "domain", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.businessInfo.email}
                    onChange={(e) =>
                      updateSettings("businessInfo", "email", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.businessInfo.phone}
                    onChange={(e) =>
                      updateSettings("businessInfo", "phone", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={settings.businessInfo.address}
                    onChange={(e) =>
                      updateSettings("businessInfo", "address", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={settings.businessInfo.country}
                    onValueChange={(value) =>
                      updateSettings("businessInfo", "country", value)
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-black/80 text-white">
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={settings.businessInfo.category}
                    onValueChange={(value) =>
                      updateSettings("businessInfo", "category", value)
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-black/80 text-white">
                      {businessCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[140px] px-3 py-2 rounded-md border border-white/10 bg-white/5 text-white placeholder:text-white/60 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-0"
                    value={settings.businessInfo.description}
                    onChange={(e) =>
                      updateSettings(
                        "businessInfo",
                        "description",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() => handleSaveSettings("Profile")}
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
                    onCheckedChange={(checked) =>
                      updateSettings(
                        "trackingSettings",
                        "enableTracking",
                        checked,
                      )
                    }
                  />
                </div>
                <Separator className="bg-border" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for new conversions
                    </p>
                  </div>
                  <Switch
                    checked={settings.trackingSettings.enableNotifications}
                    onCheckedChange={(checked) =>
                      updateSettings(
                        "trackingSettings",
                        "enableNotifications",
                        checked,
                      )
                    }
                  />
                </div>
                <Separator className="bg-border" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Detailed analytics and reporting
                    </p>
                  </div>
                  <Switch
                    checked={settings.trackingSettings.enableAnalytics}
                    onCheckedChange={(checked) =>
                      updateSettings(
                        "trackingSettings",
                        "enableAnalytics",
                        checked,
                      )
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() => handleSaveSettings("Tracking")}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Tracking Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Information (Read-only) */}
        <TabsContent value="commission" className="space-y-4">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5" />
                Commission Information
              </CardTitle>
              <CardDescription className="text-white/80">
                Your current commission rate and earnings information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-400">
                      Commission Rate Managed by Admin
                    </h4>
                    <p className="text-sm text-white/70">
                      Your commission rate is set by the platform administrator
                      and cannot be changed from this dashboard. Contact support
                      if you need to discuss your commission rate.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission-rate">
                    Current Commission Rate
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="commission-rate"
                      type="number"
                      value={stats?.adminCommissionRate || 0}
                      disabled
                      className="bg-white/10 text-white/70"
                    />
                    <Badge variant="secondary" className="text-white/70">
                      %
                    </Badge>
                  </div>
                  <p className="text-xs text-white/50">
                    Set by platform administrator
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projected-fee">Projected Fee</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="projected-fee"
                      type="number"
                      value={stats?.projectedFee || 0}
                      disabled
                      className="bg-white/10 text-white/70"
                    />
                    <Badge variant="secondary" className="text-white/70">
                      $
                    </Badge>
                  </div>
                  <p className="text-xs text-white/50">
                    Based on current commission rate
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Commission Details</Label>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">
                      Total Revenue:
                    </span>
                    <span className="text-sm font-medium">
                      ${stats?.totalRevenue || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">
                      Commission Rate:
                    </span>
                    <span className="text-sm font-medium">
                      {stats?.adminCommissionRate || 0}%
                    </span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Projected Commission:
                    </span>
                    <span className="text-sm font-medium text-green-400">
                      ${stats?.projectedFee || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings
            businessEmail={settings.businessInfo.email}
            businessName={settings.businessInfo.name}
          />
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
                    onCheckedChange={(checked) =>
                      updateSettings(
                        "securitySettings",
                        "twoFactorAuth",
                        checked,
                      )
                    }
                  />
                </div>
                <Separator className="bg-border" />
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="5"
                    max="480"
                    value={settings.securitySettings.sessionTimeout}
                    onChange={(e) =>
                      updateSettings(
                        "securitySettings",
                        "sessionTimeout",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <Separator className="bg-border" />
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleSaveSettings("Security")}
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

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        businessName={stats?.name || "Business"}
      />
    </div>
  );
}
