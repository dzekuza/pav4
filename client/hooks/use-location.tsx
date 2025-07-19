import { useState, useEffect } from "react";
import { LocationInfo, LocalDealer, LocationResponse } from "@shared/api";

export function useLocation() {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [localDealers, setLocalDealers] = useState<LocalDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPermission, setShowLocationPermission] = useState(false);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user has already set a location preference
        const savedLocation = localStorage.getItem("user_location");
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          setLocation(parsedLocation);
          await fetchLocalDealers(parsedLocation);
          setLoading(false);
          return;
        }

        // Try to detect location from server
        const response = await fetch("/api/location");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: LocationResponse = await response.json();
        
        // If server detected a specific location (not default US), use it
        if (data.location && data.location.country !== "United States") {
          setLocation(data.location);
          setLocalDealers(data.localDealers);
          localStorage.setItem("user_location", JSON.stringify(data.location));
        } else {
          // Show location permission dialog for better detection
          setShowLocationPermission(true);
        }
      } catch (err) {
        console.error("Location detection failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to detect location",
        );

        // Show location permission dialog instead of defaulting to US
        setShowLocationPermission(true);
      } finally {
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  const fetchLocalDealers = async (userLocation: LocationInfo) => {
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location: userLocation }),
      });
      
      if (response.ok) {
        const data: LocationResponse = await response.json();
        setLocalDealers(data.localDealers);
      }
    } catch (err) {
      console.error("Failed to fetch local dealers:", err);
    }
  };

  const handleLocationDetected = (detectedLocation: LocationInfo) => {
    setLocation(detectedLocation);
    setShowLocationPermission(false);
    localStorage.setItem("user_location", JSON.stringify(detectedLocation));
    fetchLocalDealers(detectedLocation);
  };

  const handleLocationSkip = () => {
    // Use Lithuania as default for Baltic region users
    const defaultLocation: LocationInfo = {
      country: "Lithuania",
      countryCode: "LT",
      region: "Baltic",
      currency: "€",
      timeZone: "Europe/Vilnius",
    };
    
    setLocation(defaultLocation);
    setShowLocationPermission(false);
    localStorage.setItem("user_location", JSON.stringify(defaultLocation));
    fetchLocalDealers(defaultLocation);
  };

  return {
    location,
    localDealers,
    loading,
    error,
    showLocationPermission,
    handleLocationDetected,
    handleLocationSkip,
  };
}
