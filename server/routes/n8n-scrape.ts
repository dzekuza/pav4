// Main app scraping route - uses the same workflow logic as N8N but implemented directly
// This route provides real product URLs from search results instead of generated URLs

import express from "express";
import axios from "axios";
import { ProductData, PriceComparison } from "../../shared/api";
import { Request, Response } from "express";
import { searchHistoryService, businessService } from "../services/database";
import { requireAuth } from "../middleware/auth";

// --- Product patterns for better product parsing ---
const productPatterns = [
  { pattern: /sonos-ace/i, brand: 'sonos', model: 'ace', category: 'headphones' },
  { pattern: /sonos-era/i, brand: 'sonos', model: 'era', category: 'speakers' },
  { pattern: /sonos-beam/i, brand: 'sonos', model: 'beam', category: 'soundbar' },
  { pattern: /sonos-arc/i, brand: 'sonos', model: 'arc', category: 'soundbar' },
  { pattern: /sonos-sub/i, brand: 'sonos', model: 'sub', category: 'subwoofer' },
  { pattern: /sonos-one/i, brand: 'sonos', model: 'one', category: 'speakers' },
  { pattern: /sonos-five/i, brand: 'sonos', model: 'five', category: 'speakers' },
  { pattern: /sonos-move/i, brand: 'sonos', model: 'move', category: 'portable-speaker' },
  { pattern: /sonos-roam/i, brand: 'sonos', model: 'roam', category: 'portable-speaker' },
  { pattern: /bose-quietcomfort/i, brand: 'bose', model: 'quietcomfort', category: 'headphones' },
  { pattern: /bose-soundlink/i, brand: 'bose', model: 'soundlink', category: 'speakers' },
  { pattern: /bose-home-speaker/i, brand: 'bose', model: 'home-speaker', category: 'speakers' },
  { pattern: /bose-sport/i, brand: 'bose', model: 'sport', category: 'headphones' },
  { pattern: /jbl-charge/i, brand: 'jbl', model: 'charge', category: 'speakers' }
];

// --- Utility functions ---
// Use countryCode variable instead of getCountryCode function.

// Utility: Extract price as number from string.
function extractPrice(text: string): number | null {
  const match = text.match(/(\d{1,4}[.,]?\d{2})/);
  return match ? parseFloat(match[1].replace(',', '.')) : null;
}

function extractDirectRetailerUrl(link: string): string {
  if (!link) return '';
  
  // Handle Google Shopping links
  if (link.includes('google.com/shopping/product/')) {
    // For Google Shopping links, we'll keep them as they are valid product pages
    return link;
  }
  
  try {
    const url = new URL(link);
    return `${url.origin}${url.pathname}`;
  } catch {
    return link;
  }
}

function extractStoreName(link: string): string {
  if (!link) return 'unknown';
  
  // Handle Google Shopping links
  if (link.includes('google.com/shopping/product/')) {
    return 'Google Shopping';
  }
  
  try {
    return new URL(link).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

const router = express.Router();

// Remove authentication middleware from router - make search public
// Authentication will only be applied when saving search history

// SearchAPI configuration (Google Search API)
const SEARCH_API_KEY = process.env.SEARCH_API_KEY || process.env.SERP_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Debug logging
console.log("SearchAPI Key loaded:", SEARCH_API_KEY ? "Yes" : "No");

// Test Gemini API key on startup
async function testGeminiAPIKey(): Promise<boolean> {
  if (!GEMINI_API_KEY) return false;
  
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
      {
        contents: [{ parts: [{ text: "Hello" }] }]
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    if (response.status === 200) {
      console.log("✅ Gemini API key is valid");
      return true;
    } else {
      console.error("❌ Gemini API test failed with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Gemini API test failed:", error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }
    return false;
  }
}

// Test the API key on startup
testGeminiAPIKey().then(isValid => {
  if (!isValid) {
    console.warn("⚠️ Gemini API key appears to be invalid, will use fallback methods");
    geminiFailureCount = MAX_GEMINI_FAILURES; // Disable Gemini immediately
  }
});

// Track Gemini API failures to disable it if it's consistently failing
let geminiFailureCount = 0;
const MAX_GEMINI_FAILURES = 3;

// Helper function to safely parse JSON from Gemini responses
function safeParseGeminiJSON(text: string, fallback: any[]): any[] {
  try {
    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    if (text.includes('```json')) {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
    } else if (text.includes('```')) {
      // Handle other code blocks
      const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonText = codeMatch[1].trim();
      }
    }
    
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      console.error('Gemini returned non-array response:', parsed);
      return fallback;
    }
  } catch (parseError) {
    console.error('Failed to parse Gemini response as JSON:', parseError);
    console.error('Raw response text:', text);
    return fallback;
  }
}

// Use Gemini to clean up product titles for better search results
async function cleanProductTitleWithGemini(productTitle: string): Promise<string> {
  if (!GEMINI_API_KEY || geminiFailureCount >= MAX_GEMINI_FAILURES) {
    console.log("Gemini API key not available or too many failures, using fallback title cleaning");
    return cleanProductTitleFallback(productTitle);
  }

  try {
    const prompt = `Clean this product title for better search results. Remove SEO words, marketing terms, and keep only the essential product information (brand, model, type). Return only the cleaned title, nothing else.

Original title: "${productTitle}"

Examples:
- "Sonos Ace: Wireless Over Ear Headphones with Noise Cancellation" → "Sonos Ace Wireless Headphones"
- "Samsung BESPOKE Jet Bot AI+ Robot Vacuum Cleaner with Clean Station" → "Samsung BESPOKE Jet Bot Vacuum"
- "Apple iPhone 15 Pro Max 256GB Titanium - Latest Model with Advanced Camera" → "Apple iPhone 15 Pro Max"

Cleaned title:`;

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
        maxRedirects: 5
      }
    );

    const data = response.data;
    const cleanedTitle = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (cleanedTitle && cleanedTitle.length > 0) {
      console.log(`Gemini cleaned title: "${productTitle}" → "${cleanedTitle}"`);
      return cleanedTitle;
    } else {
      console.log("Gemini returned empty response, using fallback");
      return cleanProductTitleFallback(productTitle);
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }
    geminiFailureCount++;
    console.log(`Gemini failure count: ${geminiFailureCount}/${MAX_GEMINI_FAILURES}`);
    console.log("Using fallback title cleaning");
    return cleanProductTitleFallback(productTitle);
  }
}

