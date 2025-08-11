import { RequestHandler } from "express";

export interface LocationInfo {
  country: string;
  countryCode: string;
  region: string;
  city?: string;
  currency: string;
  timeZone: string;
}

export interface LocalDealer {
  name: string;
  url: string;
  country: string;
  region: string;
  searchUrlPattern: string;
  currency: string;
  priority: number; // Lower = higher priority
}

// SearchAPI supported countries with their gl codes (Google Shopping API)
export const SEARCH_API_SUPPORTED_COUNTRIES: { [key: string]: LocationInfo } = {
  // Middle East
  AE: {
    country: "United Arab Emirates",
    countryCode: "ae",
    region: "Middle East",
    currency: "AED",
    timeZone: "Asia/Dubai",
  },
  // Americas
  AI: {
    country: "Anguilla",
    countryCode: "ai",
    region: "Caribbean",
    currency: "XCD",
    timeZone: "America/Anguilla",
  },
  AR: {
    country: "Argentina",
    countryCode: "ar",
    region: "South America",
    currency: "ARS",
    timeZone: "America/Argentina/Buenos_Aires",
  },
  AU: {
    country: "Australia",
    countryCode: "au",
    region: "Asia Pacific",
    currency: "AUD",
    timeZone: "Australia/Sydney",
  },
  BM: {
    country: "Bermuda",
    countryCode: "bm",
    region: "North America",
    currency: "BMD",
    timeZone: "Atlantic/Bermuda",
  },
  BR: {
    country: "Brazil",
    countryCode: "br",
    region: "South America",
    currency: "BRL",
    timeZone: "America/Sao_Paulo",
  },
  CA: {
    country: "Canada",
    countryCode: "ca",
    region: "North America",
    currency: "CAD",
    timeZone: "America/Toronto",
  },
  CL: {
    country: "Chile",
    countryCode: "cl",
    region: "South America",
    currency: "CLP",
    timeZone: "America/Santiago",
  },
  CO: {
    country: "Colombia",
    countryCode: "co",
    region: "South America",
    currency: "COP",
    timeZone: "America/Bogota",
  },
  MX: {
    country: "Mexico",
    countryCode: "mx",
    region: "North America",
    currency: "MXN",
    timeZone: "America/Mexico_City",
  },
  PE: {
    country: "Peru",
    countryCode: "pe",
    region: "South America",
    currency: "PEN",
    timeZone: "America/Lima",
  },
  US: {
    country: "United States",
    countryCode: "us",
    region: "North America",
    currency: "$",
    timeZone: "America/New_York",
  },
  VE: {
    country: "Venezuela",
    countryCode: "ve",
    region: "South America",
    currency: "VES",
    timeZone: "America/Caracas",
  },
  // Europe
  AT: {
    country: "Austria",
    countryCode: "at",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Vienna",
  },
  BE: {
    country: "Belgium",
    countryCode: "be",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Brussels",
  },
  BG: {
    country: "Bulgaria",
    countryCode: "bg",
    region: "Eastern Europe",
    currency: "BGN",
    timeZone: "Europe/Sofia",
  },
  CH: {
    country: "Switzerland",
    countryCode: "ch",
    region: "Western Europe",
    currency: "CHF",
    timeZone: "Europe/Zurich",
  },
  CZ: {
    country: "Czech Republic",
    countryCode: "cz",
    region: "Eastern Europe",
    currency: "CZK",
    timeZone: "Europe/Prague",
  },
  DE: {
    country: "Germany",
    countryCode: "de",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Berlin",
  },
  DK: {
    country: "Denmark",
    countryCode: "dk",
    region: "Nordic",
    currency: "DKK",
    timeZone: "Europe/Copenhagen",
  },
  EE: {
    country: "Estonia",
    countryCode: "ee",
    region: "Baltic",
    currency: "€",
    timeZone: "Europe/Tallinn",
  },
  ES: {
    country: "Spain",
    countryCode: "es",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Madrid",
  },
  FI: {
    country: "Finland",
    countryCode: "fi",
    region: "Nordic",
    currency: "€",
    timeZone: "Europe/Helsinki",
  },
  FR: {
    country: "France",
    countryCode: "fr",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Paris",
  },
  GB: {
    country: "United Kingdom",
    countryCode: "gb",
    region: "Western Europe",
    currency: "£",
    timeZone: "Europe/London",
  },
  GR: {
    country: "Greece",
    countryCode: "gr",
    region: "Southern Europe",
    currency: "€",
    timeZone: "Europe/Athens",
  },
  HR: {
    country: "Croatia",
    countryCode: "hr",
    region: "Eastern Europe",
    currency: "€",
    timeZone: "Europe/Zagreb",
  },
  HU: {
    country: "Hungary",
    countryCode: "hu",
    region: "Eastern Europe",
    currency: "HUF",
    timeZone: "Europe/Budapest",
  },
  IE: {
    country: "Ireland",
    countryCode: "ie",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Dublin",
  },
  IT: {
    country: "Italy",
    countryCode: "it",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Rome",
  },
  LT: {
    country: "Lithuania",
    countryCode: "lt",
    region: "Baltic",
    currency: "€",
    timeZone: "Europe/Vilnius",
  },
  LV: {
    country: "Latvia",
    countryCode: "lv",
    region: "Baltic",
    currency: "€",
    timeZone: "Europe/Riga",
  },
  LU: {
    country: "Luxembourg",
    countryCode: "lu",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Luxembourg",
  },
  MT: {
    country: "Malta",
    countryCode: "mt",
    region: "Southern Europe",
    currency: "€",
    timeZone: "Europe/Malta",
  },
  NL: {
    country: "Netherlands",
    countryCode: "nl",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Amsterdam",
  },
  NO: {
    country: "Norway",
    countryCode: "no",
    region: "Nordic",
    currency: "NOK",
    timeZone: "Europe/Oslo",
  },
  PL: {
    country: "Poland",
    countryCode: "pl",
    region: "Eastern Europe",
    currency: "PLN",
    timeZone: "Europe/Warsaw",
  },
  PT: {
    country: "Portugal",
    countryCode: "pt",
    region: "Western Europe",
    currency: "€",
    timeZone: "Europe/Lisbon",
  },
  RO: {
    country: "Romania",
    countryCode: "ro",
    region: "Eastern Europe",
    currency: "RON",
    timeZone: "Europe/Bucharest",
  },
  SE: {
    country: "Sweden",
    countryCode: "se",
    region: "Nordic",
    currency: "SEK",
    timeZone: "Europe/Stockholm",
  },
  SI: {
    country: "Slovenia",
    countryCode: "si",
    region: "Eastern Europe",
    currency: "€",
    timeZone: "Europe/Ljubljana",
  },
  SK: {
    country: "Slovakia",
    countryCode: "sk",
    region: "Eastern Europe",
    currency: "€",
    timeZone: "Europe/Bratislava",
  },
  // Asia Pacific
  HK: {
    country: "Hong Kong",
    countryCode: "hk",
    region: "Asia Pacific",
    currency: "HKD",
    timeZone: "Asia/Hong_Kong",
  },
  ID: {
    country: "Indonesia",
    countryCode: "id",
    region: "Asia Pacific",
    currency: "IDR",
    timeZone: "Asia/Jakarta",
  },
  IN: {
    country: "India",
    countryCode: "in",
    region: "Asia Pacific",
    currency: "₹",
    timeZone: "Asia/Kolkata",
  },
  JP: {
    country: "Japan",
    countryCode: "jp",
    region: "Asia Pacific",
    currency: "¥",
    timeZone: "Asia/Tokyo",
  },
  KR: {
    country: "South Korea",
    countryCode: "kr",
    region: "Asia Pacific",
    currency: "₩",
    timeZone: "Asia/Seoul",
  },
  MY: {
    country: "Malaysia",
    countryCode: "my",
    region: "Asia Pacific",
    currency: "MYR",
    timeZone: "Asia/Kuala_Lumpur",
  },
  NZ: {
    country: "New Zealand",
    countryCode: "nz",
    region: "Asia Pacific",
    currency: "NZD",
    timeZone: "Pacific/Auckland",
  },
  PH: {
    country: "Philippines",
    countryCode: "ph",
    region: "Asia Pacific",
    currency: "PHP",
    timeZone: "Asia/Manila",
  },
  SG: {
    country: "Singapore",
    countryCode: "sg",
    region: "Asia Pacific",
    currency: "SGD",
    timeZone: "Asia/Singapore",
  },
  TH: {
    country: "Thailand",
    countryCode: "th",
    region: "Asia Pacific",
    currency: "THB",
    timeZone: "Asia/Bangkok",
  },
  TW: {
    country: "Taiwan",
    countryCode: "tw",
    region: "Asia Pacific",
    currency: "TWD",
    timeZone: "Asia/Taipei",
  },
  VN: {
    country: "Vietnam",
    countryCode: "vn",
    region: "Asia Pacific",
    currency: "VND",
    timeZone: "Asia/Ho_Chi_Minh",
  },
  // Africa
  EG: {
    country: "Egypt",
    countryCode: "eg",
    region: "Africa",
    currency: "EGP",
    timeZone: "Africa/Cairo",
  },
  GH: {
    country: "Ghana",
    countryCode: "gh",
    region: "Africa",
    currency: "GHS",
    timeZone: "Africa/Accra",
  },
  KE: {
    country: "Kenya",
    countryCode: "ke",
    region: "Africa",
    currency: "KES",
    timeZone: "Africa/Nairobi",
  },
  NG: {
    country: "Nigeria",
    countryCode: "ng",
    region: "Africa",
    currency: "NGN",
    timeZone: "Africa/Lagos",
  },
  ZA: {
    country: "South Africa",
    countryCode: "za",
    region: "Africa",
    currency: "ZAR",
    timeZone: "Africa/Johannesburg",
  },
  // Middle East
  IL: {
    country: "Israel",
    countryCode: "il",
    region: "Middle East",
    currency: "ILS",
    timeZone: "Asia/Jerusalem",
  },
  SA: {
    country: "Saudi Arabia",
    countryCode: "sa",
    region: "Middle East",
    currency: "SAR",
    timeZone: "Asia/Riyadh",
  },
  TR: {
    country: "Turkey",
    countryCode: "tr",
    region: "Middle East",
    currency: "TRY",
    timeZone: "Europe/Istanbul",
  },
};

