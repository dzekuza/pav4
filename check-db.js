import { PrismaClient } from '@prisma/client';

async function checkDatabase() {
    console.log('🔍 Checking Database Connection...\n');

    const prisma = new PrismaClient();

    try {
        // Test connection
        console.log('1️⃣ Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connection successful');

        // Check businesses
        console.log('\n2️⃣ Checking businesses...');
        const businesses = await prisma.business.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                domain: true,
                isActive: true,
                affiliateId: true,
                trackingVerified: true,
            }
        });

        console.log(`✅ Found ${businesses.length} businesses:`);
        businesses.forEach(business => {
            console.log(`   - ID: ${business.id}, Name: ${business.name}, Email: ${business.email}, Domain: ${business.domain}`);
        });

        // Check specific business
        console.log('\n3️⃣ Checking specific business (ID: 3)...');
        const business = await prisma.business.findUnique({
            where: { id: 3 },
            select: {
                id: true,
                name: true,
                email: true,
                domain: true,
                isActive: true,
                affiliateId: true,
                trackingVerified: true,
                totalVisits: true,
                totalPurchases: true,
                totalRevenue: true,
            }
        });

        if (business) {
            console.log('✅ Business found:', business);
        } else {
            console.log('❌ Business with ID 3 not found');
        }

        // Check business clicks and conversions
        console.log('\n4️⃣ Checking business clicks and conversions...');
        const clicks = await prisma.businessClick.count({
            where: { businessId: 3 }
        });
        const conversions = await prisma.businessConversion.count({
            where: { businessId: 3 }
        });

        console.log(`   - Clicks: ${clicks}`);
        console.log(`   - Conversions: ${conversions}`);

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase(); 