// n8n webhook route - only handles data from n8n platform
import express from "express";
import axios from "axios";
import { ProductData, PriceComparison } from "../../shared/api";
import { Request, Response } from "express";
import { businessService, searchService } from "../services/database";

const router = express.Router();

// Helper function to extract price from string
function extractPrice(text: string): number | null {
  const match = text.match(/(\d{1,4}[.,]?\d{2})/);
  return match ? parseFloat(match[1].replace(",", ".")) : null;
}

// Helper function to extract currency from price string
function extractCurrency(priceString: string): string {
  if (priceString.includes("€")) return "€";
  if (priceString.includes("$")) return "$";
  if (priceString.includes("£")) return "£";
  return "€"; // Default to Euro
}

// Helper to add UTM params to a URL
function addUtmToUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "ipick.io");
    u.searchParams.set("utm_medium", "suggestion");
    u.searchParams.set("utm_campaign", "business_tracking");
    return u.toString();
  } catch {
    return url;
  }
}

// n8n webhook function - only calls n8n and returns the response
async function scrapeWithN8nWebhook(url: string, gl?: string): Promise<any> {
  try {
    console.log("Calling n8n webhook for URL:", url, "GL:", gl);

    const n8nWebhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      "https://n8n.srv824584.hstgr.cloud/webhook/new-test";

    console.log("Environment N8N_WEBHOOK_URL:", process.env.N8N_WEBHOOK_URL);
    console.log("Using n8n webhook URL:", n8nWebhookUrl);

    const params: any = { url };
    if (gl) {
      params.gl = gl;
    }

    console.log(
      "Full URL being called:",
      `${n8nWebhookUrl}?${new URLSearchParams(params).toString()}`,
    );

    console.log("Making axios request with params:", params);
    console.log("Full URL being called:", `${n8nWebhookUrl}?${new URLSearchParams(params).toString()}`);
    
    const response = await axios.get(n8nWebhookUrl, {
      params: params,
      timeout: 60000, // 60 second timeout
      headers: {
        "Accept": "*/*",
        "User-Agent": "curl/8.7.1",
      },
    });

    console.log("n8n webhook response status:", response.status);
    console.log(
      "n8n webhook response data:",
      JSON.stringify(response.data, null, 2),
    );

    if (response.status !== 200) {
      throw new Error(`n8n webhook returned status ${response.status}`);
    }

    const data = response.data;

    // Handle the n8n response format (array with single object containing mainProduct and suggestions)
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      data[0].mainProduct &&
      Array.isArray(data[0].suggestions)
    ) {
      console.log(
        "Handling n8n response format (array with mainProduct and suggestions)",
      );

      const firstItem = data[0];
      const mainProduct = firstItem.mainProduct;

      // Convert suggestions to PriceComparison format
      const comparisons: PriceComparison[] = firstItem.suggestions.map(
        (suggestion: any) => ({
          title: suggestion.title,
          store: suggestion.site || "unknown",
          price: extractPrice(
            suggestion.standardPrice || suggestion.discountPrice || "0",
          ),
          currency: extractCurrency(
            suggestion.standardPrice || suggestion.discountPrice || "",
          ),
          url: addUtmToUrl(suggestion.link),
          image: suggestion.image,
          condition: "New",
          // New fields
          merchant: suggestion.merchant,
          stock: suggestion.stock,
          reviewsCount: suggestion.reviewsCount,
          deliveryPrice: suggestion.deliveryPrice,
          details: suggestion.details,
          returnPolicy: suggestion.returnPolicy,
          rating: suggestion.rating ? parseFloat(suggestion.rating) : undefined,
          assessment: {
            cost: 3,
            value: 3,
            quality: 3,
            description: `Found on ${suggestion.site || "unknown"}`,
          },
        }),
      );
      // Also update suggestions array
      firstItem.suggestions = firstItem.suggestions.map((s: any) => ({
        ...s,
        link: addUtmToUrl(s.link),
      }));

      return {
        mainProduct: {
          title: mainProduct.title,
          price: mainProduct.price,
          image: mainProduct.image,
          url: addUtmToUrl(mainProduct.url),
        },
        suggestions: firstItem.suggestions,
        comparisons: comparisons,
      };
    }

    // Handle the n8n response format (single object with mainProduct and suggestions)
    if (data && data.mainProduct && Array.isArray(data.suggestions)) {
      console.log(
        "Handling n8n response format (single object with mainProduct and suggestions)",
      );

      // Convert suggestions to PriceComparison format
      const comparisons: PriceComparison[] = data.suggestions.map(
        (suggestion: any) => ({
          title: suggestion.title,
          store: suggestion.site || "unknown",
          price: extractPrice(
            suggestion.standardPrice || suggestion.discountPrice || "0",
          ),
          currency: extractCurrency(
            suggestion.standardPrice || suggestion.discountPrice || "",
          ),
          url: addUtmToUrl(suggestion.link),
          image: suggestion.image,
          condition: "New",
          assessment: {
            cost: 3,
            value: 3,
            quality: 3,
            description: `Found on ${suggestion.site || "unknown"}`,
          },
        }),
      );
      // Also update suggestions array
      data.suggestions = data.suggestions.map((s: any) => ({
        ...s,
        link: addUtmToUrl(s.link),
      }));

      return {
        mainProduct: {
          title: data.mainProduct.title,
          price: data.mainProduct.price,
          image: data.mainProduct.image,
          url: addUtmToUrl(data.mainProduct.url),
        },
        suggestions: data.suggestions,
        comparisons: comparisons,
      };
    }

    // Handle new n8n response format (single object with all fields)
    if (data && data.title && (data.standardPrice || data.discountPrice)) {
      console.log("Handling n8n response format (single object)");

      // Convert single object to the expected format
      const mainProduct = {
        title: data.title,
        price:
          data.standardPrice || data.discountPrice || "Price not available",
        image: data.image,
        url: addUtmToUrl(data.link),
      };

      const suggestion = {
        title: data.title,
        standardPrice: data.standardPrice,
        discountPrice: data.discountPrice,
        site: data.site,
        link: addUtmToUrl(data.link),
        image: data.image,
        // New fields
        merchant: data.merchant,
        stock: data.stock,
        reviewsCount: data.reviewsCount,
        deliveryPrice: data.deliveryPrice,
        details: data.details,
        returnPolicy: data.returnPolicy,
        rating: data.rating,
      };

      const comparison: PriceComparison = {
        title: data.title,
        store: data.site || "unknown",
        price: extractPrice(data.standardPrice || data.discountPrice || "0"),
        currency: extractCurrency(
          data.standardPrice || data.discountPrice || "",
        ),
        url: addUtmToUrl(data.link),
        image: data.image,
        condition: "New",
        // New fields
        merchant: data.merchant,
        stock: data.stock,
        reviewsCount: data.reviewsCount,
        deliveryPrice: data.deliveryPrice,
        details: data.details,
        returnPolicy: data.returnPolicy,
        rating: data.rating ? parseFloat(data.rating) : undefined,
        assessment: {
          cost: 3,
          value: 3,
          quality: 3,
          description: `Found on ${data.site || "unknown"}`,
        },
      };

      return {
        mainProduct: mainProduct,
        suggestions: [suggestion],
        comparisons: [comparison],
      };
    }

    // Handle new n8n response format (single object with all fields, keyword search)
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      !data.mainProduct &&
      data.title &&
      data.link
    ) {
      // Wrap single object in array for keyword search
      return [data];
    }

    // If response is an array, return as is
    if (Array.isArray(data)) {
      return data;
    }

    // If response is empty or invalid, throw an error
    if (!data || Object.keys(data).length === 0) {
      console.log("n8n webhook returned empty data");
      throw new Error("No product data received from webhook");
    }

    throw new Error("Invalid n8n webhook response format");
  } catch (error) {
    console.error("n8n webhook error:", error);

    // If it's an axios error, log more details
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        headers: error.config?.headers,
        fullUrl:
          error.config?.url +
          "?" +
          new URLSearchParams(error.config?.params || {}).toString(),
      });
    }

    throw error;
  }
}

