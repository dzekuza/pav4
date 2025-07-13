import { useState, useEffect } from "react";
import { LocationInfo, LocalDealer, LocationResponse } from "@shared/api";

export function useLocation() {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [localDealers, setLocalDealers] = useState<LocalDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/location");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: LocationResponse = await response.json();
        setLocation(data.location);
        setLocalDealers(data.localDealers);
      } catch (err) {
        console.error("Location detection failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to detect location",
        );

        // Fallback to default location
        setLocation({
          country: "United States",
          countryCode: "US",
          region: "North America",
          currency: "$",
          timeZone: "America/New_York",
        });
        setLocalDealers([]);
      } finally {
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  return {
    location,
    localDealers,
    loading,
    error,
  };
}
