import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Globe,
  Shield,
  CheckCircle,
  AlertCircle,
  Search,
} from "lucide-react";
import { LocationInfo } from "@shared/api";

interface LocationPermissionProps {
  onLocationDetected: (location: LocationInfo) => void;
  onSkip: () => void;
}

interface SupportedCountry {
  country: string;
  countryCode: string;
  region: string;
  currency: string;
  timeZone: string;
}

export function LocationPermission({
  onLocationDetected,
  onSkip,
}: LocationPermissionProps) {
  const [status, setStatus] = useState<
    "idle" | "detecting" | "success" | "error" | "manual"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<LocationInfo | null>(
    null,
  );
  const [supportedCountries, setSupportedCountries] = useState<
    SupportedCountry[]
  >([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSupportedCountries();
  }, []);

  const fetchSupportedCountries = async () => {
    try {
      const response = await fetch("/api/supported-countries");
      if (response.ok) {
        const data = await response.json();
        setSupportedCountries(data.countries);
      } else {
        // Fallback to common countries if API fails
        setSupportedCountries([
          {
            country: "United States",
            countryCode: "US",
            region: "North America",
            currency: "$",
            timeZone: "America/New_York",
          },
          {
            country: "Germany",
            countryCode: "DE",
            region: "Western Europe",
            currency: "€",
            timeZone: "Europe/Berlin",
          },
          {
            country: "United Kingdom",
            countryCode: "GB",
            region: "Western Europe",
            currency: "£",
            timeZone: "Europe/London",
          },
          {
            country: "France",
            countryCode: "FR",
            region: "Western Europe",
            currency: "€",
            timeZone: "Europe/Paris",
          },
          {
            country: "Spain",
            countryCode: "ES",
            region: "Western Europe",
            currency: "€",
            timeZone: "Europe/Madrid",
          },
          {
            country: "Italy",
            countryCode: "IT",
            region: "Western Europe",
            currency: "€",
            timeZone: "Europe/Rome",
          },
          {
            country: "Lithuania",
            countryCode: "LT",
            region: "Baltic",
            currency: "€",
            timeZone: "Europe/Vilnius",
          },
          {
            country: "Latvia",
            countryCode: "LV",
            region: "Baltic",
            currency: "€",
            timeZone: "Europe/Riga",
          },
          {
            country: "Estonia",
            countryCode: "EE",
            region: "Baltic",
            currency: "€",
            timeZone: "Europe/Tallinn",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch supported countries:", err);
      // Use fallback countries
      setSupportedCountries([
        {
          country: "United States",
          countryCode: "US",
          region: "North America",
          currency: "$",
          timeZone: "America/New_York",
        },
        {
          country: "Germany",
          countryCode: "DE",
          region: "Western Europe",
          currency: "€",
          timeZone: "Europe/Berlin",
        },
        {
          country: "United Kingdom",
          countryCode: "GB",
          region: "Western Europe",
          currency: "£",
          timeZone: "Europe/London",
        },
        {
          country: "France",
          countryCode: "FR",
          region: "Western Europe",
          currency: "€",
          timeZone: "Europe/Paris",
        },
        {
          country: "Spain",
          countryCode: "ES",
          region: "Western Europe",
          currency: "€",
          timeZone: "Europe/Madrid",
        },
        {
          country: "Italy",
          countryCode: "IT",
          region: "Western Europe",
          currency: "€",
          timeZone: "Europe/Rome",
        },
        {
          country: "Lithuania",
          countryCode: "LT",
          region: "Baltic",
          currency: "€",
          timeZone: "Europe/Vilnius",
        },
        {
          country: "Latvia",
          countryCode: "LV",
          region: "Baltic",
          currency: "€",
          timeZone: "Europe/Riga",
        },
        {
          country: "Estonia",
          countryCode: "EE",
          region: "Baltic",
          currency: "€",
          timeZone: "Europe/Tallinn",
        },
      ]);
    } finally {
      setLoadingCountries(false);
    }
  };

  const getCountryFlag = (countryCode: string) => {
    const flagMap: { [key: string]: string } = {
      US: "🇺🇸",
      DE: "🇩🇪",
      GB: "🇬🇧",
      FR: "🇫🇷",
      ES: "🇪🇸",
      IT: "🇮🇹",
      LT: "🇱🇹",
      LV: "🇱🇻",
      EE: "🇪🇪",
      PL: "🇵🇱",
      NL: "🇳🇱",
      BE: "🇧🇪",
      AT: "🇦🇹",
      CH: "🇨🇭",
      SE: "🇸🇪",
      NO: "🇳🇴",
      DK: "🇩🇰",
      FI: "🇫🇮",
      CZ: "🇨🇿",
      HU: "🇭🇺",
      RO: "🇷🇴",
      BG: "🇧🇬",
      HR: "🇭🇷",
      SK: "🇸🇰",
      SI: "🇸🇮",
      IE: "🇮🇪",
      PT: "🇵🇹",
      GR: "🇬🇷",
      CY: "🇨🇾",
      MT: "🇲🇹",
      LU: "🇱🇺",
      CA: "🇨🇦",
      MX: "🇲🇽",
      JP: "🇯🇵",
      KR: "🇰🇷",
      AU: "🇦🇺",
      NZ: "🇳🇿",
      IN: "🇮🇳",
      SG: "🇸🇬",
      MY: "🇲🇾",
      TH: "🇹🇭",
      VN: "🇻🇳",
      PH: "🇵🇭",
      ID: "🇮🇩",
      HK: "🇭🇰",
      TW: "🇹🇼",
      BR: "🇧🇷",
      AR: "🇦🇷",
      CL: "🇨🇱",
      CO: "🇨🇴",
      PE: "🇵🇪",
      VE: "🇻🇪",
      ZA: "🇿🇦",
      EG: "🇪🇬",
      NG: "🇳🇬",
      KE: "🇰🇪",
      GH: "🇬🇭",
      IL: "🇮🇱",
      AE: "🇦🇪",
      SA: "🇸🇦",
      TR: "🇹🇷",
    };
    return flagMap[countryCode] || "🌍";
  };

  const detectBrowserLocation = () => {
    setStatus("detecting");
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get country from coordinates
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
          );

          if (!response.ok) {
            throw new Error("Failed to get location data");
          }

          const data = await response.json();
          const countryCode = data.countryCode;

          // Find the country in supported countries
          const location = supportedCountries.find(
            (c) => c.countryCode === countryCode,
          );
          if (location) {
            setDetectedLocation(location);
            setStatus("success");
          } else {
            // If detected country is not supported, default to US
            const defaultLocation =
              supportedCountries.find((c) => c.countryCode === "US") ||
              supportedCountries[0];
            setDetectedLocation(defaultLocation);
            setStatus("success");
          }
        } catch (err) {
          setError("Failed to determine your location");
          setStatus("error");
        }
      },
      (err) => {
        setError("Location access denied or unavailable");
        setStatus("error");
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  };

  const selectManualLocation = (country: SupportedCountry) => {
    onLocationDetected(country);
  };

  const filteredCountries = supportedCountries.filter((country) =>
    country.country.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Detect Your Location</CardTitle>
          <CardDescription>
            We'll use your location to show you the best prices and local
            retailers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "idle" && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-5 w-5" />
                <span>Your location is only used to find better prices</span>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={detectBrowserLocation}
                  className="w-full"
                  size="lg"
                >
                  <Globe className="mr-2 h-5 w-5" />
                  Detect My Location
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or select manually
                    </span>
                  </div>
                </div>

                {loadingCountries ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Loading countries...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredCountries.map((country) => (
                        <Button
                          key={country.countryCode}
                          variant="outline"
                          size="sm"
                          onClick={() => selectManualLocation(country)}
                          className="w-full justify-start"
                        >
                          <span className="mr-2">
                            {getCountryFlag(country.countryCode)}
                          </span>
                          {country.country}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {status === "detecting" && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Detecting your location...
              </p>
            </div>
          )}

          {status === "success" && detectedLocation && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Location detected!</p>
                <Badge variant="secondary" className="mt-2">
                  {detectedLocation.country}
                </Badge>
              </div>
              <Button
                onClick={() => onLocationDetected(detectedLocation)}
                className="w-full"
              >
                Use This Location
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  Location detection failed
                </p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setStatus("manual")}
                className="w-full"
              >
                Select Manually
              </Button>
            </div>
          )}

          {status === "manual" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select your country to get localized results:
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredCountries.map((country) => (
                  <Button
                    key={country.countryCode}
                    variant="outline"
                    size="sm"
                    onClick={() => selectManualLocation(country)}
                    className="w-full justify-start"
                  >
                    <span className="mr-2">
                      {getCountryFlag(country.countryCode)}
                    </span>
                    {country.country}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="w-full text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
