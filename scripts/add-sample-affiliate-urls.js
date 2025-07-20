import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleAffiliateUrls() {
  try {
    console.log('Adding sample affiliate URLs...');

    const sampleUrls = [
      {
        name: 'Amazon Electronics',
        url: 'https://amazon.com/electronics',
        description: 'Electronics affiliate link for Amazon',
        isActive: true,
        clicks: 1250,
        conversions: 45,
        revenue: 234.50,
      },
      {
        name: 'Best Buy Tech',
        url: 'https://bestbuy.com/tech',
        description: 'Technology products from Best Buy',
        isActive: true,
        clicks: 890,
        conversions: 32,
        revenue: 156.75,
      },
      {
        name: 'Newegg Components',
        url: 'https://newegg.com/components',
        description: 'PC components and hardware',
        isActive: true,
        clicks: 567,
        conversions: 18,
        revenue: 89.25,
      },
      {
        name: 'Walmart Home',
        url: 'https://walmart.com/home',
        description: 'Home and garden products',
        isActive: false,
        clicks: 234,
        conversions: 8,
        revenue: 45.60,
      },
      {
        name: 'Target Fashion',
        url: 'https://target.com/fashion',
        description: 'Fashion and clothing affiliate',
        isActive: true,
        clicks: 432,
        conversions: 15,
        revenue: 67.80,
      },
    ];

    for (const urlData of sampleUrls) {
      await prisma.affiliateUrl.create({
        data: urlData,
      });
      console.log(`Added: ${urlData.name}`);
    }

    console.log('✅ Sample affiliate URLs added successfully!');
  } catch (error) {
    console.error('❌ Error adding sample affiliate URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleAffiliateUrls(); 