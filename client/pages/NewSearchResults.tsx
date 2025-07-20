import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ScrapeResponse, ProductData, PriceComparison } from "../../shared/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, RefreshCw, ExternalLink, Star, AlertCircle, Heart, Search, Package, Truck, Shield } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Alert, AlertDescription } from "../components/ui/alert";
import { SearchHeader } from "../components/SearchHeader";
import { SearchInput } from "../components/SearchInput";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useFavorites } from "../hooks/use-favorites";

// Helper functions
function extractPrice(priceString: string): number {
  if (!priceString) return 0;
  const match = priceString.match(/[€$£]?\s?(\d+(?:[.,]\d{2})?)/);
  return match ? parseFloat(match[1].replace(',', '.')) : 0;
}

function extractCurrency(priceString: string): string {
  if (priceString.includes('€')) return '€';
  if (priceString.includes('$')) return '$';
  if (priceString.includes('£')) return '£';
  return '€'; // Default to Euro
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

  useEffect(() => {
    // Get data from navigation state or try to fetch from API
    if (location.state?.searchData) {
      setSearchData(location.state.searchData);
      setOriginalUrl(location.state.originalUrl || "");
    } else if (location.state?.searchUrl) {
      // Handle state from Index.tsx navigation
      setOriginalUrl(location.state.searchUrl);
      // Trigger the search immediately
      handleSearchFromState(location.state.searchUrl, location.state.userCountry, location.state.gl);
    } else {
      // If no state, try to fetch the data (fallback)
      fetchSearchData();
    }
  }, [location.state, requestId]);

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
    navigate(`/new-search/${Date.now()}/${encodeURIComponent(url.trim())}`);
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

  const suggestions = searchData.suggestions || [];

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
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Analyzing product and finding best prices...
            </h2>
          </div>
        </div>
      </div>
    );
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

  const mainProduct = searchData.mainProduct;

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button onClick={handleBack} variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>

        {/* New Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search for Another Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <SearchInput
                  value={newSearchUrl}
                  onChange={(value) => setNewSearchUrl(value)}
                  placeholder="Enter product URL (e.g., Amazon, eBay, etc.)"
                  onSubmit={handleNewSearch}
                />
              </div>
              <Button onClick={() => handleNewSearch(newSearchUrl)} className="px-6">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Product */}
        {mainProduct && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Original Product</span>
                <Badge variant="secondary">Found</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <img 
                  src={mainProduct.image} 
                  alt={mainProduct.title}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{mainProduct.title}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {mainProduct.currency}{mainProduct.price}
                  </p>
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">Original Price</span>
                  </div>
                </div>
                {mainProduct.url && (
                  <Button asChild>
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
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Price Comparisons ({suggestions.filter((s: any) => extractPrice(s.standardPrice || s.discountPrice || '0') > 0).length})
              </h2>
              <Button onClick={handleRefresh} variant="outline">
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
                          <p className={`text-lg font-bold ${
                            suggestion.extractedPrice > 0 && index === 0 
                              ? 'text-green-600' 
                              : 'text-gray-700'
                          }`}>
                            {suggestion.standardPrice || suggestion.discountPrice}
                            {suggestion.extractedPrice > 0 && index === 0 && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Best Price
                              </span>
                            )}
                          </p>

                          {/* Additional details */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            {/* Stock status */}
                            {suggestion.stock && (
                              <span className={`flex items-center gap-1 ${
                                suggestion.stock.toLowerCase().includes('in stock') 
                                  ? 'text-green-600' 
                                  : 'text-orange-600'
                              }`}>
                                {suggestion.stock.toLowerCase().includes('in stock') ? '✅' : '⚠️'} 
                                {suggestion.stock}
                              </span>
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
                              <span className="text-xs">
                                🚚 {suggestion.deliveryPrice}
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          {suggestion.details && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {suggestion.details}
                            </p>
                          )}
                        </div>
                        
                        {/* External link button */}
                        {suggestion.link && (
                          <div className="flex flex-col gap-2">
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