// Fallback function to clean product titles without Gemini
function cleanProductTitleFallback(productTitle: string): string {
  if (!productTitle) return "";
  
  // Remove common SEO words and marketing terms
  const seoWords = [
    'with', 'and', 'the', 'latest', 'new', 'best', 'top', 'premium', 'advanced',
    'professional', 'pro', 'plus', 'max', 'ultra', 'extreme', 'ultimate',
    'wireless', 'bluetooth', 'smart', 'intelligent', 'automatic', 'automatic',
    'noise', 'cancelling', 'cancellation', 'active', 'passive', 'hybrid',
    'over-ear', 'on-ear', 'in-ear', 'true', 'wireless', 'earbuds', 'headphones',
    'speakers', 'sound', 'audio', 'music', 'bass', 'treble', 'clarity',
    'crystal', 'clear', 'sharp', 'vivid', 'brilliant', 'stunning', 'amazing',
    'incredible', 'fantastic', 'excellent', 'perfect', 'ideal', 'optimal',
    'superior', 'premium', 'high-quality', 'high', 'quality', 'durable',
    'long-lasting', 'reliable', 'trusted', 'popular', 'favorite', 'choice',
    'recommended', 'award-winning', 'award', 'winning', 'best-selling',
    'best', 'selling', 'trending', 'viral', 'hot', 'cool', 'awesome',
    'great', 'good', 'nice', 'beautiful', 'elegant', 'stylish', 'modern',
    'contemporary', 'classic', 'traditional', 'vintage', 'retro', 'unique',
    'special', 'exclusive', 'limited', 'edition', 'collector', 'series',
    'collection', 'set', 'bundle', 'package', 'kit', 'combo', 'deal',
    'offer', 'discount', 'sale', 'clearance', 'outlet', 'refurbished',
    'used', 'pre-owned', 'second-hand', 'like-new', 'mint', 'condition',
    'warranty', 'guarantee', 'certified', 'authentic', 'genuine', 'original',
    'official', 'licensed', 'authorized', 'dealer', 'reseller', 'distributor',
    'manufacturer', 'brand', 'company', 'corporation', 'inc', 'ltd', 'llc',
    'co', 'corp', 'international', 'global', 'worldwide', 'imported',
    'domestic', 'local', 'regional', 'national', 'federal', 'state',
    'provincial', 'municipal', 'city', 'town', 'village', 'community',
    'neighborhood', 'district', 'area', 'zone', 'region', 'territory',
    'country', 'nation', 'continent', 'hemisphere', 'planet', 'earth',
    'world', 'universe', 'galaxy', 'solar', 'system', 'space', 'cosmos',
    'nature', 'natural', 'organic', 'biological', 'chemical', 'physical',
    'mechanical', 'electrical', 'electronic', 'digital', 'analog', 'hybrid',
    'mixed', 'combined', 'integrated', 'unified', 'consolidated', 'merged',
    'fused', 'blended', 'mixed', 'combined', 'integrated', 'unified',
    'consolidated', 'merged', 'fused', 'blended', 'mixed', 'combined'
  ];
  
  let cleanedTitle = productTitle;
  
  // Remove SEO words (case insensitive)
  const seoWordsRegex = new RegExp(`\\b(${seoWords.join('|')})\\b`, 'gi');
  cleanedTitle = cleanedTitle.replace(seoWordsRegex, '');
  
  // Remove extra spaces and punctuation
  cleanedTitle = cleanedTitle.replace(/\s+/g, ' ').trim();
  cleanedTitle = cleanedTitle.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
  
  // Remove common marketing phrases
  const marketingPhrases = [
    /with\s+[a-z\s]+$/i,
    /featuring\s+[a-z\s]+$/i,
    /including\s+[a-z\s]+$/i,
    /comes\s+with\s+[a-z\s]+$/i,
    /includes\s+[a-z\s]+$/i,
    /packaged\s+with\s+[a-z\s]+$/i,
    /bundle\s+with\s+[a-z\s]+$/i,
    /set\s+with\s+[a-z\s]+$/i,
    /kit\s+with\s+[a-z\s]+$/i,
    /combo\s+with\s+[a-z\s]+$/i,
    /deal\s+with\s+[a-z\s]+$/i,
    /offer\s+with\s+[a-z\s]+$/i,
    /discount\s+with\s+[a-z\s]+$/i,
    /sale\s+with\s+[a-z\s]+$/i,
    /clearance\s+with\s+[a-z\s]+$/i,
    /outlet\s+with\s+[a-z\s]+$/i,
    /refurbished\s+with\s+[a-z\s]+$/i,
    /used\s+with\s+[a-z\s]+$/i,
    /pre-owned\s+with\s+[a-z\s]+$/i,
    /second-hand\s+with\s+[a-z\s]+$/i,
    /like-new\s+with\s+[a-z\s]+$/i,
    /mint\s+with\s+[a-z\s]+$/i,
    /condition\s+with\s+[a-z\s]+$/i,
    /warranty\s+with\s+[a-z\s]+$/i,
    /guarantee\s+with\s+[a-z\s]+$/i,
    /certified\s+with\s+[a-z\s]+$/i,
    /authentic\s+with\s+[a-z\s]+$/i,
    /genuine\s+with\s+[a-z\s]+$/i,
    /original\s+with\s+[a-z\s]+$/i,
    /official\s+with\s+[a-z\s]+$/i,
    /licensed\s+with\s+[a-z\s]+$/i,
    /authorized\s+with\s+[a-z\s]+$/i,
    /dealer\s+with\s+[a-z\s]+$/i,
    /reseller\s+with\s+[a-z\s]+$/i,
    /distributor\s+with\s+[a-z\s]+$/i,
    /manufacturer\s+with\s+[a-z\s]+$/i,
    /brand\s+with\s+[a-z\s]+$/i,
    /company\s+with\s+[a-z\s]+$/i,
    /corporation\s+with\s+[a-z\s]+$/i,
    /inc\s+with\s+[a-z\s]+$/i,
    /ltd\s+with\s+[a-z\s]+$/i,
    /llc\s+with\s+[a-z\s]+$/i,
    /co\s+with\s+[a-z\s]+$/i,
    /corp\s+with\s+[a-z\s]+$/i,
    /international\s+with\s+[a-z\s]+$/i,
    /global\s+with\s+[a-z\s]+$/i,
    /worldwide\s+with\s+[a-z\s]+$/i,
    /imported\s+with\s+[a-z\s]+$/i,
    /domestic\s+with\s+[a-z\s]+$/i,
    /local\s+with\s+[a-z\s]+$/i,
    /regional\s+with\s+[a-z\s]+$/i,
    /national\s+with\s+[a-z\s]+$/i,
    /federal\s+with\s+[a-z\s]+$/i,
    /state\s+with\s+[a-z\s]+$/i,
    /provincial\s+with\s+[a-z\s]+$/i,
    /municipal\s+with\s+[a-z\s]+$/i,
    /city\s+with\s+[a-z\s]+$/i,
    /town\s+with\s+[a-z\s]+$/i,
    /village\s+with\s+[a-z\s]+$/i,
    /community\s+with\s+[a-z\s]+$/i,
    /neighborhood\s+with\s+[a-z\s]+$/i,
    /district\s+with\s+[a-z\s]+$/i,
    /area\s+with\s+[a-z\s]+$/i,
    /zone\s+with\s+[a-z\s]+$/i,
    /region\s+with\s+[a-z\s]+$/i,
    /territory\s+with\s+[a-z\s]+$/i,
    /country\s+with\s+[a-z\s]+$/i,
    /nation\s+with\s+[a-z\s]+$/i,
    /continent\s+with\s+[a-z\s]+$/i,
    /hemisphere\s+with\s+[a-z\s]+$/i,
    /planet\s+with\s+[a-z\s]+$/i,
    /earth\s+with\s+[a-z\s]+$/i,
    /world\s+with\s+[a-z\s]+$/i,
    /universe\s+with\s+[a-z\s]+$/i,
    /galaxy\s+with\s+[a-z\s]+$/i,
    /solar\s+with\s+[a-z\s]+$/i,
    /system\s+with\s+[a-z\s]+$/i,
    /space\s+with\s+[a-z\s]+$/i,
    /cosmos\s+with\s+[a-z\s]+$/i,
    /nature\s+with\s+[a-z\s]+$/i,
    /natural\s+with\s+[a-z\s]+$/i,
    /organic\s+with\s+[a-z\s]+$/i,
    /biological\s+with\s+[a-z\s]+$/i,
    /chemical\s+with\s+[a-z\s]+$/i,
    /physical\s+with\s+[a-z\s]+$/i,
    /mechanical\s+with\s+[a-z\s]+$/i,
    /electrical\s+with\s+[a-z\s]+$/i,
    /electronic\s+with\s+[a-z\s]+$/i,
    /digital\s+with\s+[a-z\s]+$/i,
    /analog\s+with\s+[a-z\s]+$/i,
    /hybrid\s+with\s+[a-z\s]+$/i,
    /mixed\s+with\s+[a-z\s]+$/i,
    /combined\s+with\s+[a-z\s]+$/i,
    /integrated\s+with\s+[a-z\s]+$/i,
    /unified\s+with\s+[a-z\s]+$/i,
    /consolidated\s+with\s+[a-z\s]+$/i,
    /merged\s+with\s+[a-z\s]+$/i,
    /fused\s+with\s+[a-z\s]+$/i,
    /blended\s+with\s+[a-z\s]+$/i
  ];
  
  for (const phrase of marketingPhrases) {
    cleanedTitle = cleanedTitle.replace(phrase, '');
  }
  
  // Remove extra spaces and punctuation again
  cleanedTitle = cleanedTitle.replace(/\s+/g, ' ').trim();
  cleanedTitle = cleanedTitle.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
  
  console.log(`Fallback cleaned title: "${productTitle}" → "${cleanedTitle}"`);
  return cleanedTitle;
}

// Add rate limiting utility
let lastSearchApiCall = 0;
const SEARCH_API_RATE_LIMIT = 1000; // 1 second between calls
let isRateLimited = false;
let rateLimitResetTime = 0;

async function makeSearchApiRequest(url: string): Promise<any> {
  const now = Date.now();
  
  // Check if we're currently rate limited
  if (isRateLimited && now < rateLimitResetTime) {
    const remainingTime = rateLimitResetTime - now;
    console.log(`Rate limited, waiting ${remainingTime}ms before retry`);
    await new Promise(resolve => setTimeout(resolve, remainingTime));
    isRateLimited = false;
  }
  
  const timeSinceLastCall = now - lastSearchApiCall;
  
  if (timeSinceLastCall < SEARCH_API_RATE_LIMIT) {
    const delay = SEARCH_API_RATE_LIMIT - timeSinceLastCall;
    console.log(`Rate limiting: waiting ${delay}ms before next SearchAPI call`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastSearchApiCall = Date.now();
  
  try {
    const response = await axios.get(url, {
      timeout: 15000, // 15 second timeout
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PriceComparisonBot/1.0)'
      }
    });
    
    if (response.status === 429) {
      console.warn("SearchAPI rate limit exceeded, setting global rate limit for 30 seconds");
      isRateLimited = true;
      rateLimitResetTime = now + 30000; // 30 seconds
      return null; // Signal to try fallback
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        console.warn("SearchAPI rate limit exceeded, setting global rate limit for 30 seconds");
        isRateLimited = true;
        rateLimitResetTime = now + 30000; // 30 seconds
        return null; // Signal to try fallback
      }
      console.error(`SearchAPI request failed: ${error.response?.status} ${error.response?.statusText}`);
    } else {
      console.error("SearchAPI request error:", error);
    }
    return null;
  }
}

