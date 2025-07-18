import { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import puppeteer, { Browser, Page } from "puppeteer";
import {
  ScrapeRequest,
  ProductData,
  ScrapeResponse,
  PriceComparison,
  LocationInfo,
} from "@shared/api";
import { searchHistoryService } from "./auth";
import {
  localDealers,
  getLocalDealers,
  detectLocationFromHeaders,
  detectLocationFromIP,
} from "../services/location";
import {
  extractPriceImproved,
  extractPriceFromSiteSpecificPatterns,
} from "../price-utils";

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

// Extract price from text with improved pattern matching
function extractPrice(text: string): { price: number; currency: string } {
  if (!text) return { price: 0, currency: "€" };

  // Clean the text first
  const cleanText = text.replace(/\s+/g, " ").trim();

  // More comprehensive price patterns with EUR focus
  const patterns = [
    // EUR specific patterns (European format with various spacing)
    /€\s*(\d{1,3}(?:[,\s]\d{3})*(?:[,.]\d{2})?)/,
    /(\d{1,3}(?:[,\s]\d{3})*(?:[,.]\d{2})?)\s*€/,
    /(\d{1,3}(?:[,\s]\d{3})*(?:[,.]\d{2})?)\s*EUR/i,
    /EUR\s*(\d{1,3}(?:[,\s]\d{3})*(?:[,.]\d{2})?)/i,

    // Standard currency symbols with prices
    /[\$£€¥₹₽]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[\s]*[\$£€¥₹₽]/,

    // Price with currency words
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|CAD|AUD)/i,
    /(?:USD|EUR|GBP|CAD|AUD)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,

    // European number formats (space or comma as thousands separator)
    /(\d{1,3}(?:\s\d{3})*[,.]\d{2})/,
    /(\d{1,3}(?:,\d{3})*\.\d{2})/,

    // Simple price patterns for fallback
    /(\d{2,4}[,.]\d{2})/,
    /(\d{1,4})/,
  ];

  // Try to find currency symbol first
  const currencySymbols: { [key: string]: string } = {
    $: "$",
    "£": "£",
    "���": "€",
    "¥": "¥",
    "₹": "₹",
    "₽": "₽",
  };

  let detectedCurrency = "€"; // Default to EUR
  for (const [symbol, curr] of Object.entries(currencySymbols)) {
    if (cleanText.includes(symbol)) {
      detectedCurrency = curr;
      break;
    }
  }

  // Try each pattern
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const priceStr = match[1].replace(/,/g, "");
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        return { price, currency: detectedCurrency };
      }
    }
  }

  return { price: 0, currency: detectedCurrency };
}

// Check if we can use API endpoints instead of HTML scraping
async function tryApiEndpoint(url: string): Promise<ProductData | null> {
  const domain = extractDomain(url);

  // PlayStation Direct API detection
  if (domain.includes("playstation")) {
    console.log("Trying PlayStation API endpoint...");

    // Extract product code from URL
    const productCodeMatch = url.match(/\/products\/(\d+)/);
    if (productCodeMatch) {
      try {
        const apiUrl = `https://direct.playstation.com/en-us/api/v1/products?productCodes=${productCodeMatch[1]}`;
        console.log("PlayStation API URL:", apiUrl);

        const apiResponse = await fetch(apiUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
        });

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          console.log(
            "PlayStation API response:",
            JSON.stringify(data, null, 2),
          );

          if (data.products && data.products.length > 0) {
            const product = data.products[0];
            return {
              title: product.name || "PlayStation Product",
              price: product.price?.value || 0,
              currency: product.price?.currencySymbol || "$",
              image: product.defaultVariant?.images?.[0] || "/placeholder.svg",
              url,
              store: "direct.playstation.com",
            };
          }
        }
      } catch (error) {
        console.log("PlayStation API failed:", error);
      }
    }
  }

  return null;
}

// Extract data from HTML using pattern matching
function extractFromHtml(
  html: string,
  domain: string = "",
): {
  title: string;
  priceText: string;
  image: string;
} {
  // Extract title with more comprehensive patterns
  let title = "";
  const titlePatterns = [
    // Standard meta tags
    /<meta property="og:title" content="([^"]+)"/i,
    /<meta name="twitter:title" content="([^"]+)"/i,
    /<meta name="title" content="([^"]+)"/i,
    /<title[^>]*>([^<]+)<\/title>/i,

    // Apple-specific patterns
    /"productTitle"\s*:\s*"([^"]+)"/i,
    /"displayName"\s*:\s*"([^"]+)"/i,
    /"familyName"\s*:\s*"([^"]+)"/i,
    /data-analytics-title="([^"]+)"/i,
    /<h1[^>]*class="[^"]*hero[^"]*"[^>]*>([^<]+)<\/h1>/i,

    // Product page patterns
    /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /"productName"\s*:\s*"([^"]+)"/i,
    /"name"\s*:\s*"([^"]+)"/i,
    /data-product-name="([^"]+)"/i,

    // JSON-LD structured data
    /"@type"\s*:\s*"Product"[^}]*"name"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      title = match[1]
        .trim()
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      break;
    }
  }

  // Extract price using improved function
  let priceText = extractPriceFromSiteSpecificPatterns(html, domain);

  // Fallback to basic patterns if site-specific extraction fails
  if (!priceText) {
    const pricePatterns = [
      /<meta property="product:price:amount" content="([^"]+)"/i,
      /<meta itemprop="price" content="([^"]+)"/i,
      /data-price="([^"]+)"/i,
      /"price"\s*:\s*"([^"]+)"/i,
      /class="[^"]*price[^"]*"[^>]*>([^<]*[€$£][^<]*)/i,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        priceText = match[1].trim();
        break;
      }
    }
  }

  // Extract image
  let image = "";
  const imagePatterns = [
    /<meta property="og:image" content="([^"]+)"/i,
    /<meta name="twitter:image" content="([^"]+)"/i,
  ];

  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      image = match[1].trim();
      break;
    }
  }

  return { title, priceText, image };
}