// Database of local dealers by region
export const localDealers: LocalDealer[] = [
  // Lithuania
  {
    name: "pigu.lt",
    url: "https://pigu.lt",
    country: "Lithuania",
    region: "Baltic",
    searchUrlPattern: "https://pigu.lt/search?q={query}",
    currency: "€",
    priority: 1,
  },
  {
    name: "varle.lt",
    url: "https://varle.lt",
    country: "Lithuania",
    region: "Baltic",
    searchUrlPattern: "https://varle.lt/search?q={query}",
    currency: "€",
    priority: 2,
  },
  {
    name: "kilobaitas.lt",
    url: "https://kilobaitas.lt",
    country: "Lithuania",
    region: "Baltic",
    searchUrlPattern: "https://kilobaitas.lt/search?q={query}",
    currency: "€",
    priority: 3,
  },

  // Latvia
  {
    name: "1a.lv",
    url: "https://1a.lv",
    country: "Latvia",
    region: "Baltic",
    searchUrlPattern: "https://1a.lv/search?q={query}",
    currency: "€",
    priority: 1,
  },
  {
    name: "220.lv",
    url: "https://220.lv",
    country: "Latvia",
    region: "Baltic",
    searchUrlPattern: "https://220.lv/search?q={query}",
    currency: "€",
    priority: 2,
  },

  // Estonia
  {
    name: "kaup24.ee",
    url: "https://kaup24.ee",
    country: "Estonia",
    region: "Baltic",
    searchUrlPattern: "https://kaup24.ee/search?q={query}",
    currency: "€",
    priority: 1,
  },

  // Germany
  {
    name: "amazon.de",
    url: "https://amazon.de",
    country: "Germany",
    region: "Western Europe",
    searchUrlPattern: "https://amazon.de/s?k={query}",
    currency: "€",
    priority: 1,
  },
  {
    name: "mediamarkt.de",
    url: "https://mediamarkt.de",
    country: "Germany",
    region: "Western Europe",
    searchUrlPattern: "https://mediamarkt.de/search?query={query}",
    currency: "€",
    priority: 2,
  },

  // France
  {
    name: "amazon.fr",
    url: "https://amazon.fr",
    country: "France",
    region: "Western Europe",
    searchUrlPattern: "https://amazon.fr/s?k={query}",
    currency: "€",
    priority: 1,
  },
  {
    name: "fnac.com",
    url: "https://fnac.com",
    country: "France",
    region: "Western Europe",
    searchUrlPattern: "https://fnac.com/search?query={query}",
    currency: "€",
    priority: 2,
  },

  // UK
  {
    name: "amazon.co.uk",
    url: "https://amazon.co.uk",
    country: "United Kingdom",
    region: "Western Europe",
    searchUrlPattern: "https://amazon.co.uk/s?k={query}",
    currency: "£",
    priority: 1,
  },
  {
    name: "currys.co.uk",
    url: "https://currys.co.uk",
    country: "United Kingdom",
    region: "Western Europe",
    searchUrlPattern: "https://currys.co.uk/search?q={query}",
    currency: "£",
    priority: 2,
  },

  // Poland
  {
    name: "allegro.pl",
    url: "https://allegro.pl",
    country: "Poland",
    region: "Eastern Europe",
    searchUrlPattern: "https://allegro.pl/listing?string={query}",
    currency: "PLN",
    priority: 1,
  },
  {
    name: "x-kom.pl",
    url: "https://x-kom.pl",
    country: "Poland",
    region: "Eastern Europe",
    searchUrlPattern: "https://x-kom.pl/search?q={query}",
    currency: "PLN",
    priority: 2,
  },

  // Nordic countries
  {
    name: "elgiganten.dk",
    url: "https://elgiganten.dk",
    country: "Denmark",
    region: "Nordic",
    searchUrlPattern: "https://elgiganten.dk/search?SearchTerm={query}",
    currency: "DKK",
    priority: 1,
  },
  {
    name: "elkjop.no",
    url: "https://elkjop.no",
    country: "Norway",
    region: "Nordic",
    searchUrlPattern: "https://elkjop.no/search?SearchTerm={query}",
    currency: "NOK",
    priority: 1,
  },
  {
    name: "power.fi",
    url: "https://power.fi",
    country: "Finland",
    region: "Nordic",
    searchUrlPattern: "https://power.fi/search?SearchTerm={query}",
    currency: "€",
    priority: 1,
  },
];

