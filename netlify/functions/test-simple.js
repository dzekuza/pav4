exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      message: "Simple test function is working!",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      databaseUrl: process.env.NETLIFY_DATABASE_URL ? "Set" : "Not set",
    }),
  };
};
