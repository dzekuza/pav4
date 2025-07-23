import { useState } from "react";
import { TrendingUp, Shield, Zap, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/SearchInput";
import { LocationPermission } from "@/components/LocationPermission";
import { SearchLoadingOverlay } from "@/components/LoadingSkeleton";
import { SearchHeader } from "@/components/SearchHeader";
import { useLocation } from "@/hooks/use-location";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const [searchUrl, setSearchUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("de"); // Default to Germany
  const navigate = useNavigate();
  
  const { 
    location, 
    showLocationPermission, 
    handleLocationDetected, 
    handleLocationSkip 
  } = useLocation();

  // Map country codes to full country names for the API
  const getCountryName = (countryCode: string): string => {
    const countryMap: { [key: string]: string } = {
      'us': 'United States',
      'de': 'Germany',
      'uk': 'United Kingdom',
      'lt': 'Lithuania',
      'lv': 'Latvia',
      'ee': 'Estonia',
      'fr': 'France',
      'es': 'Spain',
      'it': 'Italy',
      'pl': 'Poland',
      'cz': 'Czech Republic',
      'sk': 'Slovakia',
      'hu': 'Hungary',
      'ro': 'Romania',
      'bg': 'Bulgaria',
      'hr': 'Croatia',
      'si': 'Slovenia',
      'at': 'Austria',
      'be': 'Belgium',
      'nl': 'Netherlands',
      'dk': 'Denmark',
      'se': 'Sweden',
      'no': 'Norway',
      'fi': 'Finland',
      'is': 'Iceland',
      'ie': 'Ireland',
      'pt': 'Portugal',
      'gr': 'Greece',
      'cy': 'Cyprus',
      'mt': 'Malta',
      'lu': 'Luxembourg',
      'ae': 'United Arab Emirates',
      'ai': 'Anguilla',
      'ar': 'Argentina',
      'au': 'Australia',
      'bm': 'Bermuda',
      'br': 'Brazil',
      'ca': 'Canada',
      'cl': 'Chile',
      'co': 'Colombia',
      'cr': 'Costa Rica',
      'do': 'Dominican Republic',
      'ec': 'Ecuador',
      'sv': 'El Salvador',
      'gt': 'Guatemala',
      'hn': 'Honduras',
      'mx': 'Mexico',
      'ni': 'Nicaragua',
      'pa': 'Panama',
      'py': 'Paraguay',
      'pe': 'Peru',
      'uy': 'Uruguay',
      've': 'Venezuela'
    };
    return countryMap[countryCode] || 'Germany';
  };

  const handleSearch = (url: string) => {
    if (!url.trim()) {
      setError("Please enter a product URL");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const userCountry = getCountryName(selectedCountry);
    const requestId = Date.now().toString();
    const searchQuery = "product-search"; // Generic slug

    // Navigate to the new search results page with the URL, country, and gl parameter
    const resultsUrl = `/new-search/${requestId}/${searchQuery}`;
    navigate(resultsUrl, {
      state: {
        searchUrl: url.trim(),
        userCountry,
        gl: selectedCountry, // Pass the gl parameter
        requestId,
      },
    });
  };

  const popularStores = [
    { name: "Amazon", logo: "🛒" },
    { name: "eBay", logo: "🛍️" },
    { name: "Walmart", logo: "🏪" },
    { name: "Target", logo: "🎯" },
    { name: "Best Buy", logo: "⚡" },
    { name: "Costco", logo: "📦" },
  ];

  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Smart Product Detection",
      description: "AI-powered extraction of product details from any URL",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Real-time Price Tracking",
      description: "Compare prices across multiple retailers instantly",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Trusted Sources",
      description: "Only verified retailers and marketplace sellers",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Get results in seconds with our optimized scraping",
    },
    ];

  const recentSearches = [
    { product: "Sony WH-1000XM5 Headphones", savings: "$45" },
    { product: "iPhone 15 Pro Max", savings: "$120" },
    { product: "Nike Air Max 270", savings: "$30" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Loading Overlay */}
      <SearchLoadingOverlay isVisible={isLoading} />
      {/* Location Permission Modal */}
      {showLocationPermission && (
        <LocationPermission
          onLocationDetected={handleLocationDetected}
          onSkip={handleLocationSkip}
        />
      )}
      {/* Header */}
      <SearchHeader showBackButton={false} />
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Find the{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              best deals
            </span>{" "}
            on any product
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Paste any product URL and we'll instantly find the cheapest prices
            across hundreds of retailers. Save money on every purchase with
            AI-powered price comparison.
          </p>
          {/* Search Form */}
          <div className="mb-12">
            <SearchInput
              value={searchUrl}
              onChange={setSearchUrl}
              onSubmit={handleSearch}
              isLoading={isLoading}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
          {/* Popular Stores */}
          <div className="mb-16">
            <p className="text-sm text-muted-foreground mb-4">
              We compare prices from popular stores including:
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {popularStores.map((store) => (
                <div
                  key={store.name}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-lg">{store.logo}</span>
                  <span>{store.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why choose PriceHunt?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform makes price comparison effortless and
              accurate
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-brand-gradient rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Recent Searches */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recent success stories</h2>
            <p className="text-muted-foreground">
              See how much others have saved
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {recentSearches.map((search, index) => (
              <Card
                key={index}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{search.product}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {search.savings} saved
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 PriceHunt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
