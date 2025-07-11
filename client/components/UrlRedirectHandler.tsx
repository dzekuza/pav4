import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  extractProductUrlFromPath,
  isValidProductUrl,
  generateRequestId,
  extractSlugFromUrl,
} from "@/lib/urlUtils";

export function UrlRedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    console.log("UrlRedirectHandler checking path:", fullPath);

    // More comprehensive URL detection
    let productUrl = "";

    // Pattern 1: Direct URL paths like /https://example.com
    if (
      location.pathname.startsWith("/https://") ||
      location.pathname.startsWith("/http://")
    ) {
      productUrl = fullPath.substring(1); // Remove leading slash
    }
    // Pattern 2: Domain-prefixed URLs like /pavlo4.netlify.app/https://example.com
    else if (fullPath.includes("/https://") || fullPath.includes("/http://")) {
      const httpsIndex = fullPath.indexOf("/https://");
      const httpIndex = fullPath.indexOf("/http://");

      if (httpsIndex !== -1) {
        productUrl = fullPath.substring(httpsIndex + 1);
      } else if (httpIndex !== -1) {
        productUrl = fullPath.substring(httpIndex + 1);
      }
    }
    // Pattern 3: URL-encoded patterns
    else if (
      fullPath.includes("https%3A%2F%2F") ||
      fullPath.includes("http%3A%2F%2F")
    ) {
      try {
        productUrl = decodeURIComponent(fullPath.substring(1));
      } catch (e) {
        console.error("Failed to decode URL:", e);
      }
    }

    if (productUrl) {
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
  }, [location.pathname, location.search, navigate]);

  return null; // This component doesn't render anything
}
