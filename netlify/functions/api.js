// Add debugging for Netlify environment
console.log("Netlify function environment:", {
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL,
  NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? "SET" : "NOT SET"
});

export const handler = async (event, context) => {
  console.log("Handler called with event:", {
    path: event.path,
    httpMethod: event.httpMethod
  });

  try {
    // Parse the path to determine the endpoint
    const path = event.path || event.rawPath || "";
    const method = event.httpMethod;

    // Health check endpoint
    if (path.endsWith("/health")) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          env: {
            NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? "SET" : "NOT SET"
          }
        })
      };
    }

    // Debug database endpoint
    if (path.endsWith("/debug/db")) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          databaseConnected: true,
          message: "Database connection will be implemented",
          env: {
            NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL ? "SET" : "NOT SET"
          }
        })
      };
    }

    // Business authentication endpoints
    if (path.endsWith("/business/auth/me")) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business: null,
          authenticated: false
        })
      };
    }

    // Business login endpoint
    if (path.endsWith("/business/auth/login") && method === "POST") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          message: "Business login endpoint working - database queries will be implemented",
          timestamp: new Date().toISOString()
        })
      };
    }

    // Business stats endpoint
    if (path.endsWith("/business/auth/stats")) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          message: "Real database queries will be implemented",
          timestamp: new Date().toISOString()
        })
      };
    }

    // Default response for unknown endpoints
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "API is working!",
        path: path,
        method: method,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
    };
  }
};
