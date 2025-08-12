import type { Handler } from "@netlify/functions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const handler: Handler = async (event, context) => {
  try {
    console.log("Testing database connection...");
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection successful");
    
    // Test business table
    const businessCount = await prisma.business.count();
    console.log(`Found ${businessCount} businesses in database`);
    
    // Test tracking events table
    const eventCount = await prisma.trackingEvent.count();
    console.log(`Found ${eventCount} tracking events in database`);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: "Database connection successful",
        businessCount,
        eventCount,
        databaseUrl: process.env.NETLIFY_DATABASE_URL ? "Set" : "Not set",
      }),
    };
  } catch (error) {
    console.error("Database connection test failed:", error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : String(error),
        databaseUrl: process.env.NETLIFY_DATABASE_URL ? "Set" : "Not set",
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
