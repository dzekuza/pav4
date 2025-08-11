import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBusinessAuth } from "@/hooks/use-auth";
import BusinessIntegrationWizard from "@/components/BusinessIntegrationWizard";

export default function BusinessIntegrate() {
  const navigate = useNavigate();
  const { business, isBusinessLoading, isBusiness } = useBusinessAuth();

  // Redirect to business login if not authenticated
  useEffect(() => {
    if (!isBusinessLoading && !isBusiness) {
      navigate("/business-login");
    }
  }, [isBusinessLoading, isBusiness, navigate]);

  // Show loading while checking authentication
  if (isBusinessLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isBusiness) {
    return null;
  }

  return (
    <div className="py-8">
      <BusinessIntegrationWizard business={business} />
    </div>
  );
}
