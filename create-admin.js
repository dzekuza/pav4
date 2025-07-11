// Simple script to create an admin user
// Run with: node create-admin.js

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

console.log("=== Admin User Creation ===");
console.log("To create your first admin user, follow these steps:");
console.log("");
console.log("1. Register normally through the app at /login");
console.log("2. Copy the user ID from the admin panel or server logs");
console.log("3. Manually set isAdmin: true in the server code");
console.log("");
console.log("For production, create a proper admin user creation endpoint.");
console.log("");
console.log("Sample admin user data:");
console.log("{");
console.log('  id: "' + crypto.randomUUID() + '",');
console.log('  email: "admin@example.com",');
console.log('  password: "' + bcrypt.hashSync("admin123", 12) + '",');
console.log("  isAdmin: true,");
console.log("  createdAt: new Date(),");
console.log("  searchHistory: []");
console.log("}");
