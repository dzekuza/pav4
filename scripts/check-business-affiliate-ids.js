import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinessAffiliateIds() {
  try {
    console.log('Checking affiliate IDs for all businesses...');

    // Get all businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        affiliateId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${businesses.length} total businesses`);

    if (businesses.length === 0) {
      console.log('No businesses found in the database');
      return;
    }

    // Check which businesses have affiliate IDs
    const businessesWithAffiliateIds = businesses.filter(b => b.affiliateId && b.affiliateId.trim() !== '');
    const businessesWithoutAffiliateIds = businesses.filter(b => !b.affiliateId || b.affiliateId.trim() === '');

    console.log(`\n📊 Affiliate ID Status:`);
    console.log(`✅ Businesses with affiliate IDs: ${businessesWithAffiliateIds.length}`);
    console.log(`❌ Businesses without affiliate IDs: ${businessesWithoutAffiliateIds.length}`);

    if (businessesWithAffiliateIds.length > 0) {
      console.log(`\n✅ Businesses with affiliate IDs:`);
      businessesWithAffiliateIds.forEach(business => {
        console.log(`  - ${business.name} (ID: ${business.id}, Domain: ${business.domain})`);
        console.log(`    Affiliate ID: ${business.affiliateId}`);
      });
    }

    if (businessesWithoutAffiliateIds.length > 0) {
      console.log(`\n❌ Businesses without affiliate IDs:`);
      businessesWithoutAffiliateIds.forEach(business => {
        console.log(`  - ${business.name} (ID: ${business.id}, Domain: ${business.domain})`);
      });
    }

    // Check for duplicate affiliate IDs
    const affiliateIds = businessesWithAffiliateIds.map(b => b.affiliateId);
    const uniqueAffiliateIds = new Set(affiliateIds);
    
    if (affiliateIds.length !== uniqueAffiliateIds.size) {
      console.log(`\n⚠️  Warning: Found duplicate affiliate IDs!`);
      const duplicates = affiliateIds.filter((id, index) => affiliateIds.indexOf(id) !== index);
      console.log(`Duplicate affiliate IDs: ${duplicates.join(', ')}`);
    } else {
      console.log(`\n✅ All affiliate IDs are unique`);
    }

  } catch (error) {
    console.error('Error checking business affiliate IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkBusinessAffiliateIds(); 