import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ScrapeResponse, ProductData, PriceComparison } from "../../shared/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, RefreshCw, ExternalLink, Star, AlertCircle, Heart, Search, Package, Truck, Shield, CheckCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Alert, AlertDescription } from "../components/ui/alert";
import { SearchHeader } from "../components/SearchHeader";
import { SearchInput } from "../components/SearchInput";
import { LoadingSkeleton, SearchLoadingState } from "../components/LoadingSkeleton";
import { useFavorites } from "../hooks/use-favorites";

// Helper functions
function extractPrice(priceString: string): number {
  if (!priceString) return 0;
  const match = priceString.match(/[€$£]?\s?(\d+(?:[.,]\d{2})?)/);
  return match ? parseFloat(match[1].replace(',', '.')) : 0;
}

function extractCurrency(priceString: string): string {
  const match = priceString.match(/^[^\d]*/);
  return match ? match[0].trim() : '';
}

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return "/placeholder.svg";
  }
}

const NewSearchResults = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { favorites, addFavorite, removeFavorite, checkFavorite } = useFavorites();

  const [searchData, setSearchData] = useState<any>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteStates, setFavoriteStates] = useState<Map<string, { isFavorited: boolean; favoriteId?: number }>>(new Map());
  const [newSearchUrl, setNewSearchUrl] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("de");

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
      // Handle state from Index.tsx navigation or fresh search
      setOriginalUrl(location.state.searchUrl);
      // Trigger the search immediately
      handleSearchFromState(location.state.searchUrl, location.state.userCountry, location.state.gl);
    } else {
      // If no state, try to extract URL from slug and start search
      const slug = location.pathname.split('/').pop();
      if (slug && slug !== requestId) {
        // Try to decode the slug as a URL
        try {
          const decodedSlug = decodeURIComponent(slug);
          // Check if it looks like a URL
          if (decodedSlug.includes('://') || decodedSlug.startsWith('www.')) {
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

  const handleSearchFromState = async (url: string, userCountry: string, gl?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Starting search with URL:", url, "Country:", userCountry, "GL:", gl);
      
      const response = await fetch("/api/n8n-scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          url: url,
          requestId: requestId,
          userLocation: { country: userCountry },
          gl: gl // Pass the gl parameter for country-specific search
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch search data");
      }

      const data = await response.json();
      console.log("Search response:", data);
      
      // Handle n8n response format
      if (data.mainProduct && data.suggestions) {
        // Convert n8n format to our expected format
        const mainProduct: ProductData = {
          title: data.mainProduct.title,
          price: extractPrice(data.mainProduct.price),
          currency: extractCurrency(data.mainProduct.price),
          image: data.mainProduct.image,
          url: data.mainProduct.url,
          store: new URL(data.mainProduct.url || url).hostname.replace(/^www\./, "")
        };

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

        setSearchData({
          mainProduct: mainProduct,
          suggestions: data.suggestions,
          comparisons: comparisons
        });
      } else {
        setSearchData(data);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Failed to load search results");
      setIsLoading(false);
    }
  };

  const fetchSearchData = async () => {
    if (!requestId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll use the same POST request as refresh since n8n webhook doesn't support GET with requestId
      const response = await fetch("/api/n8n-scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          url: originalUrl || "https://example.com", // Fallback URL
          requestId: requestId 
        }),
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
      handleSearchFromState(originalUrl, location.state?.userCountry || "Germany");
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleNewSearch = async (url: string) => {
    if (!url.trim()) return;
    
    // Clear all current search data
    setSearchData(null);
    setOriginalUrl("");
    setError(null);
    setIsLoading(true);
    setNewSearchUrl("");
    
    // Navigate to new search with fresh state
    const newRequestId = Date.now().toString();
    navigate(`/new-search/${newRequestId}/${encodeURIComponent(url.trim())}`, {
      replace: true,
      state: {
        searchUrl: url.trim(),
        userCountry: "Germany",
        gl: "de"
      }
    });
  };

  const toggleFavorite = async (suggestion: any) => {
    const itemKey = `${suggestion.site}-${suggestion.title}`;
    const currentState = favoriteStates.get(itemKey);
    
    try {
      if (currentState?.isFavorited && currentState.favoriteId) {
        // Remove from favorites
        await removeFavorite(currentState.favoriteId);
        setFavoriteStates(prev => {
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
          currency: extractCurrency(suggestion.standardPrice || suggestion.discountPrice || ''),
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
          condition: 'New'
        });
        
        setFavoriteStates(prev => {
          const newMap = new Map(prev);
          newMap.set(itemKey, { isFavorited: true, favoriteId: newFavorite.id });
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
        description: error instanceof Error ? error.message : "Failed to update favorites",
        variant: "destructive"
      });
    }
  };

  const suggestions = searchData?.suggestions || [];

  // Check favorite status for all suggestions
  useEffect(() => {
    const checkFavorites = async () => {
      if (!suggestions.length) return;
      
      for (const suggestion of suggestions) {
        const itemKey = `${suggestion.site}-${suggestion.title}`;
        if (!favoriteStates.has(itemKey)) {
          const status = await checkFavorite(suggestion.link);
          setFavoriteStates(prev => {
            const newMap = new Map(prev);
            newMap.set(itemKey, status);
            return newMap;
          });
        }
      }
    };
    
    checkFavorites();
  }, [suggestions, checkFavorite]);

  if (isLoading) {
    return <SearchLoadingState />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button onClick={handleBack} variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!searchData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No search data available
            </h2>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const mainProduct = searchData?.mainProduct;

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button onClick={handleBack} variant="ghost" className="mb-6">
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
        {mainProduct && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Original Product</span>
                <Badge variant="secondary">Found</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <img 
                    src={mainProduct.image && !mainProduct.image.includes('placeholder') && !mainProduct.image.includes('fallback') ? mainProduct.image : getFaviconUrl(mainProduct.url)} 
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
                  <h3 className="text-base sm:text-lg font-semibold line-clamp-2">{mainProduct.title}</h3>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                    {mainProduct.currency}{mainProduct.price}
                  </p>
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">Original Price</span>
                  </div>
                </div>
                
                {/* View Product Button */}
                {mainProduct.url && (
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <Button asChild className="w-full sm:w-auto">
                      <a 
                        href={mainProduct.url} 
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Price Comparisons ({suggestions.filter((s: any) => extractPrice(s.standardPrice || s.discountPrice || '0') > 0).length})
              </h2>
              <Button onClick={handleRefresh} variant="outline" className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suggestions
                .map((suggestion: any, index: number) => {
                  // Extract price for sorting
                  const price = extractPrice(suggestion.standardPrice || suggestion.discountPrice || '0');
                  const currency = extractCurrency(suggestion.standardPrice || suggestion.discountPrice || '');
                  
                  return {
                    ...suggestion,
                    extractedPrice: price,
                    extractedCurrency: currency,
                    originalIndex: index
                  };
                })
                .filter((suggestion: any) => suggestion.extractedPrice > 0) // Only show items with available prices
                .sort((a, b) => {
                  // Sort by price (lowest first), then by original index for stability
                  return a.extractedPrice - b.extractedPrice;
                })
                .map((suggestion: any, index: number) => (
                  <Card key={suggestion.originalIndex} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Small favicon image */}
                        <div className="flex-shrink-0">
                          <img 
                            src={suggestion.image} 
                            alt={suggestion.site || 'Store'}
                            className="w-8 h-8 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Reseller name above product name */}
                          <p className="text-xs font-medium text-blue-600 mb-1 capitalize">
                            {suggestion.merchant || suggestion.site || 'Unknown Store'}
                          </p>
                          
                          {/* Product name */}
                          <h4 className="font-medium text-sm line-clamp-2 mb-2">
                            {suggestion.title}
                          </h4>
                          
                          {/* Price - highlighted if it's the lowest */}
                          <div className="flex items-center gap-2 mb-2">
                            <p className={`text-lg font-bold ${
                              suggestion.extractedPrice > 0 && index === 0 
                                ? 'text-green-600' 
                                : 'text-gray-700'
                            }`}>
                              {suggestion.standardPrice || suggestion.discountPrice}
                            </p>
                            {suggestion.extractedPrice > 0 && index === 0 && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                                Best Price
                              </Badge>
                            )}
                          </div>

                          {/* Additional details */}
                          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                            {/* Stock status with improved styling */}
                            {suggestion.stock && (
                              <div className={`flex items-center gap-1 ${
                                suggestion.stock.toLowerCase().includes('in stock') 
                                  ? 'text-green-600' 
                                  : 'text-orange-600'
                              }`}>
                                {suggestion.stock.toLowerCase().includes('in stock') ? (
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
                                <Star className="h-3 w-3 fill-current text-yellow-400" />
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
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                              {suggestion.details}
                            </p>
                          )}
                        </div>
                        
                        {/* Action buttons - Mobile responsive */}
                        {suggestion.link && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button asChild size="sm" variant="outline" className="flex-shrink-0">
                              <a 
                                href={suggestion.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                title="View product details"
                                aria-label="View product details"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span className="sr-only">View product details</span>
                              </a>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="flex-shrink-0 p-1 h-8 w-8"
                              onClick={() => toggleFavorite(suggestion)}
                              title={favoriteStates.get(`${suggestion.site}-${suggestion.title}`)?.isFavorited ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Heart 
                                className={`h-4 w-4 ${
                                  favoriteStates.get(`${suggestion.site}-${suggestion.title}`)?.isFavorited
                                    ? "fill-red-500 text-red-500" 
                                    : "text-gray-400 hover:text-red-500"
                                }`} 
                              />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </>
        )}

        {suggestions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No price comparisons found</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {suggestions.length > 0 && suggestions.filter((s: any) => extractPrice(s.standardPrice || s.discountPrice || '0') > 0).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No price comparisons with available prices found</p>
              <p className="text-sm text-gray-400 mb-4">All found results have unavailable prices</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NewSearchResults; 