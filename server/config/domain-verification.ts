// Domain verification configuration
// This file controls whether domain verification is required for business dashboard access

export const DOMAIN_VERIFICATION_CONFIG = {
  // Set to false to make domain verification optional
  REQUIRED_FOR_DASHBOARD_ACCESS: false,

  // Set to false to make domain verification optional for tracking
  REQUIRED_FOR_TRACKING: false,

  // Set to false to make domain verification optional for analytics
  REQUIRED_FOR_ANALYTICS: false,

  // Features that require domain verification (only enforced if REQUIRED_FOR_DASHBOARD_ACCESS is true)
  FEATURES_REQUIRING_VERIFICATION: [
    "advanced_analytics",
    "real_time_tracking",
    "custom_tracking_scripts",
    "webhook_integrations",
  ],

  // Features available without domain verification
  FEATURES_AVAILABLE_WITHOUT_VERIFICATION: [
    "basic_analytics",
    "basic_tracking",
    "dashboard_access",
    "profile_management",
    "basic_reports",
  ],

  // Warning message shown when domain is not verified
  WARNING_MESSAGE:
    "Domain verification is recommended for enhanced features and accurate tracking.",

  // Success message when domain is verified
  SUCCESS_MESSAGE:
    "Domain verified successfully! You now have access to all features.",
};

// Helper function to check if a feature requires domain verification
export function requiresDomainVerification(feature: string): boolean {
  if (!DOMAIN_VERIFICATION_CONFIG.REQUIRED_FOR_DASHBOARD_ACCESS) {
    return false;
  }

  return DOMAIN_VERIFICATION_CONFIG.FEATURES_REQUIRING_VERIFICATION.includes(
    feature,
  );
}

// Helper function to check if a feature is available without verification
export function isFeatureAvailableWithoutVerification(
  feature: string,
): boolean {
  return DOMAIN_VERIFICATION_CONFIG.FEATURES_AVAILABLE_WITHOUT_VERIFICATION.includes(
    feature,
  );
}

// Helper function to get available features for a business
export function getAvailableFeatures(isDomainVerified: boolean): string[] {
  const availableFeatures = [
    ...DOMAIN_VERIFICATION_CONFIG.FEATURES_AVAILABLE_WITHOUT_VERIFICATION,
  ];

  if (isDomainVerified) {
    availableFeatures.push(
      ...DOMAIN_VERIFICATION_CONFIG.FEATURES_REQUIRING_VERIFICATION,
    );
  }

  return availableFeatures;
}

// Helper function to check if dashboard access is allowed
export function isDashboardAccessAllowed(
  isDomainVerified: boolean = false,
): boolean {
  if (!DOMAIN_VERIFICATION_CONFIG.REQUIRED_FOR_DASHBOARD_ACCESS) {
    return true;
  }

  return isDomainVerified;
}

// Helper function to check if tracking is allowed
export function isTrackingAllowed(isDomainVerified: boolean = false): boolean {
  if (!DOMAIN_VERIFICATION_CONFIG.REQUIRED_FOR_TRACKING) {
    return true;
  }

  return isDomainVerified;
}

// Helper function to check if analytics are allowed
export function isAnalyticsAllowed(isDomainVerified: boolean = false): boolean {
  if (!DOMAIN_VERIFICATION_CONFIG.REQUIRED_FOR_ANALYTICS) {
    return true;
  }

  return isDomainVerified;
}