async function testSearchAPIKey(): Promise<boolean> {
  if (!SEARCH_API_KEY) return false;
  
  try {
    const testUrl = `https://www.searchapi.io/api/v1/search?engine=google&q=test&api_key=${SEARCH_API_KEY}`;
    const response = await axios.get(testUrl, {
      timeout: 10000, // 10 second timeout
      maxRedirects: 3
    });
    
    if (response.status === 200) {
      console.log("✅ SearchAPI key is valid");
      return true;
    } else if (response.status === 401) {
      console.error("❌ SearchAPI key is invalid or expired");
      return false;
    } else if (response.status === 429) {
      console.warn("⚠️ SearchAPI rate limit exceeded during test");
      return false;
    } else {
      console.warn(`⚠️ SearchAPI test returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.error("❌ SearchAPI key is invalid or expired");
        return false;
      } else if (error.response?.status === 429) {
        console.warn("⚠️ SearchAPI rate limit exceeded during test");
        return false;
      } else {
        console.error(`❌ SearchAPI test failed: ${error.response?.status} ${error.response?.statusText}`);
        return false;
      }
    } else {
      console.error("❌ SearchAPI test failed:", error);
      return false;
    }
  }
}

// Extract product model from URL (e.g., BDFS26040XQ from Lithuanian dishwasher URL)
function extractProductModel(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Look for product model patterns in the URL path
    const modelPatterns = [
      /[A-Z]{2,3}\d{6,8}[A-Z]?/g, // Pattern like BDFS26040XQ
      /\d{8,12}/g, // Long numeric codes
      /[A-Z]{2,4}\d{4,6}[A-Z]?/g, // Shorter patterns
    ];
    
    for (const pattern of modelPatterns) {
      const matches = pathname.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`Found model in Lithuanian URL path: ${matches[0]}`);
        return matches[0];
      }
    }
    
    // Also check the full URL for patterns
    const fullUrlMatches = url.match(/[A-Z]{2,3}\d{6,8}[A-Z]?/);
    if (fullUrlMatches) {
      console.log(`Found model in full URL: ${fullUrlMatches[0]}`);
      return fullUrlMatches[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting product model:", error);
    return null;
  }
}

// Extract brand name from product title
function extractBrandFromTitle(productTitle: string): string {
  if (!productTitle) return "";
  
  // Common brand names to look for
  const brands = [
    'Samsung', 'LG', 'Bosch', 'Siemens', 'Beko', 'Whirlpool', 'Electrolux',
    'Panasonic', 'Sharp', 'Toshiba', 'Hitachi', 'Daewoo', 'Haier',
    'Apple', 'Sony', 'Philips', 'Braun', 'KitchenAid', 'Kenmore',
    'Maytag', 'Frigidaire', 'GE', 'Hotpoint', 'Zanussi', 'AEG',
    'Miele', 'Gorenje', 'Vestel', 'Arçelik', 'Blaupunkt', 'Grundig',
    // Audio/Electronics brands
    'Sonos', 'Bose', 'JBL', 'Sennheiser', 'Audio-Technica', 'Shure',
    'Beyerdynamic', 'AKG', 'Denon', 'Marantz', 'Pioneer', 'Onkyo',
    'Yamaha', 'Harman Kardon', 'Klipsch', 'Bowers & Wilkins', 'B&W',
    'Focal', 'KEF', 'Monitor Audio', 'Dynaudio', 'Elac', 'Wharfedale',
    'Cambridge Audio', 'Rega', 'Naim', 'Linn', 'McIntosh', 'Krell',
    'Paradigm', 'Martin Logan', 'Definitive Technology', 'Polk Audio',
    'Infinity', 'Cerwin Vega', 'Jamo', 'Dali', 'Q Acoustics', 'Monitor',
    'M-Audio', 'Focusrite', 'Presonus', 'Behringer', 'Rode', 'Blue',
    'Audio Technica', 'Sennheiser', 'Beyerdynamic', 'AKG', 'Shure',
    'Sony', 'Panasonic', 'Sharp', 'Toshiba', 'Hitachi', 'Daewoo',
    'LG', 'Samsung', 'Philips', 'Braun', 'KitchenAid', 'Kenmore',
    'Maytag', 'Frigidaire', 'GE', 'Hotpoint', 'Zanussi', 'AEG',
    'Miele', 'Gorenje', 'Vestel', 'Arçelik', 'Blaupunkt', 'Grundig',
    // Computer/Electronics brands
    'Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Gigabyte',
    'Intel', 'AMD', 'NVIDIA', 'Corsair', 'EVGA', 'Thermaltake',
    'Cooler Master', 'Noctua', 'be quiet!', 'Fractal Design', 'Phanteks',
    'Lian Li', 'NZXT', 'Silverstone', 'Antec', 'Seasonic', 'EVGA',
    'Corsair', 'G.Skill', 'Crucial', 'Samsung', 'Western Digital',
    'Seagate', 'Kingston', 'ADATA', 'Team Group', 'Patriot', 'PNY',
    'Logitech', 'Razer', 'SteelSeries', 'HyperX', 'Corsair', 'ROCCAT',
    'Mad Catz', 'Saitek', 'Thrustmaster', 'Fanatec', 'Logitech G',
    // Gaming brands
    'Nintendo', 'Sony', 'Microsoft', 'Xbox', 'PlayStation', 'Steam',
    'Valve', 'Blizzard', 'EA', 'Ubisoft', 'Activision', 'Bethesda',
    'Rockstar', 'Take-Two', '2K', 'Capcom', 'Konami', 'Sega',
    'Bandai Namco', 'Square Enix', 'Atlus', 'NIS America', 'Xseed',
    'Aksys', 'Idea Factory', 'Compile Heart', 'Gust', 'Falcom',
    'Nihon Falcom', 'Falcom', 'Nihon', 'Falcom', 'Nihon', 'Falcom'
  ];
  
  const titleLower = productTitle.toLowerCase();
  for (const brand of brands) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // If no known brand found, try to extract from the beginning of the title
  const words = productTitle.split(' ');
  if (words.length > 0) {
    const firstWord = words[0];
    // Check if first word looks like a brand (starts with capital letter and is reasonable length)
    if (firstWord.length > 2 && firstWord.length < 15 && /^[A-Z]/.test(firstWord)) {
      return firstWord;
    }
  }
  
  return "";
}

// Extract product type from product title
function extractProductType(productTitle: string): string {
  if (!productTitle) return "";
  
  const titleLower = productTitle.toLowerCase();
  
  // Common product types
  const productTypes = [
    // Kitchen appliances
    'dishwasher', 'washing machine', 'dryer', 'refrigerator', 'freezer',
    'oven', 'microwave', 'stove', 'cooker', 'range', 'hood', 'extractor',
    'blender', 'mixer', 'food processor', 'coffee maker', 'toaster',
    'kettle', 'iron', 'vacuum cleaner', 'air conditioner', 'heater',
    'fan', 'dehumidifier', 'humidifier', 'purifier', 'filter',
    
    // Electronics
    'laptop', 'computer', 'desktop', 'tablet', 'phone', 'smartphone',
    'tv', 'television', 'monitor', 'speaker', 'headphone', 'camera',
    'printer', 'scanner', 'router', 'modem', 'keyboard', 'mouse',
    
    // Audio equipment
    'headphones', 'headphone', 'earbuds', 'earbud', 'earphones', 'earphone',
    'speakers', 'speaker', 'subwoofer', 'woofer', 'tweeter', 'tweeters',
    'amplifier', 'amp', 'receiver', 'preamp', 'preamplifier', 'power amp',
    'power amplifier', 'integrated amp', 'integrated amplifier', 'mono block',
    'monoblock', 'stereo amp', 'stereo amplifier', 'tube amp', 'tube amplifier',
    'solid state', 'solid-state', 'class a', 'class b', 'class ab', 'class d',
    'turntable', 'record player', 'vinyl player', 'cd player', 'cdp',
    'dvd player', 'blu-ray player', 'streamer', 'streaming', 'dac',
    'digital to analog converter', 'digital-to-analog converter', 'adc',
    'analog to digital converter', 'analog-to-digital converter', 'phono',
    'phono stage', 'phono preamp', 'phono preamplifier', 'mc', 'mm',
    'moving coil', 'moving magnet', 'cartridge', 'stylus', 'needle',
    'tonearm', 'platter', 'belt drive', 'direct drive', 'idler wheel',
    'motor', 'bearing', 'spindle', 'mat', 'clamp', 'weight', 'stabilizer',
    'isolation', 'feet', 'spikes', 'cones', 'balls', 'pads', 'sorbothane',
    'cable', 'wire', 'interconnect', 'speaker cable', 'speaker wire',
    'power cord', 'power cable', 'mains cable', 'mains cord', 'iec',
    'power strip', 'surge protector', 'ups', 'uninterruptible power supply',
    'battery', 'batteries', 'rechargeable', 'lithium', 'li-ion', 'li-poly',
    'nickel', 'ni-mh', 'ni-cd', 'alkaline', 'zinc', 'carbon'
  ];
  
  for (const type of productTypes) {
    if (titleLower.includes(type)) {
      return type;
    }
  }
  
  return "";
}

// Filter search results to only include exact product matches
function filterExactProductMatches(results: any[], productModel: string | null, productTitle: string): any[] {
  if (!results || results.length === 0) return [];
  
  const titleLower = productTitle.toLowerCase();
  const modelLower = productModel?.toLowerCase() || "";
  
  return results.filter((result) => {
    const resultTitle = (result.title || "").toLowerCase();
    
    // If we have a product model, check if it's in the result title
    if (productModel && modelLower) {
      if (resultTitle.includes(modelLower)) {
        console.log(`Exact model match found: ${productModel} in "${result.title}"`);
        return true;
      }
    }
    
    // Check for significant word matches (at least 3 words)
    const titleWords = titleLower.split(/\s+/).filter(word => word.length > 2);
    const resultWords = resultTitle.split(/\s+/).filter(word => word.length > 2);
    
    let matchCount = 0;
    for (const word of titleWords) {
      if (resultWords.some(resultWord => resultWord.includes(word) || word.includes(resultWord))) {
        matchCount++;
      }
    }
    
    // Require at least 3 matching words or 60% match rate for longer titles
    const minMatches = Math.max(3, Math.floor(titleWords.length * 0.6));
    const isMatch = matchCount >= minMatches;
    
    if (isMatch) {
      console.log(`Title match found: ${matchCount}/${titleWords.length} words match in "${result.title}"`);
    }
    
    return isMatch;
  });
}

// Remove duplicate results based on URL and title similarity
function removeDuplicateResults(results: any[]): any[] {
  if (!results || results.length === 0) return [];
  
  const seen = new Set<string>();
  const uniqueResults: any[] = [];
  
  for (const result of results) {
    // Create a unique key based on URL and title
    const url = result.link || result.product_link || result.source_url || "";
    const title = result.title || "";
    const key = `${url}|${title}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(result);
    }
  }
  
  console.log(`Removed ${results.length - uniqueResults.length} duplicate results`);
  return uniqueResults;
}

// Search for exact product model using SearchAPI (Google Search API)
async function searchExactProductModel(productModel: string, productTitle: string, userCountry: string, actualPrice?: number): Promise<PriceComparison[]> {
  if (!SEARCH_API_KEY) {
    console.warn("SearchAPI key not configured");
    return [];
  }

  try {
    console.log(`Searching for exact product model: ${productModel}`);
    console.log(`Original product title: ${productTitle}`);
    console.log(`User country: ${userCountry}`);
    console.log(`Actual price: ${actualPrice || 'Not available'}`);
    console.log(`SearchAPI Key available: ${SEARCH_API_KEY ? "Yes" : "No"}`);
    
    // Test SearchAPI key first
    const isKeyValid = await testSearchAPIKey();
    if (!isKeyValid) {
      console.warn("SearchAPI key is invalid, skipping search");
      return [];
    }
    
    // Clean the product title for better search results
    const cleanedProductTitle = await cleanProductTitleWithGemini(productTitle);
    console.log(`Cleaned product title: "${cleanedProductTitle}"`);
    
    // Get country code for SearchAPI - convert to ISO format
    const countryCode = getCountryCode(userCountry);
    console.log(`Using country code: ${countryCode} for SearchAPI search`);

    // Helper function to convert country names to ISO codes
    function getCountryCode(country: string): string {
      // Import the supported countries from location service
      const { SEARCH_API_SUPPORTED_COUNTRIES } = require("../services/location");
      
      // Find the country in supported countries by name
      const supportedCountry = Object.values(SEARCH_API_SUPPORTED_COUNTRIES).find(
        (c: any) => c.country.toLowerCase() === country.toLowerCase()
      ) as any;
      
      if (supportedCountry) {
        // Return the gl code (lowercase country code)
        return supportedCountry.countryCode;
      }
      
      // If not found, default to US
      console.warn(`Country "${country}" not found in supported countries, defaulting to US`);
      return 'us';
    }
    
    // Create more flexible search queries for better matching
    let searchQueries: string[] = [];
    
    if (productModel) {
      // Try exact model number first
      searchQueries.push(`"${productModel}"`);
      // Try model with brand name
      const brand = extractBrandFromTitle(cleanedProductTitle);
      if (brand) {
        searchQueries.push(`"${productModel}" ${brand}`);
      }
      // Try model with product type
      const productType = extractProductType(cleanedProductTitle);
      if (productType) {
        searchQueries.push(`"${productModel}" ${productType}`);
      }
    }
    
    // Add cleaned product title queries
    if (cleanedProductTitle) {
      // Try exact cleaned title
      searchQueries.push(`"${cleanedProductTitle}"`);
      
      // Try without quotes for broader matching
      searchQueries.push(cleanedProductTitle);
      
      // Try with just brand and model
      const brand = extractBrandFromTitle(cleanedProductTitle);
      const words = cleanedProductTitle.split(' ').filter(word => word.length > 2);
      if (brand && words.length > 1) {
        const modelWords = words.slice(1, 3).join(' '); // Take 2-3 words after brand
        if (modelWords) {
          searchQueries.push(`${brand} ${modelWords}`);
        }
      }
    }
    
    // If no model found, try with original product title as fallback
    if (searchQueries.length === 0) {
      searchQueries.push(`"${productTitle}"`);
      searchQueries.push(productTitle);
    }
    
    console.log(`Search queries to try: ${JSON.stringify(searchQueries)}`);
    
    let allResults: any[] = [];
    let searchApiFailed = false;
    let rateLimited = false;
    
    // Try each search query with rate limiting
    for (const searchQuery of searchQueries) {
      console.log(`Trying search query: ${searchQuery}`);
      
      // Build SearchAPI URL with shopping results
      const searchApiUrl = `https://www.searchapi.io/api/v1/search?engine=google_shopping&q=${encodeURIComponent(searchQuery)}&gl=${countryCode}&api_key=${SEARCH_API_KEY}`;
      console.log(`SearchAPI URL: ${searchApiUrl}`);
      
      // Make the actual SearchAPI request with rate limiting
      const searchData = await makeSearchApiRequest(searchApiUrl);
      
      if (!searchData) {
        console.warn(`SearchAPI failed for query "${searchQuery}", trying next query or fallback`);
        searchApiFailed = true;
        
        // Check if it was rate limited
        if (searchData === null) {
          rateLimited = true;
          console.warn("Rate limit detected, stopping further searches");
          break; // Stop trying more queries if rate limited
        }
        
        continue; // Try next query
      }
      
      console.log(`Raw SearchAPI response for "${searchQuery}":`, JSON.stringify(searchData, null, 2));
      
      // Extract shopping results from SearchAPI response
      let shoppingResults = searchData.shopping_ads || searchData.shopping_results || searchData.inline_shopping || [];
      console.log(`Found ${shoppingResults.length} shopping results for query "${searchQuery}"`);
      
      // Also check for knowledge graph shopping offers
      const knowledgeGraph = searchData.knowledge_graph;
      if (knowledgeGraph && knowledgeGraph.offers) {
        console.log(`Found ${knowledgeGraph.offers.length} knowledge graph offers for query "${searchQuery}"`);
        shoppingResults.push(...knowledgeGraph.offers);
      }
      
      // Use more flexible matching instead of exact matches
      const relevantMatches = filterRelevantProductMatches(shoppingResults, productModel, cleanedProductTitle, productTitle);
      console.log(`Found ${relevantMatches.length} relevant matches for query "${searchQuery}"`);
      
      allResults.push(...relevantMatches);
      
      // If we found good results, we can stop trying more queries
      if (relevantMatches.length >= 3) {
        console.log("Found sufficient results, stopping search");
        break;
      }
    }
    
    // If SearchAPI failed completely or was rate limited, use fallback
    if ((searchApiFailed && allResults.length === 0) || rateLimited) {
      console.log("SearchAPI failed completely or was rate limited, using fallback comparisons");
      return generateFallbackComparisons(productTitle, actualPrice || 0, userCountry);
    }
    
    // Remove duplicates and limit results
    const uniqueResults = removeDuplicateResults(allResults);
    console.log(`Total unique relevant matches found: ${uniqueResults.length}`);
    
    // Validate, sanitize, and convert SearchAPI results to PriceComparison format
    const validationPromises = uniqueResults.map((result: any) => 
      validateAndSanitizeResult(result, productTitle, actualPrice)
    );
    
    // Add timeout and rate limiting for URL validation
    const validatedResults = await Promise.allSettled(validationPromises);
    const comparisons: PriceComparison[] = validatedResults
      .filter((result): result is PromiseFulfilledResult<PriceComparison | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
      .slice(0, 10);
    
    console.log(`Converted ${comparisons.length} relevant SearchAPI results to PriceComparison format`);
    
    // Apply price filtering to remove unrelated parts/accessories
    const priceFilteredComparisons = filterByPriceRange(comparisons, actualPrice || 0);
    
    console.log("Final price-filtered comparisons:", JSON.stringify(priceFilteredComparisons, null, 2));
    
    // Return all valid SearchAPI results, even if they're from known retailers
    if (priceFilteredComparisons.length > 0) {
      console.log(`Returning ${priceFilteredComparisons.length} SearchAPI results with actual product URLs`);
      return priceFilteredComparisons;
    } else {
      console.log("No SearchAPI results found, using fallback");
      return generateFallbackComparisons(productTitle, actualPrice || 0, userCountry);
    }
    
  } catch (error) {
    console.error("SearchAPI search error:", error);
    console.log("Using fallback comparisons due to error");
    return generateFallbackComparisons(productTitle, actualPrice || 0, userCountry);
  }
}

// Generate fallback comparisons when SearchAPI fails
function generateFallbackComparisons(productTitle: string, actualPrice: number, userCountry: string): PriceComparison[] {
  console.log("No real product comparisons available - SearchAPI failed or returned no results");
  console.log("Returning empty array to avoid fake URLs");
  
  // Return empty array instead of generating fake URLs
  return [];
}

// Filter search results to include relevant product matches (more flexible than exact)
function filterRelevantProductMatches(results: any[], productModel: string | null, cleanedTitle: string, originalTitle: string): any[] {
  if (!results || results.length === 0) return [];
  
  const cleanedTitleLower = cleanedTitle.toLowerCase();
  const originalTitleLower = originalTitle.toLowerCase();
  const modelLower = productModel?.toLowerCase() || "";
  
  return results.filter((result) => {
    const resultTitle = (result.title || "").toLowerCase();
    
    // If we have a product model, check if it's in the result title
    if (productModel && modelLower) {
      if (resultTitle.includes(modelLower)) {
        console.log(`Model match found: ${productModel} in "${result.title}"`);
        return true;
      }
    }
    
    // Check for brand match
    const brand = extractBrandFromTitle(cleanedTitle);
    if (brand) {
      const brandLower = brand.toLowerCase();
      if (resultTitle.includes(brandLower)) {
        console.log(`Brand match found: ${brand} in "${result.title}"`);
        return true;
      }
    }
    
    // Check for significant word matches (more flexible than exact)
    const titleWords = cleanedTitleLower.split(/\s+/).filter(word => word.length > 2);
    const resultWords = resultTitle.split(/\s+/).filter(word => word.length > 2);
    
    let matchCount = 0;
    for (const word of titleWords) {
      if (resultWords.some(resultWord => resultWord.includes(word) || word.includes(resultWord))) {
        matchCount++;
      }
    }
    
    // More flexible matching: require at least 2 matching words or 40% match rate
    const minMatches = Math.max(2, Math.floor(titleWords.length * 0.4));
    const isMatch = matchCount >= minMatches;
    
    if (isMatch) {
      console.log(`Relevant match found: ${matchCount}/${titleWords.length} words match in "${result.title}"`);
    }
    
    return isMatch;
  });
}

// These functions are no longer needed since we're using real SerpAPI data

// Generate assessment based on price and retailer
function generateAssessment(price: number, basePrice: number, retailer: string): any {
  let cost = 2; // Medium by default
  if (price < basePrice * 0.9) cost = 1; // Low cost
  else if (price > basePrice * 1.1) cost = 3; // High cost
  
  return {
    cost,
    value: Math.floor(Math.random() * 3) + 1, // 1-3
    quality: Math.floor(Math.random() * 3) + 1, // 1-3
    description: `Found on ${retailer}`
  };
}

// Extract price from SearchAPI extensions
const extractPriceFromExtensions = (extensions: string[] = []): string | null => {
  const priceRegex = /€\s?\d{1,3}(?:[.,]\d{2})?/; // Matches €437.00 or € 437,00
  for (const el of extensions) {
    const match = el.match(priceRegex);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
};

// Validate and sanitize SearchAPI result to ensure it has a valid price and URL
async function validateAndSanitizeResult(result: any, productTitle: string, actualPrice?: number): Promise<PriceComparison | null> {
  // Try to extract price from extensions first, then fallback to other fields
  const priceFromExtensions = extractPriceFromExtensions(result.rich_snippet?.extensions);
  const price = priceFromExtensions ? extractPrice(priceFromExtensions) : extractPrice(result.price || result.priceText || result.price_string || result.extracted_price || '');
  const rawUrl = result.link || result.product_link || result.source_url || result.url || result.offers_link || '';
  const url = extractDirectRetailerUrl(rawUrl);
  
  if (price == null || !url) {
    console.log(`Skipping invalid result: ${result.title} (no price or URL)`);
    return null;
  }
  
  // Check if this is a real product URL (not just a domain)
  const isRealProductUrl = url && 
    url.length > 20 && // Real product URLs are longer
    !url.match(/^https?:\/\/[^\/]+\/?$/) && // Not just a domain
    (url.includes('/product/') || url.includes('/p/') || url.includes('/dp/') || url.includes('/item/') || url.includes('/shop/') || url.includes('google.com/shopping/product/'));
  
  if (!isRealProductUrl) {
    console.log(`Skipping result with non-product URL: ${result.title} (URL: ${url})`);
    return null;
  }
  
  // Skip HTML validation for Google Shopping URLs since they return 404 when accessed directly
  if (url.includes('google.com/shopping/product/')) {
    console.log(`Skipping HTML validation for Google Shopping URL: ${url}`);
    const finalTitle = result.title || 'Unknown Product';
    const finalPrice = price || 0;
    const finalImage = result.thumbnail || result.image || '';
    
    // Generate assessment based on price comparison
    const assessment = generateAssessment(finalPrice, actualPrice || 0, result.seller || result.source || "");
    return {
      title: finalTitle,
      store: extractStoreName(result.seller || result.source || ""),
      price: finalPrice,
      currency: result.currency || "€",
      url,
      image: finalImage,
      condition: "New",
      assessment
    };
  }
  
  // Validate URL by fetching HTML and checking for product content
  try {
    console.log(`Validating URL: ${url}`);
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PriceComparisonBot/1.0)'
      }
    });
    
    const html = response.data;
    const isValidProductPage = validateProductPage(html, productTitle);
    
    if (!isValidProductPage) {
      console.log(`URL validation failed: ${result.title} (URL: ${url}) - No valid product content found`);
      return null;
    }
    
    console.log(`URL validation successful: ${result.title} (URL: ${url})`);
    
    // Extract real product information from HTML
    const extractedInfo = extractProductInfoFromHTML(html, url);
    console.log(`Extracted product info:`, extractedInfo);
    
    // Use extracted information if available, otherwise use original data
    const finalTitle = extractedInfo.title || result.title || productTitle;
    const finalPrice = extractedInfo.price || price;
    const finalImage = extractedInfo.image || result.thumbnail || result.image || "";
    
    // Generate assessment based on price comparison
    const assessment = generateAssessment(finalPrice, actualPrice || 0, result.seller || result.source || "");
    return {
      title: finalTitle,
      store: extractStoreName(result.seller || result.source || ""),
      price: finalPrice,
      currency: result.currency || "€",
      url,
      image: finalImage,
      condition: "New",
      assessment
    };
  } catch (error) {
    console.log(`URL validation failed: ${result.title} (URL: ${url}) - HTTP error: ${error}`);
    return null;
  }
}

// Validate HTML content to check if it's a real product page
function validateProductPage(html: string, productTitle: string): boolean {
  const htmlLower = html.toLowerCase();
  const titleLower = productTitle.toLowerCase();
  
  // Check for common error indicators
  const errorIndicators = [
    'page not found',
    '404',
    'not found',
    'error',
    'sorry',
    'unavailable',
    'out of stock',
    'discontinued',
    'click the button below to continue shopping'
  ];
  
  for (const indicator of errorIndicators) {
    if (htmlLower.includes(indicator)) {
      console.log(`Found error indicator: ${indicator}`);
      return false;
    }
  }
  
  // Check for product-specific content
  const productIndicators = [
    'add to cart',
    'buy now',
    'add to basket',
    'purchase',
    'price',
    '€',
    '$',
    'product',
    'item',
    'shipping',
    'delivery',
    'stock',
    'availability'
  ];
  
  let productIndicatorCount = 0;
  for (const indicator of productIndicators) {
    if (htmlLower.includes(indicator)) {
      productIndicatorCount++;
    }
  }
  
  // Check if title keywords are present in the page
  const titleWords = titleLower.split(' ').filter(word => word.length > 2);
  let titleMatchCount = 0;
  for (const word of titleWords) {
    if (htmlLower.includes(word)) {
      titleMatchCount++;
    }
  }
  
  // Require at least 3 product indicators and some title matches
  const hasProductContent = productIndicatorCount >= 3;
  const hasTitleMatches = titleMatchCount >= Math.max(1, titleWords.length * 0.3);
  
  console.log(`Product validation: ${productIndicatorCount} product indicators, ${titleMatchCount}/${titleWords.length} title matches`);
  
  return hasProductContent && hasTitleMatches;
}

// Extract product information from HTML
function extractProductInfoFromHTML(html: string, url: string): { title?: string; price?: number; image?: string } {
  const htmlLower = html.toLowerCase();
  
  // Extract title from meta tags or page title
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }
  
  // Extract price from various patterns
  let price = 0;
  const pricePatterns = [
    /€\s*(\d+[.,]\d{2})/i,
    /\$(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*€/i,
    /(\d+[.,]\d{2})\s*\$/i,
    /price[^>]*>.*?(\d+[.,]\d{2})/i,
    /cost[^>]*>.*?(\d+[.,]\d{2})/i
  ];
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      price = parseFloat(match[1].replace(',', '.'));
      break;
    }
  }
  
  // Extract image from meta tags or img tags
  let image = '';
  const imagePatterns = [
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
    /<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i,
    /<img[^>]*src="([^"]*product[^"]*)"[^>]*>/i,
    /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp))"[^>]*>/i
  ];
  
  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      image = match[1];
      if (image.startsWith('//')) {
        image = 'https:' + image;
      } else if (image.startsWith('/')) {
        const urlObj = new URL(url);
        image = urlObj.origin + image;
      }
      break;
    }
  }
  
  return { title, price, image };
}

// Filter comparisons by price range to remove unrelated parts/accessories
function filterByPriceRange(comparisons: PriceComparison[], originalPrice: number): PriceComparison[] {
  if (originalPrice <= 0) {
    console.log("No original price available, skipping price filtering");
    return comparisons;
  }
  
  // For Google Shopping results, be more lenient with price filtering
  const isGoogleShopping = comparisons.some(comp => comp.url.includes('google.com/shopping/product/'));
  
  let minPrice, maxPrice;
  if (isGoogleShopping) {
    // More lenient for Google Shopping - allow wider range
    minPrice = originalPrice * 0.1; // 10% of original price
    maxPrice = originalPrice * 3.0; // 300% of original price
    console.log(`Google Shopping detected - using lenient price range: €${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`);
  } else {
    // Standard filtering for direct retailer URLs
    minPrice = originalPrice * 0.4; // 40% of original price
    maxPrice = originalPrice * 2.0; // 200% of original price
    console.log(`Price range: €${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`);
  }
  
  const filtered = comparisons.filter(comparison => {
    const isInRange = comparison.price >= minPrice && comparison.price <= maxPrice;
    if (isInRange) {
      console.log(`✓ ${comparison.store}: €${comparison.price} (within range)`);
    } else {
      console.log(`Filtered out ${comparison.store}: €${comparison.price} (${comparison.price < minPrice ? 'too cheap' : 'too expensive'})`);
    }
    return isInRange;
  });
  
  console.log(`Price filtering: ${comparisons.length} → ${filtered.length} results`);
  return filtered;
}

// Get local retailers for a specific country
function getLocalRetailers(country: string): string[] {
  const retailerMap: { [key: string]: string[] } = {
    'Germany': [
      'amazon.de', 'mediamarkt.de', 'saturn.de', 'otto.de', 'idealo.de',
      'geizhals.de', 'preisvergleich.de', 'galaxus.de', 'coolblue.de',
      'cyberport.de', 'alternate.de', 'mindfactory.de', 'caseking.de',
      'hardwareversand.de', 'computeruniverse.net', 'notebooksbilliger.de',
      'redcoon.de', 'arlt.com', 'hifi-schluderbacher.de', 'premiumhifi.de'
    ],
    'United States': [
      'amazon.com', 'walmart.com', 'target.com', 'bestbuy.com', 'newegg.com',
      'bhphotovideo.com', 'adorama.com', 'microcenter.com', 'ebay.com',
      'costco.com', 'samsclub.com'
    ],
    'United Kingdom': [
      'amazon.co.uk', 'currys.co.uk', 'argos.co.uk', 'johnlewis.com',
      'very.co.uk', 'ao.com', 'ebay.co.uk', 'scan.co.uk', 'overclockers.co.uk'
    ],
    'France': [
      'amazon.fr', 'fnac.com', 'darty.com', 'boulanger.com', 'ldlc.com',
      'materiel.net', 'rue-du-commerce.fr', 'cdiscount.com'
    ],
    'Italy': [
      'amazon.it', 'unieuro.it', 'mediaworld.it', 'trony.it', 'euronics.it'
    ],
    'Spain': [
      'amazon.es', 'pccomponentes.com', 'mediamarkt.es', 'elcorteingles.es'
    ],
    'Netherlands': [
      'amazon.nl', 'bol.com', 'coolblue.nl', 'mediamarkt.nl', 'saturn.nl'
    ],
    'Belgium': [
      'amazon.be', 'bol.com', 'coolblue.be', 'mediamarkt.be', 'saturn.be'
    ],
    'Austria': [
      'amazon.at', 'mediamarkt.at', 'saturn.at', 'otto.at', 'idealo.at'
    ],
    'Switzerland': [
      'amazon.ch', 'digitec.ch', 'galaxus.ch', 'mediamarkt.ch', 'saturn.ch'
    ]
  };
  
  return retailerMap[country] || retailerMap['United States'];
}

