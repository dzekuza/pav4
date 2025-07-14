// Simple health check test
console.log("Testing health endpoints...");

// Test basic connectivity
fetch("http://localhost:8080/api/health")
  .then((response) => response.json())
  .then((data) => {
    console.log("✅ Health check passed:", data);
  })
  .catch((error) => {
    console.log("❌ Health check failed:", error.message);
  });

// Test database connectivity
fetch("http://localhost:8080/api/health/db")
  .then((response) => response.json())
  .then((data) => {
    console.log("✅ Database health check passed:", data);
  })
  .catch((error) => {
    console.log("❌ Database health check failed:", error.message);
  });

// Test search history endpoint (should not error now)
const userKey = "test-user-key";
fetch(`http://localhost:8080/api/legacy/search-history?userKey=${userKey}`)
  .then((response) => response.json())
  .then((data) => {
    console.log("✅ Search history endpoint working:", data);
  })
  .catch((error) => {
    console.log("❌ Search history endpoint failed:", error.message);
  });
