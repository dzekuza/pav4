# N8N Flow Improvements for Better Product Extraction

## Current Issues Identified

1. **Limited CSS Selectors** - Current selectors are too generic
2. **Basic JSON-LD Extraction** - Only handles simple cases
3. **Price Format Inconsistency** - No currency normalization
4. **Product Name Cleaning** - AI prompt could be more specific
5. **Missing Structured Data** - Not utilizing all available data sources

## Enhanced Extraction Methods

### 1. Improved HTML Extract Node

Replace the current CSS selectors with more comprehensive ones:

```json
{
    "extractionValues": {
        "values": [
            {
                "key": "title",
                "cssSelector": "meta[property='og:title'], meta[name='twitter:title'], h1.product-title, h1[class*='title'], .product-name, [itemprop='name'], .product__title, .product-title, h1",
                "returnValue": "attribute",
                "attribute": "content"
            },
            {
                "key": "price",
                "cssSelector": "[itemprop='price'], .price, .product-price, [class*='price'], .ProductPrice-productPrice, .product__price, .price__value, .price-final_price, .productPrice, .price-tag, .productPrice-value, .priceValue, .price-display, .productView-price, .product-pricing, .price__amount, .current-price, .product-detail-price, .price-current, .price-sale, .price-regular, .price-discount, .price-range, .price-from, .price-to",
                "returnValue": "text"
            },
            {
                "key": "currency",
                "cssSelector": "[itemprop='priceCurrency'], .currency, .price-currency, [class*='currency']",
                "returnValue": "text"
            },
            {
                "key": "image",
                "cssSelector": "meta[property='og:image'], meta[name='twitter:image'], img[src*='product'], img.main-image, .product-image img, .product__image img, [itemprop='image']",
                "returnValue": "attribute",
                "attribute": "content"
            },
            {
                "key": "brand",
                "cssSelector": "[itemprop='brand'], .brand, .product-brand, [class*='brand'], .manufacturer",
                "returnValue": "text"
            },
            {
                "key": "sku",
                "cssSelector": "[itemprop='sku'], .sku, .product-sku, [class*='sku'], .product-code",
                "returnValue": "text"
            },
            {
                "key": "availability",
                "cssSelector": "[itemprop='availability'], .availability, .stock-status, [class*='stock']",
                "returnValue": "text"
            }
        ]
    }
}
```

### 2. Enhanced JSON-LD Extraction

Replace the current "Extract Price JSON-LD1" node with this improved version:

```javascript
const html = $json.html || "";

let extractedData = {
    price: null,
    currency: null,
    availability: null,
    brand: null,
    sku: null,
    description: null,
    category: null,
    rating: null,
    reviewsCount: null,
};

// 1. Extract all JSON-LD scripts
const jsonLdScripts = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
);

if (jsonLdScripts) {
    for (const tag of jsonLdScripts) {
        try {
            const clean = tag.replace(/<script[^>]*>|<\/script>/g, "");
            const json = JSON.parse(clean);

            // Handle different JSON-LD structures
            const product = json["@graph"]?.find((item) =>
                item["@type"] === "Product"
            ) ||
                (json["@type"] === "Product" ? json : null) ||
                json.product ||
                json;

            if (product) {
                // Extract price information
                if (product.offers) {
                    const offers = Array.isArray(product.offers)
                        ? product.offers
                        : [product.offers];
                    for (const offer of offers) {
                        if (offer.price && !extractedData.price) {
                            extractedData.price = offer.price;
                            extractedData.currency = offer.priceCurrency ||
                                "EUR";
                        }
                        if (offer.availability && !extractedData.availability) {
                            extractedData.availability = offer.availability;
                        }
                    }
                }

                // Extract other product information
                if (product.brand && !extractedData.brand) {
                    extractedData.brand = typeof product.brand === "string"
                        ? product.brand
                        : product.brand.name;
                }

                if (product.sku && !extractedData.sku) {
                    extractedData.sku = product.sku;
                }

                if (product.description && !extractedData.description) {
                    extractedData.description = product.description;
                }

                if (product.category && !extractedData.category) {
                    extractedData.category = product.category;
                }

                if (product.aggregateRating && !extractedData.rating) {
                    extractedData.rating = product.aggregateRating.ratingValue;
                    extractedData.reviewsCount =
                        product.aggregateRating.reviewCount;
                }
            }
        } catch (err) {
            continue;
        }
    }
}

// 2. Fallback: Extract from meta tags
if (!extractedData.price) {
    const priceMeta = html.match(
        /<meta[^>]*property="product:price:amount"[^>]*content="([^"]*)"/i,
    );
    if (priceMeta) {
        extractedData.price = priceMeta[1];
    }

    const currencyMeta = html.match(
        /<meta[^>]*property="product:price:currency"[^>]*content="([^"]*)"/i,
    );
    if (currencyMeta) {
        extractedData.currency = currencyMeta[1];
    }
}

// 3. Clean and normalize price
if (typeof extractedData.price === "string") {
    const cleanPrice = extractedData.price.match(/[\d.,]+/g);
    extractedData.price = cleanPrice ? cleanPrice[0] : null;
}

return [{ json: extractedData }];
```

