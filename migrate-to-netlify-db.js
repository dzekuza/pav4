import { PrismaClient } from "@prisma/client";

async function migrateToNetlifyDB() {
  console.log("🔄 Migrating data to Netlify database...\n");

  // Local database (source)
  const localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Netlify database (target)
  const netlifyPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.NETLIFY_DATABASE_URL,
      },
    },
  });

  try {
    console.log("1️⃣ Connecting to local database...");
    await localPrisma.$connect();
    console.log("✅ Local database connected");

    console.log("2️⃣ Connecting to Netlify database...");
    await netlifyPrisma.$connect();
    console.log("✅ Netlify database connected");

    // Get businesses from local database
    console.log("3️⃣ Fetching businesses from local database...");
    const businesses = await localPrisma.business.findMany();
    console.log(`✅ Found ${businesses.length} businesses in local database`);

    // Migrate each business
    for (const business of businesses) {
      console.log(
        `4️⃣ Migrating business: ${business.name} (ID: ${business.id})`,
      );

      try {
        // Check if business already exists in Netlify database
        const existingBusiness = await netlifyPrisma.business.findUnique({
          where: { email: business.email },
        });

        if (existingBusiness) {
          console.log(
            `   ⚠️  Business ${business.name} already exists in Netlify database`,
          );
          continue;
        }

        // Create business in Netlify database
        const newBusiness = await netlifyPrisma.business.create({
          data: {
            name: business.name,
            domain: business.domain,
            website: business.website,
            description: business.description,
            logo: business.logo,
            isActive: business.isActive,
            isVerified: business.isVerified,
            contactEmail: business.contactEmail,
            contactPhone: business.contactPhone,
            address: business.address,
            country: business.country,
            category: business.category,
            commission: business.commission,
            email: business.email,
            password: business.password, // Note: This will be hashed
            totalVisits: business.totalVisits,
            totalPurchases: business.totalPurchases,
            totalRevenue: business.totalRevenue,
            adminCommissionRate: business.adminCommissionRate,
            affiliateId: business.affiliateId,
            trackingVerified: business.trackingVerified,
          },
        });

        console.log(
          `   ✅ Business ${business.name} migrated successfully (New ID: ${newBusiness.id})`,
        );
      } catch (error) {
        console.error(
          `   ❌ Error migrating business ${business.name}:`,
          error.message,
        );
      }
    }

    console.log("\n5️⃣ Migration completed!");

    // Verify migration
    const netlifyBusinesses = await netlifyPrisma.business.findMany();
    console.log(
      `✅ Netlify database now has ${netlifyBusinesses.length} businesses`,
    );
  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    await localPrisma.$disconnect();
    await netlifyPrisma.$disconnect();
  }
}

// Instructions
console.log("🚀 Database Migration Script");
console.log("============================");
console.log(
  "This script will migrate your business data from the local database",
);
console.log("to the new Netlify database.\n");

// Uncomment to run the migration
migrateToNetlifyDB();