// Filter suggestions based on registered businesses
async function filterSuggestionsByRegisteredBusinesses(
  suggestions: any[],
): Promise<any[]> {
  try {
    console.log(
      `🔍 Processing ${suggestions.length} suggestions for verified badges`,
    );

    // Get all active registered businesses
    const registeredBusinesses = await businessService.getActiveBusinesses();
    console.log(
      `🏢 Found ${registeredBusinesses.length} registered businesses:`,
      registeredBusinesses.map(
        (b) => `${b.name} (${b.domain}) - verified: ${b.trackingVerified}`,
      ),
    );

    if (registeredBusinesses.length === 0) {
      // If no businesses are registered, return all suggestions without badges
      console.log(
        `❌ No registered businesses found, returning all ${suggestions.length} suggestions without badges`,
      );
      return suggestions;
    }

    // Create a set of registered domains for faster lookup
    const registeredDomains = new Set(
      registeredBusinesses.map((business) => business.domain.toLowerCase()),
    );
    console.log(`📋 Registered domains:`, Array.from(registeredDomains));

    // Create a map of domain to business for verification status
    const businessMap = new Map(
      registeredBusinesses.map((business) => [
        business.domain.toLowerCase(),
        business,
      ]),
    );

    // Add verification status to ALL suggestions
    const processedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        // Extract domain from site field first, then fallback to URL
        let domain = "";

        if (suggestion.site) {
          // Use the site field directly (e.g., "godislove.lt")
          domain = suggestion.site.toLowerCase().replace("www.", "");
        } else if (suggestion.url) {
          // Fallback to extracting from URL
          try {
            const url = new URL(suggestion.url);
            domain = url.hostname.toLowerCase().replace("www.", "");
          } catch {
            domain = "";
          }
        }

        if (!domain) {
          return {
            ...suggestion,
            isVerified: false,
          };
        }

        const business = businessMap.get(domain);
        const isVerified = business?.trackingVerified || false;

        console.log(
          `🔍 Suggestion domain: ${domain}, registered: ${!!business}, verified: ${isVerified}`,
        );

        return {
          ...suggestion,
          isVerified,
        };
      }),
    );

    // Check if the filter is enabled
    const filterEnabled = await businessService.getSuggestionFilterEnabled();
    console.log(`🔧 Filter enabled: ${filterEnabled}`);

    if (!filterEnabled) {
      // If filter is disabled, return all suggestions with badges
      console.log(
        `✅ Filter disabled, returning all ${processedSuggestions.length} suggestions with badges`,
      );
      return processedSuggestions;
    }

    // If filter is enabled, only return suggestions from registered businesses
    const filteredSuggestions = processedSuggestions.filter((suggestion) => {
      // Extract domain from site field first, then fallback to URL
      let domain = "";

      if (suggestion.site) {
        // Use the site field directly (e.g., "godislove.lt")
        domain = suggestion.site.toLowerCase().replace("www.", "");
      } else if (suggestion.url) {
        // Fallback to extracting from URL
        try {
          const url = new URL(suggestion.url);
          domain = url.hostname.toLowerCase().replace("www.", "");
        } catch {
          return false;
        }
      }

      if (!domain) return false;

      return registeredDomains.has(domain);
    });

    console.log(
      `✅ Filter enabled, returning ${filteredSuggestions.length} filtered suggestions with badges`,
    );
    return filteredSuggestions;
  } catch (error) {
    console.error("Error processing suggestions for verified badges:", error);
    return suggestions;
  }
}

