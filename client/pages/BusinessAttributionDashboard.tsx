import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import SessionAttributionDashboard from "@/components/SessionAttributionDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  domainVerified?: boolean;
  trackingVerified?: boolean;
}

interface BusinessAttributionDashboardProps {
  stats: BusinessStats;
}

export default function BusinessAttributionDashboard() {
  const { stats } = useOutletContext<BusinessAttributionDashboardProps>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Session Attribution</h1>
          <p className="text-white/70 mt-2">
            Track which URLs and campaigns led to successful purchases on your Shopify store
          </p>
        </div>
      </div>

      {/* Integration Status */}
      {!stats.trackingVerified && (
        <Alert className="border-yellow-500/20 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-white/80">
            <strong>Setup Required:</strong> To see session attribution data, you need to set up the Shopify script integration. 
            Go to the <strong>Integrate</strong> tab to get started.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Session Attribution Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-white/80 space-y-2">
            <p>
              <strong>1. UTM Parameter Tracking:</strong> When users click on product links from your iPick integration, 
              UTM parameters are automatically added to track the source.
            </p>
            <p>
              <strong>2. Thank You Page Script:</strong> The Google Tag Manager script on your Shopify thank you page 
              captures successful orders and their associated UTM parameters.
            </p>
            <p>
              <strong>3. Session Attribution:</strong> This dashboard shows you which campaigns, sources, and URLs 
              are driving the most successful purchases.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 border border-white/10 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">{stats.totalVisits}</div>
              <div className="text-sm text-white/70">Total Sessions</div>
            </div>
            <div className="text-center p-4 border border-white/10 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">{stats.totalPurchases}</div>
              <div className="text-sm text-white/70">Attributed Orders</div>
            </div>
            <div className="text-center p-4 border border-white/10 rounded-lg bg-white/5">
              <div className="text-2xl font-bold text-white">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-white/70">Attributed Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Attribution Dashboard */}
      {stats.trackingVerified ? (
        <SessionAttributionDashboard business={stats} />
      ) : (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Session Attribution Data</CardTitle>
            <CardDescription className="text-white/70">
              Complete the integration setup to view detailed attribution data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-white/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Integration Required
              </h3>
              <p className="text-white/70 mb-6">
                Set up the Shopify script integration to start tracking session attribution data.
              </p>
              <Button
                onClick={() => window.location.href = "/business/dashboard/checkout/integrate"}
                className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
              >
                Go to Integration Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
