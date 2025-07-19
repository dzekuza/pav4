import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { LocationInfo } from "@shared/api";

interface LocationPermissionProps {
  onLocationDetected: (location: LocationInfo) => void;
  onSkip: () => void;
}

const commonCountries = [
  { name: "Lithuania", code: "LT", flag: "🇱🇹" },
  { name: "Latvia", code: "LV", flag: "🇱🇻" },
  { name: "Estonia", code: "EE", flag: "🇪🇪" },
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { name: "United States", code: "US", flag: "🇺🇸" },
  { name: "Poland", code: "PL", flag: "🇵🇱" },
  { name: "France", code: "FR", flag: "🇫🇷" },
];

export function LocationPermission({ onLocationDetected, onSkip }: LocationPermissionProps) {
  const [status, setStatus] = useState<"idle" | "detecting" | "success" | "error" | "manual">("idle");
  const [error, setError] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<LocationInfo | null>(null);

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
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          
          if (!response.ok) {
            throw new Error("Failed to get location data");
          }

          const data = await response.json();
          const countryCode = data.countryCode;
          
          // Map country code to our location format
          const locationMap: { [key: string]: LocationInfo } = {
            LT: { country: "Lithuania", countryCode: "LT", region: "Baltic", currency: "€", timeZone: "Europe/Vilnius" },
            LV: { country: "Latvia", countryCode: "LV", region: "Baltic", currency: "€", timeZone: "Europe/Riga" },
            EE: { country: "Estonia", countryCode: "EE", region: "Baltic", currency: "€", timeZone: "Europe/Tallinn" },
            DE: { country: "Germany", countryCode: "DE", region: "Western Europe", currency: "€", timeZone: "Europe/Berlin" },
            GB: { country: "United Kingdom", countryCode: "GB", region: "Western Europe", currency: "£", timeZone: "Europe/London" },
            US: { country: "United States", countryCode: "US", region: "North America", currency: "$", timeZone: "America/New_York" },
            PL: { country: "Poland", countryCode: "PL", region: "Eastern Europe", currency: "PLN", timeZone: "Europe/Warsaw" },
            FR: { country: "France", countryCode: "FR", region: "Western Europe", currency: "€", timeZone: "Europe/Paris" },
          };

          const location = locationMap[countryCode] || locationMap["US"];
          setDetectedLocation(location);
          setStatus("success");
        } catch (err) {
          setError("Failed to determine your location");
          setStatus("error");
        }
      },
      (err) => {
        setError("Location access denied or unavailable");
        setStatus("error");
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const selectManualLocation = (countryCode: string) => {
    const locationMap: { [key: string]: LocationInfo } = {
      LT: { country: "Lithuania", countryCode: "LT", region: "Baltic", currency: "€", timeZone: "Europe/Vilnius" },
      LV: { country: "Latvia", countryCode: "LV", region: "Baltic", currency: "€", timeZone: "Europe/Riga" },
      EE: { country: "Estonia", countryCode: "EE", region: "Baltic", currency: "€", timeZone: "Europe/Tallinn" },
      DE: { country: "Germany", countryCode: "DE", region: "Western Europe", currency: "€", timeZone: "Europe/Berlin" },
      GB: { country: "United Kingdom", countryCode: "GB", region: "Western Europe", currency: "£", timeZone: "Europe/London" },
      US: { country: "United States", countryCode: "US", region: "North America", currency: "$", timeZone: "America/New_York" },
      PL: { country: "Poland", countryCode: "PL", region: "Eastern Europe", currency: "PLN", timeZone: "Europe/Warsaw" },
      FR: { country: "France", countryCode: "FR", region: "Western Europe", currency: "€", timeZone: "Europe/Paris" },
    };

    const location = locationMap[countryCode];
    if (location) {
      onLocationDetected(location);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Detect Your Location</CardTitle>
          <CardDescription>
            We'll use your location to show you the best prices and local retailers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "idle" && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Your location is only used to find better prices</span>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={detectBrowserLocation}
                  className="w-full"
                  size="lg"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Detect My Location
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or select manually</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {commonCountries.map((country) => (
                    <Button
                      key={country.code}
                      variant="outline"
                      size="sm"
                      onClick={() => selectManualLocation(country.code)}
                      className="justify-start"
                    >
                      <span className="mr-2">{country.flag}</span>
                      {country.name}
                    </Button>
                  ))}
                </div>
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
                <p className="font-medium text-red-600 dark:text-red-400">Location detection failed</p>
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
              <div className="grid grid-cols-2 gap-2">
                {commonCountries.map((country) => (
                  <Button
                    key={country.code}
                    variant="outline"
                    size="sm"
                    onClick={() => selectManualLocation(country.code)}
                    className="justify-start"
                  >
                    <span className="mr-2">{country.flag}</span>
                    {country.name}
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