import 'dotenv/config';

// Fallback to NETLIFY_DATABASE_URL if DATABASE_URL is not set
if (!process.env.DATABASE_URL && process.env.NETLIFY_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.NETLIFY_DATABASE_URL;
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/delete-business.js <businessId>');
    process.exit(1);
  }

  const businessId = Number(arg);
  if (!Number.isInteger(businessId) || businessId <= 0) {
    console.error('Invalid businessId provided. It must be a positive integer.');
    process.exit(1);
  }

  console.log(`Attempting to delete business with id=${businessId} ...`);

  try {
    const existing = await prisma.business.findUnique({ where: { id: businessId } });
    if (!existing) {
      console.log(`No business found with id=${businessId}. Nothing to delete.`);
      return;
    }

    console.log('Business found:', {
      id: existing.id,
      name: existing.name,
      domain: existing.domain,
      email: existing.email,
      createdAt: existing.createdAt,
    });

    // Deleting the business will cascade to related tables due to FK constraints
    await prisma.business.delete({ where: { id: businessId } });

    console.log(`✅ Deleted business id=${businessId} and all cascading related data.`);
  } catch (error) {
    console.error('❌ Failed to delete business:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();