// Detect user location from IP (in production, use a proper IP geolocation service)
export function detectLocationFromIP(ip: string): LocationInfo {
  // This is a simplified implementation
  // In production, you would use services like:
  // - MaxMind GeoIP2
  // - ipapi.co
  // - ip-api.com
  // - CloudFlare's CF-IPCountry header

  // For now, return default based on common patterns
  if (
    ip.includes("192.168") ||
    ip.includes("127.0") ||
    ip.includes("10.") ||
    ip.includes("172.")
  ) {
    // Local development - default to Lithuania since that's where pigu.lt is popular
    return {
      country: "Lithuania",
      countryCode: "LT",
      region: "Baltic",
      city: "Vilnius",
      currency: "€",
      timeZone: "Europe/Vilnius",
    };
  }

  // Default to US for unknown IPs
  return {
    country: "United States",
    countryCode: "US",
    region: "North America",
    currency: "$",
    timeZone: "America/New_York",
  };
}

// Detect location from browser headers
export function detectLocationFromHeaders(headers: any): LocationInfo | null {
  // Check CloudFlare country header
  if (headers["cf-ipcountry"]) {
    const countryCode = headers["cf-ipcountry"].toUpperCase();
    return getLocationByCountryCode(countryCode);
  }

  // Check Accept-Language header for hints
  const acceptLanguage = headers["accept-language"];
  if (acceptLanguage) {
    if (acceptLanguage.includes("lt")) {
      return {
        country: "Lithuania",
        countryCode: "LT",
        region: "Baltic",
        currency: "€",
        timeZone: "Europe/Vilnius",
      };
    }
    if (acceptLanguage.includes("lv")) {
      return {
        country: "Latvia",
        countryCode: "LV",
        region: "Baltic",
        currency: "€",
        timeZone: "Europe/Riga",
      };
    }
    if (acceptLanguage.includes("et")) {
      return {
        country: "Estonia",
        countryCode: "EE",
        region: "Baltic",
        currency: "€",
        timeZone: "Europe/Tallinn",
      };
    }
    if (acceptLanguage.includes("de")) {
      return {
        country: "Germany",
        countryCode: "DE",
        region: "Western Europe",
        currency: "€",
        timeZone: "Europe/Berlin",
      };
    }
  }

  return null;
}

