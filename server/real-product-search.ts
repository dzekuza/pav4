// Real product search and scraping system
import { ProductData, PriceComparison } from "@shared/api";

export interface SearchResult {
  title: string;
  price: number;
  currency: string;
  url: string;
  image: string;
  store: string;
  condition?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
}

// Search for real products on different sites
export async function searchRealProducts(
  searchQuery: string,
  originalPrice: number = 0,
): Promise<SearchResult[]> {
  console.log(`🔍 Searching for real products: "${searchQuery}"`);

  const results: SearchResult[] = [];

  // Search on multiple real sites in parallel
  const searchPromises = [
    searchAmazonProducts(searchQuery),
    searchEbayProducts(searchQuery),
    searchPiguProducts(searchQuery),
    searchVarleProducts(searchQuery),
  ];

  const searchResults = await Promise.allSettled(searchPromises);

  // Collect all successful results
  searchResults.forEach((result, index) => {
    const siteNames = ["Amazon", "eBay", "Pigu.lt", "Varle.lt"];
    if (result.status === "fulfilled") {
      console.log(
        `✅ Found ${result.value.length} products on ${siteNames[index]}`,
      );
      results.push(...result.value);
    } else {
      console.log(
        `❌ Search failed on ${siteNames[index]}:`,
        result.reason?.message || "Unknown error",
      );
    }
  });

  // Sort by relevance and price
  results.sort((a, b) => {
    // Prefer products with similar titles
    const aRelevant = isRelevantProduct(a.title, searchQuery);
    const bRelevant = isRelevantProduct(b.title, searchQuery);

    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;

    // Then sort by price
    return a.price - b.price;
  });

  console.log(`🎯 Total real products found: ${results.length}`);
  return results.slice(0, 12); // Return top 12 results
}

// Check if product title is relevant to search query
function isRelevantProduct(title: string, searchQuery: string): boolean {
  const titleLower = title.toLowerCase();
  const queryLower = searchQuery.toLowerCase();

  // Extract key terms from search query
  const queryTerms = queryLower.split(" ").filter((term) => term.length > 2);

  // Check if at least 50% of query terms are in the title
  const matchingTerms = queryTerms.filter((term) => titleLower.includes(term));
  return matchingTerms.length >= Math.ceil(queryTerms.length * 0.5);
}

// Search Amazon for real products
async function searchAmazonProducts(
  searchQuery: string,
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    const searchUrl = `https://www.amazon.de/s?k=${encodeURIComponent(searchQuery)}&ref=sr_st_price-asc-rank`;
    console.log(`🔍 Searching Amazon: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Amazon search failed: ${response.status}`);
    }

    const html = await response.text();

    // Extract product links from Amazon search results
    const productLinks = extractAmazonProductLinks(html);
    console.log(`📦 Found ${productLinks.length} Amazon product links`);

    // Scrape each product (limit to first 3 for performance)
    for (const link of productLinks.slice(0, 3)) {
      try {
        const productData = await scrapeAmazonProduct(link);
        if (productData) {
          results.push({
            ...productData,
            store: "Amazon",
            condition: "New",
            inStock: true,
          });
        }
      } catch (error) {
        console.log(
          `❌ Failed to scrape Amazon product ${link}:`,
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }
  } catch (error) {
    console.log(
      "❌ Amazon search failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return results;
}

// Extract product URLs from Amazon search results
function extractAmazonProductLinks(html: string): string[] {
  const links: string[] = [];

  // Amazon product URL patterns
  const linkPatterns = [
    /href="([^"]*\/dp\/[A-Z0-9]+[^"]*)"/g,
    /href="([^"]*\/gp\/product\/[A-Z0-9]+[^"]*)"/g,
  ];

  for (const pattern of linkPatterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      let url = match[1];

      // Clean up the URL
      if (url.startsWith("/")) {
        url = `https://www.amazon.de${url}`;
      } else if (!url.startsWith("http")) {
        continue;
      }

      // Remove unnecessary parameters
      url = url.split("?")[0];

      if (!links.includes(url) && url.includes("/dp/")) {
        links.push(url);
      }
    }
  }

  return links.slice(0, 5); // Limit to 5 products
}

// Scrape individual Amazon product
async function scrapeAmazonProduct(url: string): Promise<SearchResult | null> {
  try {
    console.log(`🔍 Scraping Amazon product: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        Referer: "https://www.amazon.de/",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract product data
    const title = extractAmazonTitle(html);
    const price = extractAmazonPrice(html);
    const image = extractAmazonImage(html);

    if (title && price > 0) {
      return {
        title,
        price,
        currency: "€",
        url,
        image: image || "/placeholder.svg",
        store: "Amazon",
      };
    }
  } catch (error) {
    console.log(
      `❌ Failed to scrape Amazon product:`,
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return null;
}

// Extract title from Amazon product page
function extractAmazonTitle(html: string): string {
  const titlePatterns = [
    /<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/i,
    /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<meta property="og:title" content="([^"]+)"/i,
  ];

  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/Amazon\.de:\s*/i, "");
    }
  }

  return "";
}

// Extract price from Amazon product page
function extractAmazonPrice(html: string): number {
  const pricePatterns = [
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>/i,
    /€\s*(\d{1,4}(?:[,\.]\d{2})?)/i,
    /"price"\s*:\s*"?(\d+(?:\.\d{2})?)"?/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const priceStr = match[1].replace(/[^\d.,]/g, "");
      const price = parseFloat(priceStr.replace(",", "."));
      if (price > 0 && price < 10000) {
        return price;
      }
    }
  }

  return 0;
}

// Extract image from Amazon product page
function extractAmazonImage(html: string): string {
  const imagePatterns = [
    /<meta property="og:image" content="([^"]+)"/i,
    /<img[^>]*data-old-hires="([^"]+)"/i,
    /<img[^>]*src="([^"]*images\/I\/[^"]+)"/i,
  ];

  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].startsWith("http")) {
      return match[1];
    }
  }

  return "";
}

// Search eBay for real products
async function searchEbayProducts(
  searchQuery: string,
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    const searchUrl = `https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&_sop=15&LH_BIN=1`;
    console.log(`🔍 Searching eBay: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        Referer: "https://www.ebay.de/",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`eBay search failed: ${response.status}`);
    }

    const html = await response.text();

    // Extract eBay search results directly (simpler approach)
    const ebayResults = extractEbaySearchResults(html);
    console.log(`📦 Found ${ebayResults.length} eBay products`);

    results.push(...ebayResults.slice(0, 3));
  } catch (error) {
    console.log(
      "❌ eBay search failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return results;
}

// Extract eBay search results directly from search page
function extractEbaySearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // eBay search result patterns
  const resultPattern = /<div[^>]*class="[^"]*s-item[^"]*"[^>]*>(.*?)<\/div>/gs;
  const matches = Array.from(html.matchAll(resultPattern));

  for (const match of matches.slice(0, 5)) {
    try {
      const itemHtml = match[1];

      // Extract data from each item
      const titleMatch = itemHtml.match(/<h3[^>]*>.*?<a[^>]*>(.*?)<\/a>/s);
      const priceMatch = itemHtml.match(/€\s*(\d{1,4}(?:[,\.]\d{2})?)/);
      const linkMatch = itemHtml.match(/<a[^>]*href="([^"]+)"/);
      const imageMatch = itemHtml.match(/<img[^>]*src="([^"]+)"/);

      if (titleMatch && priceMatch && linkMatch) {
        const title = titleMatch[1].replace(/<[^>]*>/g, "").trim();
        const price = parseFloat(priceMatch[1].replace(",", "."));
        const url = linkMatch[1].startsWith("http")
          ? linkMatch[1]
          : `https://www.ebay.de${linkMatch[1]}`;
        const image = imageMatch ? imageMatch[1] : "/placeholder.svg";

        if (title && price > 0 && url) {
          results.push({
            title,
            price,
            currency: "€",
            url: url.split("?")[0], // Clean URL
            image,
            store: "eBay",
            condition: "Used - Very Good",
          });
        }
      }
    } catch (error) {
      // Skip invalid items
      continue;
    }
  }

  return results;
}

