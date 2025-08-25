import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  console.log("Minimal test function called");
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      success: true,
      message: "Minimal test function working",
      timestamp: new Date().toISOString(),
    }),
  };
};