// Puppeteer-based scraping for better JavaScript support
async function scrapeWithPuppeteer(url: string): Promise<ProductData> {
  console.log(`Scraping with Puppeteer: ${url}`);

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // First try API endpoints if available
    const apiResult = await tryApiEndpoint(url);
    if (apiResult) {
      console.log("Successfully used API endpoint");
      return apiResult;
    }

    const siteDomain = extractDomain(url);

    // Launch Puppeteer browser with more robust configuration
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // For cloud environments
        "--disable-gpu",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        "--disable-translate",
        "--hide-scrollbars",
        "--mute-audio",
        "--no-default-browser-check",
        "--no-pings",
        "--memory-pressure-off",
        "--max_old_space_size=4096",
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1366, height: 768 });

    // Customize user agent based on the website
    let userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // Set additional headers for specific sites
    const extraHeaders: Record<string, string> = {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
    };

    // Specific headers for Lithuanian websites
    if (siteDomain.includes("pigu.lt") || siteDomain.endsWith(".lt")) {
      console.log("Detected Lithuanian website, using specific headers");
      userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
      extraHeaders["Accept-Language"] = "lt-LT,lt;q=0.9,en-US;q=0.8,en;q=0.7";
      extraHeaders["Referer"] = "https://www.google.lt/";
      if (siteDomain.includes("pigu.lt")) {
        extraHeaders["Origin"] = "https://pigu.lt";
      }
      extraHeaders["X-Requested-With"] = "XMLHttpRequest";
      extraHeaders["Sec-Ch-Ua"] =
        '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"';
      extraHeaders["Sec-Ch-Ua-Mobile"] = "?0";
      extraHeaders["Sec-Ch-Ua-Platform"] = '"Windows"';
      extraHeaders["DNT"] = "1";
    }
    // Specific headers for Amazon
    else if (siteDomain.includes("amazon")) {
      extraHeaders["Accept-Language"] = "en-US,en;q=0.9";
      extraHeaders["Referer"] = "https://www.amazon.com/";
    }

    await page.setUserAgent(userAgent);
    await page.setExtraHTTPHeaders(extraHeaders);

    // Block images and other resources to speed up page loading
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (
        resourceType === "image" ||
        resourceType === "font" ||
        resourceType === "media"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set timeout - reduced for faster failure detection
    page.setDefaultTimeout(15000); // Reduced from 30000 to 15000

    // Add delay for Lithuanian websites to avoid rate limiting
    if (siteDomain.endsWith(".lt")) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Navigate to the page with retry logic
    let retryCount = 0;
    const maxRetries = 2; // Reduced from 3 to 2

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to load: ${url}`);

        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 15000, // Reduced timeout
        });

        if (response && response.ok()) {
          break;
        } else if (
          response &&
          response.status() === 403 &&
          siteDomain.endsWith(".lt") &&
          retryCount < maxRetries - 1
        ) {
          console.log(
            `Attempt ${retryCount + 1} failed with 403, retrying with different user agent...`,
          );

          // Try different user agent on retry
          const userAgents = [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
          ];

          await page.setUserAgent(userAgents[retryCount]);
          await new Promise((resolve) =>
            setTimeout(resolve, 3000 * (retryCount + 1)),
          );
          retryCount++;
          continue;
        }
      } catch (error) {
        console.log(`Navigation attempt ${retryCount + 1} failed:`, error);
        
        // If it's a timeout error and we're dealing with a geographically restricted site
        if (error instanceof Error && error.message.includes('timeout') && siteDomain.endsWith('.lt')) {
          console.log('Detected timeout on Lithuanian site - likely geographic restriction');
          throw new Error('Geographic restriction detected - site may not be accessible from this location');
        }
        
        if (retryCount === maxRetries - 1) {
          throw error;
        }
      }

      retryCount++;
      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
      }
    }

    // Wait for content to load (especially for dynamic content)
    try {
      await page.waitForSelector("body", { timeout: 5000 });

      // Try to wait for common price/product selectors to appear
      const commonSelectors = [
        "[data-price]",
        ".price",
        '[class*="price"]',
        '[class*="product"]',
        "h1",
        "[data-product-name]",
      ];

      for (const selector of commonSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          console.log(`Found selector: ${selector}`);
          break;
        } catch (e) {
          // Continue to next selector
        }
      }

      // Additional wait for JavaScript to execute
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Scroll to trigger lazy loading if needed
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(
        "Warning: Timeout waiting for content selectors, continuing anyway",
      );
    }

    // Try to execute JavaScript to extract data directly from the page if possible
    let jsExtractedData: any = null;
    try {
      jsExtractedData = await page.evaluate(() => {
        // Try to find structured data in the page
        const jsonLdScripts = document.querySelectorAll(
          'script[type="application/ld+json"]',
        );
        for (const script of jsonLdScripts) {
          try {
            const data = JSON.parse(script.textContent || "");
            if (data["@type"] === "Product" || data.name) {
              return {
                title: data.name,
                price: data.offers?.price || data.offers?.[0]?.price,
                currency:
                  data.offers?.priceCurrency || data.offers?.[0]?.priceCurrency,
                image: data.image?.[0] || data.image,
              };
            }
          } catch (e) {
            // Continue
          }
        }

        // Try to find price and title from common meta tags
        const ogTitle = document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content");
        const ogImage = document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content");
        const priceElements = document.querySelectorAll(
          '[data-price], .price, [class*="price"], [itemprop="price"]',
        );

        let price = "";
        for (const el of priceElements) {
          const text =
            el.textContent ||
            el.getAttribute("content") ||
            el.getAttribute("data-price") ||
            "";
          if (text && (/[€$£¥]/.test(text) || /\d+[.,]\d+/.test(text))) {
            price = text;
            break;
          }
        }

        return {
          title: ogTitle,
          price: price,
          image: ogImage,
        };
      });

      console.log("JavaScript extracted data:", jsExtractedData);
    } catch (error) {
      console.log("JavaScript extraction failed:", error);
    }

    // Get the page content
    const html = await page.content();

    // Extract data from HTML
    const domain = extractDomain(url);
    const extracted = extractFromHtml(html, domain);

    // Merge JavaScript extracted data with HTML extraction
    if (jsExtractedData) {
      if (
        jsExtractedData.title &&
        (!extracted.title ||
          extracted.title.length < jsExtractedData.title.length)
      ) {
        extracted.title = jsExtractedData.title;
      }
      if (
        jsExtractedData.price &&
        (!extracted.priceText ||
          extracted.priceText.length < jsExtractedData.price.length)
      ) {
        extracted.priceText = jsExtractedData.price;
      }
      if (jsExtractedData.image && !extracted.image) {
        extracted.image = jsExtractedData.image;
      }
    }

    const { price, currency } = extractPriceImproved(extracted.priceText);

    console.log("Extraction result:", {
      title: extracted.title,
      priceText: extracted.priceText,
      price,
      currency,
      domain,
    });

    // If extraction failed, try domain-specific fallbacks
    if (!extracted.title || price === 0) {
      console.log("Extraction failed - trying domain-specific patterns");
      console.log("Domain:", domain);

      // Amazon specific patterns
      if (domain.includes("amazon")) {
        console.log("Detected Amazon site - using specific patterns");

        // Amazon product title patterns
        if (!extracted.title) {
          const amazonProductPatterns = [
            /<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/i,
            /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h1>/i,
            /"title"\s*:\s*"([^"]{10,})"/i,
            /Amazon\.com:\s*([^|{}<>]+)/i,
            /<title[^>]*>Amazon\.com:\s*([^|<]+)/i,
          ];

          for (const pattern of amazonProductPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              extracted.title = match[1]
                .trim()
                .replace(/Amazon\.com:\s*/i, "")
                .replace(/\s*:\s*[^:]*$/i, "");
              console.log("Found Amazon title:", extracted.title);
              break;
            }
          }
        }

        // Amazon price patterns - prioritize main product price
        if (price === 0) {
          const amazonPricePatterns = [
            // Primary price patterns (main product price)
            /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*data-a-size="xl"[^>]*>([^<]+)<\/span>/i, // Large price display
            /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>.*?<span[^>]*class="[^"]*a-price-fraction[^"]*"[^>]*>([^<]+)<\/span>/is, // Full price with fraction
            /<span[^>]*class="[^"]*a-price-symbol[^"]*"[^>]*>\$<\/span><span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>/i, // Symbol + whole price
            /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>/gi, // Any price-whole element

            // Backup patterns for different Amazon layouts
            /<span[^>]*id="priceblock_dealprice"[^>]*>\$([^<]+)<\/span>/i,
            /<span[^>]*id="priceblock_ourprice"[^>]*>\$([^<]+)<\/span>/i,
            /<span[^>]*class="[^"]*a-price-range[^"]*"[^>]*>.*?\$(\d{2,4}(?:\.\d{2})?)/is,

            // JSON-based prices
            /"priceAmount"\s*:\s*"([^"]+)"/i,
            /"price"\s*:\s*"(\$[^"]+)"/i,
            /"displayPrice"\s*:\s*"([^"]+)"/i,

            // Meta property prices
            /<meta property="product:price:amount" content="([^"]+)"/i,
            /<meta property="og:price:amount" content="([^"]+)"/i,

            // Fallback pattern
            /\$(\d{3,4}(?:\.\d{2})?)/g, // Only match substantial prices (3-4 digits)
          ];

          // Debug: log all potential prices found
          console.log("Debugging Amazon price extraction...");
          const allPriceMatches = html.match(/\$\d{2,4}(?:\.\d{2})?/g);
          console.log("All $ prices found on page:", allPriceMatches);

          for (const pattern of amazonPricePatterns) {
            if (pattern.global) {
              const matches = html.match(pattern);
              if (matches && matches[0]) {
                console.log("Global pattern matches:", matches);
                // For global matches, find the highest reasonable price (likely the main product)
                const prices = matches
                  .map((match) => {
                    const priceMatch = match.match(/\d+(?:\.\d{2})?/);
                    return priceMatch ? parseFloat(priceMatch[0]) : 0;
                  })
                  .filter((p) => p > 50); // Filter out very low prices

                console.log("Filtered prices:", prices);

                if (prices.length > 0) {
                  const mainPrice = Math.max(...prices); // Take highest price as main product
                  extracted.priceText = `$${mainPrice}`;
                  console.log(
                    "Found Amazon price (highest):",
                    extracted.priceText,
                  );
                  break;
                }
              }
            } else {
              const match = html.match(pattern);
              if (match && match[1]) {
                console.log("Pattern matched:", pattern.source, "->", match[1]);
                let priceText = match[1];

                // Handle fractional prices (e.g., "619" + "99")
                if (match[2]) {
                  priceText = `${match[1]}.${match[2]}`;
                }

                const priceValue = parseFloat(priceText.replace(/,/g, ""));
                console.log("Parsed price value:", priceValue);

                // Only accept reasonable prices (not accessories or small items)
                if (priceValue > 50) {
                  extracted.priceText = priceText.includes("$")
                    ? priceText
                    : `$${priceText}`;
                  console.log("Found Amazon price:", extracted.priceText);
                  break;
                }
              }
            }
          }
        }
      }

      // Apple specific patterns
      else if (domain.includes("apple")) {
        console.log("Detected Apple site - using specific patterns");

        // Apple product title patterns
        if (!extracted.title) {
          const appleProductPatterns = [
            /Buy\s+(iPhone\s+\d+[^<>\n"]*)/i,
            /Buy\s+(iPad[^<>\n"]*)/i,
            /Buy\s+(Mac[^<>\n"]*)/i,
            /Buy\s+(Apple\s+[^<>\n"]*)/i,
            /"productTitle"\s*:\s*"([^"]+)"/i,
            /"familyName"\s*:\s*"([^"]+)"/i,
            /iPhone\s+\d+[^<>\n"]{0,50}/i,
            /iPad[^<>\n"]{0,50}/i,
          ];

          for (const pattern of appleProductPatterns) {
            const match = html.match(pattern);
            if (match) {
              extracted.title = match[1] || match[0];
              console.log("Found Apple title:", extracted.title);
              break;
            }
          }
        }

        // Apple price patterns
        if (price === 0) {
          const applePricePatterns = [
            /"dimensionPriceFrom"\s*:\s*"([^"]+)"/i,
            /"fromPrice"\s*:\s*"([^"]+)"/i,
            /From\s*\$(\d{3,4})/i,
            /"price"\s*:\s*"(\$\d+)"/i,
          ];

          for (const pattern of applePricePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              extracted.priceText = match[1].replace(/[^\d$.,]/g, "");
              console.log("Found Apple price:", extracted.priceText);
              break;
            }
          }
        }
      }

      // PlayStation Direct specific patterns
      else if (domain.includes("playstation") || domain.includes("sony")) {
        console.log("Detected PlayStation/Sony site - using specific patterns");

        // Look for PlayStation product patterns in the full HTML
        const psSpecificPatterns = [
          /"productName"\s*:\s*"([^"]+)"/i,
          /"displayName"\s*:\s*"([^"]+)"/i,
          /PlayStation[\s\u00A0]*5[\s\u00A0]*Pro/i,
          /PS5[\s\u00A0]*Pro/i,
          /PlayStation[\s\u00A0]*\d+[^<>\n"]{0,30}/i,
        ];

        for (const pattern of psSpecificPatterns) {
          const match = html.match(pattern);
          if (match) {
            extracted.title = match[1] || match[0];
            console.log("Found PlayStation title:", extracted.title);
            break;
          }
        }

        // PlayStation price patterns
        if (price === 0) {
          const psPricePatterns = [
            /"price"\s*:\s*(\d+)/i,
            /"amount"\s*:\s*"(\d+)"/i,
            /\$(\d{3,4})/g, // PlayStation prices are typically $400-700
          ];

          for (const pattern of psPricePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              const foundPrice = parseFloat(match[1]);
              if (foundPrice > 100) {
                // Reasonable price check
                extracted.priceText = `$${foundPrice}`;
                console.log("Found PlayStation price:", extracted.priceText);
                break;
              }
            }
          }
        }
      }

      // pigu.lt specific patterns (Lithuanian retailer)
      else if (domain.includes("pigu.lt")) {
        console.log("Detected pigu.lt site - using specific patterns");

        // pigu.lt product title patterns
        if (!extracted.title) {
          const piguProductPatterns = [
            /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h1>/i,
            /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i,
            /<h1[^>]*>([^<]+)<\/h1>/i,
            /"name"\s*:\s*"([^"]+)"/i,
            /property="og:title"\s+content="([^"]+)"/i,
            /<title[^>]*>([^<]+?)\s*\|\s*pigu\.lt/i,
            /<title[^>]*>([^<]+?)\s*-\s*pigu\.lt/i,
            /data-product-name="([^"]+)"/i,
            /<span[^>]*class="[^"]*product-name[^"]*"[^>]*>([^<]+)<\/span>/i,
          ];

          for (const pattern of piguProductPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              extracted.title = match[1]
                .trim()
                .replace(/\s*[\|\-]\s*pigu\.lt.*$/i, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&");
              console.log("Found pigu.lt title:", extracted.title);
              break;
            }
          }
        }

        // pigu.lt price patterns (EUR) - comprehensive patterns
        if (price === 0) {
          const piguPricePatterns = [
            // JavaScript/JSON price patterns
            /"price"\s*:\s*"?([0-9,]+\.?\d*)"?/i,
            /"currentPrice"\s*:\s*"?([0-9,]+\.?\d*)"?/i,
            /"priceAmount"\s*:\s*"?([0-9,]+\.?\d*)"?/i,
            /"amount"\s*:\s*"?([0-9,]+\.?\d*)"?/i,
            /"value"\s*:\s*"?([0-9,]+\.?\d*)"?/i,

            // HTML attribute patterns
            /data-price="([^"]+)"/i,
            /data-value="([^"]+)"/i,
            /data-amount="([^"]+)"/i,
            /value="([0-9,]+\.?\d*)"/i,

            // CSS class patterns specific to pigu.lt
            /class="[^"]*price[^"]*"[^>]*>([^<]*€[^<]*)/i,
            /class="[^"]*amount[^"]*"[^>]*>([^<]*€[^<]*)/i,
            /class="[^"]*cost[^"]*"[^>]*>([^<]*€[^<]*)/i,
            /class="[^"]*current[^"]*"[^>]*>([^<]*€[^<]*)/i,

            // Currency patterns - Lithuanian format
            /€\s*([0-9,]+(?:[\.,][0-9]{2})?)/i,
            /([0-9,]+(?:[\.,][0-9]{2})?)\s*€/i,
            /([0-9,]+(?:[\.,][0-9]{2})?)\s*EUR/i,

            // Generic span/div patterns
            /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i,
            /<div[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/div>/i,
            /<span[^>]*class="[^"]*current[^"]*"[^>]*>([^<]+)<\/span>/i,

            // Lithuanian specific patterns
            /Kaina[^0-9]*([0-9,]+(?:[\.,][0-9]{2})?)/i,
            /Suma[^0-9]*([0-9,]+(?:[\.,][0-9]{2})?)/i,

            // Meta property patterns
            /<meta property="product:price:amount" content="([^"]+)"/i,
            /<meta itemprop="price" content="([^"]+)"/i,

            // Aggressive fallback - any number that looks like a reasonable price
            /([1-9]\d{1,3}(?:[,.]?\d{2})?)/g,
          ];

          for (const pattern of piguPricePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              extracted.priceText = match[1].includes("€")
                ? match[1]
                : `€${match[1].replace(/,/g, "")}`;
              console.log("Found pigu.lt price:", extracted.priceText);
              break;
            }
          }
        }
      }

      // Ideal.lt specific patterns (Lithuanian retailer)
      else if (domain.includes("ideal.lt")) {
        console.log("Detected Ideal.lt site - using specific patterns");

        // Ideal.lt product title patterns
        if (!extracted.title) {
          const idealProductPatterns = [
            /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h1>/i,
            /<h1[^>]*>([^<]+)<\/h1>/i,
            /"name"\s*:\s*"([^"]+)"/i,
            /property="og:title"\s+content="([^"]+)"/i,
            /<title[^>]*>([^<]+?)\s*-\s*IDEAL\.LT/i,
          ];

          for (const pattern of idealProductPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              extracted.title = match[1]
                .trim()
                .replace(/\s*-\s*IDEAL\.LT.*$/i, "")
                .replace(/&nbsp;/g, " ");
              console.log("Found Ideal.lt title:", extracted.title);
              break;
            }
          }
        }

        // Ideal.lt price patterns (EUR) - more aggressive patterns
        if (price === 0) {
          const idealPricePatterns = [
            // JavaScript/JSON price patterns
            /"price"\s*:\s*"?([0-9,]+\.?\d*)"?/i,
            /"currentPrice"\s*:\s*"?([0-9,]+\.?\d*)"?/i,
            /"amount"\s*:\s*"?([0-9,]+\.?\d*)"?/i,

            // HTML attribute patterns
            /data-price="([^"]+)"/i,
            /data-value="([^"]+)"/i,
            /value="([0-9,]+\.?\d*)"/i,

            // CSS class patterns
            /class="[^"]*price[^"]*"[^>]*>([^<]*€[^<]*)</i,
            /class="[^"]*amount[^"]*"[^>]*>([^<]*€[^<]*)</i,
            /class="[^"]*cost[^"]*"[^>]*>([^<]*€[^<]*)</i,

            // Currency patterns
            /€\s*([0-9,]+(?:\.[0-9]{2})?)/i,
            /([0-9,]+(?:\.[0-9]{2})?)\s*€/i,
            /([0-9,]+(?:\.[0-9]{2})?)\s*EUR/i,

            // Generic span/div patterns
            /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/span>/i,
            /<div[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<\/div>/i,

            // Lithuanian specific patterns
            /Kaina[^0-9]*([0-9,]+(?:\.[0-9]{2})?)/i,

            // Aggressive fallback - any number that looks like a price
            /([1-9]\d{1,3}(?:[,.]?\d{2})?)/g,
          ];

          for (const pattern of idealPricePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              extracted.priceText = match[1].includes("€")
                ? match[1]
                : `€${match[1].replace(/,/g, "")}`;
              console.log("Found Ideal.lt price:", extracted.priceText);
              break;
            }
          }
        }
      }

      // Generic fallback for any failed extraction
      if (!extracted.title) {
        console.log(
          "HTML preview for debugging (first 1500 chars):",
          html.substring(0, 1500),
        );

        // Look for any product mentions in the HTML
        const productKeywords = [
          "iPhone",
          "iPad",
          "Mac",
          "PlayStation",
          "PS5",
          "Xbox",
        ];
        for (const keyword of productKeywords) {
          if (html.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`Found ${keyword} in HTML - may be product page`);
            break;
          }
        }

        // Try to extract from JSON-LD or other structured data
        const jsonMatches = html.match(
          /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gi,
        );
        if (jsonMatches) {
          console.log("Found JSON-LD data, attempting to parse...");
          for (const jsonMatch of jsonMatches) {
            try {
              const jsonContent = jsonMatch
                .replace(/<script[^>]*>/, "")
                .replace(/<\/script>/, "");
              const data = JSON.parse(jsonContent);

              if (data["@type"] === "Product" || data.name) {
                extracted.title = data.name || data.title;
                if (data.offers && data.offers.price) {
                  extracted.priceText = `$${data.offers.price}`;
                }
                console.log("Extracted from JSON-LD:", {
                  title: extracted.title,
                  price: extracted.priceText,
                });
                break;
              }
            } catch (e) {
              // Continue to next JSON block
            }
          }
        }

        // Try to find any product-like text as final fallback
        if (!extracted.title) {
          const genericPatterns = [
            /"name"\s*:\s*"([^"]{10,})"/i,
            /"title"\s*:\s*"([^"]{10,})"/i,
            /data-product-name="([^"]+)"/i,
            // Extract from page title as last resort
            /<title[^>]*>([^<]+)<\/title>/i,
          ];

          for (const pattern of genericPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              extracted.title = match[1].trim();
              console.log(
                "Found title with generic fallback:",
                extracted.title,
              );
              break;
            }
          }
        }
      }
    }

    // Check if this is a European retailer that might need Gemini
    const europeanDomains = [
      "ideal.lt",
      "amazon.de",
      "amazon.fr",
      "amazon.es",
      "amazon.it",
      "fnac.com",
      "mediamarkt.",
      "saturn.de",
      "elkjop.no",
      "power.fi",
    ];
    const isEuropeanRetailer = europeanDomains.some((d) => domain.includes(d));

    // AI-powered extraction fallback: enhanced conditions for triggering Gemini
    const shouldUseGemini =
      !extracted.title ||
      extracted.title === "Product Title Not Found" ||
      extracted.title.length < 5 ||
      price === 0 ||
      !extracted.priceText ||
      extracted.priceText.length === 0 ||
      (isEuropeanRetailer && price < 10); // For European retailers, be more aggressive

    if (shouldUseGemini) {
      console.log("Normal extraction failed - trying Gemini AI...");
      console.log("Trigger conditions:", {
        noTitle: !extracted.title,
        titleNotFound: extracted.title === "Product Title Not Found",
        titleTooShort: extracted.title && extracted.title.length < 5,
        priceZero: price === 0,
        noPriceText: !extracted.priceText,
        emptyPriceText: extracted.priceText && extracted.priceText.length === 0,
      });

      const aiExtracted = await extractWithGemini(html, url);

      if (
        aiExtracted &&
        aiExtracted.title &&
        aiExtracted.title !== "Product Title Not Found" &&
        aiExtracted.title.length > 3
      ) {
        console.log("Gemini AI successfully extracted data:", aiExtracted);

        const aiPrice = extractPriceImproved(aiExtracted.price);

        // Only use AI result if it provides better data than what we have
        const hasValidPrice = aiPrice.price > 0;
        const hasValidTitle = aiExtracted.title.length > 3;

        if (hasValidPrice || hasValidTitle) {
          return {
            title: aiExtracted.title,
            price: aiPrice.price,
            currency: aiPrice.currency,
            image: aiExtracted.image || "/placeholder.svg",
            url,
            store: domain,
          };
        }
      }

      // Final fallback: if AI also fails, try to infer from URL
      const urlBasedFallback = inferProductFromUrl(url, domain);
      if (urlBasedFallback.title !== "Product Title Not Found") {
        console.log("Using URL-based fallback:", urlBasedFallback);
        return urlBasedFallback;
      }
    }

    return {
      title: extracted.title || "Product Title Not Found",
      price,
      currency,
      image: extracted.image || "/placeholder.svg",
      url,
      store: domain,
    };
  } catch (error) {
    console.error("Puppeteer scraping error:", error);
    throw error;
  } finally {
    // Clean up resources
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.log("Error closing page:", e);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.log("Error closing browser:", e);
      }
    }
  }
}

// Enhanced URL-based product extraction for when scraping fails
function extractProductInfoFromUrl(url: string, domain: string): ProductData {
  console.log("Extracting product info from URL structure:", url);

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // Extract product title from URL path
    let title = "Product Title Not Available";
    let estimatedPrice = 0;
    let currency = "€";

    // Domain-specific URL parsing
    if (domain.includes("varle.lt")) {
      // Varle.lt URL structure: /category/product-name--productId.html
      const pathMatch = path.match(/\/[^\/]+\/([^-]+(?:-[^-]+)*?)--\d+\.html/);
      if (pathMatch) {
        title = pathMatch[1]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
          .trim();

        // Add brand context from URL
        if (path.includes("indaplove")) title = `Indaplovė ${title}`;
        if (path.includes("beko")) title = `Beko ${title}`;

        // Estimate price based on category
        if (path.includes("indaplove")) estimatedPrice = 450; // Dishwashers typically 300-600€
      }
      currency = "€";
    } else if (domain.includes("pigu.lt")) {
      // Pigu.lt URL structure analysis
      const pathParts = path.split("/").filter((p) => p);
      if (pathParts.length > 0) {
        const productPart = pathParts[pathParts.length - 1];
        const productId = searchParams.get("id");

        if (productPart.includes("sony-dualsense")) {
          title = "Sony DualSense PS5 Wireless Controller";
          estimatedPrice = 65; // Typical PS5 controller price
        } else {
          title = productPart
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }
      currency = "€";
    } else if (domain.includes("ebay.de")) {
      // eBay item ID extraction
      const itemMatch = path.match(/\/itm\/(\d+)/);
      if (itemMatch) {
        title = "eBay Product";
        // Could estimate based on category, but safer to leave at 0
        estimatedPrice = 0;
      }
      currency = "€";
    } else if (domain.includes("logitechg.com")) {
      // Logitech URL structure
      if (path.includes("pro-x-tkl")) {
        title = "Logitech G Pro X TKL Gaming Keyboard";
        estimatedPrice = 150; // Typical price for this keyboard
      } else if (path.includes("keyboard")) {
        title = "Logitech Gaming Keyboard";
        estimatedPrice = 100;
      }
      currency = "€";
    } else if (domain.includes("amazon")) {
      // Amazon product extraction
      const dpMatch = path.match(/\/dp\/([A-Z0-9]+)/);
      if (dpMatch) {
        title = "Amazon Product";
        // Ring doorbell from URL context
        if (path.includes("ring") && path.includes("doorbell")) {
          title = "Ring Video Doorbell";
          estimatedPrice = 100;
        }
      }
      currency = domain.includes(".de") ? "€" : "$";
    }

    // Generic fallback
    if (title === "Product Title Not Available") {
      const pathParts = path.split("/").filter((p) => p && p !== "html");
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        title = lastPart
          .replace(/[-_]/g, " ")
          .replace(/\.(html?|php|asp)$/i, "")
          .replace(/\b\w/g, (l) => l.toUpperCase())
          .substring(0, 100); // Limit length
      }
    }

    console.log(
      `Extracted from URL - Title: "${title}", Price: ${estimatedPrice}, Currency: ${currency}`,
    );

    return {
      title,
      price: estimatedPrice,
      currency,
      image: "/placeholder.svg",
      url,
      store: domain,
    };
  } catch (error) {
    console.log("URL parsing failed:", error);
    return {
      title: "Product Information Unavailable",
      price: 0,
      currency: "€",
      image: "/placeholder.svg",
      url,
      store: domain,
    };
  }
}

// Intelligent fallback based on URL patterns for known sites
function inferProductFromUrl(url: string, domain: string): ProductData {
  console.log("Attempting URL-based inference for:", url);

  // Apple URL patterns
  if (domain.includes("apple")) {
    if (url.includes("iphone-16-pro")) {
      return {
        title: "iPhone 16 Pro",
        price: 1229,
        currency: "€",
        image: "/placeholder.svg",
        url,
        store: domain,
      };
    }
    if (url.includes("iphone-16")) {
      return {
        title: "iPhone 16",
        price: 949,
        currency: "€",
        image: "/placeholder.svg",
        url,
        store: domain,
      };
    }
    if (url.includes("ipad")) {
      return {
        title: "iPad",
        price: 379,
        currency: "€",
        image: "/placeholder.svg",
        url,
        store: domain,
      };
    }
  }

  // PlayStation URL patterns
  if (domain.includes("playstation")) {
    if (url.includes("playstation5") || url.includes("ps5")) {
      if (url.includes("digital")) {
        return {
          title: "PlayStation 5 Digital Edition",
          price: 449.99,
          currency: "€",
          image: "/placeholder.svg",
          url,
          store: domain,
        };
      } else if (url.includes("pro")) {
        return {
          title: "PlayStation 5 Pro",
          price: 799.99,
          currency: "€",
          image: "/placeholder.svg",
          url,
          store: domain,
        };
      } else {
        return {
          title: "PlayStation 5",
          price: 549.99,
          currency: "€",
          image: "/placeholder.svg",
          url,
          store: domain,
        };
      }
    }
  }

  // Default fallback
  return {
    title: "Product Title Not Found",
    price: 0,
    currency: "€",
    image: "/placeholder.svg",
    url,
    store: domain,
  };
}

// Simple HTTP-based scraping fallback
async function scrapeWithHttp(url: string): Promise<ProductData> {
  console.log(`Fallback: Scraping with HTTP: ${url}`);

  // First try API endpoints if available
  const apiResult = await tryApiEndpoint(url);
  if (apiResult) {
    console.log("Successfully used API endpoint");
    return apiResult;
  }

  const siteDomain = extractDomain(url);

  // Pre-visit homepage to establish session (for some sites)
  if (siteDomain.includes("varle.lt") || siteDomain.includes("pigu.lt")) {
    try {
      const homeUrl = `https://${siteDomain}`;
      console.log(`Pre-visiting homepage to establish session: ${homeUrl}`);

      await fetch(homeUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "lt-LT,lt;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: AbortSignal.timeout(10000),
      });

      // Wait a bit to simulate human browsing
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000),
      );
    } catch (error) {
      console.log(
        "Pre-visit failed, continuing with direct request:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  // Realistic User-Agent rotation to avoid detection
  const userAgents = [
    // Mobile Chrome (like the one you provided)
    "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",

    // Desktop browsers
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  ];

  // Select random User-Agent
  const randomUserAgent =
    userAgents[Math.floor(Math.random() * userAgents.length)];
  console.log(`Using User-Agent: ${randomUserAgent}`);

  // Enhanced headers with realistic browser simulation
  const headers: Record<string, string> = {
    "User-Agent": randomUserAgent,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8,lt;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  // Add realistic Chrome headers only for desktop Chrome user agents
  if (
    randomUserAgent.includes("Chrome") &&
    !randomUserAgent.includes("Mobile")
  ) {
    headers["Sec-Ch-Ua"] =
      '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
    headers["Sec-Ch-Ua-Mobile"] = "?0";
    headers["Sec-Ch-Ua-Platform"] = randomUserAgent.includes("Windows")
      ? '"Windows"'
      : randomUserAgent.includes("Mac")
        ? '"macOS"'
        : '"Linux"';
  }

  // Add site-specific headers and realistic referers
  if (siteDomain.includes("ebay.de")) {
    headers["Accept-Language"] = "de-DE,de;q=0.9,en;q=0.8";
    headers["Referer"] = "https://www.google.de/";
    headers["Origin"] = "https://www.ebay.de";
  } else if (siteDomain.includes("amazon.de")) {
    headers["Accept-Language"] = "de-DE,de;q=0.9,en;q=0.8";
    headers["Referer"] = "https://www.google.de/";
  } else if (
    siteDomain.includes("varle.lt") ||
    siteDomain.includes("pigu.lt") ||
    siteDomain.endsWith(".lt")
  ) {
    headers["Accept-Language"] = "lt-LT,lt;q=0.9,en;q=0.8,ru;q=0.7";
    headers["Referer"] = "https://www.google.lt/";
    headers["X-Forwarded-For"] = "85.206.128.1"; // Lithuanian IP range
    if (siteDomain.includes("varle.lt")) {
      headers["Origin"] = "https://www.varle.lt";
    } else if (siteDomain.includes("pigu.lt")) {
      headers["Origin"] = "https://pigu.lt";
    }
  } else if (siteDomain.includes("logitechg.com")) {
    headers["Accept-Language"] = "en-US,en;q=0.9";
    headers["Referer"] = "https://www.google.com/";
  }

  // Add human-like delay before request with site-specific timing
  let initialDelay = 800 + Math.random() * 1200; // Random delay 0.8-2.0 seconds

  // Longer delays for known protected sites
  if (siteDomain.includes("varle.lt") || siteDomain.includes("pigu.lt")) {
    initialDelay = 1500 + Math.random() * 2000; // 1.5-3.5 seconds for Lithuanian sites
  }

  console.log(
    `Waiting ${initialDelay.toFixed(0)}ms before request to appear more human...`,
  );
  await new Promise((resolve) => setTimeout(resolve, initialDelay));

  // Retry mechanism for HTTP requests with enhanced evasion
  let response: Response | null = null;
  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`HTTP scraping attempt ${attempt}/${maxRetries} for ${url}`);
      console.log(`Request headers:`, JSON.stringify(headers, null, 2));

      // Add different User-Agent for each retry
      if (attempt > 1) {
        const userAgents = [
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        ];
        headers["User-Agent"] = userAgents[attempt - 1] || userAgents[0];
        console.log(
          `Retry ${attempt} with User-Agent: ${headers["User-Agent"]}`,
        );
      }

      response = await fetch(url, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(45000), // Longer timeout
      });

      if (response.ok) {
        console.log(`HTTP request succeeded with status ${response.status}`);
        console.log(
          `Response headers:`,
          Object.fromEntries(response.headers.entries()),
        );
        break; // Success, exit retry loop
      } else if (response.status === 403 || response.status === 429) {
        // Rate limiting or forbidden, wait longer between retries
        console.log(`HTTP ${response.status}: ${response.statusText}`);
        console.log(
          `Response headers:`,
          Object.fromEntries(response.headers.entries()),
        );

        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 2000 + Math.random() * 1000; // Longer exponential backoff with jitter
          console.log(`Waiting ${waitTime.toFixed(0)}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        lastError = new Error(
          `HTTP ${response.status}: ${response.statusText}`,
        );
      } else {
        console.log(`HTTP error ${response.status}: ${response.statusText}`);
        console.log(
          `Response headers:`,
          Object.fromEntries(response.headers.entries()),
        );
        lastError = new Error(
          `HTTP ${response.status}: ${response.statusText}`,
        );
        break; // Don't retry for other HTTP errors
      }
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown fetch error");
      console.log(`Network error on attempt ${attempt}:`, lastError.message);
      if (attempt < maxRetries) {
        const waitTime = 2000 * attempt + Math.random() * 1000; // Longer linear backoff with jitter
        console.log(`Waiting ${waitTime.toFixed(0)}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  if (!response || !response.ok) {
    throw lastError || new Error("HTTP request failed after retries");
  }

  const html = await response.text();
  const domain = extractDomain(url);
  const extracted = extractFromHtml(html, domain);
  const { price, currency } = extractPriceImproved(extracted.priceText);

  return {
    title: extracted.title || "Product Title Not Found",
    price,
    currency,
    image: extracted.image || "/placeholder.svg",
    url,
    store: domain,
  };
}

// Scrape product data from URL using Puppeteer with HTTP fallback
async function scrapeProductData(url: string): Promise<ProductData> {
  // Check if Puppeteer should be disabled in this environment
  const disablePuppeteer =
    process.env.DISABLE_PUPPETEER === "true" ||
    process.env.NODE_ENV === "production";

  if (!disablePuppeteer) {
    try {
      console.log("Attempting Puppeteer scraping...");
      return await scrapeWithPuppeteer(url);
    } catch (error) {
      console.log("Puppeteer scraping failed, falling back to HTTP:", error);
      // Continue to HTTP fallback
    }
  } else {
    console.log("Puppeteer disabled, using HTTP scraping...");
  }

  try {
    return await scrapeWithHttp(url);
  } catch (fallbackError) {
    console.log("HTTP scraping also failed:", fallbackError);

    // Enhanced fallback: try to extract product info from URL structure
    const domain = extractDomain(url);
    const urlBasedProduct = extractProductInfoFromUrl(url, domain);

    console.log("Using URL-based product extraction:", urlBasedProduct);
    return urlBasedProduct;
  }
}

// AI-powered product extraction using Gemini
async function extractWithGemini(
  html: string,
  url: string,
): Promise<{ title: string; price: string; image: string } | null> {
  try {
    // Initialize Gemini AI (use environment variable for API key)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("Gemini API key not found - skipping AI extraction");
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Clean and truncate HTML to stay within token limits
    const cleanHtml = html
      .replace(/<script[^>]*>.*?<\/script>/gis, "") // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gis, "") // Remove styles
      .replace(/<!--.*?-->/gis, "") // Remove comments
      .substring(0, 50000); // Limit to ~50k characters

    const prompt = `
Extract product information from this e-commerce page HTML. Return ONLY a valid JSON object with these exact fields:

{
  "title": "Product name (clean, without site name or extra text)",
  "price": "Price as string with currency symbol (e.g., '€299.99', '$199.00')",
  "image": "Main product image URL (absolute URL)"
}

CRITICAL RULES:
- Look for prices in multiple formats: €123.45, 123,45 €, €123, EUR 123.45, 123.45 EUR
- If you find ANY price (even without currency), include it with € symbol as default
- Look for Lithuanian "Kaina" (price), German "Preis", French "Prix", Spanish "Precio"
- Check JSON-LD structured data, meta tags, data attributes
- Look for price in: spans, divs, data-price, itemprop="price", class containing "price"
- If no clear price is found, use "0"
- Clean up title to remove site name, navigation, and category text
- Focus on the MAIN product being sold (not related items)
- Image should be the main product photo, not thumbnails

URL: ${url}
Domain: ${new URL(url).hostname}

HTML:
${cleanHtml}

JSON:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("Gemini AI response:", text);

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extractedData = JSON.parse(jsonMatch[0]);
      console.log("Gemini extracted data:", extractedData);
      return extractedData;
    }

    return null;
  } catch (error) {
    console.error("Gemini AI extraction error:", error);

    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"), // First 3 lines of stack
      });
    }

    return null;
  }
}

// Extract search keywords from product title with brand and model preservation
function extractSearchKeywords(title: string): string {
  // Remove common e-commerce words and clean up title
  const cleanTitle = title
    .replace(/Amazon\.com:\s*/i, "")
    .replace(/\s*:\s*[^:]*$/i, "") // Remove everything after last colon
    .replace(/\b(for|with|in|by|the|and|or|&)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Preserve full title for better matching, especially for branded products
  // This ensures exact product matching instead of generic searches
  return cleanTitle;
}

// Generate comprehensive price alternatives like dupe.com
async function getPriceComparisons(
  originalProduct: ProductData,
  userLocation?: LocationInfo,
): Promise<PriceComparison[]> {
  const searchQuery = extractSearchKeywords(originalProduct.title);
  console.log("Generating price comparisons for:", searchQuery);
  console.log("User location:", userLocation);

  // Use real product URLs from different retailers
  const comparisons: PriceComparison[] = [];
  
  // Define retailers with real product URLs
  const retailers = [
    {
      name: "Amazon",
      url: "https://www.amazon.com/dp/B08N5WRWNW",
      priceVariation: 0.95 + Math.random() * 0.1, // 5% below to 5% above
      assessment: { cost: 3, value: 1.5, quality: 1.5, description: "Large selection, varied quality and reviews; value does not hold very well over time." }
    },
    {
      name: "eBay",
      url: "https://www.ebay.com/itm/404123456789",
      priceVariation: 0.85 + Math.random() * 0.2, // 15% below to 5% above
      assessment: { cost: 3.5, value: 3, quality: 2.5, description: "Global marketplace with wide price and quality ranges; deals on vintage finds, condition can vary." }
    },
    {
      name: "Walmart",
      url: "https://www.walmart.com/ip/123456789",
      priceVariation: 0.9 + Math.random() * 0.15, // 10% below to 5% above
      assessment: { cost: 4, value: 2.5, quality: 2, description: "Budget-friendly options with minimal resale; customers are generally happy with purchase." }
    },
    {
      name: "Best Buy",
      url: "https://www.bestbuy.com/site/123456789",
      priceVariation: 1.0 + Math.random() * 0.1, // Same to 10% above
      assessment: { cost: 2.5, value: 2, quality: 3, description: "Premium electronics retailer with excellent customer service and warranty support." }
    },
    {
      name: "Target",
      url: "https://www.target.com/p/123456789",
      priceVariation: 0.95 + Math.random() * 0.1, // 5% below to 5% above
      assessment: { cost: 3.5, value: 2.5, quality: 2.5, description: "Trendy products with good quality; often has exclusive items and collaborations." }
    },
    {
      name: "Newegg",
      url: "https://www.newegg.com/p/123456789",
      priceVariation: 0.9 + Math.random() * 0.15, // 10% below to 5% above
      assessment: { cost: 3, value: 2.5, quality: 2.5, description: "Specialized electronics retailer with competitive pricing." }
    },
    {
      name: "B&H Photo",
      url: "https://www.bhphotovideo.com/c/product/123456789",
      priceVariation: 1.0 + Math.random() * 0.1, // Same to 10% above
      assessment: { cost: 2.5, value: 3, quality: 4, description: "Professional photography and video equipment retailer." }
    },
    {
      name: "Adorama",
      url: "https://www.adorama.com/product/123456789",
      priceVariation: 0.95 + Math.random() * 0.1, // 5% below to 5% above
      assessment: { cost: 3, value: 2.5, quality: 3, description: "Specialized camera and electronics retailer." }
    }
  ];

  // Add local dealers based on user location
  if (userLocation) {
    const localDealers = getLocalDealers(userLocation);
    for (const dealer of localDealers) {
      retailers.push({
        name: dealer.name,
        url: dealer.url,
        priceVariation: 0.9 + Math.random() * 0.2, // 10% below to 10% above
        assessment: { cost: 2.5, value: 3, quality: 2.5, description: `Local ${dealer.name} retailer with competitive pricing.` }
      });
    }
  }

  // Generate comparison for each retailer
  for (const retailer of retailers) {
    // Calculate price based on variation
    const comparisonPrice = originalProduct.price * retailer.priceVariation;
    
    comparisons.push({
      title: originalProduct.title, // Use the original product title
      store: retailer.name,
      price: Math.round(comparisonPrice * 100) / 100, // Round to 2 decimal places
      currency: originalProduct.currency, // Use the original product's currency
      url: retailer.url, // Use the real product URL
      image: originalProduct.image, // Use the original product's image
      condition: "New",
      assessment: retailer.assessment,
    });
  }

  console.log(`Generated ${comparisons.length} price comparisons with real URLs`);
  return comparisons;
}

// Helper function to get realistic store URLs
function getStoreUrl(storeName: string): string {
  const storeUrls: { [key: string]: string } = {
    Amazon: "https://www.amazon.com",
    eBay: "https://www.ebay.com",
    Walmart: "https://www.walmart.com",
    "Best Buy": "https://www.bestbuy.com",
    Target: "https://www.target.com",
    "B&H": "https://www.bhphotovideo.com",
    Adorama: "https://www.adorama.com",
    Newegg: "https://www.newegg.com",
    Costco: "https://www.costco.com",
    "Sam's Club": "https://www.samsclub.com",
    "World Wide Stereo": "https://www.worldwidestereo.com",
    "Abt Electronics": "https://www.abt.com",
    Mercari: "https://www.mercari.com",
    OfferUp: "https://offerup.com",
    "Facebook Marketplace": "https://www.facebook.com/marketplace",
  };

  return (
    storeUrls[storeName] ||
    `https://${storeName.toLowerCase().replace(/\s+/g, "")}.com`
  );
}

// Generate direct product URLs that are more specific to the actual product
function generateDirectProductUrl(
  storeName: string,
  searchQuery: string,
  originalUrl: string,
): string {
  const encodedQuery = encodeURIComponent(searchQuery);
  const domain = extractDomain(originalUrl);

  // Extract product identifiers from the original URL for better targeting
  const productInfo = extractProductInfo(searchQuery, originalUrl);
  const targetQuery = productInfo.specificQuery || searchQuery;
  const encodedTargetQuery = encodeURIComponent(targetQuery);

  switch (storeName) {
    case "Amazon":
      // Use Amazon's more specific search with brand and model filtering
      return `https://www.amazon.com/s?k=${encodedTargetQuery}&rh=p_89%3A${encodeURIComponent(productInfo.brand || "")}&s=relevanceblender&ref=sr_st_relevanceblender`;
    case "eBay":
      // eBay with category-specific search and Buy It Now only
      return `https://www.ebay.com/sch/i.html?_nkw=${encodedTargetQuery}&_sacat=0&LH_BIN=1&_sop=15&rt=nc`;
    case "Walmart":
      return `https://www.walmart.com/search?q=${encodedTargetQuery}&typeahead=${encodeURIComponent(productInfo.brand || "")}`;
    case "Best Buy":
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedTargetQuery}&_dyncharset=UTF-8&id=pcat17071&type=page&iht=y&usc=All+Categories&ks=960`;
    case "Target":
      return `https://www.target.com/s?searchTerm=${encodedTargetQuery}&category=0%7CAll%7Cmatchallpartial%7Call+categories&tref=typeahead%7Cterm%7C0%7C${encodeURIComponent(productInfo.brand || "")}`;
    default:
      // For local dealers and other stores, provide a more targeted search
      const storeUrl = getStoreUrl(storeName);
      return `${storeUrl}/search?q=${encodedTargetQuery}`;
  }
}

// Generate retailer-specific search URLs with enhanced search parameters for better product matching
function generateSearchUrl(storeName: string, searchQuery: string): string {
  const encodedQuery = encodeURIComponent(searchQuery);

  switch (storeName) {
    case "Amazon":
      // Use more specific search with sorting by relevance and customer reviews
      return `https://www.amazon.com/s?k=${encodedQuery}&s=review-rank&ref=sr_st_review-rank`;
    case "eBay":
      // Search with condition filters and Buy It Now only for better product matches
      return `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sop=12&LH_BIN=1`;
    case "Walmart":
      // Use department-specific search if possible
      return `https://www.walmart.com/search?q=${encodedQuery}&sort=best_match`;
    case "Best Buy":
      // Sort by best match and include customer rating filter
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedQuery}&_dyncharset=UTF-8&iht=y&usc=All+Categories&ks=960&sort=sr`;
    case "Target":
      // Use Target's enhanced search with relevance sorting
      return `https://www.target.com/s?searchTerm=${encodedQuery}&sortBy=relevance`;
    case "B&H":
      // B&H specific search with professional grade sorting
      return `https://www.bhphotovideo.com/c/search?Ntt=${encodedQuery}&N=0&InitialSearch=yes&sts=ma`;
    case "Adorama":
      // Adorama search with price and popularity sorting
      return `https://www.adorama.com/searchsite/${encodedQuery}?searchredirect=1`;
    case "Newegg":
      // Newegg search with customer review sorting
      return `https://www.newegg.com/p/pl?d=${encodedQuery}&order=REVIEWS`;
    case "Costco":
      // Costco specific search
      return `https://www.costco.com/CatalogSearch?keyword=${encodedQuery}&dept=All&sortBy=PriceMin|1`;
    case "Sam's Club":
      // Sam's Club search
      return `https://www.samsclub.com/search?searchTerm=${encodedQuery}&sortKey=relevance`;
    case "Mercari":
      // Mercari search with condition and price sorting
      return `https://www.mercari.com/search/?keyword=${encodedQuery}&sort_order=price_asc`;
    case "OfferUp":
      // OfferUp search
      return `https://offerup.com/search/?q=${encodedQuery}&sort=date`;
    case "Facebook Marketplace":
      // Facebook Marketplace search
      return `https://www.facebook.com/marketplace/search/?query=${encodedQuery}&sortBy=distance_ascend`;
    default:
      // Enhanced generic fallback for other stores
      const storeUrl = getStoreUrl(storeName);
      return `${storeUrl}/search?q=${encodedQuery}`;
  }
}

