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
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useFavorites } from '../hooks/use-favorites';
import { useAuthModal } from '../hooks/use-auth-modal';
import { AuthModal } from '../components/AuthModal';
import { trackProductSearch, trackPriceComparison, getStoredUtmParameters } from "@/lib/tracking";
import { ComparisonGrid } from "@/components/ComparisonGrid";

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

const SearchResults = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [originalProduct, setOriginalProduct] = useState<ProductData | null>(null);
  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [newSearchUrl, setNewSearchUrl] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("de");
  const [favoriteStates, setFavoriteStates] = useState<Map<string, { isFavorited: boolean; favoriteId?: number }>>(new Map());
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const { favorites: favoritesFromHook, addFavorite, removeFavorite, checkFavorite } = useFavorites();
  
  const { handleProtectedAction, modalProps } = useAuthModal({
    title: "Sign in to save favorites",
    description: "Create an account or sign in to save products to your favorites",
    defaultTab: "login",
    onSuccess: () => {
      // After successful authentication, the user can retry their action
      toast({
        title: "Welcome back!",
        description: "You can now save products to your favorites",
      });
    },
  });

  useEffect(() => {
    if (location.state?.searchUrl && location.state?.userCountry) {
      fetchProductData(location.state.searchUrl, location.state.userCountry, location.state.gl);
    }
  }, [location.state]);

  const fetchProductData = async (searchUrl: string, userCountry: string, gl?: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingStep(1);
    setLoadingMessage("Analyzing product...");

    try {
      // Step 1: Analyzing product
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Searching retailers
      setLoadingMessage("Searching hundreds of retailers...");
      setLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Detect if input is a URL or keywords
      let isUrl = false;
      try {
        const u = new URL(searchUrl.trim());
        isUrl = !!u.protocol && !!u.host;
      } catch {
        isUrl = false;
      }

      // Prepare request body based on input type
      const requestBody: any = {
        requestId: requestId,
        userLocation: { country: userCountry },
        gl: gl // Pass the gl parameter for country-specific search
      };

      if (isUrl) {
        requestBody.url = searchUrl;
      } else {
        requestBody.keywords = searchUrl;
      }

      const response = await fetch("/api/n8n-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch product data.");
      }

      // Step 3: Finalizing results
      setLoadingMessage("Finalizing price comparisons...");
      setLoadingStep(3);
      await new Promise(resolve => setTimeout(resolve, 800));

      const data: ScrapeResponse = await response.json();
      
      // Handle n8n response format
      if (data.mainProduct && data.suggestions) {
        // Convert n8n format to our expected format
        const mainProduct: ProductData = {
          title: data.mainProduct.title,
          price: extractPrice(data.mainProduct.price),
          currency: extractCurrency(data.mainProduct.price),
          image: data.mainProduct.image,
          url: data.mainProduct.url,
          store: new URL(data.mainProduct.url || searchUrl).hostname.replace(/^www\./, "")
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

        setOriginalProduct(mainProduct);
        setComparisons(comparisons);

        // Track product search
        const utmParams = getStoredUtmParameters();
        trackProductSearch({
          productUrl: searchUrl,
          sessionId: sessionStorage.getItem('pricehunt_session_id') || undefined,
          referrer: document.referrer,
          utmSource: utmParams.utm_source,
          utmMedium: utmParams.utm_medium,
          utmCampaign: utmParams.utm_campaign,
        });

        // Track price comparison
        if (comparisons.length > 0) {
          trackPriceComparison({
            productUrl: searchUrl,
            productTitle: mainProduct.title,
            productPrice: mainProduct.price.toString(),
            sessionId: sessionStorage.getItem('pricehunt_session_id') || undefined,
            referrer: document.referrer,
            utmSource: utmParams.utm_source,
            utmMedium: utmParams.utm_medium,
            utmCampaign: utmParams.utm_campaign,
            alternatives: comparisons,
          });
        }

      } else if (data.product && data.comparisons) {
        // Handle legacy format
        setOriginalProduct(data.product);
        setComparisons(data.comparisons);
      } else {
        setError("No product data found");
      }
      
      setLoadingStep(0);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching product data:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleRefresh = () => {
    if (location.state?.searchUrl && location.state?.userCountry) {
      fetchProductData(location.state.searchUrl, location.state.userCountry);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleNewSearch = async (url: string) => {
    if (!url.trim()) return;
    navigate(`/search-results/${Date.now()}`, {
      state: { 
        searchUrl: url,
        userCountry: "Germany",
        gl: "de"
      }
    });
  };

  const toggleFavorite = async (comparison: PriceComparison) => {
    const itemKey = `${comparison.store}-${comparison.title}`;
    const currentState = favoriteStates.get(itemKey);
    
    const performToggle = async () => {
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
            title: comparison.title,
            price: comparison.price.toString(),
            currency: comparison.currency,
            url: comparison.url,
            image: comparison.image,
            store: comparison.store,
            merchant: comparison.merchant,
            stock: comparison.stock,
            rating: comparison.rating,
            reviewsCount: comparison.reviewsCount,
            deliveryPrice: comparison.deliveryPrice,
            details: comparison.details,
            returnPolicy: comparison.returnPolicy,
            condition: comparison.condition
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

    // Use protected action handler to check authentication
    handleProtectedAction(performToggle);
  };

  // Check favorite status for all comparisons
  useEffect(() => {
    const checkFavorites = async () => {
      if (!comparisons.length) return;
      
      for (const comparison of comparisons) {
        const itemKey = `${comparison.store}-${comparison.title}`;
        if (!favoriteStates.has(itemKey)) {
          const status = await checkFavorite(comparison.url);
          setFavoriteStates(prev => {
            const newMap = new Map(prev);
            newMap.set(itemKey, status);
            return newMap;
          });
        }
      }
    };
    
    checkFavorites();
  }, [comparisons, checkFavorite]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
              role="status"
              aria-label="Loading"
            ></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {loadingMessage}
            </h2>
            <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2" role="progressbar" aria-label="Loading progress">
              <div 
                className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${
                  loadingStep === 1 ? 'w-1/3' : 
                  loadingStep === 2 ? 'w-2/3' : 
                  loadingStep === 3 ? 'w-full' : 'w-0'
                }`}
              ></div>
            </div>
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
            Back to Search
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

  if (!originalProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No product data available
            </h2>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Main Product */}
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
                src={originalProduct.image} 
                alt={originalProduct.title}
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{originalProduct.title}</h3>
                <p className="text-2xl font-bold text-green-600">
                  {originalProduct.currency}{originalProduct.price}
                </p>
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">Original Price</span>
                </div>
              </div>
              {originalProduct.url && (
                <Button asChild>
                  <a 
                    href={originalProduct.url} 
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

        {/* Price Comparisons */}
        {comparisons.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Price Comparisons ({comparisons.filter((c) => (c.price || 0) > 0).length})
              </h2>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {comparisons
                .map((comparison, index) => {
                  // Extract price for sorting
                  const price = comparison.price || 0;
                  
                  return {
                    ...comparison,
                    extractedPrice: price,
                    originalIndex: index
                  };
                })
                .filter((comparison) => comparison.extractedPrice > 0) // Only show items with available prices
                .sort((a, b) => {
                  // Sort by price (lowest first), then by original index for stability
                  return a.extractedPrice - b.extractedPrice;
                })
                .map((comparison, index) => (
                  <Card key={comparison.originalIndex} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Small favicon image */}
                        <div className="flex-shrink-0">
                          <img 
                            src={comparison.image} 
                            alt={comparison.store || 'Store'}
                            className="w-8 h-8 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Reseller name above product name */}
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-medium text-blue-600 capitalize">
                              {comparison.merchant || comparison.store || 'Unknown Store'}
                            </p>
                          </div>
                          
                          {/* Product name */}
                          <h4 className="font-medium text-sm line-clamp-2 mb-2">
                            {comparison.title}
                          </h4>
                          
                          {/* Price - highlighted if it's the lowest */}
                          <p className={`text-lg font-bold ${
                            comparison.extractedPrice > 0 && index === 0 
                              ? 'text-green-600' 
                              : 'text-gray-700'
                          }`}>
                            {comparison.currency}{comparison.price}
                            {comparison.extractedPrice > 0 && index === 0 && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Best Price
                              </span>
                            )}
                          </p>
                          
                          {/* Additional details */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            {/* Stock status */}
                            {comparison.stock && (
                              <span className={`flex items-center gap-1 ${
                                comparison.stock.toLowerCase().includes('in stock') 
                                  ? 'text-green-600' 
                                  : 'text-orange-600'
                              }`}>
                                {comparison.stock.toLowerCase().includes('in stock') ? '✅' : '⚠️'} 
                                {comparison.stock}
                              </span>
                            )}

                            {/* Rating */}
                            {comparison.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current text-yellow-400" />
                                <span>{comparison.rating}</span>
                                {comparison.reviewsCount && (
                                  <span className="text-xs">
                                    ({comparison.reviewsCount})
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Delivery price */}
                            {comparison.deliveryPrice && (
                              <span className="text-xs">
                                🚚 {comparison.deliveryPrice}
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          {comparison.details && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {comparison.details}
                            </p>
                          )}
                          
                          {/* Assessment */}
                          <div className="flex items-center mt-2">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="ml-1 text-xs text-gray-600">
                              {comparison.assessment.description}
                            </span>
                          </div>
                        </div>
                        
                        {/* External link button */}
                        {comparison.url && (
                          <div className="flex flex-col gap-2">
                            <Button asChild size="sm" variant="outline" className="flex-shrink-0">
                              <a 
                                href={comparison.url} 
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
                              onClick={() => toggleFavorite(comparison)}
                              title={favoriteStates.get(`${comparison.store}-${comparison.title}`)?.isFavorited ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Heart 
                                className={`h-4 w-4 ${
                                  favoriteStates.get(`${comparison.store}-${comparison.title}`)?.isFavorited
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

        {comparisons.length === 0 && (
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

        {comparisons.length > 0 && comparisons.filter((c) => (c.price || 0) > 0).length === 0 && (
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
      
      {/* Authentication Modal */}
      <AuthModal {...modalProps} />
    </div>
  );
};

export default SearchResults;
