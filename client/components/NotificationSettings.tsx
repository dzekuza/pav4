import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Smartphone, Settings, Save, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  emailNotifications: {
    enabled: boolean;
    salesNotifications: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    domainVerification: boolean;
    securityAlerts: boolean;
  };
  emailPreferences: {
    frequency: "immediate" | "daily" | "weekly";
    timezone: string;
    language: string;
  };
  testEmail: string;
}

interface NotificationSettingsProps {
  businessEmail: string;
  businessName: string;
}

export function NotificationSettings({ businessEmail, businessName }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: {
      enabled: true,
      salesNotifications: true,
      weeklyReports: false,
      monthlyReports: true,
      domainVerification: true,
      securityAlerts: true,
    },
    emailPreferences: {
      frequency: "immediate",
      timezone: "UTC",
      language: "en",
    },
    testEmail: businessEmail,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update test email when business email changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      testEmail: businessEmail,
    }));
  }, [businessEmail]);

  const updateNotificationSetting = (category: keyof NotificationSettings['emailNotifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [category]: value,
      },
    }));
  };

  const updateEmailPreference = (field: keyof NotificationSettings['emailPreferences'], value: string) => {
    setSettings(prev => ({
      ...prev,
      emailPreferences: {
        ...prev.emailPreferences,
        [field]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save notification settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/business/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: settings.testEmail,
          businessName,
        }),
      });

      if (response.ok) {
        toast({
          title: "Test Email Sent",
          description: "A test email has been sent to your email address.",
        });
      } else {
        throw new Error("Failed to send test email");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Notification Settings</h2>
          <p className="text-white/70">
            Manage your email notifications and preferences
          </p>
        </div>
      </div>

      {/* Email Notifications */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription className="text-white/80">
            Choose which notifications you want to receive via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
            <div className="space-y-1">
              <Label className="text-white font-medium">Enable Email Notifications</Label>
              <p className="text-sm text-white/70">
                Master switch for all email notifications
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications.enabled}
              onCheckedChange={(checked) => updateNotificationSetting("enabled", checked)}
            />
          </div>

          <Separator className="border-white/10" />

          {/* Individual Notification Types */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white font-medium">Sales Notifications</Label>
                <p className="text-sm text-white/70">
                  Get notified immediately when you make a sale
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications.salesNotifications}
                onCheckedChange={(checked) => updateNotificationSetting("salesNotifications", checked)}
                disabled={!settings.emailNotifications.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white font-medium">Weekly Reports</Label>
                <p className="text-sm text-white/70">
                  Receive weekly analytics and performance summaries
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications.weeklyReports}
                onCheckedChange={(checked) => updateNotificationSetting("weeklyReports", checked)}
                disabled={!settings.emailNotifications.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white font-medium">Monthly Reports</Label>
                <p className="text-sm text-white/70">
                  Receive comprehensive monthly analytics reports
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications.monthlyReports}
                onCheckedChange={(checked) => updateNotificationSetting("monthlyReports", checked)}
                disabled={!settings.emailNotifications.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white font-medium">Domain Verification</Label>
                <p className="text-sm text-white/70">
                  Notifications about domain verification status
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications.domainVerification}
                onCheckedChange={(checked) => updateNotificationSetting("domainVerification", checked)}
                disabled={!settings.emailNotifications.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white font-medium">Security Alerts</Label>
                <p className="text-sm text-white/70">
                  Important security notifications and alerts
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications.securityAlerts}
                onCheckedChange={(checked) => updateNotificationSetting("securityAlerts", checked)}
                disabled={!settings.emailNotifications.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription className="text-white/80">
            Customize your email notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-white">Notification Frequency</Label>
              <Select
                value={settings.emailPreferences.frequency}
                onValueChange={(value) => updateEmailPreference("frequency", value)}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 text-black">
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-white">Timezone</Label>
              <Select
                value={settings.emailPreferences.timezone}
                onValueChange={(value) => updateEmailPreference("timezone", value)}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 text-black">
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">Eastern Time</SelectItem>
                  <SelectItem value="PST">Pacific Time</SelectItem>
                  <SelectItem value="CET">Central European Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TestTube className="h-5 w-5" />
            Test Email Configuration
          </CardTitle>
          <CardDescription className="text-white/80">
            Send a test email to verify your notification settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email" className="text-white">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              value={settings.testEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, testEmail: e.target.value }))}
              placeholder="Enter email address for testing"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/60"
            />
          </div>
          <Button
            onClick={handleSendTestEmail}
            disabled={isLoading || !settings.testEmail}
            className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
