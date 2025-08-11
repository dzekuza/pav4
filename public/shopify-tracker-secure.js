/**
 * PriceHunt Secure Shopify Tracker Loader
 *
 * This loader checks domain verification before loading the full tracking script.
 * Only verified domains can use PriceHunt tracking.
 */

(function () {
  "use strict";

  // Get configuration from script tag
  const script =
    document.currentScript ||
    document.querySelector('script[src*="shopify-tracker-secure.js"]');
  const businessId = script?.getAttribute("data-business-id");
  const affiliateId = script?.getAttribute("data-affiliate-id");
  const debug = script?.getAttribute("data-debug") === "true";

  // Validate required parameters
  if (!businessId || !affiliateId) {
    console.error(
      "[PriceHunt] Missing required parameters: data-business-id and data-affiliate-id",
    );
    return;
  }

  // Get current domain
  const currentDomain = window.location.hostname;

  console.log("[PriceHunt] Checking domain verification for:", currentDomain);

  // Check domain verification
  async function checkDomainVerification() {
    try {
      const response = await fetch(
        `https://pavlo4.netlify.app/api/domain-verification/check?domain=${encodeURIComponent(currentDomain)}`,
      );
      const data = await response.json();

      if (data.success && data.verified) {
        console.log("[PriceHunt] Domain verified, loading tracking script...");
        loadTrackingScript(data.business);
      } else {
        console.error(
          "[PriceHunt] Domain not verified. Please verify your domain ownership first.",
        );
        showVerificationMessage();
      }
    } catch (error) {
      console.error("[PriceHunt] Failed to check domain verification:", error);
      showVerificationMessage();
    }
  }

  // Load the full tracking script
  function loadTrackingScript(business) {
    const trackingScript = document.createElement("script");
    trackingScript.src =
      "https://pavlo4.netlify.app/shopify-tracker-enhanced.js";
    trackingScript.setAttribute("data-business-id", business.id);
    trackingScript.setAttribute("data-affiliate-id", business.affiliateId);
    if (debug) {
      trackingScript.setAttribute("data-debug", "true");
    }

    // Add load event listener
    trackingScript.onload = function () {
      console.log("[PriceHunt] Secure tracking script loaded successfully");
    };

    trackingScript.onerror = function () {
      console.error("[PriceHunt] Failed to load secure tracking script");
    };

    // Insert the script
    document.head.appendChild(trackingScript);
  }

  // Show verification message
  function showVerificationMessage() {
    // Create a visible message for users
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            max-width: 300px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

    messageDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <div style="color: #92400e; font-weight: 600;">⚠️ Domain Verification Required</div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: #6b7280; font-size: 18px;">×</button>
            </div>
            <div style="color: #92400e; margin-top: 8px; font-size: 13px;">
                Please verify your domain ownership to use PriceHunt tracking.
                <br><br>
                <a href="https://pavlo4.netlify.app/business-integrate" target="_blank" style="color: #7c3aed; text-decoration: none; font-weight: 500;">
                    Verify Domain →
                </a>
            </div>
        `;

    document.body.appendChild(messageDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (messageDiv.parentElement) {
        messageDiv.remove();
      }
    }, 10000);
  }

  // Start verification check
  checkDomainVerification();
})();
