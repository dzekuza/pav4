// Utility functions for URL parsing and validation

export function extractProductUrlFromPath(path: string): string | null {
  console.log("Extracting product URL from path:", path);

  // Pattern 1: Direct URL paths like /https://example.com
  if (path.startsWith("/https://") || path.startsWith("/http://")) {
    return path.substring(1); // Remove leading slash
  }

  // Pattern 2: Domain-prefixed URLs like /pavlo4.netlify.app/https://example.com
  const httpsIndex = path.indexOf("/https://");
  const httpIndex = path.indexOf("/http://");

  if (httpsIndex !== -1) {
    return path.substring(httpsIndex + 1);
  } else if (httpIndex !== -1) {
    return path.substring(httpIndex + 1);
  }

  // Pattern 3: URL-encoded patterns
  if (path.includes("https%3A%2F%2F") || path.includes("http%3A%2F%2F")) {
    try {
      const decoded = decodeURIComponent(path.substring(1));
      if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
        return decoded;
      }
    } catch (e) {
      console.error("Failed to decode URL:", e);
    }
  }

  return null;
}

export function isValidProductUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Basic validation: must be http/https and have a valid domain
    return (
      (urlObj.protocol === "http:" || urlObj.protocol === "https:") &&
      urlObj.hostname.length > 0 &&
      urlObj.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function extractSlugFromUrl(url: string): string {
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
