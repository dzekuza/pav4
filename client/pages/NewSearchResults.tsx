import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { ScrapeResponse, ProductData, PriceComparison } from "../../shared/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, RefreshCw, ExternalLink, Star, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Alert, AlertDescription } from "../components/ui/alert";

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

  const [searchData, setSearchData] = useState<any>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const suggestions = searchData.suggestions || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button onClick={handleBack} variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>

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
                Price Comparisons ({suggestions.length})
              </h2>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((suggestion: any, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <img 
                        src={suggestion.image} 
                        alt={suggestion.title}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {suggestion.title}
                        </h4>
                        <p className="text-lg font-bold text-green-600">
                          {suggestion.standardPrice || suggestion.discountPrice || "Price not available"}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {suggestion.site}
                        </p>
                      </div>
                      {suggestion.link && (
                        <Button asChild size="sm" variant="outline">
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
      </div>
    </div>
  );
};

export default NewSearchResults; 