// Sort comparisons by local retailers first
function sortByLocalRetailers(comparisons: PriceComparison[], userCountry: string): PriceComparison[] {
  const localRetailers = getLocalRetailers(userCountry);
  
  return comparisons.sort((a, b) => {
    const aIsLocal = localRetailers.some(retailer => 
      a.store.toLowerCase().includes(retailer.toLowerCase())
    );
    const bIsLocal = localRetailers.some(retailer => 
      b.store.toLowerCase().includes(retailer.toLowerCase())
    );
    
    // Local retailers first
    if (aIsLocal && !bIsLocal) return -1;
    if (!aIsLocal && bIsLocal) return 1;
    
    // Then by price (lowest first)
    return a.price - b.price;
  });
}

// Detect product information from URL
async function detectProductFromUrl(url: string): Promise<{
  brand: string;
  model: string;
  title: string;
  category: string;
  price?: number;
} | null> {
  try {
    console.log(`Detecting product from URL: ${url}`);
    
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    
    // Extract brand from hostname
    const brandFromHostname = extractBrandFromHostname(hostname);
    
    // Extract product information from pathname
    const pathInfo = extractProductFromPathname(pathname);
    
    // Combine information
    const detectedProduct = {
      brand: brandFromHostname || pathInfo.brand || "",
      model: pathInfo.model || "",
      title: pathInfo.title || "",
      category: pathInfo.category || "",
      price: pathInfo.price
    };
    
    console.log(`Detected product:`, detectedProduct);
    return detectedProduct;
    
  } catch (error) {
    console.error("Error detecting product from URL:", error);
    return null;
  }
}

// Extract brand from hostname
function extractBrandFromHostname(hostname: string): string {
  const brandPatterns = [
    /^www\.(sonos|bose|jbl|sennheiser|beyerdynamic|akg|shure|denon|marantz|yamaha|pioneer|onkyo|harman|klipsch|bowerswilkins|focal|kef|monitor|dynaudio|elac|wharfedale|cambridge|rega|naim|linn|mcintosh|krell|paradigm|martinlogan|definitive|polk|infinity|cerwinvega|jamo|dali|qacoustics|m-audio|focusrite|presonus|behringer|rode|blue|audiotechnica|raycon|anker|soundcore|houseofmarley)\./i,
    /^www\.(samsung|lg|bosch|siemens|beko|whirlpool|electrolux|panasonic|sharp|toshiba|hitachi|daewoo|haier|apple|sony|philips|braun|kitchenaid|kenmore|maytag|frigidaire|ge|hotpoint|zanussi|aeg|miele|gorenje|vestel|arçelik|blaupunkt|grundig)\./i,
    /^www\.(dell|hp|lenovo|asus|acer|msi|gigabyte|intel|amd|nvidia|corsair|evga|thermaltake|coolermaster|noctua|bequiet|fractal|phanteks|lianli|nzxt|silverstone|antec|seasonic|gskill|crucial|western|seagate|kingston|adata|teamgroup|patriot|pny|logitech|razer|steelseries|hyperx|roccat|madcatz|saitek|thrustmaster|fanatec)\./i
  ];
  
  for (const pattern of brandPatterns) {
    const match = hostname.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  
  return "";
}

// Extract product information from URL pathname
function extractProductFromPathname(pathname: string): {
  brand: string;
  model: string;
  title: string;
  category: string;
  price?: number;
} {
  const pathParts = pathname.split('/').filter(part => part.length > 0);
  
  // Common product patterns
  const productPatterns = [
    // Sonos patterns
    { pattern: /sonos-ace/i, brand: 'sonos', model: 'ace', category: 'headphones' },
    { pattern: /sonos-era/i, brand: 'sonos', model: 'era', category: 'speakers' },
    { pattern: /sonos-beam/i, brand: 'sonos', model: 'beam', category: 'soundbar' },
    { pattern: /sonos-arc/i, brand: 'sonos', model: 'arc', category: 'soundbar' },
    { pattern: /sonos-sub/i, brand: 'sonos', model: 'sub', category: 'subwoofer' },
    { pattern: /sonos-one/i, brand: 'sonos', model: 'one', category: 'speakers' },
    { pattern: /sonos-five/i, brand: 'sonos', model: 'five', category: 'speakers' },
    { pattern: /sonos-move/i, brand: 'sonos', model: 'move', category: 'portable-speaker' },
    { pattern: /sonos-roam/i, brand: 'sonos', model: 'roam', category: 'portable-speaker' },
    
    // Bose patterns
    { pattern: /bose-quietcomfort/i, brand: 'bose', model: 'quietcomfort', category: 'headphones' },
    { pattern: /bose-soundlink/i, brand: 'bose', model: 'soundlink', category: 'speakers' },
    { pattern: /bose-home-speaker/i, brand: 'bose', model: 'home-speaker', category: 'speakers' },
    { pattern: /bose-sport/i, brand: 'bose', model: 'sport', category: 'headphones' },
    
    // JBL patterns
    { pattern: /jbl-charge/i, brand: 'jbl', model: 'charge', category: 'portable-speaker' },
    { pattern: /jbl-flip/i, brand: 'jbl', model: 'flip', category: 'portable-speaker' },
    { pattern: /jbl-pulse/i, brand: 'jbl', model: 'pulse', category: 'portable-speaker' },
    { pattern: /jbl-partybox/i, brand: 'jbl', model: 'partybox', category: 'portable-speaker' },
    
    // Sennheiser patterns
    { pattern: /sennheiser-momentum/i, brand: 'sennheiser', model: 'momentum', category: 'headphones' },
    { pattern: /sennheiser-hd/i, brand: 'sennheiser', model: 'hd', category: 'headphones' },
    { pattern: /sennheiser-ie/i, brand: 'sennheiser', model: 'ie', category: 'earphones' },
    
    // Audio-Technica patterns
    { pattern: /audio-technica-ath/i, brand: 'audio-technica', model: 'ath', category: 'headphones' },
    { pattern: /audio-technica-at/i, brand: 'audio-technica', model: 'at', category: 'microphones' },
    
    // Shure patterns
    { pattern: /shure-se/i, brand: 'shure', model: 'se', category: 'earphones' },
    { pattern: /shure-srh/i, brand: 'shure', model: 'srh', category: 'headphones' },
    { pattern: /shure-sm/i, brand: 'shure', model: 'sm', category: 'microphones' },
    
    // Beyerdynamic patterns
    { pattern: /beyerdynamic-dt/i, brand: 'beyerdynamic', model: 'dt', category: 'headphones' },
    { pattern: /beyerdynamic-t/i, brand: 'beyerdynamic', model: 't', category: 'microphones' },
    
    // AKG patterns
    { pattern: /akg-k/i, brand: 'akg', model: 'k', category: 'headphones' },
    { pattern: /akg-p/i, brand: 'akg', model: 'p', category: 'microphones' },
    
    // Denon patterns
    { pattern: /denon-avr/i, brand: 'denon', model: 'avr', category: 'receiver' },
    { pattern: /denon-dm/i, brand: 'denon', model: 'dm', category: 'micro-system' },
    
    // Marantz patterns
    { pattern: /marantz-sr/i, brand: 'marantz', model: 'sr', category: 'receiver' },
    { pattern: /marantz-pm/i, brand: 'marantz', model: 'pm', category: 'amplifier' },
    
    // Yamaha patterns
    { pattern: /yamaha-rx/i, brand: 'yamaha', model: 'rx', category: 'receiver' },
    { pattern: /yamaha-ax/i, brand: 'yamaha', model: 'ax', category: 'amplifier' },
    { pattern: /yamaha-ns/i, brand: 'yamaha', model: 'ns', category: 'speakers' },
    
    // Pioneer patterns
    { pattern: /pioneer-vsx/i, brand: 'pioneer', model: 'vsx', category: 'receiver' },
    { pattern: /pioneer-a/i, brand: 'pioneer', model: 'a', category: 'amplifier' },
    
    // Onkyo patterns
    { pattern: /onkyo-tx/i, brand: 'onkyo', model: 'tx', category: 'receiver' },
    { pattern: /onkyo-a/i, brand: 'onkyo', model: 'a', category: 'amplifier' },
    
    // Klipsch patterns
    { pattern: /klipsch-rp/i, brand: 'klipsch', model: 'rp', category: 'speakers' },
    { pattern: /klipsch-reference/i, brand: 'klipsch', model: 'reference', category: 'speakers' },
    { pattern: /klipsch-synergy/i, brand: 'klipsch', model: 'synergy', category: 'speakers' },
    
    // Bowers & Wilkins patterns
    { pattern: /bowers-wilkins-600/i, brand: 'bowers & wilkins', model: '600', category: 'speakers' },
    { pattern: /bowers-wilkins-700/i, brand: 'bowers & wilkins', model: '700', category: 'speakers' },
    { pattern: /bowers-wilkins-800/i, brand: 'bowers & wilkins', model: '800', category: 'speakers' },
    { pattern: /bowers-wilkins-px/i, brand: 'bowers & wilkins', model: 'px', category: 'headphones' },
    { pattern: /bowers-wilkins-pi/i, brand: 'bowers & wilkins', model: 'pi', category: 'earphones' },
    
    // Focal patterns
    { pattern: /focal-aria/i, brand: 'focal', model: 'aria', category: 'speakers' },
    { pattern: /focal-chora/i, brand: 'focal', model: 'chora', category: 'speakers' },
    { pattern: /focal-utopia/i, brand: 'focal', model: 'utopia', category: 'speakers' },
    { pattern: /focal-elegia/i, brand: 'focal', model: 'elegia', category: 'headphones' },
    { pattern: /focal-clear/i, brand: 'focal', model: 'clear', category: 'headphones' },
    
    // KEF patterns
    { pattern: /kef-q/i, brand: 'kef', model: 'q', category: 'speakers' },
    { pattern: /kef-r/i, brand: 'kef', model: 'r', category: 'speakers' },
    { pattern: /kef-reference/i, brand: 'kef', model: 'reference', category: 'speakers' },
    { pattern: /kef-ls50/i, brand: 'kef', model: 'ls50', category: 'speakers' },
    
    // Monitor Audio patterns
    { pattern: /monitor-audio-bronze/i, brand: 'monitor audio', model: 'bronze', category: 'speakers' },
    { pattern: /monitor-audio-silver/i, brand: 'monitor audio', model: 'silver', category: 'speakers' },
    { pattern: /monitor-audio-gold/i, brand: 'monitor audio', model: 'gold', category: 'speakers' },
    { pattern: /monitor-audio-platinum/i, brand: 'monitor audio', model: 'platinum', category: 'speakers' }
  ];
  
  const pathString = pathname.toLowerCase();
  
  for (const pattern of productPatterns) {
    if (pattern.pattern.test(pathString)) {
      return {
        brand: pattern.brand,
        model: pattern.model,
        title: `${pattern.brand} ${pattern.model}`.toLowerCase(),
        category: pattern.category
      };
    }
  }
  
  // Fallback: try to extract from path parts
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart) {
    // Look for model numbers in the last part
    const modelMatch = lastPart.match(/([a-z]{2,4}\d{2,4}[a-z]?)/i);
    if (modelMatch) {
      return {
        brand: "",
        model: modelMatch[1],
        title: lastPart,
        category: "electronics"
      };
    }
  }
  
  return {
    brand: "",
    model: "",
    title: pathParts.join(' '),
    category: "electronics"
  };
}

