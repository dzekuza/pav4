// Test script to verify product name extraction
function extractProductName(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    
    // Try to get the last meaningful part of the URL
    const lastPart = pathParts[pathParts.length - 1];
    
    if (lastPart) {
      // Clean up the product name
      let productName = lastPart
        .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
        .replace(/\.[^/.]+$/, "") // Remove file extensions
        .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word
        .trim();
      
      // If it's too short or generic, try the second to last part
      if (productName.length < 3 || productName.toLowerCase() === "product") {
        const secondLastPart = pathParts[pathParts.length - 2];
        if (secondLastPart) {
          productName = secondLastPart
            .replace(/[-_]/g, " ")
            .replace(/\.[^/.]+$/, "")
            .replace(/\b\w/g, (l) => l.toUpperCase())
            .trim();
        }
      }
      
      return productName || "Product";
    }
    
    // If no path parts, try to extract from domain or return generic
    const hostname = urlObj.hostname;
    if (hostname && hostname !== "localhost") {
      return hostname.replace(/^www\./, "").replace(/\.[^/.]+$/, "");
    }
    
    return "Product";
  } catch {
    return "Product";
  }
}

// Test cases
const testUrls = [
  "https://example.com/products/blue-t-shirt",
  "https://shop.example.com/checkout/product/123",
  "https://store.com/category/electronics/iphone-14-pro",
  "https://example.com/page_view",
  "https://example.com/checkout_start",
  "https://example.com/products/product",
  "https://example.com/",
  "https://www.amazon.com/dp/B08N5WRWNW",
  "https://shopify-store.myshopify.com/products/coffee-mug",
  "https://woocommerce-store.com/product/woo-album-1/"
];

console.log("🧪 Testing Product Name Extraction...\n");

testUrls.forEach((url, index) => {
  const productName = extractProductName(url);
  console.log(`${index + 1}. URL: ${url}`);
  console.log(`   Product Name: "${productName}"\n`);
});

console.log("✅ Product name extraction test completed!");
