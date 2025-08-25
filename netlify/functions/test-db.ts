import type { Handler } from "@netlify/functions";
import { PrismaClient } from "@prisma/client";

export const handler: Handler = async (event, context) => {
  console.log("Test DB function called");
  console.log("Environment variables:", {
    NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? "Set" : "Not set",
    DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Not set",
    NODE_ENV: process.env.NODE_ENV,
  });

  try {
    const prisma = new PrismaClient({
      log: ["error", "warn"],
    });

    // Test database connection
    await prisma.$connect();
    console.log("Database connection successful");

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("Query result:", result);

    await prisma.$disconnect();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Database connection test successful",
        result: result,
      }),
    };
  } catch (error) {
    console.error("Database test failed:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Database connection test failed",
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
