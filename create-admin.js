#!/usr/bin/env node
/**
 * CLI: Promote a user to admin
 * Usage examples:
 *   node create-admin.js --email info@gvozdovic.com
 *   node create-admin.js -e info@gvozdovic.com
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const emailArgIndex = Math.max(args.indexOf("--email"), args.indexOf("-e"));
const email = emailArgIndex !== -1 ? args[emailArgIndex + 1] : null;

if (!email) {
  console.error("Usage: node create-admin.js --email user@example.com");
  process.exit(1);
}

async function promoteViaApi() {
  // Prefer calling server endpoint if available
  const fetch = (await import("node-fetch")).default;
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:8083";
  try {
    const res = await fetch(`${baseUrl}/api/admin/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    if (data.success) {
      console.log(`✔ Promoted ${email} to admin via API.`);
      return true;
    }
    console.error("API error:", data.error || data);
    return false;
  } catch (err) {
    console.warn(
      "API promote failed, falling back to local DB where possible:",
      err.message,
    );
    return false;
  }
}

(async () => {
  const ok = await promoteViaApi();
  if (ok) return;

  // Fallback: show instructions for manual promotion depending on storage
  console.log("\nManual promotion steps (fallback):");
  console.log(
    "- If you use Prisma/SQLite file (prisma/dev.db), run an UPDATE to set isAdmin=1 for the user with email:",
    email,
  );
  console.log(
    "- If you use a JSON/Netlify DB, find the user document and set isAdmin: true.",
  );
  console.log(
    "- Or expose an /api/admin/promote endpoint that updates the user by email.",
  );
})();
