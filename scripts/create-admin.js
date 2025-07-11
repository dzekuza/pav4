// Script to create an admin user
// Usage: node scripts/create-admin.js <email> <password>

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createAdminUser(email, password) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ User with email ${email} already exists`);
      console.log(
        "To make them admin, update the database directly or use the admin panel",
      );
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isAdmin: true,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`👑 Admin: ${user.isAdmin}`);
    console.log(`📅 Created: ${user.createdAt}`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

if (!email || !password) {
  console.log("📋 Usage: node scripts/create-admin.js <email> <password>");
  console.log(
    "📋 Example: node scripts/create-admin.js admin@example.com mypassword123",
  );
  process.exit(1);
}

if (password.length < 6) {
  console.log("❌ Password must be at least 6 characters long");
  process.exit(1);
}

createAdminUser(email, password);
