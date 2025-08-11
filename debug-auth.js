const axios = require("axios");

async function debugAuth() {
  console.log("🔍 Debugging Authentication Flow...\n");

  try {
    // Step 1: Test login
    console.log("1️⃣ Testing login...");
    const loginResponse = await axios.post(
      "https://pavlo4.netlify.app/api/business/auth/login",
      {
        email: "hello@godislove.lt",
        password: "your-password", // Replace with actual password
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      },
    );

    console.log("✅ Login successful:", loginResponse.data.success);
    console.log("Business ID:", loginResponse.data.business?.id);
    console.log(
      "Cookies set:",
      loginResponse.headers["set-cookie"] ? "Yes" : "No",
    );

    // Step 2: Test /me endpoint
    console.log("\n2️⃣ Testing /me endpoint...");
    const meResponse = await axios.get(
      "https://pavlo4.netlify.app/api/business/auth/me",
      {
        withCredentials: true,
      },
    );

    console.log("✅ /me successful:", meResponse.data.authenticated);
    console.log("Business data:", meResponse.data.business);

    // Step 3: Test /stats endpoint
    console.log("\n3️⃣ Testing /stats endpoint...");
    const statsResponse = await axios.get(
      "https://pavlo4.netlify.app/api/business/auth/stats",
      {
        withCredentials: true,
      },
    );

    console.log("✅ /stats successful:", statsResponse.data.success);
    console.log("Stats data:", statsResponse.data.stats);
  } catch (error) {
    console.log(
      "❌ Error:",
      error.response?.status,
      error.response?.data || error.message,
    );

    if (error.response?.data?.error) {
      console.log("Error details:", error.response.data.error);
    }
  }
}

// Instructions
console.log("🚀 Authentication Debug Script");
console.log("================================");
console.log("This script will test the authentication flow step by step.");
console.log("Make sure to replace the password with your actual password.\n");

// Uncomment to run the debug
// debugAuth();
