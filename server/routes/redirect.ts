import express from "express";
const router = express.Router();

// /api/redirect?to=<url>&user_id=<id>&reseller_id=<id>
router.get("/redirect", async (req, res) => {
  const { to, user_id, reseller_id } = req.query;

  if (!to || typeof to !== "string") {
    return res.status(400).json({ error: "Missing destination URL" });
  }

  let url;
  try {
    url = new URL(to);
  } catch {
    return res.status(400).json({ error: "Invalid destination URL" });
  }

  if (user_id) url.searchParams.set("track_user", String(user_id));
  if (reseller_id) url.searchParams.set("aff_id", String(reseller_id));
  url.searchParams.set("utm_source", "pavlo4");

  // TODO: Save to your DB here if needed (click log, analytics, etc.)
  console.log("Redirecting user:", {
    user_id,
    reseller_id,
    destination: url.toString(),
    timestamp: new Date().toISOString(),
  });

  res.redirect(302, url.toString());
});

export default router; 