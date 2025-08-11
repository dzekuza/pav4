import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to generate unique affiliate ID
function generateAffiliateId(domain) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const domainPrefix = domain.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10);
  return `aff_${domainPrefix}_${timestamp}_${randomSuffix}`;
}

async function addMissingAffiliateIds() {
  try {
    console.log("Starting to add missing affiliate IDs...");

    // Find all businesses without affiliate IDs
    const businessesWithoutAffiliateIds = await prisma.business.findMany({
      where: {
        OR: [{ affiliateId: null }, { affiliateId: "" }],
      },
    });

    console.log(
      `Found ${businessesWithoutAffiliateIds.length} businesses without affiliate IDs`,
    );

    if (businessesWithoutAffiliateIds.length === 0) {
      console.log("All businesses already have affiliate IDs!");
      return;
    }

    // Update each business with a new affiliate ID
    for (const business of businessesWithoutAffiliateIds) {
      let affiliateId = generateAffiliateId(business.domain);

      // Check if affiliate ID already exists and generate a new one if needed
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const existingBusiness = await prisma.business.findUnique({
          where: { affiliateId },
        });

        if (!existingBusiness) {
          break; // Affiliate ID is unique
        }

        // Generate new affiliate ID with different random suffix
        affiliateId = generateAffiliateId(business.domain);
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.error(
          `Failed to generate unique affiliate ID for business ${business.id} (${business.name})`,
        );
        continue;
      }

      // Update the business with the new affiliate ID
      await prisma.business.update({
        where: { id: business.id },
        data: { affiliateId },
      });

      console.log(
        `Updated business "${business.name}" (ID: ${business.id}) with affiliate ID: ${affiliateId}`,
      );
    }

    console.log("Successfully added affiliate IDs to all businesses!");

    // Verify all businesses now have affiliate IDs
    const remainingBusinessesWithoutAffiliateIds =
      await prisma.business.findMany({
        where: {
          OR: [{ affiliateId: null }, { affiliateId: "" }],
        },
      });

    if (remainingBusinessesWithoutAffiliateIds.length === 0) {
      console.log(
        "✅ Verification successful: All businesses now have affiliate IDs",
      );
    } else {
      console.log(
        `❌ Warning: ${remainingBusinessesWithoutAffiliateIds.length} businesses still don't have affiliate IDs`,
      );
    }
  } catch (error) {
    console.error("Error adding missing affiliate IDs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addMissingAffiliateIds();
