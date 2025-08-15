export const run: ActionRun = async ({ params, logger, api, connections }) => {
  logger.info("Starting checkout tracking debug analysis");

  // Get current shop ID for tenancy filtering
  const shopIdRaw = connections.shopify.currentShopId;
  if (!shopIdRaw) {
    logger.error("No shop ID found in connections");
    throw new Error("Shop ID is required for this analysis");
  }

  const shopId = shopIdRaw.toString();
  logger.info(`Analyzing checkout tracking for shop: ${shopId}`);

  // Initialize analysis results
  const analysisResults = {
    shopId,
    timestamp: new Date().toISOString(),
    summary: {
      totalCheckouts: 0,
      totalOrders: 0,
      totalBusinessReferrals: 0,
      checkoutsWithReferralData: 0,
      ordersWithReferralData: 0,
      iPickDetectedCheckouts: 0,
      iPickDetectedOrders: 0
    },
    checkoutAnalysis: [] as any[],
    orderAnalysis: [] as any[],
    businessReferrals: [] as any[],
    patterns: {
      commonSourceUrls: new Map<string, number>(),
      commonSourceNames: new Map<string, number>(),
      detectedReferralSources: new Set<string>()
    },
    recommendations: [] as string[]
  };

  // Query recent shopifyCheckout records
  logger.info("Querying recent shopifyCheckout records");
  const recentCheckouts = await api.shopifyCheckout.findMany({
    filter: {
      shopId: { equals: shopId },
      createdAt: { greaterThan: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() } // Last 7 days
    },
    sort: { createdAt: "Descending" },
    first: 50,
    select: {
      id: true,
      createdAt: true,
      sourceUrl: true,
      sourceName: true,
      sourceIdentifier: true,
      email: true,
      token: true,
      totalPrice: true,
      currency: true,
      completedAt: true,
      userId: true
    }
  });

  analysisResults.summary.totalCheckouts = recentCheckouts.length;
  logger.info(`Found ${recentCheckouts.length} recent checkouts`);

  // Analyze each checkout
  for (const checkout of recentCheckouts) {
    logger.info(`Analyzing checkout ${checkout.id}`);
    
    const analysis = {
      id: checkout.id,
      createdAt: checkout.createdAt,
      sourceUrl: checkout.sourceUrl,
      sourceName: checkout.sourceName,
      sourceIdentifier: checkout.sourceIdentifier,
      email: checkout.email,
      totalPrice: checkout.totalPrice,
      currency: checkout.currency,
      completedAt: checkout.completedAt,
      userId: checkout.userId,
      hasReferralData: false,
      iPickDetected: false,
      detectedPatterns: [] as string[],
      issues: [] as string[]
    };

    // Check for referral data
    if (checkout.sourceUrl || checkout.sourceName || checkout.sourceIdentifier) {
      analysis.hasReferralData = true;
      analysisResults.summary.checkoutsWithReferralData++;
      
      // Track common patterns
      if (checkout.sourceUrl) {
        const count = analysisResults.patterns.commonSourceUrls.get(checkout.sourceUrl) || 0;
        analysisResults.patterns.commonSourceUrls.set(checkout.sourceUrl, count + 1);
      }
      if (checkout.sourceName) {
        const count = analysisResults.patterns.commonSourceNames.get(checkout.sourceName) || 0;
        analysisResults.patterns.commonSourceNames.set(checkout.sourceName, count + 1);
      }
    }

    // iPick detection logic (based on common patterns)
    const iPickDetection = detectIPick(checkout.sourceUrl, checkout.sourceName, checkout.sourceIdentifier);
    analysis.iPickDetected = iPickDetection.detected;
    analysis.detectedPatterns = iPickDetection.patterns;
    
    if (analysis.iPickDetected) {
      analysisResults.summary.iPickDetectedCheckouts++;
      analysisResults.patterns.detectedReferralSources.add(checkout.sourceUrl || checkout.sourceName || 'unknown');
    }

    // Check for common issues
    if (!checkout.sourceUrl && !checkout.sourceName && !checkout.sourceIdentifier) {
      analysis.issues.push("No referral tracking data present");
    }
    if (checkout.sourceUrl && !isValidUrl(checkout.sourceUrl)) {
      analysis.issues.push("Invalid source URL format");
    }
    if (!checkout.completedAt && checkout.totalPrice) {
      analysis.issues.push("Checkout has value but not completed");
    }

    analysisResults.checkoutAnalysis.push(analysis);
  }

  // Query recent shopifyOrder records
  logger.info("Querying recent shopifyOrder records");
  const recentOrders = await api.shopifyOrder.findMany({
    filter: {
      shopId: { equals: shopId },
      createdAt: { greaterThan: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() } // Last 7 days
    },
    sort: { createdAt: "Descending" },
    first: 50,
    select: {
      id: true,
      createdAt: true,
      sourceUrl: true,
      sourceName: true,
      sourceIdentifier: true,
      email: true,
      name: true,
      totalPrice: true,
      currency: true,
      financialStatus: true,
      fulfillmentStatus: true,
      checkoutToken: true
    }
  });

  analysisResults.summary.totalOrders = recentOrders.length;
  logger.info(`Found ${recentOrders.length} recent orders`);

  // Analyze each order
  for (const order of recentOrders) {
    logger.info(`Analyzing order ${order.id}`);
    
    const analysis = {
      id: order.id,
      name: order.name,
      createdAt: order.createdAt,
      sourceUrl: order.sourceUrl,
      sourceName: order.sourceName,
      sourceIdentifier: order.sourceIdentifier,
      email: order.email,
      totalPrice: order.totalPrice,
      currency: order.currency,
      financialStatus: order.financialStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      checkoutToken: order.checkoutToken,
      hasReferralData: false,
      iPickDetected: false,
      detectedPatterns: [] as string[],
      issues: [] as string[]
    };

    // Check for referral data
    if (order.sourceUrl || order.sourceName || order.sourceIdentifier) {
      analysis.hasReferralData = true;
      analysisResults.summary.ordersWithReferralData++;
      
      // Track common patterns
      if (order.sourceUrl) {
        const count = analysisResults.patterns.commonSourceUrls.get(order.sourceUrl) || 0;
        analysisResults.patterns.commonSourceUrls.set(order.sourceUrl, count + 1);
      }
      if (order.sourceName) {
        const count = analysisResults.patterns.commonSourceNames.get(order.sourceName) || 0;
        analysisResults.patterns.commonSourceNames.set(order.sourceName, count + 1);
      }
    }

    // iPick detection logic
    const iPickDetection = detectIPick(order.sourceUrl, order.sourceName, order.sourceIdentifier);
    analysis.iPickDetected = iPickDetection.detected;
    analysis.detectedPatterns = iPickDetection.patterns;
    
    if (analysis.iPickDetected) {
      analysisResults.summary.iPickDetectedOrders++;
      analysisResults.patterns.detectedReferralSources.add(order.sourceUrl || order.sourceName || 'unknown');
    }

    // Check for common issues
    if (!order.sourceUrl && !order.sourceName && !order.sourceIdentifier) {
      analysis.issues.push("No referral tracking data present");
    }
    if (order.sourceUrl && !isValidUrl(order.sourceUrl)) {
      analysis.issues.push("Invalid source URL format");
    }
    if (order.financialStatus !== 'paid' && order.totalPrice) {
      analysis.issues.push(`Order not paid (status: ${order.financialStatus})`);
    }

    analysisResults.orderAnalysis.push(analysis);
  }

  // Query all business referrals for this shop
  logger.info("Querying business referral records");
  const businessReferrals = await api.businessReferral.findMany({
    filter: {
      shopId: { equals: shopId }
    },
    sort: { createdAt: "Descending" },
    first: 100,
    select: {
      id: true,
      referralId: true,
      businessDomain: true,
      targetUrl: true,
      sourceUrl: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      conversionStatus: true,
      conversionValue: true,
      clickedAt: true,
      createdAt: true,
      userId: true,
      productName: true
    }
  });

  analysisResults.summary.totalBusinessReferrals = businessReferrals.length;
  logger.info(`Found ${businessReferrals.length} business referral records`);

  // Analyze business referrals
  for (const referral of businessReferrals) {
    analysisResults.businessReferrals.push({
      ...referral,
      age: Math.round((Date.now() - new Date(referral.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      hasConversion: referral.conversionStatus === 'converted',
      issues: referral.conversionStatus === 'abandoned' ? ['Conversion abandoned'] : []
    });
  }

  // Generate recommendations
  logger.info("Generating recommendations");
  
  if (analysisResults.summary.totalCheckouts === 0 && analysisResults.summary.totalOrders === 0) {
    analysisResults.recommendations.push("No recent checkout or order activity found. Check if the shop is receiving traffic.");
  }

  const referralDataPercentage = ((analysisResults.summary.checkoutsWithReferralData + analysisResults.summary.ordersWithReferralData) / 
    (analysisResults.summary.totalCheckouts + analysisResults.summary.totalOrders)) * 100;
  
  if (referralDataPercentage < 10) {
    analysisResults.recommendations.push(`Low referral data capture rate (${referralDataPercentage.toFixed(1)}%). Check if tracking scripts are properly installed.`);
  }

  if (analysisResults.summary.iPickDetectedCheckouts === 0 && analysisResults.summary.iPickDetectedOrders === 0) {
    analysisResults.recommendations.push("No iPick referrals detected. Verify iPick integration and tracking parameters.");
  }

  if (analysisResults.summary.totalBusinessReferrals === 0) {
    analysisResults.recommendations.push("No business referral records found. Check if referral tracking actions are being triggered.");
  }

  const conversionRate = businessReferrals.filter(r => r.conversionStatus === 'converted').length / businessReferrals.length * 100;
  if (conversionRate < 5 && businessReferrals.length > 0) {
    analysisResults.recommendations.push(`Low conversion rate (${conversionRate.toFixed(1)}%). Review conversion tracking logic.`);
  }

  // Convert Maps to objects for JSON serialization
  const finalResults = {
    ...analysisResults,
    patterns: {
      commonSourceUrls: Object.fromEntries(analysisResults.patterns.commonSourceUrls),
      commonSourceNames: Object.fromEntries(analysisResults.patterns.commonSourceNames),
      detectedReferralSources: Array.from(analysisResults.patterns.detectedReferralSources)
    }
  };

  logger.info("Checkout tracking analysis completed");
  logger.info("Analysis summary", { 
    totalCheckouts: finalResults.summary.totalCheckouts,
    totalOrders: finalResults.summary.totalOrders,
    referralDataCaptureRate: referralDataPercentage.toFixed(1) + '%',
    recommendationsCount: finalResults.recommendations.length
  });

  return finalResults;
};

// Helper function to detect iPick referrals
function detectIPick(sourceUrl?: string | null, sourceName?: string | null, sourceIdentifier?: string | null) {
  const patterns: string[] = [];
  let detected = false;

  // Check for iPick in source URL
  if (sourceUrl) {
    if (sourceUrl.includes('ipick') || sourceUrl.includes('i-pick')) {
      patterns.push('iPick domain detected in source URL');
      detected = true;
    }
    if (sourceUrl.includes('affiliate') || sourceUrl.includes('ref=')) {
      patterns.push('Affiliate parameter detected in source URL');
      detected = true;
    }
  }

  // Check for iPick in source name
  if (sourceName) {
    if (sourceName.toLowerCase().includes('ipick') || sourceName.toLowerCase().includes('i-pick')) {
      patterns.push('iPick detected in source name');
      detected = true;
    }
    if (sourceName.toLowerCase().includes('affiliate') || sourceName.toLowerCase().includes('referral')) {
      patterns.push('Affiliate/referral detected in source name');
      detected = true;
    }
  }

  // Check for iPick in source identifier
  if (sourceIdentifier) {
    if (sourceIdentifier.includes('ipick') || sourceIdentifier.includes('i-pick')) {
      patterns.push('iPick detected in source identifier');
      detected = true;
    }
  }

  return { detected, patterns };
}

// Helper function to validate URLs
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}
