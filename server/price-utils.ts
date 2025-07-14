// Improved price extraction with better validation and pattern matching

export function extractPriceImproved(text: string): {
  price: number;
  currency: string;
} {
  if (!text) return { price: 0, currency: "€" };

  // Clean the text first and log for debugging
  const cleanText = text.replace(/\s+/g, " ").trim();
  console.log("Extracting price from text:", cleanText);

  // Currency symbol detection
  const currencyDetection = [
    { symbol: "€", currency: "€" },
    { symbol: "$", currency: "$" },
    { symbol: "£", currency: "£" },
    { symbol: "USD", currency: "$" },
    { symbol: "EUR", currency: "€" },
    { symbol: "GBP", currency: "£" },
  ];

  let detectedCurrency = "€"; // Default to EUR
  for (const { symbol, currency } of currencyDetection) {
    if (cleanText.includes(symbol)) {
      detectedCurrency = currency;
      break;
    }
  }

  // More precise price patterns - ordered by specificity
  const pricePatterns = [
    // Exact currency + price patterns
    /€\s*(\d{1,4}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)(?!\d)/g,
    /(\d{1,4}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)\s*€(?!\d)/g,
    /EUR\s*(\d{1,4}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)(?!\d)/gi,
    /(\d{1,4}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)\s*EUR(?!\d)/gi,

    // Dollar patterns
    /\$\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)(?!\d)/g,
    /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*USD(?!\d)/gi,
    /USD\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)(?!\d)/gi,

    // Pound patterns
    /£\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)(?!\d)/g,
    /(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)\s*GBP(?!\d)/gi,

    // Context-based patterns (with price keywords)
    /(?:price|cost|kaina|preis|prix)\s*:?\s*€?\s*(\d{1,4}(?:[,\.]\d{2,3})?)(?!\d)/gi,
    /(?:from|starting|ab|vanaf)\s*€?\s*(\d{1,4}(?:[,\.]\d{2})?)(?!\d)/gi,

    // Meta tag and JSON patterns
    /"price"\s*:\s*"?(\d{1,4}(?:[,\.]\d{2,3})?)"?/gi,
    /content="(\d{1,4}(?:[,\.]\d{2,3})?)"/gi,
  ];

  const foundPrices: { price: number; pattern: string }[] = [];

  // Try each pattern and collect all valid prices
  for (const pattern of pricePatterns) {
    const matches = Array.from(cleanText.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        const rawPrice = match[1];
        const normalizedPrice = normalizePriceString(rawPrice);

        console.log(
          `Pattern ${pattern.source} matched: ${rawPrice} -> normalized: ${normalizedPrice}`,
        );

        // Validate price is reasonable (between 1 and 50000)
        if (normalizedPrice >= 1 && normalizedPrice <= 50000) {
          foundPrices.push({
            price: normalizedPrice,
            pattern: pattern.source.substring(0, 30),
          });
        } else {
          console.log(
            `Price ${normalizedPrice} is outside reasonable range, skipping`,
          );
        }
      }
    }
  }

  if (foundPrices.length > 0) {
    // Sort by pattern specificity and choose the most likely price
    // Prefer prices with currency symbols and context
    foundPrices.sort((a, b) => {
      // Prefer prices with exact currency matches
      const aHasCurrency =
        a.pattern.includes("€") ||
        a.pattern.includes("\\$") ||
        a.pattern.includes("£");
      const bHasCurrency =
        b.pattern.includes("€") ||
        b.pattern.includes("\\$") ||
        b.pattern.includes("£");

      if (aHasCurrency && !bHasCurrency) return -1;
      if (!aHasCurrency && bHasCurrency) return 1;

      // Then prefer reasonable price ranges (10-5000 for most products)
      const aReasonable = a.price >= 10 && a.price <= 5000;
      const bReasonable = b.price >= 10 && b.price <= 5000;

      if (aReasonable && !bReasonable) return -1;
      if (!aReasonable && bReasonable) return 1;

      return 0;
    });

    const selectedPrice = foundPrices[0];
    console.log(
      `Selected price: ${selectedPrice.price} ${detectedCurrency} from pattern: ${selectedPrice.pattern}`,
    );
    return { price: selectedPrice.price, currency: detectedCurrency };
  }

  console.log("No valid price found in text:", cleanText);
  return { price: 0, currency: detectedCurrency };
}

function normalizePriceString(priceStr: string): number {
  // Handle European number format (comma as decimal separator)
  let normalized = priceStr;

  if (normalized.includes(",") && normalized.includes(".")) {
    // If both comma and period exist, assume comma is thousands separator
    normalized = normalized.replace(/,/g, "");
  } else if (normalized.includes(",")) {
    const parts = normalized.split(",");
    if (parts.length === 2 && parts[1].length === 2) {
      // If comma with exactly 2 digits after, it's decimal separator
      normalized = normalized.replace(",", ".");
    } else {
      // Otherwise, comma is thousands separator
      normalized = normalized.replace(/,/g, "");
    }
  } else {
    // Remove any remaining commas as thousands separators
    normalized = normalized.replace(/,/g, "");
  }

  return parseFloat(normalized);
}

// Extract from HTML with better price detection for specific sites
export function extractPriceFromSiteSpecificPatterns(
  html: string,
  domain: string,
): string {
  console.log(`Extracting price for domain: ${domain}`);

  // Site-specific price extraction patterns
  const sitePatterns: { [key: string]: RegExp[] } = {
    "logitechg.com": [
      /data-price="([^"]+)"/gi,
      /"price"\s*:\s*"([^"]+)"/gi,
      /class="[^"]*price[^"]*"[^>]*>([^<]*€[^<]*)/gi,
      /€\s*(\d{2,4}(?:[,\.]\d{2})?)/gi,
    ],
    "ebay.de": [
      /notranslate">([^<]*€[^<]*)</gi,
      /class="[^"]*price[^"]*"[^>]*>([^<]*€[^<]*)/gi,
      /EUR\s*(\d{2,4}(?:[,\.]\d{2})?)/gi,
      /"price"\s*:\s*"([^"]+)"/gi,
    ],
    amazon: [
      /class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)</gi,
      /priceblock_ourprice"[^>]*>([^<]*\$[^<]*)/gi,
      /"price"\s*:\s*"([^"]+)"/gi,
    ],
  };

  // Try site-specific patterns first
  for (const [site, patterns] of Object.entries(sitePatterns)) {
    if (domain.includes(site)) {
      console.log(`Using ${site} specific patterns`);
      for (const pattern of patterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const match of matches) {
          if (match[1]) {
            console.log(`Site-specific pattern found: ${match[1]}`);
            return match[1].trim();
          }
        }
      }
    }
  }

  // Fallback to generic patterns
  const genericPatterns = [
    /<meta property="product:price:amount" content="([^"]+)"/gi,
    /<meta itemprop="price" content="([^"]+)"/gi,
    /data-price="([^"]+)"/gi,
    /class="[^"]*price[^"]*"[^>]*>([^<]*[€$£][^<]*)/gi,
    /"price"\s*:\s*"([^"]+)"/gi,
  ];

  for (const pattern of genericPatterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        console.log(`Generic pattern found: ${match[1]}`);
        return match[1].trim();
      }
    }
  }

  return "";
}
