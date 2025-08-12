import React from "react";
import { useOutletContext } from "react-router-dom";
import BusinessIntegrationWizard from "@/components/BusinessIntegrationWizard";

interface BusinessStats {
  id: number;
  name: string;
  domain?: string;
  domainVerified?: boolean;
  trackingVerified?: boolean;
  affiliateId: string;
  totalVisits?: number;
  totalPurchases?: number;
  totalRevenue?: number;
  adminCommissionRate?: number;
  projectedFee?: number;
  averageOrderValue?: number;
  conversionRate?: number;
}

export default function BusinessIntegrateDashboard() {
  const { stats } = useOutletContext<{ stats: BusinessStats }>();

  return (
    <div className="py-8">
      <BusinessIntegrationWizard business={stats} />
    </div>
  );
}
