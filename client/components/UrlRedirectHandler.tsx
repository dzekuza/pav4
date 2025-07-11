import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Generate a simple UUID v4
function generateRequestId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Extract slug from URL
function extractSlug(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, "");
    const pathParts = urlObj.pathname
      .split("/")
      .filter((part) => part.length > 0);

    // Get the last meaningful part of the path or use domain + first part
    const productPart =
      pathParts[pathParts.length - 1] || pathParts[0] || "product";

    // Clean up the slug
    const slug = `${domain}-${productPart}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return slug || "unknown-product";
  } catch {
    return "unknown-product";
  }
}

export function UrlRedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    console.log("UrlRedirectHandler checking path:", fullPath);

    // Check if the path starts with /https:// or /http://
    if (
      location.pathname.startsWith("/https://") ||
      location.pathname.startsWith("/http://")
    ) {
      const productUrl = fullPath.substring(1); // Remove leading slash
      console.log("Detected product URL:", productUrl);

      // Validate URL
      try {
        new URL(productUrl);

        // Generate request ID and slug
        const requestId = generateRequestId();
        const slug = extractSlug(productUrl);

        console.log("Generated requestId:", requestId);
        console.log("Generated slug:", slug);

        // Save the original URL to sessionStorage for the API call
        sessionStorage.setItem(
          `product_request_${requestId}`,
          JSON.stringify({
            url: productUrl,
            timestamp: Date.now(),
          }),
        );

        const redirectPath = `/search/${requestId}/${slug}`;
        console.log("Redirecting to:", redirectPath);

        // Redirect to search results page
        navigate(redirectPath, { replace: true });
      } catch (error) {
        console.error("Invalid URL:", productUrl, error);
        // Redirect to home with error
        navigate("/?error=invalid-url", { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return null; // This component doesn't render anything
}
