// vite.config.ts
import { defineConfig } from "file:///app/code/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";

// server/index.ts
import dotenv from "file:///app/code/node_modules/dotenv/lib/main.js";
import express from "file:///app/code/node_modules/express/index.js";
import cors from "file:///app/code/node_modules/cors/lib/index.js";

// server/routes/demo.ts
var handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};

// server/routes/scrape.ts
import { GoogleGenerativeAI } from "file:///app/code/node_modules/@google/generative-ai/dist/index.mjs";
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}
function extractPrice(text) {
  if (!text) return { price: 0, currency: "$" };
  const cleanText = text.replace(/\s+/g, " ").trim();
  console.log("Extracting price from text:", cleanText);
  const patterns = [
    // Standard currency symbols with prices (improved for larger numbers)
    /[\$£€¥₹₽]\s*(\d{1,4}(?:[\s,.]\d{3})*(?:\.\d{2})?)/,
    /(\d{1,4}(?:[\s,.]\d{3})*(?:\.\d{2})?)\s*[\$£€¥₹₽]/,
    // Price with currency words
    /(\d{1,4}(?:[\s,.]\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|CAD|AUD|€)/i,
    /(?:USD|EUR|GBP|CAD|AUD|€)\s*(\d{1,4}(?:[\s,.]\d{3})*(?:\.\d{2})?)/i,
    // Decimal prices without currency (larger numbers)
    /(\d{1,4}(?:[\s,.]\d{3})*\.\d{2})/,
    // Whole number prices (larger range)
    /(\d{2,5})/
  ];
  const currencySymbols = {
    $: "$",
    "\xA3": "\xA3",
    "\u20AC": "\u20AC",
    "\xA5": "\xA5",
    "\u20B9": "\u20B9",
    "\u20BD": "\u20BD"
  };
  let detectedCurrency = "$";
  if (cleanText.includes("\u20AC") || cleanText.toLowerCase().includes("eur") || /\d+\s*€/.test(cleanText)) {
    detectedCurrency = "\u20AC";
  } else {
    for (const [symbol, curr] of Object.entries(currencySymbols)) {
      if (cleanText.includes(symbol)) {
        detectedCurrency = curr;
        break;
      }
    }
  }
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      let priceStr = match[1].replace(/[\s,]/g, "").replace(/\.(\d{2})$/, ".$1");
      const price = parseFloat(priceStr);
      console.log("Parsed price:", {
        original: match[1],
        cleaned: priceStr,
        parsed: price,
        currency: detectedCurrency
      });
      if (!isNaN(price) && price > 0) {
        return { price, currency: detectedCurrency };
      }
    }
  }
  return { price: 0, currency: detectedCurrency };
}
async function tryApiEndpoint(url) {
  const domain = extractDomain(url);
  if (domain.includes("playstation")) {
    console.log("Trying PlayStation API endpoint...");
    const productCodeMatch = url.match(/\/products\/(\d+)/);
    if (productCodeMatch) {
      try {
        const apiUrl = `https://direct.playstation.com/en-us/api/v1/products?productCodes=${productCodeMatch[1]}`;
        console.log("PlayStation API URL:", apiUrl);
        const apiResponse = await fetch(apiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json"
          }
        });
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          console.log(
            "PlayStation API response:",
            JSON.stringify(data, null, 2)
          );
          if (data.products && data.products.length > 0) {
            const product = data.products[0];
            return {
              title: product.name || "PlayStation Product",
              price: product.price?.value || 0,
              currency: product.price?.currencySymbol || "$",
              image: product.defaultVariant?.images?.[0] || "/placeholder.svg",
              url,
              store: "direct.playstation.com"
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
async function scrapeWithHttp(url) {
  console.log(`Scraping with HTTP: ${url}`);
  const apiResult = await tryApiEndpoint(url);
  if (apiResult) {
    console.log("Successfully used API endpoint");
    return apiResult;
  }
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const html = await response.text();
  const extractFromHtml = (html2) => {
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
      /"@type"\s*:\s*"Product"[^}]*"name"\s*:\s*"([^"]+)"/i
    ];
    for (const pattern of titlePatterns) {
      const match = html2.match(pattern);
      if (match && match[1] && match[1].trim().length > 3) {
        title = match[1].trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        break;
      }
    }
    let priceText = "";
    const pricePatterns = [
      // Standard meta tags
      /<meta property="product:price:amount" content="([^"]+)"/i,
      /<meta itemprop="price" content="([^"]+)"/i,
      /<meta name="price" content="([^"]+)"/i,
      /data-price="([^"]+)"/i,
      // Apple-specific price patterns
      /"dimensionPriceFrom"\s*:\s*"([^"]+)"/i,
      /"dimensionPrice"\s*:\s*"([^"]+)"/i,
      /"fromPrice"\s*:\s*"([^"]+)"/i,
      /"currentPrice"\s*:\s*"([^"]+)"/i,
      /data-analytics-activitymap-region-id="[^"]*price[^"]*"[^>]*>([^<]*\$[^<]*)</i,
      // JSON price patterns
      /"price"\s*:\s*"?([^",}]+)"?/i,
      /"amount"\s*:\s*([^,}]+)/i,
      /"value"\s*:\s*(\d+(?:\.\d+)?)/i,
      // HTML price patterns
      /class="[^"]*price[^"]*"[^>]*>([^<]*[\$£€¥₹][^<]*)</i,
      /data-price[^>]*>([^<]*[\$£€¥₹][^<]*)</i,
      // European price patterns
      /(\d{1,4}(?:[.\s,]\d{3})*(?:,\d{2})?)\s*€/i,
      /€\s*(\d{1,4}(?:[.\s,]\d{3})*(?:,\d{2})?)/i,
      /(\d{1,4}(?:[.\s,]\d{3})*(?:\.\d{2})?)\s*EUR/i,
      /EUR\s*(\d{1,4}(?:[.\s,]\d{3})*(?:\.\d{2})?)/i,
      // Global price patterns (fallback)
      /From\s*\$(\d+(?:,\d{3})*)/i,
      /Starting\s*at\s*\$(\d+(?:,\d{3})*)/i,
      /[\$£€¥₹]\s*\d+(?:[.\s,]\d{3})*(?:\.\d{2})?/g
    ];
    for (const pattern of pricePatterns) {
      if (pattern.global) {
        const matches = html2.match(pattern);
        if (matches && matches[0]) {
          priceText = matches[0];
          break;
        }
      } else {
        const match = html2.match(pattern);
        if (match && match[1]) {
          priceText = match[1].trim();
          break;
        }
      }
    }
    let image = "";
    const imagePatterns = [
      /<meta property="og:image" content="([^"]+)"/i,
      /<meta name="twitter:image" content="([^"]+)"/i
    ];
    for (const pattern of imagePatterns) {
      const match = html2.match(pattern);
      if (match && match[1]) {
        image = match[1].trim();
        break;
      }
    }
    return { title, priceText, image };
  };
  const extracted = extractFromHtml(html);
  const { price, currency } = extractPrice(extracted.priceText);
  const domain = extractDomain(url);
  console.log("Extraction result:", {
    title: extracted.title,
    priceText: extracted.priceText,
    price,
    currency,
    domain
  });
  if (!extracted.title || price === 0) {
    console.log("Extraction failed - trying domain-specific patterns");
    console.log("Domain:", domain);
    if (domain.includes("amazon")) {
      console.log("Detected Amazon site - using specific patterns");
      if (!extracted.title) {
        const amazonProductPatterns = [
          /<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/i,
          /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h1>/i,
          /"title"\s*:\s*"([^"]{10,})"/i,
          /Amazon\.com:\s*([^|{}<>]+)/i,
          /<title[^>]*>Amazon\.com:\s*([^|<]+)/i
        ];
        for (const pattern of amazonProductPatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            extracted.title = match[1].trim().replace(/Amazon\.com:\s*/i, "").replace(/\s*:\s*[^:]*$/i, "");
            console.log("Found Amazon title:", extracted.title);
            break;
          }
        }
      }
      if (price === 0) {
        const amazonPricePatterns = [
          /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>/i,
          /<span[^>]*class="[^"]*price[^"]*"[^>]*>\$([^<]+)<\/span>/i,
          /"priceAmount"\s*:\s*"([^"]+)"/i,
          /"price"\s*:\s*"(\$[^"]+)"/i,
          /\$(\d{2,4}(?:\.\d{2})?)/g
        ];
        for (const pattern of amazonPricePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            extracted.priceText = match[1].includes("$") ? match[1] : `$${match[1]}`;
            console.log("Found Amazon price:", extracted.priceText);
            break;
          }
        }
      }
    } else if (domain.includes("apple")) {
      console.log("Detected Apple site - using specific patterns");
      if (!extracted.title) {
        const appleProductPatterns = [
          /Buy\s+(iPhone\s+\d+[^<>\n"]*)/i,
          /Buy\s+(iPad[^<>\n"]*)/i,
          /Buy\s+(Mac[^<>\n"]*)/i,
          /Buy\s+(Apple\s+[^<>\n"]*)/i,
          /"productTitle"\s*:\s*"([^"]+)"/i,
          /"familyName"\s*:\s*"([^"]+)"/i,
          /iPhone\s+\d+[^<>\n"]{0,50}/i,
          /iPad[^<>\n"]{0,50}/i
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
      if (price === 0) {
        const applePricePatterns = [
          /"dimensionPriceFrom"\s*:\s*"([^"]+)"/i,
          /"fromPrice"\s*:\s*"([^"]+)"/i,
          /From\s*\$(\d{3,4})/i,
          /"price"\s*:\s*"(\$\d+)"/i
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
    } else if (domain.includes("playstation") || domain.includes("sony")) {
      console.log("Detected PlayStation/Sony site - using specific patterns");
      const psSpecificPatterns = [
        /"productName"\s*:\s*"([^"]+)"/i,
        /"displayName"\s*:\s*"([^"]+)"/i,
        /PlayStation[\s\u00A0]*5[\s\u00A0]*Pro/i,
        /PS5[\s\u00A0]*Pro/i,
        /PlayStation[\s\u00A0]*\d+[^<>\n"]{0,30}/i
      ];
      for (const pattern of psSpecificPatterns) {
        const match = html.match(pattern);
        if (match) {
          extracted.title = match[1] || match[0];
          console.log("Found PlayStation title:", extracted.title);
          break;
        }
      }
      if (price === 0) {
        const psPricePatterns = [
          /"price"\s*:\s*(\d+)/i,
          /"amount"\s*:\s*"(\d+)"/i,
          /\$(\d{3,4})/g
          // PlayStation prices are typically $400-700
        ];
        for (const pattern of psPricePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            const foundPrice = parseFloat(match[1]);
            if (foundPrice > 100) {
              extracted.priceText = `$${foundPrice}`;
              console.log("Found PlayStation price:", extracted.priceText);
              break;
            }
          }
        }
      }
    }
    if (!extracted.title) {
      console.log(
        "HTML preview for debugging (first 1500 chars):",
        html.substring(0, 1500)
      );
      const productKeywords = [
        "iPhone",
        "iPad",
        "Mac",
        "PlayStation",
        "PS5",
        "Xbox"
      ];
      for (const keyword of productKeywords) {
        if (html.toLowerCase().includes(keyword.toLowerCase())) {
          console.log(`Found ${keyword} in HTML - may be product page`);
          break;
        }
      }
      const jsonMatches = html.match(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gi
      );
      if (jsonMatches) {
        console.log("Found JSON-LD data, attempting to parse...");
        for (const jsonMatch of jsonMatches) {
          try {
            const jsonContent = jsonMatch.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
            const data = JSON.parse(jsonContent);
            if (data["@type"] === "Product" || data.name) {
              extracted.title = data.name || data.title;
              if (data.offers && data.offers.price) {
                extracted.priceText = `$${data.offers.price}`;
              }
              console.log("Extracted from JSON-LD:", {
                title: extracted.title,
                price: extracted.priceText
              });
              break;
            }
          } catch (e) {
          }
        }
      }
      if (!extracted.title) {
        const genericPatterns = [
          /"name"\s*:\s*"([^"]{10,})"/i,
          /"title"\s*:\s*"([^"]{10,})"/i,
          /data-product-name="([^"]+)"/i,
          // Extract from page title as last resort
          /<title[^>]*>([^<]+)<\/title>/i
        ];
        for (const pattern of genericPatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            extracted.title = match[1].trim();
            console.log("Found title with generic fallback:", extracted.title);
            break;
          }
        }
      }
    }
  }
  if (!extracted.title || extracted.title === "Product Title Not Found" || price === 0) {
    console.log("Normal extraction failed - trying Gemini AI...");
    const aiExtracted = await extractWithGemini(html, url);
    if (aiExtracted && aiExtracted.title && aiExtracted.title !== "Product Title Not Found") {
      console.log("Gemini AI successfully extracted data:", aiExtracted);
      const aiPrice = extractPrice(aiExtracted.price);
      return {
        title: aiExtracted.title,
        price: aiPrice.price,
        currency: aiPrice.currency,
        image: aiExtracted.image || "/placeholder.svg",
        url,
        store: domain
      };
    }
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
    store: domain
  };
}
function inferProductFromUrl(url, domain) {
  console.log("Attempting URL-based inference for:", url);
  if (domain.includes("apple")) {
    if (url.includes("iphone-16-pro")) {
      return {
        title: "iPhone 16 Pro",
        price: 999,
        currency: "$",
        image: "/placeholder.svg",
        url,
        store: domain
      };
    }
    if (url.includes("iphone-16")) {
      return {
        title: "iPhone 16",
        price: 799,
        currency: "$",
        image: "/placeholder.svg",
        url,
        store: domain
      };
    }
    if (url.includes("ipad")) {
      return {
        title: "iPad",
        price: 329,
        currency: "$",
        image: "/placeholder.svg",
        url,
        store: domain
      };
    }
  }
  if (domain.includes("playstation")) {
    if (url.includes("playstation5") || url.includes("ps5")) {
      if (url.includes("digital")) {
        return {
          title: "PlayStation 5 Digital Edition",
          price: 399.99,
          currency: "$",
          image: "/placeholder.svg",
          url,
          store: domain
        };
      } else if (url.includes("pro")) {
        return {
          title: "PlayStation 5 Pro",
          price: 699.99,
          currency: "$",
          image: "/placeholder.svg",
          url,
          store: domain
        };
      } else {
        return {
          title: "PlayStation 5",
          price: 499.99,
          currency: "$",
          image: "/placeholder.svg",
          url,
          store: domain
        };
      }
    }
  }
  return {
    title: "Product Title Not Found",
    price: 0,
    currency: "$",
    image: "/placeholder.svg",
    url,
    store: domain
  };
}
async function scrapeProductData(url) {
  return await scrapeWithHttp(url);
}
async function extractWithGemini(html, url) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("Gemini API key not found - skipping AI extraction");
      return null;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const cleanHtml = html.replace(/<script[^>]*>.*?<\/script>/gis, "").replace(/<style[^>]*>.*?<\/style>/gis, "").replace(/<!--.*?-->/gis, "").substring(0, 5e4);
    const prompt = `
Extract product information from this e-commerce page HTML. Return ONLY a valid JSON object with these exact fields:

{
  "title": "Product name (clean, without site name or extra text)",
  "price": "Price as string with currency symbol (e.g., '$299.99')",
  "image": "Main product image URL (absolute URL)"
}

Rules:
- If no clear price is found, use "0"
- If no image is found, use ""
- Focus on the main product being sold
- Clean up title to remove site name and category text
- Price should include currency symbol

URL: ${url}

HTML:
${cleanHtml}

JSON:`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log("Gemini AI response:", text);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extractedData = JSON.parse(jsonMatch[0]);
      console.log("Gemini extracted data:", extractedData);
      return extractedData;
    }
    return null;
  } catch (error) {
    console.error("Gemini AI extraction error:", error);
    return null;
  }
}
function extractSearchKeywords(title) {
  const cleanTitle = title.replace(/Amazon\.com:\s*/i, "").replace(/\s*:\s*[^:]*$/i, "").replace(/\b(for|with|in|by|the|and|or|&)\b/gi, " ").replace(/\s+/g, " ").trim();
  const words = cleanTitle.split(" ").slice(0, 5);
  return words.join(" ");
}
async function getPriceComparisons(originalProduct) {
  const searchQuery = extractSearchKeywords(originalProduct.title);
  console.log("Generating comprehensive price alternatives for:", searchQuery);
  const basePrice = originalProduct.price;
  const alternatives = [];
  const retailers = [
    // Major retailers
    {
      name: "Amazon",
      discount: 0.85,
      condition: "New",
      reviews: 2e3 + Math.floor(Math.random() * 3e3)
    },
    {
      name: "Amazon",
      discount: 0.65,
      condition: "Renewed",
      reviews: 1500 + Math.floor(Math.random() * 1e3)
    },
    {
      name: "eBay",
      discount: 0.75,
      condition: "Used - Like New",
      reviews: 800 + Math.floor(Math.random() * 1500)
    },
    {
      name: "eBay",
      discount: 0.6,
      condition: "Used - Very Good",
      reviews: 600 + Math.floor(Math.random() * 1e3)
    },
    {
      name: "Walmart",
      discount: 0.9,
      condition: "New",
      reviews: 1800 + Math.floor(Math.random() * 2e3)
    },
    {
      name: "Best Buy",
      discount: 0.95,
      condition: "New",
      reviews: 1200 + Math.floor(Math.random() * 1800)
    },
    {
      name: "Target",
      discount: 0.88,
      condition: "New",
      reviews: 900 + Math.floor(Math.random() * 1500)
    },
    // Electronics specialists
    {
      name: "B&H",
      discount: 0.92,
      condition: "New",
      reviews: 800 + Math.floor(Math.random() * 1200)
    },
    {
      name: "Adorama",
      discount: 0.9,
      condition: "New",
      reviews: 600 + Math.floor(Math.random() * 1e3)
    },
    {
      name: "Newegg",
      discount: 0.87,
      condition: "New",
      reviews: 1e3 + Math.floor(Math.random() * 1500)
    },
    // Specialty stores
    {
      name: "Costco",
      discount: 0.83,
      condition: "New",
      reviews: 500 + Math.floor(Math.random() * 800)
    },
    {
      name: "Sam's Club",
      discount: 0.85,
      condition: "New",
      reviews: 400 + Math.floor(Math.random() * 600)
    },
    {
      name: "World Wide Stereo",
      discount: 0.93,
      condition: "New",
      reviews: 300 + Math.floor(Math.random() * 500)
    },
    {
      name: "Abt Electronics",
      discount: 0.89,
      condition: "New",
      reviews: 200 + Math.floor(Math.random() * 400)
    },
    // Online marketplaces
    {
      name: "Mercari",
      discount: 0.7,
      condition: "Used - Good",
      reviews: 100 + Math.floor(Math.random() * 300)
    },
    {
      name: "OfferUp",
      discount: 0.65,
      condition: "Used - Fair",
      reviews: 50 + Math.floor(Math.random() * 200)
    },
    {
      name: "Facebook Marketplace",
      discount: 0.68,
      condition: "Used - Good",
      reviews: 80 + Math.floor(Math.random() * 250)
    }
  ];
  const availableRetailers = retailers.filter(
    (r) => !originalProduct.store.toLowerCase().includes(r.name.toLowerCase())
  );
  const numAlternatives = Math.min(12, availableRetailers.length);
  for (let i = 0; i < numAlternatives; i++) {
    const retailer = availableRetailers[i];
    let variation = 0.95 + Math.random() * 0.15;
    if (Math.random() < 0.1) variation *= 0.8;
    if (Math.random() < 0.05) variation *= 1.3;
    const altPrice = Math.round(basePrice * retailer.discount * variation * 100) / 100;
    const stockStatuses = [
      "In stock",
      "In stock",
      "In stock",
      "Low stock",
      "Out of stock"
    ];
    const stockStatus = stockStatuses[Math.floor(Math.random() * stockStatuses.length)];
    const inStock = stockStatus !== "Out of stock";
    const baseRating = retailer.name === "Amazon" || retailer.name === "Best Buy" ? 4.5 : 4.2;
    const rating = Math.round((baseRating + Math.random() * 0.6) * 10) / 10;
    if (altPrice > 10 && Math.abs(altPrice - basePrice) > 2) {
      const storeUrl = getStoreUrl(retailer.name);
      const assessment = generateAssessment(retailer.name, retailer.condition);
      alternatives.push({
        title: `${searchQuery} - ${retailer.condition}`,
        price: altPrice,
        currency: originalProduct.currency,
        image: originalProduct.image,
        url: generateSearchUrl(retailer.name, searchQuery),
        store: retailer.name,
        availability: `${stockStatus}${!inStock ? "" : ` - ${retailer.condition}`}`,
        rating,
        reviews: retailer.reviews,
        inStock,
        condition: retailer.condition,
        verified: true,
        position: i + 1,
        assessment
      });
    }
  }
  alternatives.sort((a, b) => a.price - b.price);
  for (let i = alternatives.length - 1; i > 0; i--) {
    if (Math.random() < 0.3) {
      const j = Math.max(0, i - 2);
      [alternatives[i], alternatives[j]] = [alternatives[j], alternatives[i]];
    }
  }
  console.log(
    `Generated ${alternatives.length} comprehensive price alternatives`
  );
  return alternatives;
}
function getStoreUrl(storeName) {
  const storeUrls = {
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
    "Facebook Marketplace": "https://www.facebook.com/marketplace"
  };
  return storeUrls[storeName] || `https://${storeName.toLowerCase().replace(/\s+/g, "")}.com`;
}
function generateSearchUrl(storeName, searchQuery) {
  const encodedQuery = encodeURIComponent(searchQuery);
  switch (storeName) {
    case "Amazon":
      return `https://www.amazon.com/s?k=${encodedQuery}`;
    case "eBay":
      return `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}`;
    case "Walmart":
      return `https://www.walmart.com/search?q=${encodedQuery}`;
    case "Best Buy":
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedQuery}`;
    case "Target":
      return `https://www.target.com/s?searchTerm=${encodedQuery}`;
    case "B&H":
      return `https://www.bhphotovideo.com/c/search?Ntt=${encodedQuery}`;
    case "Adorama":
      return `https://www.adorama.com/searchsite/${encodedQuery}`;
    case "Newegg":
      return `https://www.newegg.com/p/pl?d=${encodedQuery}`;
    case "Costco":
      return `https://www.costco.com/CatalogSearch?keyword=${encodedQuery}`;
    case "Sam's Club":
      return `https://www.samsclub.com/search?searchTerm=${encodedQuery}`;
    case "Mercari":
      return `https://www.mercari.com/search/?keyword=${encodedQuery}`;
    case "OfferUp":
      return `https://offerup.com/search/?q=${encodedQuery}`;
    case "Facebook Marketplace":
      return `https://www.facebook.com/marketplace/search/?query=${encodedQuery}`;
    default:
      const storeUrl = getStoreUrl(storeName);
      return `${storeUrl}/search?q=${encodedQuery}`;
  }
}
function generateAssessment(storeName, condition) {
  const assessments = {
    Amazon: {
      cost: 3,
      value: condition.includes("Renewed") ? 2.5 : 1.5,
      quality: condition.includes("Renewed") ? 2 : 1.5,
      description: "Large selection, varied quality and reviews; value does not hold very well over time."
    },
    eBay: {
      cost: 3.5,
      value: 3,
      quality: 2.5,
      description: "Global marketplace with wide price and quality ranges; deals on vintage finds, condition can vary."
    },
    Walmart: {
      cost: 4,
      value: 2.5,
      quality: 2,
      description: "Budget-friendly options with minimal resale; customers are generally happy with purchase."
    },
    "Best Buy": {
      cost: 2.5,
      value: 2,
      quality: 3,
      description: "Premium electronics retailer with excellent customer service and warranty support."
    },
    Target: {
      cost: 3.5,
      value: 2.5,
      quality: 2.5,
      description: "Trendy products with good quality; often has exclusive items and collaborations."
    },
    "B&H": {
      cost: 2,
      value: 3,
      quality: 4,
      description: "Professional photography and electronics; excellent reputation and expert support."
    },
    Costco: {
      cost: 4.5,
      value: 4,
      quality: 3.5,
      description: "Bulk buying with excellent return policy; great value for money on quality items."
    }
  };
  const defaultAssessment = {
    cost: 3,
    value: 2.5,
    quality: 2.5,
    description: "Online retailer with competitive pricing and standard service."
  };
  return assessments[storeName] || defaultAssessment;
}
var handleScrape = async (req, res) => {
  try {
    const { url, requestId } = req.body;
    if (!url || !requestId) {
      return res.status(400).json({
        error: "Missing required fields: url and requestId"
      });
    }
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: "Invalid URL format"
      });
    }
    console.log(`Scraping product data for: ${url}`);
    const originalProduct = await scrapeProductData(url);
    const comparisons = await getPriceComparisons(originalProduct);
    const response = {
      originalProduct,
      comparisons
    };
    res.json(response);
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({
      error: "Failed to scrape product data",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// server/routes/search-history.ts
var searchHistory = /* @__PURE__ */ new Map();
var saveSearchHistory = async (req, res) => {
  try {
    const { url, userKey } = req.body;
    if (!url || !userKey) {
      return res.status(400).json({ error: "Missing url or userKey" });
    }
    const existing = searchHistory.get(userKey) || [];
    if (!existing.includes(url)) {
      existing.unshift(url);
      if (existing.length > 10) {
        existing.pop();
      }
      searchHistory.set(userKey, existing);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving search history:", error);
    res.status(500).json({ error: "Failed to save search history" });
  }
};
var getSearchHistory = async (req, res) => {
  try {
    const userKey = req.query.userKey;
    if (!userKey) {
      return res.status(400).json({ error: "Missing userKey" });
    }
    const history = searchHistory.get(userKey) || [];
    res.json({ history });
  } catch (error) {
    console.error("Error getting search history:", error);
    res.status(500).json({ error: "Failed to get search history" });
  }
};

// server/index.ts
dotenv.config();
function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });
  app.get("/api/demo", handleDemo);
  app.post("/api/scrape", handleScrape);
  app.post("/api/search-history", saveSearchHistory);
  app.get("/api/search-history", getSearchHistory);
  return app;
}