### 3. Improved Product Name Cleaning

Enhance the AI Agent prompt for better product name extraction:

```javascript
// Updated AI Agent prompt
const prompt =
    `You are a product data extraction expert. Analyze the following product headline and extract ONLY the essential product information that can be used for accurate product searches.

Input: "{{ $json.shortTitle }}"

Extraction Rules:
1. Extract ONLY brand name and model number/specifications
2. Remove marketing words like "best price", "cheap", "discount", "sale"
3. Remove retailer-specific information
4. Keep technical specifications (size, color, capacity, etc.)
5. Normalize brand names to standard format
6. Remove language-specific words that don't help with search

Examples:
Input: "Indaplovė Indų plovimo mašina BEKO BDFN26440XC Plienas 60 cm"
Output: "BEKO BDFN26440XC"

Input: "Best price for iPhone 16PRO MAX in Europe"
Output: "iPhone 16 Pro Max"

Input: "Samsung Galaxy S24 Ultra 256GB Phantom Black"
Output: "Samsung Galaxy S24 Ultra 256GB"

Return ONLY the cleaned product name, nothing else.`;
```

### 4. Price Normalization Node

Add a new Code node for price normalization:

```javascript
const priceData = $input.first().json;

// Normalize price formats
function normalizePrice(price, currency) {
    if (!price) return null;

    // Remove currency symbols and spaces
    let cleanPrice = String(price).replace(/[€$£¥₹₽₩₪₦₨₫₴₸₺₼₾₿\s]/g, "");

    // Handle different decimal separators
    cleanPrice = cleanPrice.replace(",", ".");

    // Extract numeric value
    const match = cleanPrice.match(/[\d.]+/);
    if (!match) return null;

    const numericPrice = parseFloat(match[0]);

    // Convert to EUR if needed
    const currencyMap = {
        "USD": 0.85,
        "GBP": 1.17,
        "PLN": 0.22,
        "CZK": 0.04,
        "HUF": 0.0027,
        "RON": 0.20,
        "BGN": 0.51,
        "HRK": 0.13,
        "DKK": 0.13,
        "SEK": 0.087,
        "NOK": 0.087,
        "CHF": 0.93,
    };

    const rate = currencyMap[currency?.toUpperCase()] || 1;
    return Math.round(numericPrice * rate * 100) / 100;
}

const normalizedPrice = normalizePrice(priceData.price, priceData.currency);

return [{
    json: {
        ...priceData,
        normalizedPrice,
        originalPrice: priceData.price,
        originalCurrency: priceData.currency,
    },
}];
```

### 5. Enhanced Search Query Generation

Improve the search query generation for better competitor price finding:

```javascript
const productData = $input.first().json;

// Generate multiple search variations
const searchQueries = [];

// 1. Brand + Model (most specific)
if (productData.brand && productData.sku) {
    searchQueries.push(`${productData.brand} ${productData.sku}`);
}

// 2. Brand + Model from title
if (productData.brand && productData.title) {
    const modelMatch = productData.title.match(/([A-Z0-9]{6,})/);
    if (modelMatch) {
        searchQueries.push(`${productData.brand} ${modelMatch[1]}`);
    }
}

// 3. Cleaned title from AI
if (productData.cleanedTitle) {
    searchQueries.push(productData.cleanedTitle);
}

// 4. Fallback to original title
if (productData.title) {
    searchQueries.push(productData.title);
}

// Add price comparison keywords
const priceKeywords = ["price", "buy", "compare", "best price", "cheapest"];
const enhancedQueries = [];

for (const query of searchQueries) {
    for (const keyword of priceKeywords) {
        enhancedQueries.push(`${query} ${keyword}`);
    }
}

return [{
    json: {
        searchQueries: enhancedQueries.slice(0, 5), // Limit to 5 best queries
        primaryQuery: searchQueries[0] || productData.title,
    },
}];
```

