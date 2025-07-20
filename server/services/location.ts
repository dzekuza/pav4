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
  const countryMap: { [key: string]: LocationInfo } = {
    LT: {
      country: "Lithuania",
      countryCode: "LT",
      region: "Baltic",
      currency: "€",
      timeZone: "Europe/Vilnius",
    },
    LV: {
      country: "Latvia",
      countryCode: "LV",
      region: "Baltic",
      currency: "€",
      timeZone: "Europe/Riga",
    },
    EE: {
      country: "Estonia",
      countryCode: "EE",
      region: "Baltic",
      currency: "€",
      timeZone: "Europe/Tallinn",
    },
    DE: {
      country: "Germany",
      countryCode: "DE",
      region: "Western Europe",
      currency: "€",
      timeZone: "Europe/Berlin",
    },
    FR: {
      country: "France",
      countryCode: "FR",
      region: "Western Europe",
      currency: "€",
      timeZone: "Europe/Paris",
    },
    GB: {
      country: "United Kingdom",
      countryCode: "GB",
      region: "Western Europe",
      currency: "£",
      timeZone: "Europe/London",
    },
    PL: {
      country: "Poland",
      countryCode: "PL",
      region: "Eastern Europe",
      currency: "PLN",
      timeZone: "Europe/Warsaw",
    },
    US: {
      country: "United States",
      countryCode: "US",
      region: "North America",
      currency: "$",
      timeZone: "America/New_York",
    },
  };

  return countryMap[countryCode] || countryMap["US"];
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
    const clientIP = req.ip || req.socket.remoteAddress || "127.0.0.1";

    // Try to detect from headers first
    let location = detectLocationFromHeaders(req.headers);

    // Fallback to IP detection
    if (!location) {
      location = detectLocationFromIP(clientIP);
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
      location: {
        country: "United States",
        countryCode: "US",
        region: "North America",
        currency: "$",
        timeZone: "America/New_York",
      },
      localDealers: [],
      error: "Failed to detect location"
    });
  }
};