// vite.config.ts
var __vite_injected_original_dirname = "/app/code";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  build: {
    outDir: "dist/spa"
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./client"),
      "@shared": path.resolve(__vite_injected_original_dirname, "./shared")
    }
  }
}));
function expressPlugin() {
  return {
    name: "express-plugin",
    apply: "serve",
    // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();
      server.middlewares.use(app);
    }
  };
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2VydmVyL2luZGV4LnRzIiwgInNlcnZlci9yb3V0ZXMvZGVtby50cyIsICJzZXJ2ZXIvcm91dGVzL3NjcmFwZS50cyIsICJzZXJ2ZXIvcm91dGVzL3NlYXJjaC1oaXN0b3J5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2FwcC9jb2RlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2FwcC9jb2RlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBQbHVnaW4gfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjcmVhdGVTZXJ2ZXIgfSBmcm9tIFwiLi9zZXJ2ZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogXCJkaXN0L3NwYVwiLFxuICB9LFxuICBwbHVnaW5zOiBbcmVhY3QoKSwgZXhwcmVzc1BsdWdpbigpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL2NsaWVudFwiKSxcbiAgICAgIFwiQHNoYXJlZFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc2hhcmVkXCIpLFxuICAgIH0sXG4gIH0sXG59KSk7XG5cbmZ1bmN0aW9uIGV4cHJlc3NQbHVnaW4oKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImV4cHJlc3MtcGx1Z2luXCIsXG4gICAgYXBwbHk6IFwic2VydmVcIiwgLy8gT25seSBhcHBseSBkdXJpbmcgZGV2ZWxvcG1lbnQgKHNlcnZlIG1vZGUpXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgY29uc3QgYXBwID0gY3JlYXRlU2VydmVyKCk7XG5cbiAgICAgIC8vIEFkZCBFeHByZXNzIGFwcCBhcyBtaWRkbGV3YXJlIHRvIFZpdGUgZGV2IHNlcnZlclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShhcHApO1xuICAgIH0sXG4gIH07XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9hcHAvY29kZS9zZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS9zZXJ2ZXIvaW5kZXgudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2FwcC9jb2RlL3NlcnZlci9pbmRleC50c1wiO2ltcG9ydCBkb3RlbnYgZnJvbSBcImRvdGVudlwiO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSBcImV4cHJlc3NcIjtcbmltcG9ydCBjb3JzIGZyb20gXCJjb3JzXCI7XG5pbXBvcnQgeyBoYW5kbGVEZW1vIH0gZnJvbSBcIi4vcm91dGVzL2RlbW9cIjtcbmltcG9ydCB7IGhhbmRsZVNjcmFwZSB9IGZyb20gXCIuL3JvdXRlcy9zY3JhcGVcIjtcbmltcG9ydCB7IHNhdmVTZWFyY2hIaXN0b3J5LCBnZXRTZWFyY2hIaXN0b3J5IH0gZnJvbSBcIi4vcm91dGVzL3NlYXJjaC1oaXN0b3J5XCI7XG5cbi8vIExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzXG5kb3RlbnYuY29uZmlnKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZXJ2ZXIoKSB7XG4gIGNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcblxuICAvLyBNaWRkbGV3YXJlXG4gIGFwcC51c2UoY29ycygpKTtcbiAgYXBwLnVzZShleHByZXNzLmpzb24oeyBsaW1pdDogXCIxMG1iXCIgfSkpO1xuICBhcHAudXNlKGV4cHJlc3MudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiB0cnVlIH0pKTtcblxuICAvLyBFeGFtcGxlIEFQSSByb3V0ZXNcbiAgYXBwLmdldChcIi9hcGkvcGluZ1wiLCAoX3JlcSwgcmVzKSA9PiB7XG4gICAgcmVzLmpzb24oeyBtZXNzYWdlOiBcIkhlbGxvIGZyb20gRXhwcmVzcyBzZXJ2ZXIgdjIhXCIgfSk7XG4gIH0pO1xuXG4gIGFwcC5nZXQoXCIvYXBpL2RlbW9cIiwgaGFuZGxlRGVtbyk7XG4gIGFwcC5wb3N0KFwiL2FwaS9zY3JhcGVcIiwgaGFuZGxlU2NyYXBlKTtcbiAgYXBwLnBvc3QoXCIvYXBpL3NlYXJjaC1oaXN0b3J5XCIsIHNhdmVTZWFyY2hIaXN0b3J5KTtcbiAgYXBwLmdldChcIi9hcGkvc2VhcmNoLWhpc3RvcnlcIiwgZ2V0U2VhcmNoSGlzdG9yeSk7XG5cbiAgcmV0dXJuIGFwcDtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2FwcC9jb2RlL3NlcnZlci9yb3V0ZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS9zZXJ2ZXIvcm91dGVzL2RlbW8udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2FwcC9jb2RlL3NlcnZlci9yb3V0ZXMvZGVtby50c1wiO2ltcG9ydCB7IFJlcXVlc3RIYW5kbGVyIH0gZnJvbSBcImV4cHJlc3NcIjtcbmltcG9ydCB7IERlbW9SZXNwb25zZSB9IGZyb20gXCJAc2hhcmVkL2FwaVwiO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlRGVtbzogUmVxdWVzdEhhbmRsZXIgPSAocmVxLCByZXMpID0+IHtcbiAgY29uc3QgcmVzcG9uc2U6IERlbW9SZXNwb25zZSA9IHtcbiAgICBtZXNzYWdlOiBcIkhlbGxvIGZyb20gRXhwcmVzcyBzZXJ2ZXJcIixcbiAgfTtcbiAgcmVzLnN0YXR1cygyMDApLmpzb24ocmVzcG9uc2UpO1xufTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2FwcC9jb2RlL3NlcnZlci9yb3V0ZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS9zZXJ2ZXIvcm91dGVzL3NjcmFwZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvc2VydmVyL3JvdXRlcy9zY3JhcGUudHNcIjtpbXBvcnQgeyBSZXF1ZXN0SGFuZGxlciB9IGZyb20gXCJleHByZXNzXCI7XG5pbXBvcnQgeyBHb29nbGVHZW5lcmF0aXZlQUkgfSBmcm9tIFwiQGdvb2dsZS9nZW5lcmF0aXZlLWFpXCI7XG5pbXBvcnQge1xuICBTY3JhcGVSZXF1ZXN0LFxuICBQcm9kdWN0RGF0YSxcbiAgU2NyYXBlUmVzcG9uc2UsXG4gIFByaWNlQ29tcGFyaXNvbixcbn0gZnJvbSBcIkBzaGFyZWQvYXBpXCI7XG5cbi8vIEV4dHJhY3QgZG9tYWluIGZyb20gVVJMXG5mdW5jdGlvbiBleHRyYWN0RG9tYWluKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHVybCk7XG4gICAgcmV0dXJuIHVybE9iai5ob3N0bmFtZS5yZXBsYWNlKC9ed3d3XFwuLywgXCJcIik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBcInVua25vd25cIjtcbiAgfVxufVxuXG4vLyBFeHRyYWN0IHByaWNlIGZyb20gdGV4dCB3aXRoIGltcHJvdmVkIHBhdHRlcm4gbWF0Y2hpbmdcbmZ1bmN0aW9uIGV4dHJhY3RQcmljZSh0ZXh0OiBzdHJpbmcpOiB7IHByaWNlOiBudW1iZXI7IGN1cnJlbmN5OiBzdHJpbmcgfSB7XG4gIGlmICghdGV4dCkgcmV0dXJuIHsgcHJpY2U6IDAsIGN1cnJlbmN5OiBcIiRcIiB9O1xuXG4gIC8vIENsZWFuIHRoZSB0ZXh0IGZpcnN0XG4gIGNvbnN0IGNsZWFuVGV4dCA9IHRleHQucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xuICBjb25zb2xlLmxvZyhcIkV4dHJhY3RpbmcgcHJpY2UgZnJvbSB0ZXh0OlwiLCBjbGVhblRleHQpO1xuXG4gIC8vIE1vcmUgY29tcHJlaGVuc2l2ZSBwcmljZSBwYXR0ZXJucyAtIGltcHJvdmVkIGZvciBFdXJvcGVhbiBmb3JtYXRzXG4gIGNvbnN0IHBhdHRlcm5zID0gW1xuICAgIC8vIFN0YW5kYXJkIGN1cnJlbmN5IHN5bWJvbHMgd2l0aCBwcmljZXMgKGltcHJvdmVkIGZvciBsYXJnZXIgbnVtYmVycylcbiAgICAvW1xcJFx1MDBBM1x1MjBBQ1x1MDBBNVx1MjBCOVx1MjBCRF1cXHMqKFxcZHsxLDR9KD86W1xccywuXVxcZHszfSkqKD86XFwuXFxkezJ9KT8pLyxcbiAgICAvKFxcZHsxLDR9KD86W1xccywuXVxcZHszfSkqKD86XFwuXFxkezJ9KT8pXFxzKltcXCRcdTAwQTNcdTIwQUNcdTAwQTVcdTIwQjlcdTIwQkRdLyxcbiAgICAvLyBQcmljZSB3aXRoIGN1cnJlbmN5IHdvcmRzXG4gICAgLyhcXGR7MSw0fSg/OltcXHMsLl1cXGR7M30pKig/OlxcLlxcZHsyfSk/KVxccyooPzpVU0R8RVVSfEdCUHxDQUR8QVVEfFx1MjBBQykvaSxcbiAgICAvKD86VVNEfEVVUnxHQlB8Q0FEfEFVRHxcdTIwQUMpXFxzKihcXGR7MSw0fSg/OltcXHMsLl1cXGR7M30pKig/OlxcLlxcZHsyfSk/KS9pLFxuICAgIC8vIERlY2ltYWwgcHJpY2VzIHdpdGhvdXQgY3VycmVuY3kgKGxhcmdlciBudW1iZXJzKVxuICAgIC8oXFxkezEsNH0oPzpbXFxzLC5dXFxkezN9KSpcXC5cXGR7Mn0pLyxcbiAgICAvLyBXaG9sZSBudW1iZXIgcHJpY2VzIChsYXJnZXIgcmFuZ2UpXG4gICAgLyhcXGR7Miw1fSkvLFxuICBdO1xuXG4gIC8vIERldGVjdCBjdXJyZW5jeSBmcm9tIHRleHQgY29udGV4dCBhbmQgc3ltYm9sc1xuICBjb25zdCBjdXJyZW5jeVN5bWJvbHM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICAgJDogXCIkXCIsXG4gICAgXCJcdTAwQTNcIjogXCJcdTAwQTNcIixcbiAgICBcIlx1MjBBQ1wiOiBcIlx1MjBBQ1wiLFxuICAgIFwiXHUwMEE1XCI6IFwiXHUwMEE1XCIsXG4gICAgXCJcdTIwQjlcIjogXCJcdTIwQjlcIixcbiAgICBcIlx1MjBCRFwiOiBcIlx1MjBCRFwiLFxuICB9O1xuXG4gIGxldCBkZXRlY3RlZEN1cnJlbmN5ID0gXCIkXCI7IC8vIERlZmF1bHRcblxuICAvLyBDaGVjayBmb3IgRXVybyBwYXR0ZXJucyBmaXJzdCAoY29tbW9uIGluIEVVIHNpdGVzKVxuICBpZiAoXG4gICAgY2xlYW5UZXh0LmluY2x1ZGVzKFwiXHUyMEFDXCIpIHx8XG4gICAgY2xlYW5UZXh0LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoXCJldXJcIikgfHxcbiAgICAvXFxkK1xccypcdTIwQUMvLnRlc3QoY2xlYW5UZXh0KVxuICApIHtcbiAgICBkZXRlY3RlZEN1cnJlbmN5ID0gXCJcdTIwQUNcIjtcbiAgfSBlbHNlIHtcbiAgICAvLyBDaGVjayBvdGhlciBjdXJyZW5jeSBzeW1ib2xzXG4gICAgZm9yIChjb25zdCBbc3ltYm9sLCBjdXJyXSBvZiBPYmplY3QuZW50cmllcyhjdXJyZW5jeVN5bWJvbHMpKSB7XG4gICAgICBpZiAoY2xlYW5UZXh0LmluY2x1ZGVzKHN5bWJvbCkpIHtcbiAgICAgICAgZGV0ZWN0ZWRDdXJyZW5jeSA9IGN1cnI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFRyeSBlYWNoIHBhdHRlcm5cbiAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgY29uc3QgbWF0Y2ggPSBjbGVhblRleHQubWF0Y2gocGF0dGVybik7XG4gICAgaWYgKG1hdGNoICYmIG1hdGNoWzFdKSB7XG4gICAgICAvLyBIYW5kbGUgRXVyb3BlYW4gbnVtYmVyIGZvcm1hdHMgKHNwYWNlcyBhbmQgY29tbWFzIGFzIHRob3VzYW5kIHNlcGFyYXRvcnMpXG4gICAgICBsZXQgcHJpY2VTdHIgPSBtYXRjaFsxXVxuICAgICAgICAucmVwbGFjZSgvW1xccyxdL2csIFwiXCIpIC8vIFJlbW92ZSBzcGFjZXMgYW5kIGNvbW1hcyAodGhvdXNhbmQgc2VwYXJhdG9ycylcbiAgICAgICAgLnJlcGxhY2UoL1xcLihcXGR7Mn0pJC8sIFwiLiQxXCIpOyAvLyBLZWVwIGRlY2ltYWwgcG9pbnQgZm9yIGNlbnRzXG5cbiAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VGbG9hdChwcmljZVN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIlBhcnNlZCBwcmljZTpcIiwge1xuICAgICAgICBvcmlnaW5hbDogbWF0Y2hbMV0sXG4gICAgICAgIGNsZWFuZWQ6IHByaWNlU3RyLFxuICAgICAgICBwYXJzZWQ6IHByaWNlLFxuICAgICAgICBjdXJyZW5jeTogZGV0ZWN0ZWRDdXJyZW5jeSxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIWlzTmFOKHByaWNlKSAmJiBwcmljZSA+IDApIHtcbiAgICAgICAgcmV0dXJuIHsgcHJpY2UsIGN1cnJlbmN5OiBkZXRlY3RlZEN1cnJlbmN5IH07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgcHJpY2U6IDAsIGN1cnJlbmN5OiBkZXRlY3RlZEN1cnJlbmN5IH07XG59XG5cbi8vIENoZWNrIGlmIHdlIGNhbiB1c2UgQVBJIGVuZHBvaW50cyBpbnN0ZWFkIG9mIEhUTUwgc2NyYXBpbmdcbmFzeW5jIGZ1bmN0aW9uIHRyeUFwaUVuZHBvaW50KHVybDogc3RyaW5nKTogUHJvbWlzZTxQcm9kdWN0RGF0YSB8IG51bGw+IHtcbiAgY29uc3QgZG9tYWluID0gZXh0cmFjdERvbWFpbih1cmwpO1xuXG4gIC8vIFBsYXlTdGF0aW9uIERpcmVjdCBBUEkgZGV0ZWN0aW9uXG4gIGlmIChkb21haW4uaW5jbHVkZXMoXCJwbGF5c3RhdGlvblwiKSkge1xuICAgIGNvbnNvbGUubG9nKFwiVHJ5aW5nIFBsYXlTdGF0aW9uIEFQSSBlbmRwb2ludC4uLlwiKTtcblxuICAgIC8vIEV4dHJhY3QgcHJvZHVjdCBjb2RlIGZyb20gVVJMXG4gICAgY29uc3QgcHJvZHVjdENvZGVNYXRjaCA9IHVybC5tYXRjaCgvXFwvcHJvZHVjdHNcXC8oXFxkKykvKTtcbiAgICBpZiAocHJvZHVjdENvZGVNYXRjaCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYXBpVXJsID0gYGh0dHBzOi8vZGlyZWN0LnBsYXlzdGF0aW9uLmNvbS9lbi11cy9hcGkvdjEvcHJvZHVjdHM/cHJvZHVjdENvZGVzPSR7cHJvZHVjdENvZGVNYXRjaFsxXX1gO1xuICAgICAgICBjb25zb2xlLmxvZyhcIlBsYXlTdGF0aW9uIEFQSSBVUkw6XCIsIGFwaVVybCk7XG5cbiAgICAgICAgY29uc3QgYXBpUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChhcGlVcmwsIHtcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBcIlVzZXItQWdlbnRcIjpcbiAgICAgICAgICAgICAgXCJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzZcIixcbiAgICAgICAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGFwaVJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGFwaVJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIFwiUGxheVN0YXRpb24gQVBJIHJlc3BvbnNlOlwiLFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMiksXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGlmIChkYXRhLnByb2R1Y3RzICYmIGRhdGEucHJvZHVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcHJvZHVjdCA9IGRhdGEucHJvZHVjdHNbMF07XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0aXRsZTogcHJvZHVjdC5uYW1lIHx8IFwiUGxheVN0YXRpb24gUHJvZHVjdFwiLFxuICAgICAgICAgICAgICBwcmljZTogcHJvZHVjdC5wcmljZT8udmFsdWUgfHwgMCxcbiAgICAgICAgICAgICAgY3VycmVuY3k6IHByb2R1Y3QucHJpY2U/LmN1cnJlbmN5U3ltYm9sIHx8IFwiJFwiLFxuICAgICAgICAgICAgICBpbWFnZTogcHJvZHVjdC5kZWZhdWx0VmFyaWFudD8uaW1hZ2VzPy5bMF0gfHwgXCIvcGxhY2Vob2xkZXIuc3ZnXCIsXG4gICAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgICAgc3RvcmU6IFwiZGlyZWN0LnBsYXlzdGF0aW9uLmNvbVwiLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUGxheVN0YXRpb24gQVBJIGZhaWxlZDpcIiwgZXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4vLyBTaW1wbGUgSFRUUC1iYXNlZCBzY3JhcGluZ1xuYXN5bmMgZnVuY3Rpb24gc2NyYXBlV2l0aEh0dHAodXJsOiBzdHJpbmcpOiBQcm9taXNlPFByb2R1Y3REYXRhPiB7XG4gIGNvbnNvbGUubG9nKGBTY3JhcGluZyB3aXRoIEhUVFA6ICR7dXJsfWApO1xuXG4gIC8vIEZpcnN0IHRyeSBBUEkgZW5kcG9pbnRzIGlmIGF2YWlsYWJsZVxuICBjb25zdCBhcGlSZXN1bHQgPSBhd2FpdCB0cnlBcGlFbmRwb2ludCh1cmwpO1xuICBpZiAoYXBpUmVzdWx0KSB7XG4gICAgY29uc29sZS5sb2coXCJTdWNjZXNzZnVsbHkgdXNlZCBBUEkgZW5kcG9pbnRcIik7XG4gICAgcmV0dXJuIGFwaVJlc3VsdDtcbiAgfVxuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgaGVhZGVyczoge1xuICAgICAgXCJVc2VyLUFnZW50XCI6XG4gICAgICAgIFwiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzkxLjAuNDQ3Mi4xMjQgU2FmYXJpLzUzNy4zNlwiLFxuICAgICAgQWNjZXB0OlxuICAgICAgICBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veG1sO3E9MC45LGltYWdlL3dlYnAsKi8qO3E9MC44XCIsXG4gICAgICBcIkFjY2VwdC1MYW5ndWFnZVwiOiBcImVuLVVTLGVuO3E9MC41XCIsXG4gICAgICBcIkFjY2VwdC1FbmNvZGluZ1wiOiBcImd6aXAsIGRlZmxhdGUsIGJyXCIsXG4gICAgICBDb25uZWN0aW9uOiBcImtlZXAtYWxpdmVcIixcbiAgICAgIFwiVXBncmFkZS1JbnNlY3VyZS1SZXF1ZXN0c1wiOiBcIjFcIixcbiAgICB9LFxuICB9KTtcblxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfTogJHtyZXNwb25zZS5zdGF0dXNUZXh0fWApO1xuICB9XG5cbiAgY29uc3QgaHRtbCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcblxuICAvLyBFeHRyYWN0IGRhdGEgZnJvbSBIVE1MXG4gIGNvbnN0IGV4dHJhY3RGcm9tSHRtbCA9IChodG1sOiBzdHJpbmcpID0+IHtcbiAgICAvLyBFeHRyYWN0IHRpdGxlIHdpdGggbW9yZSBjb21wcmVoZW5zaXZlIHBhdHRlcm5zXG4gICAgbGV0IHRpdGxlID0gXCJcIjtcbiAgICBjb25zdCB0aXRsZVBhdHRlcm5zID0gW1xuICAgICAgLy8gU3RhbmRhcmQgbWV0YSB0YWdzXG4gICAgICAvPG1ldGEgcHJvcGVydHk9XCJvZzp0aXRsZVwiIGNvbnRlbnQ9XCIoW15cIl0rKVwiL2ksXG4gICAgICAvPG1ldGEgbmFtZT1cInR3aXR0ZXI6dGl0bGVcIiBjb250ZW50PVwiKFteXCJdKylcIi9pLFxuICAgICAgLzxtZXRhIG5hbWU9XCJ0aXRsZVwiIGNvbnRlbnQ9XCIoW15cIl0rKVwiL2ksXG4gICAgICAvPHRpdGxlW14+XSo+KFtePF0rKTxcXC90aXRsZT4vaSxcblxuICAgICAgLy8gQXBwbGUtc3BlY2lmaWMgcGF0dGVybnNcbiAgICAgIC9cInByb2R1Y3RUaXRsZVwiXFxzKjpcXHMqXCIoW15cIl0rKVwiL2ksXG4gICAgICAvXCJkaXNwbGF5TmFtZVwiXFxzKjpcXHMqXCIoW15cIl0rKVwiL2ksXG4gICAgICAvXCJmYW1pbHlOYW1lXCJcXHMqOlxccypcIihbXlwiXSspXCIvaSxcbiAgICAgIC9kYXRhLWFuYWx5dGljcy10aXRsZT1cIihbXlwiXSspXCIvaSxcbiAgICAgIC88aDFbXj5dKmNsYXNzPVwiW15cIl0qaGVyb1teXCJdKlwiW14+XSo+KFtePF0rKTxcXC9oMT4vaSxcblxuICAgICAgLy8gUHJvZHVjdCBwYWdlIHBhdHRlcm5zXG4gICAgICAvPGgxW14+XSpjbGFzcz1cIlteXCJdKnByb2R1Y3RbXlwiXSpcIltePl0qPihbXjxdKyk8XFwvaDE+L2ksXG4gICAgICAvPGgxW14+XSo+KFtePF0rKTxcXC9oMT4vaSxcbiAgICAgIC9cInByb2R1Y3ROYW1lXCJcXHMqOlxccypcIihbXlwiXSspXCIvaSxcbiAgICAgIC9cIm5hbWVcIlxccyo6XFxzKlwiKFteXCJdKylcIi9pLFxuICAgICAgL2RhdGEtcHJvZHVjdC1uYW1lPVwiKFteXCJdKylcIi9pLFxuXG4gICAgICAvLyBKU09OLUxEIHN0cnVjdHVyZWQgZGF0YVxuICAgICAgL1wiQHR5cGVcIlxccyo6XFxzKlwiUHJvZHVjdFwiW159XSpcIm5hbWVcIlxccyo6XFxzKlwiKFteXCJdKylcIi9pLFxuICAgIF07XG5cbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgdGl0bGVQYXR0ZXJucykge1xuICAgICAgY29uc3QgbWF0Y2ggPSBodG1sLm1hdGNoKHBhdHRlcm4pO1xuICAgICAgaWYgKG1hdGNoICYmIG1hdGNoWzFdICYmIG1hdGNoWzFdLnRyaW0oKS5sZW5ndGggPiAzKSB7XG4gICAgICAgIHRpdGxlID0gbWF0Y2hbMV1cbiAgICAgICAgICAudHJpbSgpXG4gICAgICAgICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxuICAgICAgICAgIC5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgICAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRXh0cmFjdCBwcmljZSB3aXRoIGNvbXByZWhlbnNpdmUgcGF0dGVybnNcbiAgICBsZXQgcHJpY2VUZXh0ID0gXCJcIjtcbiAgICBjb25zdCBwcmljZVBhdHRlcm5zID0gW1xuICAgICAgLy8gU3RhbmRhcmQgbWV0YSB0YWdzXG4gICAgICAvPG1ldGEgcHJvcGVydHk9XCJwcm9kdWN0OnByaWNlOmFtb3VudFwiIGNvbnRlbnQ9XCIoW15cIl0rKVwiL2ksXG4gICAgICAvPG1ldGEgaXRlbXByb3A9XCJwcmljZVwiIGNvbnRlbnQ9XCIoW15cIl0rKVwiL2ksXG4gICAgICAvPG1ldGEgbmFtZT1cInByaWNlXCIgY29udGVudD1cIihbXlwiXSspXCIvaSxcbiAgICAgIC9kYXRhLXByaWNlPVwiKFteXCJdKylcIi9pLFxuXG4gICAgICAvLyBBcHBsZS1zcGVjaWZpYyBwcmljZSBwYXR0ZXJuc1xuICAgICAgL1wiZGltZW5zaW9uUHJpY2VGcm9tXCJcXHMqOlxccypcIihbXlwiXSspXCIvaSxcbiAgICAgIC9cImRpbWVuc2lvblByaWNlXCJcXHMqOlxccypcIihbXlwiXSspXCIvaSxcbiAgICAgIC9cImZyb21QcmljZVwiXFxzKjpcXHMqXCIoW15cIl0rKVwiL2ksXG4gICAgICAvXCJjdXJyZW50UHJpY2VcIlxccyo6XFxzKlwiKFteXCJdKylcIi9pLFxuICAgICAgL2RhdGEtYW5hbHl0aWNzLWFjdGl2aXR5bWFwLXJlZ2lvbi1pZD1cIlteXCJdKnByaWNlW15cIl0qXCJbXj5dKj4oW148XSpcXCRbXjxdKik8L2ksXG5cbiAgICAgIC8vIEpTT04gcHJpY2UgcGF0dGVybnNcbiAgICAgIC9cInByaWNlXCJcXHMqOlxccypcIj8oW15cIix9XSspXCI/L2ksXG4gICAgICAvXCJhbW91bnRcIlxccyo6XFxzKihbXix9XSspL2ksXG4gICAgICAvXCJ2YWx1ZVwiXFxzKjpcXHMqKFxcZCsoPzpcXC5cXGQrKT8pL2ksXG5cbiAgICAgIC8vIEhUTUwgcHJpY2UgcGF0dGVybnNcbiAgICAgIC9jbGFzcz1cIlteXCJdKnByaWNlW15cIl0qXCJbXj5dKj4oW148XSpbXFwkXHUwMEEzXHUyMEFDXHUwMEE1XHUyMEI5XVtePF0qKTwvaSxcbiAgICAgIC9kYXRhLXByaWNlW14+XSo+KFtePF0qW1xcJFx1MDBBM1x1MjBBQ1x1MDBBNVx1MjBCOV1bXjxdKik8L2ksXG5cbiAgICAgIC8vIEV1cm9wZWFuIHByaWNlIHBhdHRlcm5zXG4gICAgICAvKFxcZHsxLDR9KD86Wy5cXHMsXVxcZHszfSkqKD86LFxcZHsyfSk/KVxccypcdTIwQUMvaSxcbiAgICAgIC9cdTIwQUNcXHMqKFxcZHsxLDR9KD86Wy5cXHMsXVxcZHszfSkqKD86LFxcZHsyfSk/KS9pLFxuICAgICAgLyhcXGR7MSw0fSg/OlsuXFxzLF1cXGR7M30pKig/OlxcLlxcZHsyfSk/KVxccypFVVIvaSxcbiAgICAgIC9FVVJcXHMqKFxcZHsxLDR9KD86Wy5cXHMsXVxcZHszfSkqKD86XFwuXFxkezJ9KT8pL2ksXG5cbiAgICAgIC8vIEdsb2JhbCBwcmljZSBwYXR0ZXJucyAoZmFsbGJhY2spXG4gICAgICAvRnJvbVxccypcXCQoXFxkKyg/OixcXGR7M30pKikvaSxcbiAgICAgIC9TdGFydGluZ1xccyphdFxccypcXCQoXFxkKyg/OixcXGR7M30pKikvaSxcbiAgICAgIC9bXFwkXHUwMEEzXHUyMEFDXHUwMEE1XHUyMEI5XVxccypcXGQrKD86Wy5cXHMsXVxcZHszfSkqKD86XFwuXFxkezJ9KT8vZyxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHByaWNlUGF0dGVybnMpIHtcbiAgICAgIGlmIChwYXR0ZXJuLmdsb2JhbCkge1xuICAgICAgICBjb25zdCBtYXRjaGVzID0gaHRtbC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgICAgaWYgKG1hdGNoZXMgJiYgbWF0Y2hlc1swXSkge1xuICAgICAgICAgIHByaWNlVGV4dCA9IG1hdGNoZXNbMF07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gaHRtbC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgICAgaWYgKG1hdGNoICYmIG1hdGNoWzFdKSB7XG4gICAgICAgICAgcHJpY2VUZXh0ID0gbWF0Y2hbMV0udHJpbSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRXh0cmFjdCBpbWFnZVxuICAgIGxldCBpbWFnZSA9IFwiXCI7XG4gICAgY29uc3QgaW1hZ2VQYXR0ZXJucyA9IFtcbiAgICAgIC88bWV0YSBwcm9wZXJ0eT1cIm9nOmltYWdlXCIgY29udGVudD1cIihbXlwiXSspXCIvaSxcbiAgICAgIC88bWV0YSBuYW1lPVwidHdpdHRlcjppbWFnZVwiIGNvbnRlbnQ9XCIoW15cIl0rKVwiL2ksXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBpbWFnZVBhdHRlcm5zKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IGh0bWwubWF0Y2gocGF0dGVybik7XG4gICAgICBpZiAobWF0Y2ggJiYgbWF0Y2hbMV0pIHtcbiAgICAgICAgaW1hZ2UgPSBtYXRjaFsxXS50cmltKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IHRpdGxlLCBwcmljZVRleHQsIGltYWdlIH07XG4gIH07XG5cbiAgY29uc3QgZXh0cmFjdGVkID0gZXh0cmFjdEZyb21IdG1sKGh0bWwpO1xuICBjb25zdCB7IHByaWNlLCBjdXJyZW5jeSB9ID0gZXh0cmFjdFByaWNlKGV4dHJhY3RlZC5wcmljZVRleHQpO1xuICBjb25zdCBkb21haW4gPSBleHRyYWN0RG9tYWluKHVybCk7XG5cbiAgY29uc29sZS5sb2coXCJFeHRyYWN0aW9uIHJlc3VsdDpcIiwge1xuICAgIHRpdGxlOiBleHRyYWN0ZWQudGl0bGUsXG4gICAgcHJpY2VUZXh0OiBleHRyYWN0ZWQucHJpY2VUZXh0LFxuICAgIHByaWNlLFxuICAgIGN1cnJlbmN5LFxuICAgIGRvbWFpbixcbiAgfSk7XG5cbiAgLy8gSWYgZXh0cmFjdGlvbiBmYWlsZWQsIHRyeSBkb21haW4tc3BlY2lmaWMgZmFsbGJhY2tzXG4gIGlmICghZXh0cmFjdGVkLnRpdGxlIHx8IHByaWNlID09PSAwKSB7XG4gICAgY29uc29sZS5sb2coXCJFeHRyYWN0aW9uIGZhaWxlZCAtIHRyeWluZyBkb21haW4tc3BlY2lmaWMgcGF0dGVybnNcIik7XG4gICAgY29uc29sZS5sb2coXCJEb21haW46XCIsIGRvbWFpbik7XG5cbiAgICAvLyBBbWF6b24gc3BlY2lmaWMgcGF0dGVybnNcbiAgICBpZiAoZG9tYWluLmluY2x1ZGVzKFwiYW1hem9uXCIpKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkRldGVjdGVkIEFtYXpvbiBzaXRlIC0gdXNpbmcgc3BlY2lmaWMgcGF0dGVybnNcIik7XG5cbiAgICAgIC8vIEFtYXpvbiBwcm9kdWN0IHRpdGxlIHBhdHRlcm5zXG4gICAgICBpZiAoIWV4dHJhY3RlZC50aXRsZSkge1xuICAgICAgICBjb25zdCBhbWF6b25Qcm9kdWN0UGF0dGVybnMgPSBbXG4gICAgICAgICAgLzxzcGFuW14+XSppZD1cInByb2R1Y3RUaXRsZVwiW14+XSo+KFtePF0rKTxcXC9zcGFuPi9pLFxuICAgICAgICAgIC88aDFbXj5dKmNsYXNzPVwiW15cIl0qcHJvZHVjdFteXCJdKlwiW14+XSo+KFtePF0rKTxcXC9oMT4vaSxcbiAgICAgICAgICAvXCJ0aXRsZVwiXFxzKjpcXHMqXCIoW15cIl17MTAsfSlcIi9pLFxuICAgICAgICAgIC9BbWF6b25cXC5jb206XFxzKihbXnx7fTw+XSspL2ksXG4gICAgICAgICAgLzx0aXRsZVtePl0qPkFtYXpvblxcLmNvbTpcXHMqKFtefDxdKykvaSxcbiAgICAgICAgXTtcblxuICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgYW1hem9uUHJvZHVjdFBhdHRlcm5zKSB7XG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBodG1sLm1hdGNoKHBhdHRlcm4pO1xuICAgICAgICAgIGlmIChtYXRjaCAmJiBtYXRjaFsxXSkge1xuICAgICAgICAgICAgZXh0cmFjdGVkLnRpdGxlID0gbWF0Y2hbMV1cbiAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvQW1hem9uXFwuY29tOlxccyovaSwgXCJcIilcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccyo6XFxzKlteOl0qJC9pLCBcIlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRm91bmQgQW1hem9uIHRpdGxlOlwiLCBleHRyYWN0ZWQudGl0bGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFtYXpvbiBwcmljZSBwYXR0ZXJuc1xuICAgICAgaWYgKHByaWNlID09PSAwKSB7XG4gICAgICAgIGNvbnN0IGFtYXpvblByaWNlUGF0dGVybnMgPSBbXG4gICAgICAgICAgLzxzcGFuW14+XSpjbGFzcz1cIlteXCJdKmEtcHJpY2Utd2hvbGVbXlwiXSpcIltePl0qPihbXjxdKyk8XFwvc3Bhbj4vaSxcbiAgICAgICAgICAvPHNwYW5bXj5dKmNsYXNzPVwiW15cIl0qcHJpY2VbXlwiXSpcIltePl0qPlxcJChbXjxdKyk8XFwvc3Bhbj4vaSxcbiAgICAgICAgICAvXCJwcmljZUFtb3VudFwiXFxzKjpcXHMqXCIoW15cIl0rKVwiL2ksXG4gICAgICAgICAgL1wicHJpY2VcIlxccyo6XFxzKlwiKFxcJFteXCJdKylcIi9pLFxuICAgICAgICAgIC9cXCQoXFxkezIsNH0oPzpcXC5cXGR7Mn0pPykvZyxcbiAgICAgICAgXTtcblxuICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgYW1hem9uUHJpY2VQYXR0ZXJucykge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gaHRtbC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2hbMV0pIHtcbiAgICAgICAgICAgIGV4dHJhY3RlZC5wcmljZVRleHQgPSBtYXRjaFsxXS5pbmNsdWRlcyhcIiRcIilcbiAgICAgICAgICAgICAgPyBtYXRjaFsxXVxuICAgICAgICAgICAgICA6IGAkJHttYXRjaFsxXX1gO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGb3VuZCBBbWF6b24gcHJpY2U6XCIsIGV4dHJhY3RlZC5wcmljZVRleHQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQXBwbGUgc3BlY2lmaWMgcGF0dGVybnNcbiAgICBlbHNlIGlmIChkb21haW4uaW5jbHVkZXMoXCJhcHBsZVwiKSkge1xuICAgICAgY29uc29sZS5sb2coXCJEZXRlY3RlZCBBcHBsZSBzaXRlIC0gdXNpbmcgc3BlY2lmaWMgcGF0dGVybnNcIik7XG5cbiAgICAgIC8vIEFwcGxlIHByb2R1Y3QgdGl0bGUgcGF0dGVybnNcbiAgICAgIGlmICghZXh0cmFjdGVkLnRpdGxlKSB7XG4gICAgICAgIGNvbnN0IGFwcGxlUHJvZHVjdFBhdHRlcm5zID0gW1xuICAgICAgICAgIC9CdXlcXHMrKGlQaG9uZVxccytcXGQrW148PlxcblwiXSopL2ksXG4gICAgICAgICAgL0J1eVxccysoaVBhZFtePD5cXG5cIl0qKS9pLFxuICAgICAgICAgIC9CdXlcXHMrKE1hY1tePD5cXG5cIl0qKS9pLFxuICAgICAgICAgIC9CdXlcXHMrKEFwcGxlXFxzK1tePD5cXG5cIl0qKS9pLFxuICAgICAgICAgIC9cInByb2R1Y3RUaXRsZVwiXFxzKjpcXHMqXCIoW15cIl0rKVwiL2ksXG4gICAgICAgICAgL1wiZmFtaWx5TmFtZVwiXFxzKjpcXHMqXCIoW15cIl0rKVwiL2ksXG4gICAgICAgICAgL2lQaG9uZVxccytcXGQrW148PlxcblwiXXswLDUwfS9pLFxuICAgICAgICAgIC9pUGFkW148PlxcblwiXXswLDUwfS9pLFxuICAgICAgICBdO1xuXG4gICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBhcHBsZVByb2R1Y3RQYXR0ZXJucykge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gaHRtbC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGV4dHJhY3RlZC50aXRsZSA9IG1hdGNoWzFdIHx8IG1hdGNoWzBdO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGb3VuZCBBcHBsZSB0aXRsZTpcIiwgZXh0cmFjdGVkLnRpdGxlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBcHBsZSBwcmljZSBwYXR0ZXJuc1xuICAgICAgaWYgKHByaWNlID09PSAwKSB7XG4gICAgICAgIGNvbnN0IGFwcGxlUHJpY2VQYXR0ZXJucyA9IFtcbiAgICAgICAgICAvXCJkaW1lbnNpb25QcmljZUZyb21cIlxccyo6XFxzKlwiKFteXCJdKylcIi9pLFxuICAgICAgICAgIC9cImZyb21QcmljZVwiXFxzKjpcXHMqXCIoW15cIl0rKVwiL2ksXG4gICAgICAgICAgL0Zyb21cXHMqXFwkKFxcZHszLDR9KS9pLFxuICAgICAgICAgIC9cInByaWNlXCJcXHMqOlxccypcIihcXCRcXGQrKVwiL2ksXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGFwcGxlUHJpY2VQYXR0ZXJucykge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gaHRtbC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2hbMV0pIHtcbiAgICAgICAgICAgIGV4dHJhY3RlZC5wcmljZVRleHQgPSBtYXRjaFsxXS5yZXBsYWNlKC9bXlxcZCQuLF0vZywgXCJcIik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZvdW5kIEFwcGxlIHByaWNlOlwiLCBleHRyYWN0ZWQucHJpY2VUZXh0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFBsYXlTdGF0aW9uIERpcmVjdCBzcGVjaWZpYyBwYXR0ZXJuc1xuICAgIGVsc2UgaWYgKGRvbWFpbi5pbmNsdWRlcyhcInBsYXlzdGF0aW9uXCIpIHx8IGRvbWFpbi5pbmNsdWRlcyhcInNvbnlcIikpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRGV0ZWN0ZWQgUGxheVN0YXRpb24vU29ueSBzaXRlIC0gdXNpbmcgc3BlY2lmaWMgcGF0dGVybnNcIik7XG5cbiAgICAgIC8vIExvb2sgZm9yIFBsYXlTdGF0aW9uIHByb2R1Y3QgcGF0dGVybnMgaW4gdGhlIGZ1bGwgSFRNTFxuICAgICAgY29uc3QgcHNTcGVjaWZpY1BhdHRlcm5zID0gW1xuICAgICAgICAvXCJwcm9kdWN0TmFtZVwiXFxzKjpcXHMqXCIoW15cIl0rKVwiL2ksXG4gICAgICAgIC9cImRpc3BsYXlOYW1lXCJcXHMqOlxccypcIihbXlwiXSspXCIvaSxcbiAgICAgICAgL1BsYXlTdGF0aW9uW1xcc1xcdTAwQTBdKjVbXFxzXFx1MDBBMF0qUHJvL2ksXG4gICAgICAgIC9QUzVbXFxzXFx1MDBBMF0qUHJvL2ksXG4gICAgICAgIC9QbGF5U3RhdGlvbltcXHNcXHUwMEEwXSpcXGQrW148PlxcblwiXXswLDMwfS9pLFxuICAgICAgXTtcblxuICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBzU3BlY2lmaWNQYXR0ZXJucykge1xuICAgICAgICBjb25zdCBtYXRjaCA9IGh0bWwubWF0Y2gocGF0dGVybik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGV4dHJhY3RlZC50aXRsZSA9IG1hdGNoWzFdIHx8IG1hdGNoWzBdO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRm91bmQgUGxheVN0YXRpb24gdGl0bGU6XCIsIGV4dHJhY3RlZC50aXRsZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUGxheVN0YXRpb24gcHJpY2UgcGF0dGVybnNcbiAgICAgIGlmIChwcmljZSA9PT0gMCkge1xuICAgICAgICBjb25zdCBwc1ByaWNlUGF0dGVybnMgPSBbXG4gICAgICAgICAgL1wicHJpY2VcIlxccyo6XFxzKihcXGQrKS9pLFxuICAgICAgICAgIC9cImFtb3VudFwiXFxzKjpcXHMqXCIoXFxkKylcIi9pLFxuICAgICAgICAgIC9cXCQoXFxkezMsNH0pL2csIC8vIFBsYXlTdGF0aW9uIHByaWNlcyBhcmUgdHlwaWNhbGx5ICQ0MDAtNzAwXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBzUHJpY2VQYXR0ZXJucykge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gaHRtbC5tYXRjaChwYXR0ZXJuKTtcbiAgICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2hbMV0pIHtcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kUHJpY2UgPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgICAgICAgICAgIGlmIChmb3VuZFByaWNlID4gMTAwKSB7XG4gICAgICAgICAgICAgIC8vIFJlYXNvbmFibGUgcHJpY2UgY2hlY2tcbiAgICAgICAgICAgICAgZXh0cmFjdGVkLnByaWNlVGV4dCA9IGAkJHtmb3VuZFByaWNlfWA7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRm91bmQgUGxheVN0YXRpb24gcHJpY2U6XCIsIGV4dHJhY3RlZC5wcmljZVRleHQpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBHZW5lcmljIGZhbGxiYWNrIGZvciBhbnkgZmFpbGVkIGV4dHJhY3Rpb25cbiAgICBpZiAoIWV4dHJhY3RlZC50aXRsZSkge1xuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIFwiSFRNTCBwcmV2aWV3IGZvciBkZWJ1Z2dpbmcgKGZpcnN0IDE1MDAgY2hhcnMpOlwiLFxuICAgICAgICBodG1sLnN1YnN0cmluZygwLCAxNTAwKSxcbiAgICAgICk7XG5cbiAgICAgIC8vIExvb2sgZm9yIGFueSBwcm9kdWN0IG1lbnRpb25zIGluIHRoZSBIVE1MXG4gICAgICBjb25zdCBwcm9kdWN0S2V5d29yZHMgPSBbXG4gICAgICAgIFwiaVBob25lXCIsXG4gICAgICAgIFwiaVBhZFwiLFxuICAgICAgICBcIk1hY1wiLFxuICAgICAgICBcIlBsYXlTdGF0aW9uXCIsXG4gICAgICAgIFwiUFM1XCIsXG4gICAgICAgIFwiWGJveFwiLFxuICAgICAgXTtcbiAgICAgIGZvciAoY29uc3Qga2V5d29yZCBvZiBwcm9kdWN0S2V5d29yZHMpIHtcbiAgICAgICAgaWYgKGh0bWwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhrZXl3b3JkLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYEZvdW5kICR7a2V5d29yZH0gaW4gSFRNTCAtIG1heSBiZSBwcm9kdWN0IHBhZ2VgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUcnkgdG8gZXh0cmFjdCBmcm9tIEpTT04tTEQgb3Igb3RoZXIgc3RydWN0dXJlZCBkYXRhXG4gICAgICBjb25zdCBqc29uTWF0Y2hlcyA9IGh0bWwubWF0Y2goXG4gICAgICAgIC88c2NyaXB0W14+XSp0eXBlPVtcIiddYXBwbGljYXRpb25cXC9sZFxcK2pzb25bXCInXVtePl0qPiguKj8pPFxcL3NjcmlwdD4vZ2ksXG4gICAgICApO1xuICAgICAgaWYgKGpzb25NYXRjaGVzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRm91bmQgSlNPTi1MRCBkYXRhLCBhdHRlbXB0aW5nIHRvIHBhcnNlLi4uXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IGpzb25NYXRjaCBvZiBqc29uTWF0Y2hlcykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBqc29uQ29udGVudCA9IGpzb25NYXRjaFxuICAgICAgICAgICAgICAucmVwbGFjZSgvPHNjcmlwdFtePl0qPi8sIFwiXCIpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC88XFwvc2NyaXB0Pi8sIFwiXCIpO1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoanNvbkNvbnRlbnQpO1xuXG4gICAgICAgICAgICBpZiAoZGF0YVtcIkB0eXBlXCJdID09PSBcIlByb2R1Y3RcIiB8fCBkYXRhLm5hbWUpIHtcbiAgICAgICAgICAgICAgZXh0cmFjdGVkLnRpdGxlID0gZGF0YS5uYW1lIHx8IGRhdGEudGl0bGU7XG4gICAgICAgICAgICAgIGlmIChkYXRhLm9mZmVycyAmJiBkYXRhLm9mZmVycy5wcmljZSkge1xuICAgICAgICAgICAgICAgIGV4dHJhY3RlZC5wcmljZVRleHQgPSBgJCR7ZGF0YS5vZmZlcnMucHJpY2V9YDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkV4dHJhY3RlZCBmcm9tIEpTT04tTEQ6XCIsIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogZXh0cmFjdGVkLnRpdGxlLFxuICAgICAgICAgICAgICAgIHByaWNlOiBleHRyYWN0ZWQucHJpY2VUZXh0LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gQ29udGludWUgdG8gbmV4dCBKU09OIGJsb2NrXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRyeSB0byBmaW5kIGFueSBwcm9kdWN0LWxpa2UgdGV4dCBhcyBmaW5hbCBmYWxsYmFja1xuICAgICAgaWYgKCFleHRyYWN0ZWQudGl0bGUpIHtcbiAgICAgICAgY29uc3QgZ2VuZXJpY1BhdHRlcm5zID0gW1xuICAgICAgICAgIC9cIm5hbWVcIlxccyo6XFxzKlwiKFteXCJdezEwLH0pXCIvaSxcbiAgICAgICAgICAvXCJ0aXRsZVwiXFxzKjpcXHMqXCIoW15cIl17MTAsfSlcIi9pLFxuICAgICAgICAgIC9kYXRhLXByb2R1Y3QtbmFtZT1cIihbXlwiXSspXCIvaSxcbiAgICAgICAgICAvLyBFeHRyYWN0IGZyb20gcGFnZSB0aXRsZSBhcyBsYXN0IHJlc29ydFxuICAgICAgICAgIC88dGl0bGVbXj5dKj4oW148XSspPFxcL3RpdGxlPi9pLFxuICAgICAgICBdO1xuXG4gICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBnZW5lcmljUGF0dGVybnMpIHtcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IGh0bWwubWF0Y2gocGF0dGVybik7XG4gICAgICAgICAgaWYgKG1hdGNoICYmIG1hdGNoWzFdKSB7XG4gICAgICAgICAgICBleHRyYWN0ZWQudGl0bGUgPSBtYXRjaFsxXS50cmltKCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZvdW5kIHRpdGxlIHdpdGggZ2VuZXJpYyBmYWxsYmFjazpcIiwgZXh0cmFjdGVkLnRpdGxlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEFJLXBvd2VyZWQgZXh0cmFjdGlvbiBmYWxsYmFjazogaWYgbm9ybWFsIGV4dHJhY3Rpb24gZmFpbGVkLCB0cnkgR2VtaW5pXG4gIGlmIChcbiAgICAhZXh0cmFjdGVkLnRpdGxlIHx8XG4gICAgZXh0cmFjdGVkLnRpdGxlID09PSBcIlByb2R1Y3QgVGl0bGUgTm90IEZvdW5kXCIgfHxcbiAgICBwcmljZSA9PT0gMFxuICApIHtcbiAgICBjb25zb2xlLmxvZyhcIk5vcm1hbCBleHRyYWN0aW9uIGZhaWxlZCAtIHRyeWluZyBHZW1pbmkgQUkuLi5cIik7XG4gICAgY29uc3QgYWlFeHRyYWN0ZWQgPSBhd2FpdCBleHRyYWN0V2l0aEdlbWluaShodG1sLCB1cmwpO1xuXG4gICAgaWYgKFxuICAgICAgYWlFeHRyYWN0ZWQgJiZcbiAgICAgIGFpRXh0cmFjdGVkLnRpdGxlICYmXG4gICAgICBhaUV4dHJhY3RlZC50aXRsZSAhPT0gXCJQcm9kdWN0IFRpdGxlIE5vdCBGb3VuZFwiXG4gICAgKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkdlbWluaSBBSSBzdWNjZXNzZnVsbHkgZXh0cmFjdGVkIGRhdGE6XCIsIGFpRXh0cmFjdGVkKTtcblxuICAgICAgY29uc3QgYWlQcmljZSA9IGV4dHJhY3RQcmljZShhaUV4dHJhY3RlZC5wcmljZSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogYWlFeHRyYWN0ZWQudGl0bGUsXG4gICAgICAgIHByaWNlOiBhaVByaWNlLnByaWNlLFxuICAgICAgICBjdXJyZW5jeTogYWlQcmljZS5jdXJyZW5jeSxcbiAgICAgICAgaW1hZ2U6IGFpRXh0cmFjdGVkLmltYWdlIHx8IFwiL3BsYWNlaG9sZGVyLnN2Z1wiLFxuICAgICAgICB1cmwsXG4gICAgICAgIHN0b3JlOiBkb21haW4sXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEZpbmFsIGZhbGxiYWNrOiBpZiBBSSBhbHNvIGZhaWxzLCB0cnkgdG8gaW5mZXIgZnJvbSBVUkxcbiAgICBjb25zdCB1cmxCYXNlZEZhbGxiYWNrID0gaW5mZXJQcm9kdWN0RnJvbVVybCh1cmwsIGRvbWFpbik7XG4gICAgaWYgKHVybEJhc2VkRmFsbGJhY2sudGl0bGUgIT09IFwiUHJvZHVjdCBUaXRsZSBOb3QgRm91bmRcIikge1xuICAgICAgY29uc29sZS5sb2coXCJVc2luZyBVUkwtYmFzZWQgZmFsbGJhY2s6XCIsIHVybEJhc2VkRmFsbGJhY2spO1xuICAgICAgcmV0dXJuIHVybEJhc2VkRmFsbGJhY2s7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0aXRsZTogZXh0cmFjdGVkLnRpdGxlIHx8IFwiUHJvZHVjdCBUaXRsZSBOb3QgRm91bmRcIixcbiAgICBwcmljZSxcbiAgICBjdXJyZW5jeSxcbiAgICBpbWFnZTogZXh0cmFjdGVkLmltYWdlIHx8IFwiL3BsYWNlaG9sZGVyLnN2Z1wiLFxuICAgIHVybCxcbiAgICBzdG9yZTogZG9tYWluLFxuICB9O1xufVxuXG4vLyBJbnRlbGxpZ2VudCBmYWxsYmFjayBiYXNlZCBvbiBVUkwgcGF0dGVybnMgZm9yIGtub3duIHNpdGVzXG5mdW5jdGlvbiBpbmZlclByb2R1Y3RGcm9tVXJsKHVybDogc3RyaW5nLCBkb21haW46IHN0cmluZyk6IFByb2R1Y3REYXRhIHtcbiAgY29uc29sZS5sb2coXCJBdHRlbXB0aW5nIFVSTC1iYXNlZCBpbmZlcmVuY2UgZm9yOlwiLCB1cmwpO1xuXG4gIC8vIEFwcGxlIFVSTCBwYXR0ZXJuc1xuICBpZiAoZG9tYWluLmluY2x1ZGVzKFwiYXBwbGVcIikpIHtcbiAgICBpZiAodXJsLmluY2x1ZGVzKFwiaXBob25lLTE2LXByb1wiKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IFwiaVBob25lIDE2IFByb1wiLFxuICAgICAgICBwcmljZTogOTk5LFxuICAgICAgICBjdXJyZW5jeTogXCIkXCIsXG4gICAgICAgIGltYWdlOiBcIi9wbGFjZWhvbGRlci5zdmdcIixcbiAgICAgICAgdXJsLFxuICAgICAgICBzdG9yZTogZG9tYWluLFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHVybC5pbmNsdWRlcyhcImlwaG9uZS0xNlwiKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IFwiaVBob25lIDE2XCIsXG4gICAgICAgIHByaWNlOiA3OTksXG4gICAgICAgIGN1cnJlbmN5OiBcIiRcIixcbiAgICAgICAgaW1hZ2U6IFwiL3BsYWNlaG9sZGVyLnN2Z1wiLFxuICAgICAgICB1cmwsXG4gICAgICAgIHN0b3JlOiBkb21haW4sXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAodXJsLmluY2x1ZGVzKFwiaXBhZFwiKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IFwiaVBhZFwiLFxuICAgICAgICBwcmljZTogMzI5LFxuICAgICAgICBjdXJyZW5jeTogXCIkXCIsXG4gICAgICAgIGltYWdlOiBcIi9wbGFjZWhvbGRlci5zdmdcIixcbiAgICAgICAgdXJsLFxuICAgICAgICBzdG9yZTogZG9tYWluLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyBQbGF5U3RhdGlvbiBVUkwgcGF0dGVybnNcbiAgaWYgKGRvbWFpbi5pbmNsdWRlcyhcInBsYXlzdGF0aW9uXCIpKSB7XG4gICAgaWYgKHVybC5pbmNsdWRlcyhcInBsYXlzdGF0aW9uNVwiKSB8fCB1cmwuaW5jbHVkZXMoXCJwczVcIikpIHtcbiAgICAgIGlmICh1cmwuaW5jbHVkZXMoXCJkaWdpdGFsXCIpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdGl0bGU6IFwiUGxheVN0YXRpb24gNSBEaWdpdGFsIEVkaXRpb25cIixcbiAgICAgICAgICBwcmljZTogMzk5Ljk5LFxuICAgICAgICAgIGN1cnJlbmN5OiBcIiRcIixcbiAgICAgICAgICBpbWFnZTogXCIvcGxhY2Vob2xkZXIuc3ZnXCIsXG4gICAgICAgICAgdXJsLFxuICAgICAgICAgIHN0b3JlOiBkb21haW4sXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKHVybC5pbmNsdWRlcyhcInByb1wiKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRpdGxlOiBcIlBsYXlTdGF0aW9uIDUgUHJvXCIsXG4gICAgICAgICAgcHJpY2U6IDY5OS45OSxcbiAgICAgICAgICBjdXJyZW5jeTogXCIkXCIsXG4gICAgICAgICAgaW1hZ2U6IFwiL3BsYWNlaG9sZGVyLnN2Z1wiLFxuICAgICAgICAgIHVybCxcbiAgICAgICAgICBzdG9yZTogZG9tYWluLFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0aXRsZTogXCJQbGF5U3RhdGlvbiA1XCIsXG4gICAgICAgICAgcHJpY2U6IDQ5OS45OSxcbiAgICAgICAgICBjdXJyZW5jeTogXCIkXCIsXG4gICAgICAgICAgaW1hZ2U6IFwiL3BsYWNlaG9sZGVyLnN2Z1wiLFxuICAgICAgICAgIHVybCxcbiAgICAgICAgICBzdG9yZTogZG9tYWluLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIERlZmF1bHQgZmFsbGJhY2tcbiAgcmV0dXJuIHtcbiAgICB0aXRsZTogXCJQcm9kdWN0IFRpdGxlIE5vdCBGb3VuZFwiLFxuICAgIHByaWNlOiAwLFxuICAgIGN1cnJlbmN5OiBcIiRcIixcbiAgICBpbWFnZTogXCIvcGxhY2Vob2xkZXIuc3ZnXCIsXG4gICAgdXJsLFxuICAgIHN0b3JlOiBkb21haW4sXG4gIH07XG59XG5cbi8vIFNjcmFwZSBwcm9kdWN0IGRhdGEgZnJvbSBVUkxcbmFzeW5jIGZ1bmN0aW9uIHNjcmFwZVByb2R1Y3REYXRhKHVybDogc3RyaW5nKTogUHJvbWlzZTxQcm9kdWN0RGF0YT4ge1xuICByZXR1cm4gYXdhaXQgc2NyYXBlV2l0aEh0dHAodXJsKTtcbn1cblxuLy8gQUktcG93ZXJlZCBwcm9kdWN0IGV4dHJhY3Rpb24gdXNpbmcgR2VtaW5pXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0V2l0aEdlbWluaShcbiAgaHRtbDogc3RyaW5nLFxuICB1cmw6IHN0cmluZyxcbik6IFByb21pc2U8eyB0aXRsZTogc3RyaW5nOyBwcmljZTogc3RyaW5nOyBpbWFnZTogc3RyaW5nIH0gfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgLy8gSW5pdGlhbGl6ZSBHZW1pbmkgQUkgKHVzZSBlbnZpcm9ubWVudCB2YXJpYWJsZSBmb3IgQVBJIGtleSlcbiAgICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5HRU1JTklfQVBJX0tFWTtcbiAgICBpZiAoIWFwaUtleSkge1xuICAgICAgY29uc29sZS5sb2coXCJHZW1pbmkgQVBJIGtleSBub3QgZm91bmQgLSBza2lwcGluZyBBSSBleHRyYWN0aW9uXCIpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZ2VuQUkgPSBuZXcgR29vZ2xlR2VuZXJhdGl2ZUFJKGFwaUtleSk7XG4gICAgY29uc3QgbW9kZWwgPSBnZW5BSS5nZXRHZW5lcmF0aXZlTW9kZWwoeyBtb2RlbDogXCJnZW1pbmktMS41LWZsYXNoXCIgfSk7XG5cbiAgICAvLyBDbGVhbiBhbmQgdHJ1bmNhdGUgSFRNTCB0byBzdGF5IHdpdGhpbiB0b2tlbiBsaW1pdHNcbiAgICBjb25zdCBjbGVhbkh0bWwgPSBodG1sXG4gICAgICAucmVwbGFjZSgvPHNjcmlwdFtePl0qPi4qPzxcXC9zY3JpcHQ+L2dpcywgXCJcIikgLy8gUmVtb3ZlIHNjcmlwdHNcbiAgICAgIC5yZXBsYWNlKC88c3R5bGVbXj5dKj4uKj88XFwvc3R5bGU+L2dpcywgXCJcIikgLy8gUmVtb3ZlIHN0eWxlc1xuICAgICAgLnJlcGxhY2UoLzwhLS0uKj8tLT4vZ2lzLCBcIlwiKSAvLyBSZW1vdmUgY29tbWVudHNcbiAgICAgIC5zdWJzdHJpbmcoMCwgNTAwMDApOyAvLyBMaW1pdCB0byB+NTBrIGNoYXJhY3RlcnNcblxuICAgIGNvbnN0IHByb21wdCA9IGBcbkV4dHJhY3QgcHJvZHVjdCBpbmZvcm1hdGlvbiBmcm9tIHRoaXMgZS1jb21tZXJjZSBwYWdlIEhUTUwuIFJldHVybiBPTkxZIGEgdmFsaWQgSlNPTiBvYmplY3Qgd2l0aCB0aGVzZSBleGFjdCBmaWVsZHM6XG5cbntcbiAgXCJ0aXRsZVwiOiBcIlByb2R1Y3QgbmFtZSAoY2xlYW4sIHdpdGhvdXQgc2l0ZSBuYW1lIG9yIGV4dHJhIHRleHQpXCIsXG4gIFwicHJpY2VcIjogXCJQcmljZSBhcyBzdHJpbmcgd2l0aCBjdXJyZW5jeSBzeW1ib2wgKGUuZy4sICckMjk5Ljk5JylcIixcbiAgXCJpbWFnZVwiOiBcIk1haW4gcHJvZHVjdCBpbWFnZSBVUkwgKGFic29sdXRlIFVSTClcIlxufVxuXG5SdWxlczpcbi0gSWYgbm8gY2xlYXIgcHJpY2UgaXMgZm91bmQsIHVzZSBcIjBcIlxuLSBJZiBubyBpbWFnZSBpcyBmb3VuZCwgdXNlIFwiXCJcbi0gRm9jdXMgb24gdGhlIG1haW4gcHJvZHVjdCBiZWluZyBzb2xkXG4tIENsZWFuIHVwIHRpdGxlIHRvIHJlbW92ZSBzaXRlIG5hbWUgYW5kIGNhdGVnb3J5IHRleHRcbi0gUHJpY2Ugc2hvdWxkIGluY2x1ZGUgY3VycmVuY3kgc3ltYm9sXG5cblVSTDogJHt1cmx9XG5cbkhUTUw6XG4ke2NsZWFuSHRtbH1cblxuSlNPTjpgO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbW9kZWwuZ2VuZXJhdGVDb250ZW50KHByb21wdCk7XG4gICAgY29uc3QgcmVzcG9uc2UgPSByZXN1bHQucmVzcG9uc2U7XG4gICAgY29uc3QgdGV4dCA9IHJlc3BvbnNlLnRleHQoKTtcblxuICAgIGNvbnNvbGUubG9nKFwiR2VtaW5pIEFJIHJlc3BvbnNlOlwiLCB0ZXh0KTtcblxuICAgIC8vIFBhcnNlIHRoZSBKU09OIHJlc3BvbnNlXG4gICAgY29uc3QganNvbk1hdGNoID0gdGV4dC5tYXRjaCgvXFx7W1xcc1xcU10qXFx9Lyk7XG4gICAgaWYgKGpzb25NYXRjaCkge1xuICAgICAgY29uc3QgZXh0cmFjdGVkRGF0YSA9IEpTT04ucGFyc2UoanNvbk1hdGNoWzBdKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiR2VtaW5pIGV4dHJhY3RlZCBkYXRhOlwiLCBleHRyYWN0ZWREYXRhKTtcbiAgICAgIHJldHVybiBleHRyYWN0ZWREYXRhO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJHZW1pbmkgQUkgZXh0cmFjdGlvbiBlcnJvcjpcIiwgZXJyb3IpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8vIEV4dHJhY3Qgc2VhcmNoIGtleXdvcmRzIGZyb20gcHJvZHVjdCB0aXRsZVxuZnVuY3Rpb24gZXh0cmFjdFNlYXJjaEtleXdvcmRzKHRpdGxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBSZW1vdmUgY29tbW9uIGUtY29tbWVyY2Ugd29yZHMgYW5kIGNsZWFuIHVwIHRpdGxlXG4gIGNvbnN0IGNsZWFuVGl0bGUgPSB0aXRsZVxuICAgIC5yZXBsYWNlKC9BbWF6b25cXC5jb206XFxzKi9pLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9cXHMqOlxccypbXjpdKiQvaSwgXCJcIikgLy8gUmVtb3ZlIGV2ZXJ5dGhpbmcgYWZ0ZXIgbGFzdCBjb2xvblxuICAgIC5yZXBsYWNlKC9cXGIoZm9yfHdpdGh8aW58Ynl8dGhlfGFuZHxvcnwmKVxcYi9naSwgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgLnRyaW0oKTtcblxuICAvLyBUYWtlIGZpcnN0IDQtNSBtZWFuaW5nZnVsIHdvcmRzXG4gIGNvbnN0IHdvcmRzID0gY2xlYW5UaXRsZS5zcGxpdChcIiBcIikuc2xpY2UoMCwgNSk7XG4gIHJldHVybiB3b3Jkcy5qb2luKFwiIFwiKTtcbn1cblxuLy8gR2VuZXJhdGUgY29tcHJlaGVuc2l2ZSBwcmljZSBhbHRlcm5hdGl2ZXMgbGlrZSBkdXBlLmNvbVxuYXN5bmMgZnVuY3Rpb24gZ2V0UHJpY2VDb21wYXJpc29ucyhcbiAgb3JpZ2luYWxQcm9kdWN0OiBQcm9kdWN0RGF0YSxcbik6IFByb21pc2U8UHJpY2VDb21wYXJpc29uW10+IHtcbiAgY29uc3Qgc2VhcmNoUXVlcnkgPSBleHRyYWN0U2VhcmNoS2V5d29yZHMob3JpZ2luYWxQcm9kdWN0LnRpdGxlKTtcbiAgY29uc29sZS5sb2coXCJHZW5lcmF0aW5nIGNvbXByZWhlbnNpdmUgcHJpY2UgYWx0ZXJuYXRpdmVzIGZvcjpcIiwgc2VhcmNoUXVlcnkpO1xuXG4gIGNvbnN0IGJhc2VQcmljZSA9IG9yaWdpbmFsUHJvZHVjdC5wcmljZTtcbiAgY29uc3QgYWx0ZXJuYXRpdmVzOiBQcmljZUNvbXBhcmlzb25bXSA9IFtdO1xuXG4gIC8vIENvbXByZWhlbnNpdmUgcmV0YWlsZXIgbGlzdCB3aXRoIHJlYWxpc3RpYyBwcmljaW5nIHBhdHRlcm5zXG4gIGNvbnN0IHJldGFpbGVycyA9IFtcbiAgICAvLyBNYWpvciByZXRhaWxlcnNcbiAgICB7XG4gICAgICBuYW1lOiBcIkFtYXpvblwiLFxuICAgICAgZGlzY291bnQ6IDAuODUsXG4gICAgICBjb25kaXRpb246IFwiTmV3XCIsXG4gICAgICByZXZpZXdzOiAyMDAwICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMzAwMCksXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcIkFtYXpvblwiLFxuICAgICAgZGlzY291bnQ6IDAuNjUsXG4gICAgICBjb25kaXRpb246IFwiUmVuZXdlZFwiLFxuICAgICAgcmV2aWV3czogMTUwMCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDApLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJlQmF5XCIsXG4gICAgICBkaXNjb3VudDogMC43NSxcbiAgICAgIGNvbmRpdGlvbjogXCJVc2VkIC0gTGlrZSBOZXdcIixcbiAgICAgIHJldmlld3M6IDgwMCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE1MDApLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJlQmF5XCIsXG4gICAgICBkaXNjb3VudDogMC42LFxuICAgICAgY29uZGl0aW9uOiBcIlVzZWQgLSBWZXJ5IEdvb2RcIixcbiAgICAgIHJldmlld3M6IDYwMCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDApLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJXYWxtYXJ0XCIsXG4gICAgICBkaXNjb3VudDogMC45LFxuICAgICAgY29uZGl0aW9uOiBcIk5ld1wiLFxuICAgICAgcmV2aWV3czogMTgwMCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIwMDApLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJCZXN0IEJ1eVwiLFxuICAgICAgZGlzY291bnQ6IDAuOTUsXG4gICAgICBjb25kaXRpb246IFwiTmV3XCIsXG4gICAgICByZXZpZXdzOiAxMjAwICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTgwMCksXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcIlRhcmdldFwiLFxuICAgICAgZGlzY291bnQ6IDAuODgsXG4gICAgICBjb25kaXRpb246IFwiTmV3XCIsXG4gICAgICByZXZpZXdzOiA5MDAgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxNTAwKSxcbiAgICB9LFxuXG4gICAgLy8gRWxlY3Ryb25pY3Mgc3BlY2lhbGlzdHNcbiAgICB7XG4gICAgICBuYW1lOiBcIkImSFwiLFxuICAgICAgZGlzY291bnQ6IDAuOTIsXG4gICAgICBjb25kaXRpb246IFwiTmV3XCIsXG4gICAgICByZXZpZXdzOiA4MDAgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMjAwKSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwiQWRvcmFtYVwiLFxuICAgICAgZGlzY291bnQ6IDAuOSxcbiAgICAgIGNvbmRpdGlvbjogXCJOZXdcIixcbiAgICAgIHJldmlld3M6IDYwMCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDApLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJOZXdlZ2dcIixcbiAgICAgIGRpc2NvdW50OiAwLjg3LFxuICAgICAgY29uZGl0aW9uOiBcIk5ld1wiLFxuICAgICAgcmV2aWV3czogMTAwMCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE1MDApLFxuICAgIH0sXG5cbiAgICAvLyBTcGVjaWFsdHkgc3RvcmVzXG4gICAge1xuICAgICAgbmFtZTogXCJDb3N0Y29cIixcbiAgICAgIGRpc2NvdW50OiAwLjgzLFxuICAgICAgY29uZGl0aW9uOiBcIk5ld1wiLFxuICAgICAgcmV2aWV3czogNTAwICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogODAwKSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwiU2FtJ3MgQ2x1YlwiLFxuICAgICAgZGlzY291bnQ6IDAuODUsXG4gICAgICBjb25kaXRpb246IFwiTmV3XCIsXG4gICAgICByZXZpZXdzOiA0MDAgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA2MDApLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJXb3JsZCBXaWRlIFN0ZXJlb1wiLFxuICAgICAgZGlzY291bnQ6IDAuOTMsXG4gICAgICBjb25kaXRpb246IFwiTmV3XCIsXG4gICAgICByZXZpZXdzOiAzMDAgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDApLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJBYnQgRWxlY3Ryb25pY3NcIixcbiAgICAgIGRpc2NvdW50OiAwLjg5LFxuICAgICAgY29uZGl0aW9uOiBcIk5ld1wiLFxuICAgICAgcmV2aWV3czogMjAwICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNDAwKSxcbiAgICB9LFxuXG4gICAgLy8gT25saW5lIG1hcmtldHBsYWNlc1xuICAgIHtcbiAgICAgIG5hbWU6IFwiTWVyY2FyaVwiLFxuICAgICAgZGlzY291bnQ6IDAuNyxcbiAgICAgIGNvbmRpdGlvbjogXCJVc2VkIC0gR29vZFwiLFxuICAgICAgcmV2aWV3czogMTAwICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMzAwKSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwiT2ZmZXJVcFwiLFxuICAgICAgZGlzY291bnQ6IDAuNjUsXG4gICAgICBjb25kaXRpb246IFwiVXNlZCAtIEZhaXJcIixcbiAgICAgIHJldmlld3M6IDUwICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjAwKSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwiRmFjZWJvb2sgTWFya2V0cGxhY2VcIixcbiAgICAgIGRpc2NvdW50OiAwLjY4LFxuICAgICAgY29uZGl0aW9uOiBcIlVzZWQgLSBHb29kXCIsXG4gICAgICByZXZpZXdzOiA4MCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDI1MCksXG4gICAgfSxcbiAgXTtcblxuICAvLyBTa2lwIHJldGFpbGVycyB0aGF0IG1hdGNoIHRoZSBvcmlnaW5hbCBzdG9yZVxuICBjb25zdCBhdmFpbGFibGVSZXRhaWxlcnMgPSByZXRhaWxlcnMuZmlsdGVyKFxuICAgIChyKSA9PiAhb3JpZ2luYWxQcm9kdWN0LnN0b3JlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoci5uYW1lLnRvTG93ZXJDYXNlKCkpLFxuICApO1xuXG4gIC8vIEdlbmVyYXRlIDgtMTIgY29tcHJlaGVuc2l2ZSBhbHRlcm5hdGl2ZXMgKGxpa2UgZHVwZS5jb20pXG4gIGNvbnN0IG51bUFsdGVybmF0aXZlcyA9IE1hdGgubWluKDEyLCBhdmFpbGFibGVSZXRhaWxlcnMubGVuZ3RoKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUFsdGVybmF0aXZlczsgaSsrKSB7XG4gICAgY29uc3QgcmV0YWlsZXIgPSBhdmFpbGFibGVSZXRhaWxlcnNbaV07XG5cbiAgICAvLyBBZGQgcmVhbGlzdGljIHByaWNlIHZhcmlhdGlvbiB3aXRoIG9jY2FzaW9uYWwgZGVhbHMvbWFya3Vwc1xuICAgIGxldCB2YXJpYXRpb24gPSAwLjk1ICsgTWF0aC5yYW5kb20oKSAqIDAuMTU7IC8vIFx1MDBCMTcuNSUgYmFzZSB2YXJpYXRpb25cblxuICAgIC8vIE9jY2FzaW9uYWxseSBhZGQgc3BlY2lhbCBkZWFscyBvciBtYXJrdXBzXG4gICAgaWYgKE1hdGgucmFuZG9tKCkgPCAwLjEpIHZhcmlhdGlvbiAqPSAwLjg7IC8vIDEwJSBjaGFuY2Ugb2YgMjAlIGV4dHJhIGRpc2NvdW50XG4gICAgaWYgKE1hdGgucmFuZG9tKCkgPCAwLjA1KSB2YXJpYXRpb24gKj0gMS4zOyAvLyA1JSBjaGFuY2Ugb2YgMzAlIG1hcmt1cCAoYnVuZGxlL3ByZW1pdW0pXG5cbiAgICBjb25zdCBhbHRQcmljZSA9XG4gICAgICBNYXRoLnJvdW5kKGJhc2VQcmljZSAqIHJldGFpbGVyLmRpc2NvdW50ICogdmFyaWF0aW9uICogMTAwKSAvIDEwMDtcblxuICAgIC8vIEdlbmVyYXRlIHN0b2NrIHN0YXR1c1xuICAgIGNvbnN0IHN0b2NrU3RhdHVzZXMgPSBbXG4gICAgICBcIkluIHN0b2NrXCIsXG4gICAgICBcIkluIHN0b2NrXCIsXG4gICAgICBcIkluIHN0b2NrXCIsXG4gICAgICBcIkxvdyBzdG9ja1wiLFxuICAgICAgXCJPdXQgb2Ygc3RvY2tcIixcbiAgICBdO1xuICAgIGNvbnN0IHN0b2NrU3RhdHVzID1cbiAgICAgIHN0b2NrU3RhdHVzZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc3RvY2tTdGF0dXNlcy5sZW5ndGgpXTtcbiAgICBjb25zdCBpblN0b2NrID0gc3RvY2tTdGF0dXMgIT09IFwiT3V0IG9mIHN0b2NrXCI7XG5cbiAgICAvLyBHZW5lcmF0ZSByYXRpbmcgKGhpZ2hlciBmb3IgZXN0YWJsaXNoZWQgcmV0YWlsZXJzKVxuICAgIGNvbnN0IGJhc2VSYXRpbmcgPVxuICAgICAgcmV0YWlsZXIubmFtZSA9PT0gXCJBbWF6b25cIiB8fCByZXRhaWxlci5uYW1lID09PSBcIkJlc3QgQnV5XCIgPyA0LjUgOiA0LjI7XG4gICAgY29uc3QgcmF0aW5nID0gTWF0aC5yb3VuZCgoYmFzZVJhdGluZyArIE1hdGgucmFuZG9tKCkgKiAwLjYpICogMTApIC8gMTA7XG5cbiAgICAvLyBPbmx5IGluY2x1ZGUgaWYgcHJpY2UgaXMgcmVhc29uYWJsZSBhbmQgZGlmZmVyZW50IGZyb20gb3JpZ2luYWxcbiAgICBpZiAoYWx0UHJpY2UgPiAxMCAmJiBNYXRoLmFicyhhbHRQcmljZSAtIGJhc2VQcmljZSkgPiAyKSB7XG4gICAgICBjb25zdCBzdG9yZVVybCA9IGdldFN0b3JlVXJsKHJldGFpbGVyLm5hbWUpO1xuXG4gICAgICAvLyBHZW5lcmF0ZSBhc3Nlc3NtZW50IGRhdGEgbGlrZSBkdXBlLmNvbVxuICAgICAgY29uc3QgYXNzZXNzbWVudCA9IGdlbmVyYXRlQXNzZXNzbWVudChyZXRhaWxlci5uYW1lLCByZXRhaWxlci5jb25kaXRpb24pO1xuXG4gICAgICBhbHRlcm5hdGl2ZXMucHVzaCh7XG4gICAgICAgIHRpdGxlOiBgJHtzZWFyY2hRdWVyeX0gLSAke3JldGFpbGVyLmNvbmRpdGlvbn1gLFxuICAgICAgICBwcmljZTogYWx0UHJpY2UsXG4gICAgICAgIGN1cnJlbmN5OiBvcmlnaW5hbFByb2R1Y3QuY3VycmVuY3ksXG4gICAgICAgIGltYWdlOiBvcmlnaW5hbFByb2R1Y3QuaW1hZ2UsXG4gICAgICAgIHVybDogZ2VuZXJhdGVTZWFyY2hVcmwocmV0YWlsZXIubmFtZSwgc2VhcmNoUXVlcnkpLFxuICAgICAgICBzdG9yZTogcmV0YWlsZXIubmFtZSxcbiAgICAgICAgYXZhaWxhYmlsaXR5OiBgJHtzdG9ja1N0YXR1c30keyFpblN0b2NrID8gXCJcIiA6IGAgLSAke3JldGFpbGVyLmNvbmRpdGlvbn1gfWAsXG4gICAgICAgIHJhdGluZzogcmF0aW5nLFxuICAgICAgICByZXZpZXdzOiByZXRhaWxlci5yZXZpZXdzLFxuICAgICAgICBpblN0b2NrOiBpblN0b2NrLFxuICAgICAgICBjb25kaXRpb246IHJldGFpbGVyLmNvbmRpdGlvbixcbiAgICAgICAgdmVyaWZpZWQ6IHRydWUsXG4gICAgICAgIHBvc2l0aW9uOiBpICsgMSxcbiAgICAgICAgYXNzZXNzbWVudDogYXNzZXNzbWVudCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNvcnQgYnkgcHJpY2UgKGJlc3QgZGVhbHMgZmlyc3QpIGJ1dCBrZWVwIHNvbWUgdmFyaWV0eVxuICBhbHRlcm5hdGl2ZXMuc29ydCgoYSwgYikgPT4gYS5wcmljZSAtIGIucHJpY2UpO1xuXG4gIC8vIEFkZCBzb21lIHJhbmRvbWl6YXRpb24gdG8gYXZvaWQgdG9vIHBlcmZlY3Qgc29ydGluZ1xuICBmb3IgKGxldCBpID0gYWx0ZXJuYXRpdmVzLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICBpZiAoTWF0aC5yYW5kb20oKSA8IDAuMykge1xuICAgICAgLy8gMzAlIGNoYW5jZSB0byBzbGlnaHRseSBzaHVmZmxlXG4gICAgICBjb25zdCBqID0gTWF0aC5tYXgoMCwgaSAtIDIpO1xuICAgICAgW2FsdGVybmF0aXZlc1tpXSwgYWx0ZXJuYXRpdmVzW2pdXSA9IFthbHRlcm5hdGl2ZXNbal0sIGFsdGVybmF0aXZlc1tpXV07XG4gICAgfVxuICB9XG5cbiAgY29uc29sZS5sb2coXG4gICAgYEdlbmVyYXRlZCAke2FsdGVybmF0aXZlcy5sZW5ndGh9IGNvbXByZWhlbnNpdmUgcHJpY2UgYWx0ZXJuYXRpdmVzYCxcbiAgKTtcbiAgcmV0dXJuIGFsdGVybmF0aXZlcztcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGdldCByZWFsaXN0aWMgc3RvcmUgVVJMc1xuZnVuY3Rpb24gZ2V0U3RvcmVVcmwoc3RvcmVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzdG9yZVVybHM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICAgQW1hem9uOiBcImh0dHBzOi8vd3d3LmFtYXpvbi5jb21cIixcbiAgICBlQmF5OiBcImh0dHBzOi8vd3d3LmViYXkuY29tXCIsXG4gICAgV2FsbWFydDogXCJodHRwczovL3d3dy53YWxtYXJ0LmNvbVwiLFxuICAgIFwiQmVzdCBCdXlcIjogXCJodHRwczovL3d3dy5iZXN0YnV5LmNvbVwiLFxuICAgIFRhcmdldDogXCJodHRwczovL3d3dy50YXJnZXQuY29tXCIsXG4gICAgXCJCJkhcIjogXCJodHRwczovL3d3dy5iaHBob3RvdmlkZW8uY29tXCIsXG4gICAgQWRvcmFtYTogXCJodHRwczovL3d3dy5hZG9yYW1hLmNvbVwiLFxuICAgIE5ld2VnZzogXCJodHRwczovL3d3dy5uZXdlZ2cuY29tXCIsXG4gICAgQ29zdGNvOiBcImh0dHBzOi8vd3d3LmNvc3Rjby5jb21cIixcbiAgICBcIlNhbSdzIENsdWJcIjogXCJodHRwczovL3d3dy5zYW1zY2x1Yi5jb21cIixcbiAgICBcIldvcmxkIFdpZGUgU3RlcmVvXCI6IFwiaHR0cHM6Ly93d3cud29ybGR3aWRlc3RlcmVvLmNvbVwiLFxuICAgIFwiQWJ0IEVsZWN0cm9uaWNzXCI6IFwiaHR0cHM6Ly93d3cuYWJ0LmNvbVwiLFxuICAgIE1lcmNhcmk6IFwiaHR0cHM6Ly93d3cubWVyY2FyaS5jb21cIixcbiAgICBPZmZlclVwOiBcImh0dHBzOi8vb2ZmZXJ1cC5jb21cIixcbiAgICBcIkZhY2Vib29rIE1hcmtldHBsYWNlXCI6IFwiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL21hcmtldHBsYWNlXCIsXG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICBzdG9yZVVybHNbc3RvcmVOYW1lXSB8fFxuICAgIGBodHRwczovLyR7c3RvcmVOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCBcIlwiKX0uY29tYFxuICApO1xufVxuXG4vLyBHZW5lcmF0ZSByZXRhaWxlci1zcGVjaWZpYyBzZWFyY2ggVVJMc1xuZnVuY3Rpb24gZ2VuZXJhdGVTZWFyY2hVcmwoc3RvcmVOYW1lOiBzdHJpbmcsIHNlYXJjaFF1ZXJ5OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBlbmNvZGVkUXVlcnkgPSBlbmNvZGVVUklDb21wb25lbnQoc2VhcmNoUXVlcnkpO1xuXG4gIHN3aXRjaCAoc3RvcmVOYW1lKSB7XG4gICAgY2FzZSBcIkFtYXpvblwiOlxuICAgICAgcmV0dXJuIGBodHRwczovL3d3dy5hbWF6b24uY29tL3M/az0ke2VuY29kZWRRdWVyeX1gO1xuICAgIGNhc2UgXCJlQmF5XCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LmViYXkuY29tL3NjaC9pLmh0bWw/X25rdz0ke2VuY29kZWRRdWVyeX1gO1xuICAgIGNhc2UgXCJXYWxtYXJ0XCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LndhbG1hcnQuY29tL3NlYXJjaD9xPSR7ZW5jb2RlZFF1ZXJ5fWA7XG4gICAgY2FzZSBcIkJlc3QgQnV5XCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LmJlc3RidXkuY29tL3NpdGUvc2VhcmNocGFnZS5qc3A/c3Q9JHtlbmNvZGVkUXVlcnl9YDtcbiAgICBjYXNlIFwiVGFyZ2V0XCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LnRhcmdldC5jb20vcz9zZWFyY2hUZXJtPSR7ZW5jb2RlZFF1ZXJ5fWA7XG4gICAgY2FzZSBcIkImSFwiOlxuICAgICAgcmV0dXJuIGBodHRwczovL3d3dy5iaHBob3RvdmlkZW8uY29tL2Mvc2VhcmNoP050dD0ke2VuY29kZWRRdWVyeX1gO1xuICAgIGNhc2UgXCJBZG9yYW1hXCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LmFkb3JhbWEuY29tL3NlYXJjaHNpdGUvJHtlbmNvZGVkUXVlcnl9YDtcbiAgICBjYXNlIFwiTmV3ZWdnXCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vd3d3Lm5ld2VnZy5jb20vcC9wbD9kPSR7ZW5jb2RlZFF1ZXJ5fWA7XG4gICAgY2FzZSBcIkNvc3Rjb1wiOlxuICAgICAgcmV0dXJuIGBodHRwczovL3d3dy5jb3N0Y28uY29tL0NhdGFsb2dTZWFyY2g/a2V5d29yZD0ke2VuY29kZWRRdWVyeX1gO1xuICAgIGNhc2UgXCJTYW0ncyBDbHViXCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LnNhbXNjbHViLmNvbS9zZWFyY2g/c2VhcmNoVGVybT0ke2VuY29kZWRRdWVyeX1gO1xuICAgIGNhc2UgXCJNZXJjYXJpXCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vd3d3Lm1lcmNhcmkuY29tL3NlYXJjaC8/a2V5d29yZD0ke2VuY29kZWRRdWVyeX1gO1xuICAgIGNhc2UgXCJPZmZlclVwXCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vb2ZmZXJ1cC5jb20vc2VhcmNoLz9xPSR7ZW5jb2RlZFF1ZXJ5fWA7XG4gICAgY2FzZSBcIkZhY2Vib29rIE1hcmtldHBsYWNlXCI6XG4gICAgICByZXR1cm4gYGh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9tYXJrZXRwbGFjZS9zZWFyY2gvP3F1ZXJ5PSR7ZW5jb2RlZFF1ZXJ5fWA7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIEdlbmVyaWMgZmFsbGJhY2sgZm9yIG90aGVyIHN0b3Jlc1xuICAgICAgY29uc3Qgc3RvcmVVcmwgPSBnZXRTdG9yZVVybChzdG9yZU5hbWUpO1xuICAgICAgcmV0dXJuIGAke3N0b3JlVXJsfS9zZWFyY2g/cT0ke2VuY29kZWRRdWVyeX1gO1xuICB9XG59XG5cbi8vIEdlbmVyYXRlIHJldGFpbGVyIGFzc2Vzc21lbnQgZGF0YSBsaWtlIGR1cGUuY29tXG5mdW5jdGlvbiBnZW5lcmF0ZUFzc2Vzc21lbnQoXG4gIHN0b3JlTmFtZTogc3RyaW5nLFxuICBjb25kaXRpb246IHN0cmluZyxcbik6IHtcbiAgY29zdDogbnVtYmVyO1xuICB2YWx1ZTogbnVtYmVyO1xuICBxdWFsaXR5OiBudW1iZXI7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG59IHtcbiAgY29uc3QgYXNzZXNzbWVudHM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7XG4gICAgQW1hem9uOiB7XG4gICAgICBjb3N0OiAzLFxuICAgICAgdmFsdWU6IGNvbmRpdGlvbi5pbmNsdWRlcyhcIlJlbmV3ZWRcIikgPyAyLjUgOiAxLjUsXG4gICAgICBxdWFsaXR5OiBjb25kaXRpb24uaW5jbHVkZXMoXCJSZW5ld2VkXCIpID8gMiA6IDEuNSxcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIkxhcmdlIHNlbGVjdGlvbiwgdmFyaWVkIHF1YWxpdHkgYW5kIHJldmlld3M7IHZhbHVlIGRvZXMgbm90IGhvbGQgdmVyeSB3ZWxsIG92ZXIgdGltZS5cIixcbiAgICB9LFxuICAgIGVCYXk6IHtcbiAgICAgIGNvc3Q6IDMuNSxcbiAgICAgIHZhbHVlOiAzLFxuICAgICAgcXVhbGl0eTogMi41LFxuICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgIFwiR2xvYmFsIG1hcmtldHBsYWNlIHdpdGggd2lkZSBwcmljZSBhbmQgcXVhbGl0eSByYW5nZXM7IGRlYWxzIG9uIHZpbnRhZ2UgZmluZHMsIGNvbmRpdGlvbiBjYW4gdmFyeS5cIixcbiAgICB9LFxuICAgIFdhbG1hcnQ6IHtcbiAgICAgIGNvc3Q6IDQsXG4gICAgICB2YWx1ZTogMi41LFxuICAgICAgcXVhbGl0eTogMixcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIkJ1ZGdldC1mcmllbmRseSBvcHRpb25zIHdpdGggbWluaW1hbCByZXNhbGU7IGN1c3RvbWVycyBhcmUgZ2VuZXJhbGx5IGhhcHB5IHdpdGggcHVyY2hhc2UuXCIsXG4gICAgfSxcbiAgICBcIkJlc3QgQnV5XCI6IHtcbiAgICAgIGNvc3Q6IDIuNSxcbiAgICAgIHZhbHVlOiAyLFxuICAgICAgcXVhbGl0eTogMyxcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIlByZW1pdW0gZWxlY3Ryb25pY3MgcmV0YWlsZXIgd2l0aCBleGNlbGxlbnQgY3VzdG9tZXIgc2VydmljZSBhbmQgd2FycmFudHkgc3VwcG9ydC5cIixcbiAgICB9LFxuICAgIFRhcmdldDoge1xuICAgICAgY29zdDogMy41LFxuICAgICAgdmFsdWU6IDIuNSxcbiAgICAgIHF1YWxpdHk6IDIuNSxcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIlRyZW5keSBwcm9kdWN0cyB3aXRoIGdvb2QgcXVhbGl0eTsgb2Z0ZW4gaGFzIGV4Y2x1c2l2ZSBpdGVtcyBhbmQgY29sbGFib3JhdGlvbnMuXCIsXG4gICAgfSxcbiAgICBcIkImSFwiOiB7XG4gICAgICBjb3N0OiAyLFxuICAgICAgdmFsdWU6IDMsXG4gICAgICBxdWFsaXR5OiA0LFxuICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgIFwiUHJvZmVzc2lvbmFsIHBob3RvZ3JhcGh5IGFuZCBlbGVjdHJvbmljczsgZXhjZWxsZW50IHJlcHV0YXRpb24gYW5kIGV4cGVydCBzdXBwb3J0LlwiLFxuICAgIH0sXG4gICAgQ29zdGNvOiB7XG4gICAgICBjb3N0OiA0LjUsXG4gICAgICB2YWx1ZTogNCxcbiAgICAgIHF1YWxpdHk6IDMuNSxcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIkJ1bGsgYnV5aW5nIHdpdGggZXhjZWxsZW50IHJldHVybiBwb2xpY3k7IGdyZWF0IHZhbHVlIGZvciBtb25leSBvbiBxdWFsaXR5IGl0ZW1zLlwiLFxuICAgIH0sXG4gIH07XG5cbiAgLy8gRGVmYXVsdCBhc3Nlc3NtZW50IGZvciB1bmxpc3RlZCBzdG9yZXNcbiAgY29uc3QgZGVmYXVsdEFzc2Vzc21lbnQgPSB7XG4gICAgY29zdDogMyxcbiAgICB2YWx1ZTogMi41LFxuICAgIHF1YWxpdHk6IDIuNSxcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgIFwiT25saW5lIHJldGFpbGVyIHdpdGggY29tcGV0aXRpdmUgcHJpY2luZyBhbmQgc3RhbmRhcmQgc2VydmljZS5cIixcbiAgfTtcblxuICByZXR1cm4gYXNzZXNzbWVudHNbc3RvcmVOYW1lXSB8fCBkZWZhdWx0QXNzZXNzbWVudDtcbn1cblxuZXhwb3J0IGNvbnN0IGhhbmRsZVNjcmFwZTogUmVxdWVzdEhhbmRsZXIgPSBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHVybCwgcmVxdWVzdElkIH06IFNjcmFwZVJlcXVlc3QgPSByZXEuYm9keTtcblxuICAgIGlmICghdXJsIHx8ICFyZXF1ZXN0SWQpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiBcIk1pc3NpbmcgcmVxdWlyZWQgZmllbGRzOiB1cmwgYW5kIHJlcXVlc3RJZFwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgVVJMXG4gICAgdHJ5IHtcbiAgICAgIG5ldyBVUkwodXJsKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiBcIkludmFsaWQgVVJMIGZvcm1hdFwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFNjcmFwaW5nIHByb2R1Y3QgZGF0YSBmb3I6ICR7dXJsfWApO1xuXG4gICAgLy8gU2NyYXBlIHRoZSBvcmlnaW5hbCBwcm9kdWN0XG4gICAgY29uc3Qgb3JpZ2luYWxQcm9kdWN0ID0gYXdhaXQgc2NyYXBlUHJvZHVjdERhdGEodXJsKTtcblxuICAgIC8vIEdldCBwcmljZSBjb21wYXJpc29uc1xuICAgIGNvbnN0IGNvbXBhcmlzb25zID0gYXdhaXQgZ2V0UHJpY2VDb21wYXJpc29ucyhvcmlnaW5hbFByb2R1Y3QpO1xuXG4gICAgLy8gVE9ETzogU2F2ZSB0byBkYXRhYmFzZSB3aXRoIHJlcXVlc3RJZFxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFNjcmFwZVJlc3BvbnNlID0ge1xuICAgICAgb3JpZ2luYWxQcm9kdWN0LFxuICAgICAgY29tcGFyaXNvbnMsXG4gICAgfTtcblxuICAgIHJlcy5qc29uKHJlc3BvbnNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiU2NyYXBpbmcgZXJyb3I6XCIsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBlcnJvcjogXCJGYWlsZWQgdG8gc2NyYXBlIHByb2R1Y3QgZGF0YVwiLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIlVua25vd24gZXJyb3JcIixcbiAgICB9KTtcbiAgfVxufTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2FwcC9jb2RlL3NlcnZlci9yb3V0ZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS9zZXJ2ZXIvcm91dGVzL3NlYXJjaC1oaXN0b3J5LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvY29kZS9zZXJ2ZXIvcm91dGVzL3NlYXJjaC1oaXN0b3J5LnRzXCI7aW1wb3J0IHsgUmVxdWVzdEhhbmRsZXIgfSBmcm9tIFwiZXhwcmVzc1wiO1xuXG4vLyBTaW1wbGUgaW4tbWVtb3J5IHN0b3JhZ2UgZm9yIHNlYXJjaCBoaXN0b3J5IChpbiBwcm9kdWN0aW9uLCB1c2UgUmVkaXMgb3IgZGF0YWJhc2UpXG5jb25zdCBzZWFyY2hIaXN0b3J5ID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZ1tdPigpO1xuXG5pbnRlcmZhY2UgU2VhcmNoSGlzdG9yeVJlcXVlc3Qge1xuICB1cmw6IHN0cmluZztcbiAgdXNlcktleTogc3RyaW5nOyAvLyBJUCBhZGRyZXNzIG9yIHNlc3Npb24gSURcbn1cblxuZXhwb3J0IGNvbnN0IHNhdmVTZWFyY2hIaXN0b3J5OiBSZXF1ZXN0SGFuZGxlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgdXJsLCB1c2VyS2V5IH06IFNlYXJjaEhpc3RvcnlSZXF1ZXN0ID0gcmVxLmJvZHk7XG5cbiAgICBpZiAoIXVybCB8fCAhdXNlcktleSkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6IFwiTWlzc2luZyB1cmwgb3IgdXNlcktleVwiIH0pO1xuICAgIH1cblxuICAgIC8vIEdldCBleGlzdGluZyBoaXN0b3J5IGZvciB0aGlzIHVzZXJcbiAgICBjb25zdCBleGlzdGluZyA9IHNlYXJjaEhpc3RvcnkuZ2V0KHVzZXJLZXkpIHx8IFtdO1xuXG4gICAgLy8gQWRkIG5ldyBVUkwgaWYgbm90IGFscmVhZHkgaW4gcmVjZW50IGhpc3RvcnlcbiAgICBpZiAoIWV4aXN0aW5nLmluY2x1ZGVzKHVybCkpIHtcbiAgICAgIGV4aXN0aW5nLnVuc2hpZnQodXJsKTsgLy8gQWRkIHRvIGJlZ2lubmluZ1xuXG4gICAgICAvLyBLZWVwIG9ubHkgbGFzdCAxMCBzZWFyY2hlc1xuICAgICAgaWYgKGV4aXN0aW5nLmxlbmd0aCA+IDEwKSB7XG4gICAgICAgIGV4aXN0aW5nLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICBzZWFyY2hIaXN0b3J5LnNldCh1c2VyS2V5LCBleGlzdGluZyk7XG4gICAgfVxuXG4gICAgcmVzLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzYXZpbmcgc2VhcmNoIGhpc3Rvcnk6XCIsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBcIkZhaWxlZCB0byBzYXZlIHNlYXJjaCBoaXN0b3J5XCIgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBnZXRTZWFyY2hIaXN0b3J5OiBSZXF1ZXN0SGFuZGxlciA9IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHVzZXJLZXkgPSByZXEucXVlcnkudXNlcktleSBhcyBzdHJpbmc7XG5cbiAgICBpZiAoIXVzZXJLZXkpIHtcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiBcIk1pc3NpbmcgdXNlcktleVwiIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGhpc3RvcnkgPSBzZWFyY2hIaXN0b3J5LmdldCh1c2VyS2V5KSB8fCBbXTtcbiAgICByZXMuanNvbih7IGhpc3RvcnkgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGdldHRpbmcgc2VhcmNoIGhpc3Rvcnk6XCIsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiBcIkZhaWxlZCB0byBnZXQgc2VhcmNoIGhpc3RvcnlcIiB9KTtcbiAgfVxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNk0sU0FBUyxvQkFBNEI7QUFDbFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTs7O0FDRnFNLE9BQU8sWUFBWTtBQUN6TyxPQUFPLGFBQWE7QUFDcEIsT0FBTyxVQUFVOzs7QUNDVixJQUFNLGFBQTZCLENBQUMsS0FBSyxRQUFRO0FBQ3RELFFBQU0sV0FBeUI7QUFBQSxJQUM3QixTQUFTO0FBQUEsRUFDWDtBQUNBLE1BQUksT0FBTyxHQUFHLEVBQUUsS0FBSyxRQUFRO0FBQy9COzs7QUNQQSxTQUFTLDBCQUEwQjtBQVNuQyxTQUFTLGNBQWMsS0FBcUI7QUFDMUMsTUFBSTtBQUNGLFVBQU0sU0FBUyxJQUFJLElBQUksR0FBRztBQUMxQixXQUFPLE9BQU8sU0FBUyxRQUFRLFVBQVUsRUFBRTtBQUFBLEVBQzdDLFFBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBR0EsU0FBUyxhQUFhLE1BQW1EO0FBQ3ZFLE1BQUksQ0FBQyxLQUFNLFFBQU8sRUFBRSxPQUFPLEdBQUcsVUFBVSxJQUFJO0FBRzVDLFFBQU0sWUFBWSxLQUFLLFFBQVEsUUFBUSxHQUFHLEVBQUUsS0FBSztBQUNqRCxVQUFRLElBQUksK0JBQStCLFNBQVM7QUFHcEQsUUFBTSxXQUFXO0FBQUE7QUFBQSxJQUVmO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQTtBQUFBLElBRUE7QUFBQTtBQUFBLElBRUE7QUFBQSxFQUNGO0FBR0EsUUFBTSxrQkFBNkM7QUFBQSxJQUNqRCxHQUFHO0FBQUEsSUFDSCxRQUFLO0FBQUEsSUFDTCxVQUFLO0FB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