// Track visits for businesses that appear in suggestions
async function trackBusinessVisits(suggestions: any[]): Promise<void> {
  try {
    const visitedDomains = new Set<string>();

    // Extract unique domains from suggestions
    for (const suggestion of suggestions) {
      if (suggestion.url) {
        try {
          const url = new URL(suggestion.url);
          const domain = url.hostname.toLowerCase().replace("www.", "");
          visitedDomains.add(domain);
        } catch {
          // Skip invalid URLs
        }
      }
    }

    // Increment visit count for each business
    for (const domain of visitedDomains) {
      const business = await businessService.findBusinessByDomain(domain);
      if (business) {
        await businessService.incrementBusinessVisits(business.id);
        console.log(`Tracked visit for business: ${business.name} (${domain})`);
      }
    }
  } catch (error) {
    console.error("Error tracking business visits:", error);
  }
}

// Fallback scraping functions
async function fallbackScraping(url: string, gl?: string): Promise<any> {
  console.log("Using fallback scraping for URL:", url);
  
  // Use SearchAPI.io as fallback
  const searchApiKey = process.env.SEARCH_API_KEY || "DzqyetWqB73LnNL7v96cWb7i";
  const searchApiUrl = "https://api.searchapi.io/api/v1/search";
  
  try {
    // Extract product title from URL for search
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    const searchQuery = pathParts.slice(-2).join(' '); // Use last 2 path segments
    
    console.log("Fallback search query:", searchQuery);
    
    const response = await axios.get(searchApiUrl, {
      params: {
        api_key: searchApiKey,
        engine: "google",
        q: searchQuery,
        gl: gl || "us",
        num: 10
      },
      timeout: 30000
    });
    
    if (response.data && response.data.organic_results) {
      const results = response.data.organic_results.slice(0, 5);
      
      const suggestions = results.map((result: any) => ({
        title: result.title,
        link: addUtmToUrl(result.link),
        site: new URL(result.link).hostname,
        standardPrice: "Price not available",
        image: null,
        merchant: new URL(result.link).hostname,
        stock: "Unknown",
        reviewsCount: null,
        deliveryPrice: null,
        details: result.snippet,
        returnPolicy: null,
        rating: null
      }));
      
      return {
        mainProduct: {
          title: searchQuery,
          price: "Price not available",
          image: null,
          url: addUtmToUrl(url)
        },
        suggestions: suggestions
      };
    }
    
    throw new Error("No search results found");
  } catch (error) {
    console.error("Fallback scraping failed:", error);
    throw error;
  }
}