### 6. Improved Price Extraction from Search Results

Enhance the Code11 node for better price extraction:

```javascript
const items = $json.organic_results || [];

const parsed = items.slice(0, 10).map((result) => {
    const title = result.title || "";
    const link = result.link || "";
    const domain = result.domain ||
        (link.match(/^https?:\/\/([^/?#]+)/)?.[1] || null);
    const favicon = result.favicon || null;
    const snippet = result.snippet || "";
    const richSnippet = result.rich_snippet || {};

    let price = null;
    let originalPrice = null;
    let discountPrice = null;
    let deliveryPrice = null;
    let details = richSnippet?.top?.extensions?.join(", ") || "";
    let stock = null;
    let merchant = result.source || domain;
    let returnPolicy = null;
    let rating = null;
    let reviewsCount = null;

    // Enhanced price extraction from rich snippets
    const extensions = richSnippet?.extensions || [];
    for (const ext of extensions) {
        const text = typeof ext === "string" ? ext : String(ext);

        // Multiple price patterns
        const pricePatterns = [
            /[€$£¥₹₽₩₪₦₨₫₴₸₺₼₾₿]\s?[\d,]+(?:[.,]\d{2})?/g,
            /[\d,]+(?:[.,]\d{2})?\s?[€$£¥₹₽₩₪₦₨₫₴₸₺₼₾₿]/g,
            /price:\s*[€$£¥₹₽₩₪₦₨₫₴₸₺₼₾₿]?\s*[\d,]+(?:[.,]\d{2})?/gi,
        ];

        for (const pattern of pricePatterns) {
            const matches = text.match(pattern);
            if (matches && !price) {
                price = matches[0];
                break;
            }
        }

        // Extract other information
        if (!deliveryPrice && text.toLowerCase().includes("delivery")) {
            deliveryPrice = text;
        }
        if (
            !stock && /(in stock|out of stock|preorder|available)/i.test(text)
        ) {
            stock = text;
        }
        if (!returnPolicy && /(return|free returns|days return)/i.test(text)) {
            returnPolicy = text;
        }
        if (!rating && text.match(/([0-5](\.\d)?)(\s*stars?)/i)) {
            rating = text.match(/([0-5](\.\d)?)(\s*stars?)/i)[1];
        }
        if (!reviewsCount && text.match(/\d{1,5}\s*(ratings|reviews)/i)) {
            reviewsCount = text.match(/\d{1,5}/)[0];
        }
    }

    // Fallback: Extract from snippet
    if (!price && snippet) {
        const pricePatterns = [
            /[€$£¥₹₽₩₪₦₨₫₴₸₺₼₾₿]\s?[\d,]+(?:[.,]\d{2})?/g,
            /[\d,]+(?:[.,]\d{2})?\s?[€$£¥₹₽₩₪₦₨₫₴₸₺₼₾₿]/g,
        ];

        for (const pattern of pricePatterns) {
            const match = snippet.match(pattern);
            if (match) {
                price = match[0];
                break;
            }
        }
    }

    return {
        title,
        standardPrice: price || null,
        discountPrice: discountPrice || null,
        originalPrice: originalPrice || null,
        deliveryPrice: deliveryPrice || null,
        details: details || null,
        stock: stock || null,
        merchant: merchant || null,
        returnPolicy: returnPolicy || null,
        rating: rating || null,
        reviewsCount: reviewsCount || null,
        site: domain,
        link,
        image: favicon,
    };
});

return parsed.map((p) => ({ json: p }));
```

## Implementation Steps

1. **Update HTML Extract node** with enhanced CSS selectors
2. **Replace Extract Price JSON-LD1** with the improved JSON-LD extraction
3. **Add Price Normalization node** after the merge
4. **Update AI Agent prompt** for better product name cleaning
5. **Add Search Query Generation node** before HTTP Request5
6. **Update Code11 node** with enhanced price extraction
7. **Add error handling** and validation nodes

## Additional Recommendations

1. **Add retry logic** for failed HTTP requests
2. **Implement rate limiting** for SearchAPI calls
3. **Add data validation** nodes to ensure quality
4. **Create fallback extraction methods** for different website structures
5. **Add logging** for debugging extraction issues

These improvements will significantly enhance your product price and name
extraction accuracy across different e-commerce platforms.
