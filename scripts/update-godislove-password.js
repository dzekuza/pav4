#!/usr/bin/env node
/**
 * Script to update password for godislove.lt business account
 * Usage: node scripts/update-godislove-password.js
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function updateGodislovePassword() {
  try {
    // Generate a secure password
    const newPassword = "Godislove2024!";
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update godislove.lt business password
    const business = await prisma.business.update({
      where: { domain: "godislove.lt" },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        domain: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
    });

    console.log("✅ Godislove business password updated successfully!");
    console.log("📋 Business Information:");
    console.log(`   ID: ${business.id}`);
    console.log(`   Name: ${business.name}`);
    console.log(`   Domain: ${business.domain}`);
    console.log(`   Email: ${business.email}`);
    console.log(`   Active: ${business.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`   Updated: ${business.updatedAt.toISOString()}`);
    console.log("\n🔐 Login Credentials:");
    console.log(`   Email: ${business.email}`);
    console.log(`   Password: ${newPassword}`);
    console.log("\n⚠️  Please save these credentials securely!");
    
    return true;
  } catch (error) {
    console.error("❌ Error updating godislove business password:", error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

console.log("🔄 Updating password for godislove.lt business account...");

updateGodislovePassword()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });


