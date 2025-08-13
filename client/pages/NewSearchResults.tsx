import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ScrapeResponse, ProductData, PriceComparison } from "../../shared/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Star,
  AlertCircle,
  Heart,
  Search,
  Package,
  Truck,
  Shield,
  CheckCircle,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import AnimatedGradientBackground from "../components/ui/animated-gradient-background";
import { Alert, AlertDescription } from "../components/ui/alert";
import { SearchHeader } from "../components/SearchHeader";
import { SearchInput } from "../components/SearchInput";
import {
  LoadingSkeleton,
  SearchLoadingState,
} from "../components/LoadingSkeleton";
import { useFavorites } from "../hooks/use-favorites";
import { useAuthModal } from "../hooks/use-auth-modal";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

// Helper functions
function extractPrice(priceString: string): number {
  if (!priceString) return 0;
  const match = priceString.match(/[€$£]?\s?(\d+(?:[.,]\d{2})?)/);
  if (!match) return 0;
  
  const price = parseFloat(match[1].replace(",", "."));
  
  // Convert USD prices to EUR (approximate conversion)
  if (priceString.includes('$')) {
    return price * 0.85; // Approximate USD to EUR conversion
  }
  
  return price;
}

function extractCurrency(priceString: string): string {
  // Always return EUR for consistency
  return "€";
}

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return "/placeholder.svg";
  }
}

// Categories data
const categories = [
  { name: "all", icon: "🔍", label: "All Results" },
  { name: "electronics", icon: "📱", label: "Electronics" },
  { name: "fashion", icon: "👗", label: "Fashion" },
  { name: "home", icon: "🏠", label: "Home & Garden" },
  { name: "sports", icon: "⚽", label: "Sports" },
  { name: "beauty", icon: "💄", label: "Beauty" },
  { name: "books", icon: "📚", label: "Books" },
  { name: "toys", icon: "🧸", label: "Toys" },
  { name: "automotive", icon: "🚗", label: "Automotive" },
  { name: "health", icon: "💊", label: "Health" },
  { name: "food", icon: "🍕", label: "Food" },
  { name: "baby", icon: "👶", label: "Baby & Kids" },
  { name: "pets", icon: "🐕", label: "Pet Supplies" },
  { name: "office", icon: "💼", label: "Office & Business" },
  { name: "jewelry", icon: "💍", label: "Jewelry & Watches" },
  { name: "tools", icon: "🔧", label: "Tools & Hardware" },
  { name: "music", icon: "🎵", label: "Music & Instruments" },
  { name: "art", icon: "🎨", label: "Art & Crafts" },
  { name: "garden", icon: "🌱", label: "Garden & Outdoor" },
  { name: "kitchen", icon: "🍽️", label: "Kitchen & Dining" },
  { name: "bath", icon: "🛁", label: "Bath & Personal Care" },
];

function getCategoryIcon(categoryName: string) {
  const category = categories.find(c => c.name === categoryName);
  return category?.icon || "📦";
}

function getCategoryLabel(categoryName: string) {
  const category = categories.find(c => c.name === categoryName);
  return category?.label || "All Results";
}

const NewSearchResults = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { favorites, addFavorite, removeFavorite, checkFavorite } =
    useFavorites();
  const { isAuthenticated } = useAuth();

  const { handleProtectedAction, modalProps } = useAuthModal({
    title: "Sign in to save favorites",
    description:
      "Create an account or sign in to save products to your favorites",
    defaultTab: "login",
    onSuccess: () => {
      // After successful authentication, the user can retry their action
      toast({
        title: "Welcome back!",
        description: "You can now save products to your favorites",
      });
    },
  });

  const [searchData, setSearchData] = useState<any>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteStates, setFavoriteStates] = useState<
    Map<string, { isFavorited: boolean; favoriteId?: number }>
  >(new Map());
  const [newSearchUrl, setNewSearchUrl] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("de");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    // Clear any existing data when starting fresh
    if (location.state?.searchUrl) {
      setSearchData(null);
      setOriginalUrl("");
      setError(null);
      setIsLoading(true);
    }

    // Get data from navigation state or try to fetch from API
    if (location.state?.searchData) {
      setSearchData(location.state.searchData);
      setOriginalUrl(location.state.originalUrl || "");
    } else if (location.state?.searchUrl) {
      setOriginalUrl(location.state.searchUrl);
      // If keyword search, skip URL validation and call keyword search API
      if (location.state.isKeywordSearch) {
        handleKeywordSearch(
          location.state.searchUrl,
          location.state.userCountry,
          location.state.gl,
        );
      } else {
        // Trigger the search immediately (URL flow)
        handleSearchFromState(
          location.state.searchUrl,
          location.state.userCountry,
          location.state.gl,
        );
      }
    } else {
      // If no state, try to extract URL from slug and start search
      const slug = location.pathname.split("/").pop();
      if (slug && slug !== requestId) {
        // Try to decode the slug as a URL
        try {
          const decodedSlug = decodeURIComponent(slug);
          // Check if it looks like a URL
          if (decodedSlug.includes("://") || decodedSlug.startsWith("www.")) {
            console.log("Extracted URL from slug:", decodedSlug);
            setOriginalUrl(decodedSlug);
            handleSearchFromState(decodedSlug, "Germany", "de");
            return;
          }
        } catch (error) {
          console.log("Could not decode slug as URL:", slug);
        }
      }

      // If no URL found in slug, try to fetch the data (fallback)
      fetchSearchData();
    }
  }, [location.state, requestId, location.pathname]);

  const handleSearchFromState = async (
    url: string,
    userCountry: string,
    gl?: string,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "Starting search with URL:",
        url,
        "Country:",
        userCountry,
        "GL:",
        gl,
      );

      // Detect if input is a URL or keywords
      let isUrl = false;
      try {
        const u = new URL(url.trim());
        isUrl = !!u.protocol && !!u.host;
      } catch {
        isUrl = false;
      }

      // Prepare request body based on input type
      const requestBody: any = {
        requestId: requestId,
        userLocation: { country: userCountry },
        gl: gl, // Pass the gl parameter for country-specific search
      };

      if (isUrl) {
        requestBody.url = url;
      } else {
        requestBody.keywords = url;
      }

      const response = await fetch("/api/n8n-scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch search data");
      }

      const data = await response.json();
      console.log("Search response:", data);

      // Normalize array-wrapped n8n payloads: [{ mainProduct, suggestions }]
      const payload: any =
        Array.isArray(data) &&
        data.length === 1 &&
        data[0]?.mainProduct &&
        data[0]?.suggestions
          ? data[0]
          : data;

      // Handle n8n response format
      if (payload.mainProduct && payload.suggestions) {
        // Convert n8n format to our expected format
        const mainProduct: ProductData = {
          title: payload.mainProduct.title,
          price: extractPrice(payload.mainProduct.price),
          currency: extractCurrency(payload.mainProduct.price),
          image: payload.mainProduct.image,
          url: payload.mainProduct.url,
          store: new URL(payload.mainProduct.url || url).hostname.replace(
            /^www\./,
            "",
          ),
        };

        // Convert suggestions to PriceComparison format
        const comparisons: PriceComparison[] = payload.suggestions.map(
          (suggestion: any) => ({
            title: suggestion.title,
            store: suggestion.site || "unknown",
            price: extractPrice(
              suggestion.standardPrice || suggestion.discountPrice || "0",
            ),
            currency: extractCurrency(
              suggestion.standardPrice || suggestion.discountPrice || "",
            ),
            url: suggestion.link,
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

        setSearchData({
          mainProduct: mainProduct,
          suggestions: payload.suggestions,
          comparisons: comparisons,
        });
      } else {
        setSearchData(payload);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Search error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load search results",
      );
      setIsLoading(false);
    }
  };

  const fetchSearchData = async () => {
    if (!requestId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to get the URL from sessionStorage if originalUrl is not set
      let urlToUse = originalUrl;
      if (!urlToUse) {
        const storedData = sessionStorage.getItem(`product_request_${requestId}`);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            urlToUse = parsedData.url;
            setOriginalUrl(urlToUse); // Update the state with the retrieved URL
            console.log("Retrieved URL from sessionStorage:", urlToUse);
          } catch (error) {
            console.error("Error parsing sessionStorage data:", error);
          }
        }
      }

      // Detect if urlToUse is a URL or keywords
      let isUrl = false;
      try {
        const u = new URL(urlToUse || "https://example.com");
        isUrl = !!u.protocol && !!u.host;
      } catch {
        isUrl = false;
      }

      // Prepare request body based on input type
      const requestBody: any = {
        requestId: requestId,
      };

      if (isUrl) {
        requestBody.url = urlToUse || "https://example.com";
      } else {
        requestBody.keywords = urlToUse || "example product";
      }

      // For now, we'll use the same POST request as refresh since n8n webhook doesn't support GET with requestId
      const response = await fetch("/api/n8n-scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchData(data);
      } else {
        setError("Failed to load search results");
      }
    } catch (err) {
      setError("Failed to load search results");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (originalUrl) {
      handleSearchFromState(
        originalUrl,
        location.state?.userCountry || "Germany",
      );
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleNewSearch = async (url: string) => {
    if (!url.trim()) return;
    // Detect if input is a URL
    let isUrl = false;
    try {
      const u = new URL(url.trim());
      isUrl = !!u.protocol && !!u.host;
    } catch {
      isUrl = false;
    }
    // Clear all current search data
    setSearchData(null);
    setOriginalUrl("");
    setError(null);
    setIsLoading(true);
    setNewSearchUrl("");
    // Navigate to new search with fresh state
    const newRequestId = Date.now().toString();
    navigate(`/new-search/${newRequestId}/search`, {
      replace: true,
      state: {
        searchUrl: url.trim(),
        userCountry: "Germany",
        gl: "de",
        isKeywordSearch: !isUrl,
      },
    });
  };

  const toggleFavorite = async (suggestion: any) => {
    const itemKey = `${suggestion.site}-${suggestion.title}`;
    const currentState = favoriteStates.get(itemKey);

    const performToggle = async () => {
      try {
        if (currentState?.isFavorited && currentState.favoriteId) {
          // Remove from favorites
          await removeFavorite(currentState.favoriteId);
          setFavoriteStates((prev) => {
            const newMap = new Map(prev);
            newMap.set(itemKey, { isFavorited: false });
            return newMap;
          });
          toast({
            title: "Removed from favorites",
            description: "Item removed from your favorites",
          });
        } else {
          // Add to favorites
          const newFavorite = await addFavorite({
            title: suggestion.title,
            price: suggestion.standardPrice || suggestion.discountPrice,
            currency: extractCurrency(
              suggestion.standardPrice || suggestion.discountPrice || "",
            ),
            url: suggestion.link,
            image: suggestion.image,
            store: suggestion.site,
            merchant: suggestion.merchant,
            stock: suggestion.stock,
            rating: suggestion.rating,
            reviewsCount: suggestion.reviewsCount,
            deliveryPrice: suggestion.deliveryPrice,
            details: suggestion.details,
            returnPolicy: suggestion.returnPolicy,
            condition: "New",
          });

          setFavoriteStates((prev) => {
            const newMap = new Map(prev);
            newMap.set(itemKey, {
              isFavorited: true,
              favoriteId: newFavorite.id,
            });
            return newMap;
          });

          toast({
            title: "Added to favorites",
            description: "Item added to your favorites",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to update favorites",
          variant: "destructive",
        });
      }
    };

    // Use protected action handler to check authentication
    handleProtectedAction(performToggle);
  };

  // Determine if searchData is an array (keyword search) or object (URL search)
  const isArrayResponse = Array.isArray(searchData);
  // Always treat suggestions as an array for rendering
  const suggestions = isArrayResponse
    ? searchData
    : searchData?.suggestions
      ? Array.isArray(searchData.suggestions)
        ? searchData.suggestions
        : [searchData.suggestions]
      : [];
  const mainProduct = !isArrayResponse ? searchData?.mainProduct : null;

  // Filter suggestions by category
  const filteredSuggestions = selectedCategory === "all" 
    ? suggestions 
    : suggestions.filter((suggestion: any) => {
        // Simple category detection based on product title and store
        const title = suggestion.title?.toLowerCase() || "";
        const store = suggestion.site?.toLowerCase() || "";
        
        switch (selectedCategory) {
          case "electronics":
            return title.includes("phone") || title.includes("laptop") || title.includes("computer") || 
                   title.includes("tablet") || title.includes("camera") || title.includes("tv") ||
                   store.includes("amazon") || store.includes("bestbuy");
          case "fashion":
            return title.includes("shirt") || title.includes("dress") || title.includes("shoes") || 
                   title.includes("jacket") || title.includes("pants") || title.includes("accessories");
          case "home":
            return title.includes("furniture") || title.includes("kitchen") || title.includes("garden") || 
                   title.includes("decor") || title.includes("bedroom") || title.includes("bathroom");
          case "sports":
            return title.includes("fitness") || title.includes("gym") || title.includes("running") || 
                   title.includes("basketball") || title.includes("football") || title.includes("tennis");
          case "beauty":
            return title.includes("makeup") || title.includes("skincare") || title.includes("perfume") || 
                   title.includes("cosmetics") || title.includes("beauty");
          case "books":
            return title.includes("book") || title.includes("novel") || title.includes("textbook") || 
                   store.includes("amazon") || store.includes("barnes");
          case "toys":
            return title.includes("toy") || title.includes("game") || title.includes("puzzle") || 
                   title.includes("doll") || title.includes("lego");
          case "automotive":
            return title.includes("car") || title.includes("auto") || title.includes("tire") || 
                   title.includes("battery") || title.includes("oil");
          case "health":
            return title.includes("vitamin") || title.includes("supplement") || title.includes("medicine") || 
                   title.includes("health") || title.includes("wellness");
          case "food":
            return title.includes("food") || title.includes("snack") || title.includes("beverage") || 
                   title.includes("coffee") || title.includes("tea");
          case "baby":
            return title.includes("baby") || title.includes("infant") || title.includes("toddler") || 
                   title.includes("diaper") || title.includes("formula") || title.includes("stroller");
          case "pets":
            return title.includes("pet") || title.includes("dog") || title.includes("cat") || 
                   title.includes("pet food") || title.includes("toy") || title.includes("collar");
          case "office":
            return title.includes("office") || title.includes("business") || title.includes("desk") || 
                   title.includes("chair") || title.includes("printer") || title.includes("paper");
          case "jewelry":
            return title.includes("jewelry") || title.includes("ring") || title.includes("necklace") || 
                   title.includes("watch") || title.includes("bracelet") || title.includes("earring");
          case "tools":
            return title.includes("tool") || title.includes("hardware") || title.includes("drill") || 
                   title.includes("screwdriver") || title.includes("hammer") || title.includes("wrench");
          case "music":
            return title.includes("music") || title.includes("instrument") || title.includes("guitar") || 
                   title.includes("piano") || title.includes("drum") || title.includes("microphone");
          case "art":
            return title.includes("art") || title.includes("craft") || title.includes("paint") || 
                   title.includes("canvas") || title.includes("brush") || title.includes("sculpture");
          case "garden":
            return title.includes("garden") || title.includes("outdoor") || title.includes("plant") || 
                   title.includes("flower") || title.includes("lawn") || title.includes("patio");
          case "kitchen":
            return title.includes("kitchen") || title.includes("cookware") || title.includes("appliance") || 
                   title.includes("utensil") || title.includes("dining") || title.includes("tableware");
          case "bath":
            return title.includes("bath") || title.includes("personal care") || title.includes("soap") || 
                   title.includes("shampoo") || title.includes("towel") || title.includes("toiletries");
          default:
            return true;
        }
      });

  // Prevent repeated fetches: Only fetch if searchData is null and not already loading
  useEffect(() => {
    let didFetch = false;
    if (!searchData && !isLoading && location.state?.searchUrl) {
      didFetch = true;
      setIsLoading(true);
      setError(null);
      if (location.state.isKeywordSearch) {
        handleKeywordSearch(
          location.state.searchUrl,
          location.state.userCountry,
          location.state.gl,
        );
      } else {
        handleSearchFromState(
          location.state.searchUrl,
          location.state.userCountry,
          location.state.gl,
        );
      }
    }
    // Cleanup: avoid memory leaks
    return () => {
      didFetch = false;
    };
  }, [location.state, requestId, location.pathname]);

  // Add a new handler for keyword search
  const handleKeywordSearch = async (
    keywords: string,
    userCountry: string,
    gl?: string,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      // Call the keyword search API endpoint (assume /api/n8n-scrape for now)
      const response = await fetch("/api/n8n-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords,
          requestId: requestId,
          userLocation: { country: userCountry },
          gl: gl,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch search data");
      }
      const data = await response.json();
      const payload: any =
        Array.isArray(data) &&
        data.length === 1 &&
        data[0]?.mainProduct &&
        data[0]?.suggestions
          ? data[0]
          : data;
      setSearchData(payload);
      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load search results",
      );
      setIsLoading(false);
    }
  };

  // Save search to DB after successful search
  useEffect(() => {
    if (!isAuthenticated || !searchData || !originalUrl || !requestId) return;
    // Only save if we have a main product or suggestions
    const title =
      searchData.mainProduct?.title || searchData[0]?.title || originalUrl;
    // Prevent duplicate saves by using a ref
    let didSave = false;
    if (!didSave && title && requestId) {
      didSave = true;
      fetch("/api/search-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url: originalUrl,
          title,
          requestId,
        }),
      });
    }
  }, [isAuthenticated, searchData, originalUrl, requestId]);

  if (isLoading) {
    return <SearchLoadingState />;
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <AnimatedGradientBackground />
        </div>
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/20 to-transparent" />
        </div>
        <SearchHeader />
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Button onClick={handleBack} variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Alert className="mb-4 border-white/10 bg-white/10 backdrop-blur-md text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <Button
            onClick={handleRefresh}
            className="w-full rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!searchData) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <AnimatedGradientBackground />
        </div>
        <SearchHeader />
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-4">
              No search data available
            </h2>
            <Button
              onClick={handleBack}
              className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Use same animated gradient background as landing */}
      <div className="absolute inset-0 -z-20">
        <AnimatedGradientBackground />
      </div>
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
      </div>
      <SearchHeader />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Button
          onClick={handleBack}
          variant="ghost"
          className="mb-6 text-white hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>

        {/* Search Field - Left Aligned */}
        <div className="mb-8">
          <SearchInput
            value={newSearchUrl}
            onChange={(value) => setNewSearchUrl(value)}
            placeholder="Enter product URL (e.g., Amazon, eBay, etc.)"
            onSubmit={handleNewSearch}
            align="left"
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
        </div>

        {/* Main Product - Mobile Responsive */}
        {mainProduct &&
          !isArrayResponse &&
          !location.state?.isKeywordSearch && (
            <Card className="mb-8 border-white/10 bg-white/5 backdrop-blur-xl text-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Original Product</span>
                  <Badge variant="secondary" className="bg-white text-black">
                    Found
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={
                        mainProduct.image &&
                        !mainProduct.image.includes("placeholder") &&
                        !mainProduct.image.includes("fallback")
                          ? mainProduct.image
                          : getFaviconUrl(mainProduct.url)
                      }
                      alt={mainProduct.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                      onError={(e) => {
                        // Fallback to favicon if the image fails to load
                        e.currentTarget.src = getFaviconUrl(mainProduct.url);
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold line-clamp-2">
                      {mainProduct.title}
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-green-400 mt-1">
                      {mainProduct.currency}
                      {mainProduct.price}
                    </p>
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 text-yellow-300 fill-current" />
                      <span className="ml-1 text-sm text-white/70">
                        Original Price
                      </span>
                    </div>
                  </div>

                  {/* View Product Button */}
                  {mainProduct.url && (
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <Button
                        asChild
                        className="w-full sm:w-auto rounded-full bg-white text-black hover:bg-white/90"
                      >
                        <a
                          href={`/api/redirect?to=${encodeURIComponent(mainProduct.url)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="View original product details"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Product
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Results ({filteredSuggestions.length})
              </h2>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Categories Filter */}
            <div className="mb-6">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <div className="overflow-x-auto">
                  <TabsList className="flex w-full min-w-max space-x-1 bg-white/5 border border-white/10">
                    {categories.map((category) => (
                      <TabsTrigger
                        key={category.name}
                        value={category.name}
                        className="flex-shrink-0 px-3 md:px-4 text-white"
                      >
                        <span className="mr-2">{category.icon}</span>
                        <span className="hidden sm:inline">{category.label}</span>
                        <span className="sm:hidden">{category.icon}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSuggestions.map((suggestion: any, index: number) => {
                // Extract price for sorting (handle nulls)
                const price = extractPrice(
                  suggestion.standardPrice || suggestion.discountPrice || "0",
                );
                const currency = extractCurrency(
                  suggestion.standardPrice || suggestion.discountPrice || "",
                );
                return (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-shadow border-white/10 bg-white/5 backdrop-blur-xl text-white"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Small favicon image */}
                        <div className="flex-shrink-0">
                          <img
                            src={suggestion.image || "/placeholder.svg"}
                            alt={suggestion.site || "Store"}
                            className="w-8 h-8 object-cover rounded border border-white/20"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Reseller name above product name */}
                          <p className="text-xs font-medium text-white/80 mb-1 capitalize">
                            {suggestion.merchant ||
                              suggestion.site ||
                              "Unknown Store"}
                          </p>
                          {/* Product name */}
                          <h4 className="font-medium text-sm line-clamp-2 mb-2">
                            {suggestion.title}
                          </h4>
                          {/* Price */}
                          {(suggestion.standardPrice ||
                            suggestion.discountPrice) && (
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-lg font-bold text-white">
                                {suggestion.standardPrice ||
                                  suggestion.discountPrice}
                              </p>
                            </div>
                          )}
                          {/* Additional details */}
                          <div className="flex flex-col gap-2 text-xs text-white/70">
                            {/* Stock status */}
                            {suggestion.stock && (
                              <div
                                className={`flex items-center gap-1 ${
                                  suggestion.stock
                                    .toLowerCase()
                                    .includes("in stock")
                                    ? "text-green-400"
                                    : "text-orange-400"
                                }`}
                              >
                                {suggestion.stock
                                  .toLowerCase()
                                  .includes("in stock") ? (
                                  <CheckCircle className="h-3 w-3 fill-current" />
                                ) : (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                                <span className="font-medium">
                                  {suggestion.stock}
                                </span>
                              </div>
                            )}
                            {/* Rating */}
                            {suggestion.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current text-yellow-300" />
                                <span>{suggestion.rating}</span>
                                {suggestion.reviewsCount && (
                                  <span className="text-xs">
                                    ({suggestion.reviewsCount})
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Delivery price */}
                            {suggestion.deliveryPrice && (
                              <div className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                <span>{suggestion.deliveryPrice}</span>
                              </div>
                            )}
                          </div>
                          {/* Details */}
                          {suggestion.details && (
                            <p className="text-xs text-white/60 mt-2 line-clamp-1">
                              {suggestion.details}
                            </p>
                          )}
                        </div>
                        {/* Action buttons - Mobile responsive */}
                        {suggestion.link && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="flex-shrink-0 rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                            >
                              <a
                                href={`/api/redirect?to=${encodeURIComponent(suggestion.link)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View product details"
                                aria-label="View product details"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span className="sr-only">
                                  View product details
                                </span>
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-shrink-0 p-1 h-8 w-8"
                              onClick={() => toggleFavorite(suggestion)}
                              title={
                                favoriteStates.get(
                                  `${suggestion.site}-${suggestion.title}`,
                                )?.isFavorited
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                              }
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  favoriteStates.get(
                                    `${suggestion.site}-${suggestion.title}`,
                                  )?.isFavorited
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-300 hover:text-red-500"
                                }`}
                              />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {filteredSuggestions.length === 0 && suggestions.length > 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl text-white">
            <CardContent className="p-8 text-center">
              <p className="text-white/70 mb-4">No results found in this category</p>
              <p className="text-sm text-white/60 mb-4">Try selecting a different category or search again</p>
              <Button
                onClick={() => setSelectedCategory("all")}
                className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90 mr-2"
              >
                Show All Results
              </Button>
              <Button
                onClick={handleRefresh}
                className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {suggestions.length === 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl text-white">
            <CardContent className="p-8 text-center">
              <p className="text-white/70 mb-4">No price comparisons found</p>
              <Button
                onClick={handleRefresh}
                className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {suggestions.length > 0 &&
          suggestions.filter(
            (s: any) =>
              extractPrice(s.standardPrice || s.discountPrice || "0") > 0,
          ).length === 0 && (
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl text-white">
              <CardContent className="p-8 text-center">
                <p className="text-white/70 mb-4">
                  No price comparisons with available prices found
                </p>
                <p className="text-sm text-white/60 mb-4">
                  All found results have unavailable prices
                </p>
                <Button
                  onClick={handleRefresh}
                  className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Authentication Modal */}
      <AuthModal {...modalProps} />
    </div>
  );
};

export default NewSearchResults;
