import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Business Data Cleanup Script
 * 
 * This script can be used to clean up mock/cached business statistics and related data.
 * Use with caution as it will permanently delete data.
 * 
 * Usage:
 * - node server/scripts/cleanup-business-data.js --stats-only    (reset statistics only)
 * - node server/scripts/cleanup-business-data.js --all           (reset stats + delete all data)
 * - node server/scripts/cleanup-business-data.js --dry-run       (show what would be cleaned)
 */

async function cleanupBusinessData() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isStatsOnly = args.includes('--stats-only');
  const isAllData = args.includes('--all');

  if (!isStatsOnly && !isAllData && !isDryRun) {
    console.log('❌ Please specify cleanup mode:');
    console.log('  --stats-only  : Reset business statistics to zero only');
    console.log('  --all         : Reset stats + delete all tracking data');
    console.log('  --dry-run     : Show what would be cleaned without making changes');
    process.exit(1);
  }

  try {
    console.log('🧹 Starting business data cleanup...');
    console.log(`Mode: ${isDryRun ? 'DRY RUN' : isStatsOnly ? 'STATS ONLY' : 'ALL DATA'}`);

    // Get current data counts
    const [businesses, trackingEvents, clicks, conversions, sales] = await Promise.all([
      prisma.business.findMany({
        select: {
          id: true,
          name: true,
          domain: true,
          totalVisits: true,
          totalPurchases: true,
          totalRevenue: true,
        },
      }),
      prisma.trackingEvent.count(),
      prisma.businessClick.count(),
      prisma.businessConversion.count(),
      prisma.sale.count(),
    ]);

    console.log('\n📊 Current data:');
    console.log(`  - Businesses: ${businesses.length}`);
    console.log(`  - Tracking Events: ${trackingEvents}`);
    console.log(`  - Business Clicks: ${clicks}`);
    console.log(`  - Business Conversions: ${conversions}`);
    console.log(`  - Sales Records: ${sales}`);

    console.log('\n📈 Current business statistics:');
    businesses.forEach(business => {
      console.log(`  ${business.name} (${business.domain}):`);
      console.log(`    - Total Visits: ${business.totalVisits}`);
      console.log(`    - Total Purchases: ${business.totalPurchases}`);
      console.log(`    - Total Revenue: $${business.totalRevenue}`);
    });

    if (isDryRun) {
      console.log('\n🔍 DRY RUN - No changes will be made');
      console.log('To perform actual cleanup, run with --stats-only or --all');
      return;
    }

    // Reset business statistics
    if (!isDryRun) {
      const resetResult = await prisma.business.updateMany({
        data: {
          totalVisits: 0,
          totalPurchases: 0,
          totalRevenue: 0,
        },
      });
      console.log(`✅ Reset statistics for ${resetResult.count} businesses`);
    }

    // Delete tracking data if --all is specified
    if (isAllData && !isDryRun) {
      const [trackingEventsResult, clicksResult, conversionsResult, salesResult] = await Promise.all([
        prisma.trackingEvent.deleteMany({}),
        prisma.businessClick.deleteMany({}),
        prisma.businessConversion.deleteMany({}),
        prisma.sale.deleteMany({}),
      ]);

      console.log(`🗑️  Deleted ${trackingEventsResult.count} tracking events`);
      console.log(`🗑️  Deleted ${clicksResult.count} business clicks`);
      console.log(`🗑️  Deleted ${conversionsResult.count} business conversions`);
      console.log(`🗑️  Deleted ${salesResult.count} sales records`);
    }

    // Show final results
    const finalBusinesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        totalVisits: true,
        totalPurchases: true,
        totalRevenue: true,
      },
    });

    console.log('\n📊 Final business statistics:');
    finalBusinesses.forEach(business => {
      console.log(`  ${business.name} (${business.domain}):`);
      console.log(`    - Total Visits: ${business.totalVisits}`);
      console.log(`    - Total Purchases: ${business.totalPurchases}`);
      console.log(`    - Total Revenue: $${business.totalRevenue}`);
    });

    if (isAllData) {
      const [remainingTrackingEvents, remainingClicks, remainingConversions, remainingSales] = await Promise.all([
        prisma.trackingEvent.count(),
        prisma.businessClick.count(),
        prisma.businessConversion.count(),
        prisma.sale.count(),
      ]);

      console.log('\n📈 Remaining data counts:');
      console.log(`  - Tracking Events: ${remainingTrackingEvents}`);
      console.log(`  - Business Clicks: ${remainingClicks}`);
      console.log(`  - Business Conversions: ${remainingConversions}`);
      console.log(`  - Sales Records: ${remainingSales}`);
    }

    console.log('\n✅ Business data cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupBusinessData();
