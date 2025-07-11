// Generate or retrieve user ID for analytics tracking
export function getUserId(): string {
  let userId = localStorage.getItem("ph_user_id");

  if (!userId) {
    // Generate a new user ID
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("ph_user_id", userId);
  }

  return userId;
}

// Initialize user tracking on app load
export function initializeUserTracking(): void {
  // Ensure user has an ID
  getUserId();

  // Track page views and other events if needed
  console.log("User tracking initialized for:", getUserId());
}