async function fallbackKeywordSearch(keywords: string, gl?: string): Promise<any> {
  console.log("Using fallback keyword search for:", keywords);
  
  const searchApiKey = process.env.SEARCH_API_KEY || "DzqyetWqB73LnNL7v96cWb7i";
  const searchApiUrl = "https://api.searchapi.io/api/v1/search";
  
  try {
    const response = await axios.get(searchApiUrl, {
      params: {
        api_key: searchApiKey,
        engine: "google",
        q: keywords,
        gl: gl || "us",
        num: 10
      },
      timeout: 30000
    });
    
    if (response.data && response.data.organic_results) {
      const results = response.data.organic_results.slice(0, 10);
      
      return results.map((result: any) => ({
        title: result.title,
        link: addUtmToUrl(result.link),
        site: new URL(result.link).hostname,
        standardPrice: "Price not available",
        image: null,
        merchant: new URL(result.link).hostname,
        stock: "Unknown",
        reviewsCount: null,
        deliveryPrice: null,
        details: result.snippet,
        returnPolicy: null,
        rating: null
      }));
    }
    
    throw new Error("No search results found");
  } catch (error) {
    console.error("Fallback keyword search failed:", error);
    throw error;
  }
}

// Main n8n webhook route
router.post("/n8n-scrape", async (req, res) => {
  console.log("=== n8n-scrape route called ===");
  console.log("Request body:", req.body);
  try {
    const { url, keywords, requestId, gl, userCountry, findSimilar } = req.body;
    if (!url && !keywords) {
      return res.status(400).json({ error: "URL or keywords is required" });
    }

    let result;

    try {
      if (url) {
        console.log(`n8n webhook scraping request for URL: ${url}, GL: ${gl}`);
        result = await scrapeWithN8nWebhook(url, gl);
      } else if (keywords) {
        console.log(
          `n8n webhook scraping request for keywords: ${keywords}, GL: ${gl}`,
        );
        result = await scrapeWithN8nWebhook(keywords, gl);
      }
    } catch (n8nError) {
      console.error("n8n webhook failed:", n8nError);
      
      // Try fallback to traditional scraping
      console.log("Attempting fallback to traditional scraping...");
      try {
        if (url) {
          result = await fallbackScraping(url, gl);
        } else if (keywords) {
          result = await fallbackKeywordSearch(keywords, gl);
        }
        console.log("Fallback scraping successful");
      } catch (fallbackError) {
        console.error("Fallback scraping also failed:", fallbackError);
        
        // Return error response when both n8n and fallback fail
        return res.status(500).json({
          error: "Failed to fetch product information",
          message: "Both N8N and fallback scraping failed. Please try again later.",
          mainProduct: null,
          suggestions: [],
        });
      }
    }

    // If result is an array (keyword search), send directly
    if (Array.isArray(result)) {
      return res.json(result);
    }

    // If result is a single object with a single suggestion, wrap it in an array for consistency
    if (result && result.suggestions && !Array.isArray(result.suggestions)) {
      result.suggestions = [result.suggestions];
    }

    console.log("n8n webhook scraping successful");
    console.log("Main product:", result.mainProduct);
    console.log("Original suggestions count:", result.suggestions?.length || 0);

    // Filter suggestions based on registered businesses and track visits
    if (result.suggestions && result.suggestions.length > 0) {
      result.suggestions = await filterSuggestionsByRegisteredBusinesses(
        result.suggestions,
      );
      console.log("Filtered suggestions count:", result.suggestions.length);

      // Track visits for each business that appears in suggestions
      await trackBusinessVisits(result.suggestions);
    }

    // If findSimilar is true, modify the search to focus on similar products
    if (findSimilar && result.mainProduct) {
      console.log("Processing similar products search...");

      if (result.suggestions && result.suggestions.length > 0) {
        // Mark suggestions as similar products
        result.suggestions = result.suggestions.map((suggestion) => ({
          ...suggestion,
          isSimilar: true,
          similarityReason: `Similar product from ${suggestion.merchant || suggestion.site || "other retailers"}`,
        }));

        console.log(
          `Enhanced ${result.suggestions.length} suggestions for similar products`,
        );
      }
    }

    // Save to search history if user is authenticated
    try {
      // Check if user is authenticated by looking for user info in request
      const userId = (req as any).user?.id;
      if (userId && result.mainProduct?.title) {
        await searchService.addSearch(userId, {
          url: addUtmToUrl(url),
          title: result.mainProduct.title,
          requestId: requestId || `search_${Date.now()}`,
        });
        console.log(
          `Search history saved for user ${userId} (type: ${findSimilar ? "similar" : "price_comparison"})`,
        );
      } else {
        console.log(
          "No user authentication found, skipping search history save",
        );
      }
    } catch (historyError) {
      console.error("Failed to save search history:", historyError);
      // Don't fail the main request if history saving fails
    }

    res.json(result);
  } catch (error) {
    console.error("n8n webhook scraping error:", error);

    // Return a proper error response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.log("Returning error response:", errorMessage);

    res.status(500).json({
      error: "Failed to fetch product information",
      message: errorMessage,
      mainProduct: null,
      suggestions: [],
    });
  }
});

export default router;
