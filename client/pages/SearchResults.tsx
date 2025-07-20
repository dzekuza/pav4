import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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

      const response = await fetch("/api/n8n-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: searchUrl, 
          requestId: requestId,
          userLocation: { country: userCountry },
          gl: gl // Pass the gl parameter for country-specific search
        }),
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
      } else if (data.product && data.comparisons) {
        // Handle legacy format
        setOriginalProduct(data.product);
        setComparisons(data.comparisons);
      } else {
        throw new Error("Invalid response format from server");
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
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 progress-bar"
                style={{ '--progress-width': `${(loadingStep / 3) * 100}%` } as React.CSSProperties}
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button onClick={handleBack} variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>

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
                Price Comparisons ({comparisons.length})
              </h2>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {comparisons.map((comparison, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <img 
                        src={comparison.image} 
                        alt={comparison.title}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {comparison.title}
                        </h4>
                        <p className="text-lg font-bold text-green-600">
                          {comparison.currency}{comparison.price}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {comparison.store}
                        </p>
                        <div className="flex items-center mt-2">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="ml-1 text-xs text-gray-600">
                            {comparison.assessment.description}
                          </span>
                        </div>
                      </div>
                      {comparison.url && (
                        <Button asChild size="sm" variant="outline">
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
      </div>
    </div>
  );
};

export default SearchResults;