// Generate price comparisons for a product
function generatePriceComparisons(mainProduct: ProductData): PriceComparison[] {
  console.log(`Generating price comparisons for: ${mainProduct.title}`);
  
  // Get user location (default to Germany for now)
  const userLocation = { country: 'Germany' };
  console.log(`User location: ${JSON.stringify(userLocation)}`);
  
  // Don't generate fake URLs - return empty array
  console.log("Not generating fake URLs - returning empty array");
  return [];
}

// Convert scraped data to standard format
function convertToStandardFormat(scrapedData: any): {
  product: ProductData;
  comparisons: PriceComparison[];
} {
  const product: ProductData = {
    title: scrapedData.originalProduct?.title || "Product",
    price: scrapedData.originalProduct?.price || 0,
    currency: scrapedData.originalProduct?.currency || "€",
    url: scrapedData.originalProduct?.url || "",
    image: scrapedData.originalProduct?.image || "/placeholder.svg",
    store: scrapedData.originalProduct?.store || "Unknown"
  };
  
  const comparisons: PriceComparison[] = scrapedData.comparisons || [];
  
  return { product, comparisons };
}

// Gemini validation function
async function runGeminiValidation(originalProduct: any, comparisons: any[]) {
  // Skip Gemini validation if too many failures
  if (geminiFailureCount >= MAX_GEMINI_FAILURES) {
    console.log("Skipping Gemini validation due to previous failures");
    return comparisons;
  }

  const prompt = `You are a product comparison filter. Given an original product and a list of product comparisons from different stores, return only the ones that truly match the original product (same model and condition). Also clean up image URLs and standardize pricing.

IMPORTANT: Return ONLY a valid JSON array, no markdown formatting, no explanations, no code blocks. Just the raw JSON array.

Original Product:
${JSON.stringify(originalProduct)}

Comparisons:
${JSON.stringify(comparisons)}

Return ONLY a JSON array of cleaned and validated comparison products:`;

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000, // 30 second timeout
        maxRedirects: 5
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return safeParseGeminiJSON(text, comparisons);
  } catch (error) {
    console.error('Gemini API error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }
    geminiFailureCount++;
    console.log(`Gemini validation failure count: ${geminiFailureCount}/${MAX_GEMINI_FAILURES}`);
    throw new Error(`Gemini API request failed: ${error}`);
  }
}

router.post("/scrape-enhanced", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`Backend scraping request for: ${url}`);

    // Enhanced product detection (like Dupe.com)
    const detectedProduct = await detectProductFromUrl(url);
    console.log(`Enhanced product detection result:`, detectedProduct);

    // Extract product model from URL (fallback method)
    const productModel = extractProductModel(url);
    console.log(`Extracted product model: ${productModel || "Not found"}`);

    // Get user country from request or default to United States
    const userCountry = req.body.userLocation?.country || "United States";
    console.log(`User country detected: ${userCountry}`);

    // Extract product data directly without calling the old scraping function
    let capturedData: any = null;
    
    try {
      // Use the enhanced product detection
      const detectedProduct = await detectProductFromUrl(url);
      console.log("Detected product:", detectedProduct);
      
      // Create basic product data structure
      capturedData = {
        originalProduct: {
          title: detectedProduct?.title || "Product",
          price: detectedProduct?.price || 0,
          currency: "€",
          url,
          image: "/placeholder.svg",
          store: new URL(url).hostname.replace(/^www\./, ""),
        },
        comparisons: [],
      };
    } catch (error) {
      console.error("Error detecting product:", error);
      capturedData = {
        originalProduct: {
          title: "Product",
          price: 0,
          currency: "€",
          url,
          image: "/placeholder.svg",
          store: new URL(url).hostname.replace(/^www\./, ""),
        },
        comparisons: [],
      };
    }

    // Debug: Log what the original scraping returned
    console.log("Original scraping result:", JSON.stringify(capturedData, null, 2));

    // ALWAYS try to get real URLs from SearchAPI first, regardless of scraping success
    let comparisons: PriceComparison[] = [];
    let searchApiUsed = false;
    
    try {
      // Consolidate search logic to avoid duplicate calls
      let searchAttempted = false;
      
      // Use enhanced product detection for better search queries
      if (detectedProduct && detectedProduct.brand && detectedProduct.model && !searchAttempted) {
        console.log(`Using enhanced product detection: ${detectedProduct.brand} ${detectedProduct.model}`);
        const searchTitle = `${detectedProduct.brand} ${detectedProduct.model}`;
        comparisons = await searchExactProductModel(
          detectedProduct.model, 
          searchTitle, 
          userCountry, 
          capturedData?.originalProduct?.price
        );
        searchApiUsed = true;
        searchAttempted = true;
      }
      
      // If no results and we have a product model, try with that
      if (comparisons.length === 0 && productModel && !searchAttempted) {
        console.log(`Using extracted product model: ${productModel}`);
        comparisons = await searchExactProductModel(
          productModel, 
          capturedData?.originalProduct?.title || "Product", 
          userCountry, 
          capturedData?.originalProduct?.price
        );
        searchApiUsed = true;
        searchAttempted = true;
      }

      // If still no results, try with just the product title (only once)
      if (comparisons.length === 0 && capturedData?.originalProduct?.title && !searchAttempted) {
        console.log("No results with product model, trying with product title");
        comparisons = await searchExactProductModel(
          "", 
          capturedData.originalProduct.title, 
          userCountry, 
          capturedData.originalProduct.price
        );
        searchApiUsed = true;
        searchAttempted = true;
      }
    } catch (searchError) {
      console.error("SearchAPI error:", searchError);
      console.log("SearchAPI failed, will use fallback comparisons");
    }

    // Check if we got real SearchAPI results with actual product URLs
    const hasRealUrls = comparisons.length > 0 && searchApiUsed && 
      comparisons.some(comp => comp.url && comp.url.length > 20 && 
        !comp.url.match(/^https?:\/\/[^\/]+\/?$/));
    
    if (hasRealUrls) {
      console.log(`Found ${comparisons.length} real SearchAPI results with actual product URLs, using them`);
      // Sort by price (lowest first) and then by local retailers
      comparisons = sortByLocalRetailers(comparisons, userCountry);
      if (capturedData) {
        capturedData.comparisons = comparisons;
      } else {
        // Create basic product data if scraping failed
        capturedData = {
          originalProduct: {
            title: detectedProduct?.title || "Product",
            price: 0,
            currency: "€",
            url,
            image: "/placeholder.svg",
            store: new URL(url).hostname.replace(/^www\./, ""),
          },
          comparisons,
        };
      }
    } else {
      console.log("No real SearchAPI results with valid URLs found, using empty comparisons");
      // Don't use fake URLs - return empty comparisons
      if (!capturedData || !capturedData.originalProduct || capturedData.originalProduct.price === 0) {
        console.log("Original scraping failed or returned no price");
        
        // Create a basic product data structure
        const product: ProductData = {
          title: detectedProduct?.title || "Product",
          price: 0,
          currency: "€",
          url,
          image: "/placeholder.svg",
          store: new URL(url).hostname.replace(/^www\./, ""),
        };

        capturedData = {
          originalProduct: product,
          comparisons: [], // Empty array instead of fake URLs
        };
      } else {
        // Original scraping succeeded, but no SearchAPI results
        console.log("Using empty comparisons - no real URLs available");
        capturedData.comparisons = []; // Empty array instead of fake URLs
      }
    }

    if (!capturedData) {
      throw new Error("Failed to scrape product data");
    }

    // Convert to standard format
    const result = convertToStandardFormat(capturedData);

    // Gemini validation step
    let validatedComparisons = result.comparisons;
    try {
      validatedComparisons = await runGeminiValidation(result.product, result.comparisons);
      console.log(`Gemini validation successful, filtered to ${validatedComparisons.length} comparisons`);
    } catch (geminiErr) {
      console.error("Gemini validation failed, using unfiltered comparisons:", geminiErr);
      // Keep original comparisons if Gemini fails
      validatedComparisons = result.comparisons;
    }

    // Generate a unique request ID
    const requestId = Date.now().toString();

    res.json({
      product: result.product,
      comparisons: validatedComparisons,
      requestId,
    });
  } catch (error) {
    console.error("Scraping error:", error);
    
    // Even if everything fails, provide a basic response
    try {
      const url = req.body.url;
      const userCountry = req.body.userLocation?.country || "United States";
      
      console.log("Providing fallback response due to error");
      
  const fallbackProduct: ProductData = {
    title: "Product",
    price: 0,
    currency: "€",
    url,
    image: "/placeholder.svg",
    store: new URL(url).hostname.replace(/^www\./, ""),
  };
      
      // Don't generate fake URLs in error fallback
      res.json({
        product: fallbackProduct,
        comparisons: [], // Empty array instead of fake URLs
        requestId: Date.now().toString(),
      });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      res.json({ 
        product: {
          title: "Product",
          price: 0,
          currency: "€",
          url: req.body.url || "",
          image: "/placeholder.svg",
          store: "unknown"
        },
        comparisons: [],
        requestId: Date.now().toString(),
        error: "Failed to scrape product data"
      });
    }
  }
});