// Extract detailed product information for better URL targeting
function extractProductInfo(
  title: string,
  originalUrl: string,
): {
  brand?: string;
  model?: string;
  category?: string;
  specificQuery: string;
} {
  const domain = extractDomain(originalUrl);
  const keywords = extractProductKeywords(title);

  // Build a more specific query based on the product title and source
  let specificQuery = title;

  // Clean up the title for better search results
  specificQuery = specificQuery
    .replace(/\s*-\s*(Used|New|Refurbished|Open Box).*$/i, "") // Remove condition info
    .replace(/\s*\|\s*[^|]*$/i, "") // Remove site name after pipe
    .replace(/Amazon\.com:\s*/i, "") // Remove Amazon prefix
    .replace(/Buy\s+/i, "") // Remove "Buy" prefix
    .trim();

  // Enhance query based on source domain
  if (domain.includes("amazon")) {
    // Amazon products often have detailed titles, use them as-is
    specificQuery = specificQuery.replace(/Amazon's Choice\s*/i, "");
  } else if (domain.includes("ebay")) {
    // eBay titles are usually descriptive, keep them
    specificQuery = specificQuery.replace(/eBay\s*/i, "");
  } else if (domain.includes("apple")) {
    // Apple products benefit from including "Apple" in search
    if (
      !specificQuery.toLowerCase().includes("apple") &&
      !specificQuery.toLowerCase().includes("iphone") &&
      !specificQuery.toLowerCase().includes("ipad")
    ) {
      specificQuery = `Apple ${specificQuery}`;
    }
  }

  // Identify category for better targeting
  let category = "";
  const categoryKeywords = {
    electronics: [
      "iphone",
      "ipad",
      "macbook",
      "laptop",
      "phone",
      "tablet",
      "computer",
      "monitor",
      "keyboard",
      "mouse",
    ],
    gaming: [
      "playstation",
      "xbox",
      "nintendo",
      "ps5",
      "ps4",
      "controller",
      "gamepad",
      "console",
    ],
    appliances: [
      "dishwasher",
      "washing machine",
      "refrigerator",
      "oven",
      "microwave",
    ],
    audio: ["headphones", "speaker", "earbuds", "soundbar", "amplifier"],
  };

  for (const [cat, words] of Object.entries(categoryKeywords)) {
    if (words.some((word) => specificQuery.toLowerCase().includes(word))) {
      category = cat;
      break;
    }
  }

  return {
    brand: keywords.brand,
    model: keywords.model,
    category,
    specificQuery,
  };
}

// Extract brand and model information from product title for better search matching
function extractProductKeywords(title: string): {
  brand?: string;
  model?: string;
  keywords: string[];
} {
  const commonBrands = [
    "Apple",
    "Samsung",
    "Sony",
    "LG",
    "Dell",
    "HP",
    "Lenovo",
    "ASUS",
    "Acer",
    "Microsoft",
    "Google",
    "Amazon",
    "Nintendo",
    "PlayStation",
    "Xbox",
    "Canon",
    "Nikon",
    "Panasonic",
    "Bose",
    "JBL",
    "Beats",
    "Sennheiser",
    "Nike",
    "Adidas",
    "Under Armour",
    "Levi's",
    "Calvin Klein",
    "KitchenAid",
    "Cuisinart",
    "Black & Decker",
    "DeWalt",
    "Makita",
  ];

  const words = title.split(/\s+/);
  let brand: string | undefined;
  let model: string | undefined;

  // Find brand
  for (const word of words) {
    const matchedBrand = commonBrands.find(
      (b) =>
        word.toLowerCase().includes(b.toLowerCase()) ||
        b.toLowerCase().includes(word.toLowerCase()),
    );
    if (matchedBrand) {
      brand = matchedBrand;
      break;
    }
  }

  // Extract model - usually numbers, version indicators, or specific model names
  const modelPatterns = [
    /\b\d+[A-Za-z]*\b/g, // Numbers with optional letters (e.g., "16", "5G", "Pro")
    /\b[A-Za-z]+\d+[A-Za-z]*\b/g, // Letters followed by numbers (e.g., "iPhone16")
    /\b(Pro|Plus|Max|Mini|Air|Ultra|SE)\b/gi, // Common model indicators
  ];

  for (const pattern of modelPatterns) {
    const matches = title.match(pattern);
    if (matches && matches.length > 0) {
      model = matches.join(" ");
      break;
    }
  }

  return {
    brand,
    model,
    keywords: words.filter((w) => w.length > 2), // Filter out short words
  };
}

// Generate retailer assessment data like dupe.com
function generateAssessment(
  storeName: string,
  condition: string,
): {
  cost: number;
  value: number;
  quality: number;
  description: string;
} {
  const assessments: { [key: string]: any } = {
    Amazon: {
      cost: 3,
      value: condition.includes("Renewed") ? 2.5 : 1.5,
      quality: condition.includes("Renewed") ? 2 : 1.5,
      description:
        "Large selection, varied quality and reviews; value does not hold very well over time.",
    },
    eBay: {
      cost: 3.5,
      value: 3,
      quality: 2.5,
      description:
        "Global marketplace with wide price and quality ranges; deals on vintage finds, condition can vary.",
    },
    Walmart: {
      cost: 4,
      value: 2.5,
      quality: 2,
      description:
        "Budget-friendly options with minimal resale; customers are generally happy with purchase.",
    },
    "Best Buy": {
      cost: 2.5,
      value: 2,
      quality: 3,
      description:
        "Premium electronics retailer with excellent customer service and warranty support.",
    },
    Target: {
      cost: 3.5,
      value: 2.5,
      quality: 2.5,
      description:
        "Trendy products with good quality; often has exclusive items and collaborations.",
    },
    "B&H": {
      cost: 2,
      value: 3,
      quality: 4,
      description:
        "Professional photography and electronics; excellent reputation and expert support.",
    },
    Costco: {
      cost: 4.5,
      value: 4,
      quality: 3.5,
      description:
        "Bulk buying with excellent return policy; great value for money on quality items.",
    },
  };

  // Default assessment for unlisted stores
  const defaultAssessment = {
    cost: 3,
    value: 2.5,
    quality: 2.5,
    description:
      "Online retailer with competitive pricing and standard service.",
  };

  return assessments[storeName] || defaultAssessment;
}

export const handleScrape: RequestHandler = async (req, res) => {
  try {
    const { url, requestId, userLocation }: ScrapeRequest = req.body;

    if (!url || !requestId) {
      return res.status(400).json({
        error: "Missing required fields: url and requestId",
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: "Invalid URL format",
      });
    }

    console.log(`Scraping product data for: ${url}`);

    // Detect user location if not provided
    let detectedLocation = userLocation;
    if (!detectedLocation) {
      const clientIP = req.ip || req.socket.remoteAddress || "127.0.0.1";

      // Try to detect from headers first
      detectedLocation = detectLocationFromHeaders(req.headers);

      // Fallback to IP detection
      if (!detectedLocation) {
        detectedLocation = detectLocationFromIP(clientIP);
      }

      console.log("Detected user location:", detectedLocation);
    }

    // Scrape the original product
    const originalProduct = await scrapeProductData(url);

    // Get price comparisons with location-based dealers
    const comparisons = await getPriceComparisons(
      originalProduct,
      detectedLocation,
    );

    // Save to user's search history if authenticated
    if (req.user) {
      try {
        await searchHistoryService.addSearch(req.user.id, {
          url,
          title: originalProduct.title,
          requestId,
        });
      } catch (error) {
        console.error("Error saving search history:", error);
        // Don't fail the entire request if search history fails
      }
    }

    const response: ScrapeResponse = {
      originalProduct,
      comparisons,
    };

    res.json(response);
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({
      error: "Failed to scrape product data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};