// Get location info by country code
function getLocationByCountryCode(countryCode: string): LocationInfo {
  // Only return supported countries
  const supportedCountry = SEARCH_API_SUPPORTED_COUNTRIES[countryCode];
  if (supportedCountry) {
    return supportedCountry;
  }

  // Fallback to US if country is not supported
  return SEARCH_API_SUPPORTED_COUNTRIES["US"];
}

// Get list of all supported countries
export function getSupportedCountries(): LocationInfo[] {
  return Object.values(SEARCH_API_SUPPORTED_COUNTRIES).sort((a, b) =>
    a.country.localeCompare(b.country),
  );
}

// Validate if a country is supported by SearchAPI
export function isCountrySupported(countryCode: string): boolean {
  // Convert to lowercase for comparison since gl codes are lowercase
  const normalizedCode = countryCode.toLowerCase();
  return Object.values(SEARCH_API_SUPPORTED_COUNTRIES).some(
    (country: any) => country.countryCode === normalizedCode,
  );
}

// Get local dealers for a specific location
export function getLocalDealers(location: LocationInfo): LocalDealer[] {
  return localDealers
    .filter(
      (dealer) =>
        dealer.country === location.country ||
        dealer.region === location.region,
    )
    .sort((a, b) => a.priority - b.priority);
}