// New n8n webhook scraping function
async function scrapeWithN8nWebhook(url: string, gl?: string): Promise<any> {
  try {
    console.log("Calling n8n webhook for URL:", url, "GL:", gl);
    
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.srv824584.hstgr.cloud/webhook/new-test';
    
    console.log("Using n8n webhook URL:", n8nWebhookUrl);
    
    const params: any = { url };
    if (gl) {
      params.gl = gl;
    }
    
    console.log("Full URL being called:", `${n8nWebhookUrl}?${new URLSearchParams(params).toString()}`);
    
    const response = await axios.get(n8nWebhookUrl, {
      params: params,
      timeout: 60000, // 60 second timeout (increased from 30)
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log("n8n webhook response status:", response.status);
    console.log("n8n webhook response data:", JSON.stringify(response.data, null, 2));

    if (response.status !== 200) {
      throw new Error(`n8n webhook returned status ${response.status}`);
    }

    const data = response.data;
    
    // Handle the n8n response format
    if (data && data.mainProduct && Array.isArray(data.suggestions)) {
      // Convert suggestions to PriceComparison format
      const comparisons: PriceComparison[] = data.suggestions.map((suggestion: any) => ({
        title: suggestion.title,
        store: suggestion.site || 'unknown',
        price: extractPrice(suggestion.standardPrice || suggestion.discountPrice || '0'),
        currency: extractCurrency(suggestion.standardPrice || suggestion.discountPrice || ''),
        url: suggestion.link,
        image: suggestion.image,
        condition: "New",
        assessment: {
          cost: 3,
          value: 3,
          quality: 3,
          description: `Found on ${suggestion.site || 'unknown'}`
        }
      }));

      return {
        mainProduct: {
          title: data.mainProduct.title,
          price: data.mainProduct.price,
          image: data.mainProduct.image,
          url: data.mainProduct.url
        },
        suggestions: data.suggestions,
        comparisons: comparisons
      };
    }

    // Handle new n8n response format (array with single object containing mainProduct and suggestions)
    if (Array.isArray(data) && data.length > 0 && data[0].mainProduct && Array.isArray(data[0].suggestions)) {
      console.log("Handling new n8n response format (array with mainProduct and suggestions)");
      
      const firstItem = data[0];
      const mainProduct = firstItem.mainProduct;
      
      // Convert suggestions to PriceComparison format
      const comparisons: PriceComparison[] = firstItem.suggestions.map((suggestion: any) => ({
        title: suggestion.title,
        store: suggestion.site || 'unknown',
        price: extractPrice(suggestion.standardPrice || suggestion.discountPrice || '0'),
        currency: extractCurrency(suggestion.standardPrice || suggestion.discountPrice || ''),
        url: suggestion.link,
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
          description: `Found on ${suggestion.site || 'unknown'}`
        }
      }));

      return {
        mainProduct: {
          title: mainProduct.title,
          price: mainProduct.price,
          image: mainProduct.image,
          url: mainProduct.url
        },
        suggestions: firstItem.suggestions,
        comparisons: comparisons
      };
    }

    // Handle new n8n response format (single object with all fields)
    if (data && data.title && (data.standardPrice || data.discountPrice)) {
      console.log("Handling new n8n response format (single object)");
      
      // Convert single object to the expected format
      const mainProduct = {
        title: data.title,
        price: data.standardPrice || data.discountPrice || "Price not available",
        image: data.image,
        url: data.link
      };

      const suggestion = {
        title: data.title,
        standardPrice: data.standardPrice,
        discountPrice: data.discountPrice,
        site: data.site,
        link: data.link,
        image: data.image,
        // New fields
        merchant: data.merchant,
        stock: data.stock,
        reviewsCount: data.reviewsCount,
        deliveryPrice: data.deliveryPrice,
        details: data.details,
        returnPolicy: data.returnPolicy,
        rating: data.rating
      };

      const comparison: PriceComparison = {
        title: data.title,
        store: data.site || 'unknown',
        price: extractPrice(data.standardPrice || data.discountPrice || '0'),
        currency: extractCurrency(data.standardPrice || data.discountPrice || ''),
        url: data.link,
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
          description: `Found on ${data.site || 'unknown'}`
        }
      };

      return {
        mainProduct: mainProduct,
        suggestions: [suggestion],
        comparisons: [comparison]
      };
    }

    // If response is empty or invalid, throw an error instead of providing fallback data
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
        fullUrl: error.config?.url + '?' + new URLSearchParams(error.config?.params || {}).toString()
      });
    }
    
    throw error;
  }
}

// Helper function to extract currency from price string
function extractCurrency(priceString: string): string {
  if (priceString.includes('€')) return '€';
  if (priceString.includes('$')) return '$';
  if (priceString.includes('£')) return '£';
  return '€'; // Default to Euro
}

// Filter suggestions based on registered businesses
async function filterSuggestionsByRegisteredBusinesses(suggestions: any[]): Promise<any[]> {
  try {
    // Get all active registered businesses
    const registeredBusinesses = await businessService.getActiveBusinesses();
    
    if (registeredBusinesses.length === 0) {
      // If no businesses are registered, return all suggestions
      return suggestions;
    }

    // Create a set of registered domains for faster lookup
    const registeredDomains = new Set(
      registeredBusinesses.map(business => business.domain.toLowerCase())
    );

    // Filter suggestions to only include registered businesses
    const filteredSuggestions = suggestions.filter(suggestion => {
      if (!suggestion.url) return false;
      
      try {
        const url = new URL(suggestion.url);
        const domain = url.hostname.toLowerCase().replace('www.', '');
        return registeredDomains.has(domain);
      } catch {
        return false;
      }
    });

    // If no suggestions match registered businesses, return empty array
    if (filteredSuggestions.length === 0) {
      console.log("No suggestions match registered businesses");
      return [];
    }

    console.log(`Filtered ${suggestions.length} suggestions to ${filteredSuggestions.length} from registered businesses`);
    return filteredSuggestions;
  } catch (error) {
    console.error("Error filtering suggestions by registered businesses:", error);
    // Return original suggestions if filtering fails
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
          const domain = url.hostname.toLowerCase().replace('www.', '');
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

// New route for n8n webhook scraping
router.post("/n8n-scrape", async (req, res) => {
  console.log("=== n8n-scrape route called ===");
  console.log("Request body:", req.body);
  
  try {
    const { url, requestId, gl, userCountry, findSimilar } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`n8n webhook scraping request for URL: ${url}, GL: ${gl}`);
    console.log(`Request ID: ${requestId}`);
    console.log(`Find Similar: ${findSimilar}`);

    // Call the n8n webhook with gl parameter
    const result = await scrapeWithN8nWebhook(url, gl);

    console.log("n8n webhook scraping successful");
    console.log("Main product:", result.mainProduct);
    console.log("Original suggestions count:", result.suggestions?.length || 0);

    // Filter suggestions based on registered businesses and track visits
    if (result.suggestions && result.suggestions.length > 0) {
      result.suggestions = await filterSuggestionsByRegisteredBusinesses(result.suggestions);
      console.log("Filtered suggestions count:", result.suggestions.length);
      
      // Track visits for each business that appears in suggestions
      await trackBusinessVisits(result.suggestions);
    }

    // If findSimilar is true, modify the search to focus on similar products
    if (findSimilar && result.mainProduct) {
      console.log("Processing similar products search...");
      
      // Extract product information for similar search
      const productTitle = result.mainProduct.title;
      const productBrand = extractBrandFromTitle(productTitle);
      const productType = extractProductType(productTitle);
      
      // Create a search query for similar products
      const similarSearchQuery = `${productBrand} ${productType}`;
      console.log(`Similar products search query: ${similarSearchQuery}`);
      
      // For now, we'll use the same suggestions but mark them as similar products
      // In a full implementation, you might want to make additional API calls
      // to find truly similar products from different brands or categories
      
      if (result.suggestions && result.suggestions.length > 0) {
        // Filter and enhance suggestions for similar products
        result.suggestions = result.suggestions.map(suggestion => ({
          ...suggestion,
          isSimilar: true,
          similarityReason: `Similar ${productType} from ${suggestion.merchant || suggestion.site || 'other retailers'}`
        }));
        
        console.log(`Enhanced ${result.suggestions.length} suggestions for similar products`);
      }
    }

    // Save to search history if user is authenticated
    try {
      // Check if user is authenticated by looking for user info in request
      const userId = (req as any).user?.id;
      if (userId && result.mainProduct?.title) {
        await searchHistoryService.addSearch(userId, {
          url: url,
          title: result.mainProduct.title,
          requestId: requestId || `search_${Date.now()}`,
        });
        console.log(`Search history saved for user ${userId} (type: ${findSimilar ? 'similar' : 'price_comparison'})`);
      } else {
        console.log("No user authentication found, skipping search history save");
      }
    } catch (historyError) {
      console.error("Failed to save search history:", historyError);
      // Don't fail the main request if history saving fails
    }

    res.json(result);
  } catch (error) {
    console.error("n8n webhook scraping error:", error);
    
    // Return a proper error response instead of mock data
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.log("Returning error response:", errorMessage);
    
    res.status(500).json({ 
      error: "Failed to fetch product information",
      message: errorMessage,
      mainProduct: null,
      suggestions: []
    });
  }
});

export default router; 