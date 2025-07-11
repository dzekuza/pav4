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

    // Try to extract a product URL from the current path
    const productUrl = extractProductUrlFromPath(fullPath);

    if (productUrl && isValidProductUrl(productUrl)) {
      console.log("Detected valid product URL:", productUrl);

      // Generate request ID and slug
      const requestId = generateRequestId();
      const slug = extractSlugFromUrl(productUrl);

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
    } else if (productUrl) {
      console.error("Invalid product URL detected:", productUrl);
      // Redirect to home with error
      navigate("/?error=invalid-url", { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return null; // This component doesn't render anything
}