// Get location detection handler
export const getLocationHandler: RequestHandler = async (req, res) => {
  try {
    // If it's a POST request with location data, validate and use that
    if (req.method === "POST" && req.body && req.body.location) {
      const userLocation = req.body.location as LocationInfo;

      // Validate that the country is supported
      if (!isCountrySupported(userLocation.countryCode)) {
        return res.status(400).json({
          error: "Country not supported by SearchAPI",
          message: `Country code '${userLocation.countryCode}' is not supported. Please choose from the supported countries list.`,
        });
      }

      const dealers = getLocalDealers(userLocation);

      res.json({
        location: userLocation,
        localDealers: dealers.slice(0, 5), // Return top 5 local dealers
      });
      return;
    }

    // For GET requests, detect location automatically
    const clientIP = req.ip || req.socket.remoteAddress || "127.0.0.1";

    // Try to detect from headers first
    let location = detectLocationFromHeaders(req.headers);

    // Fallback to IP detection
    if (!location) {
      location = detectLocationFromIP(clientIP);
    }

    // Ensure the detected location is supported
    if (!isCountrySupported(location.countryCode)) {
      // Fallback to US if detected country is not supported
      location = SEARCH_API_SUPPORTED_COUNTRIES["US"];
    }

    // Get local dealers
    const dealers = getLocalDealers(location);

    res.json({
      location,
      localDealers: dealers.slice(0, 5), // Return top 5 local dealers
    });
  } catch (error) {
    console.error("Location detection error:", error);
    // Return a fallback response instead of 500 error
    res.json({
      location: SEARCH_API_SUPPORTED_COUNTRIES["US"],
      localDealers: [],
      error: "Failed to detect location",
    });
  }
};