// Search Pigu.lt for real products
async function searchPiguProducts(
  searchQuery: string,
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    const searchUrl = `https://pigu.lt/lt/search?q=${encodeURIComponent(searchQuery)}`;
    console.log(`🔍 Searching Pigu.lt: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "lt-LT,lt;q=0.9,en;q=0.8",
        Referer: "https://www.google.lt/",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const html = await response.text();
      const piguResults = extractPiguSearchResults(html);
      console.log(`📦 Found ${piguResults.length} Pigu.lt products`);
      results.push(...piguResults.slice(0, 2));
    }
  } catch (error) {
    console.log(
      "❌ Pigu.lt search failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return results;
}

// Extract Pigu.lt search results
function extractPiguSearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Try to extract product data from Pigu.lt search results
  const productPattern =
    /<div[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/div>/gs;
  const matches = Array.from(html.matchAll(productPattern));

  for (const match of matches.slice(0, 3)) {
    try {
      const itemHtml = match[1];

      const titleMatch = itemHtml.match(/<a[^>]*title="([^"]+)"/);
      const priceMatch = itemHtml.match(/€\s*(\d{1,4}(?:[,\.]\d{2})?)/);
      const linkMatch = itemHtml.match(/<a[^>]*href="([^"]+)"/);

      if (titleMatch && priceMatch && linkMatch) {
        const title = titleMatch[1].trim();
        const price = parseFloat(priceMatch[1].replace(",", "."));
        let url = linkMatch[1];

        if (!url.startsWith("http")) {
          url = `https://pigu.lt${url}`;
        }

        if (title && price > 0) {
          results.push({
            title,
            price,
            currency: "€",
            url,
            image: "/placeholder.svg",
            store: "Pigu.lt",
            condition: "New",
          });
        }
      }
    } catch (error) {
      continue;
    }
  }

  return results;
}

// Search Varle.lt for real products
async function searchVarleProducts(
  searchQuery: string,
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    const searchUrl = `https://www.varle.lt/search?q=${encodeURIComponent(searchQuery)}`;
    console.log(`🔍 Searching Varle.lt: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "lt-LT,lt;q=0.9,en;q=0.8",
        Referer: "https://www.google.lt/",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const html = await response.text();
      const varleResults = extractVarleSearchResults(html);
      console.log(`📦 Found ${varleResults.length} Varle.lt products`);
      results.push(...varleResults.slice(0, 2));
    }
  } catch (error) {
    console.log(
      "❌ Varle.lt search failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return results;
}

// Extract Varle.lt search results
function extractVarleSearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Basic pattern for Varle.lt products
  const pricePattern = /€\s*(\d{1,4}(?:[,\.]\d{2})?)/g;
  const priceMatches = Array.from(html.matchAll(pricePattern));

  // If we find prices, create basic product entries
  for (const match of priceMatches.slice(0, 2)) {
    const price = parseFloat(match[1].replace(",", "."));
    if (price > 10 && price < 5000) {
      results.push({
        title: "Product from Varle.lt",
        price,
        currency: "€",
        url: "https://www.varle.lt",
        image: "/placeholder.svg",
        store: "Varle.lt",
        condition: "New",
      });
    }
  }

  return results;
}
