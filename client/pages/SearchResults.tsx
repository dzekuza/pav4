import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ExternalLink, AlertCircle, Search, TrendingUp, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SearchHeader } from "@/components/SearchHeader";
import { ComparisonGrid, SavingsSummary } from "@/components/ComparisonGrid";
import { SearchLoadingState } from "@/components/LoadingSkeleton";
import { LoadingState } from "@/components/LoadingState";
import { ProductData, PriceComparison, ScrapeResponse } from "@shared/api";

export default function SearchResults() {
  const { requestId } = useParams<{ requestId: string }>();
  const location = useLocation();
  
  const [originalProduct, setOriginalProduct] = useState<ProductData | null>(null);
  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Detecting product details...");
  const [loadingStep, setLoadingStep] = useState(1);

  useEffect(() => {
    const { searchUrl, userCountry } = location.state || {};

    if (!searchUrl) {
      setError("No product URL provided.");
      setLoading(false);
      return;
    }

    const fetchProductData = async () => {
      setLoading(true);
      try {
        // Step 1: Product detection
        setLoadingMessage("Detecting product details...");
        setLoadingStep(1);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 2: Searching retailers
        setLoadingMessage("Searching hundreds of retailers...");
        setLoadingStep(2);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await fetch("/api/scrape-enhanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: searchUrl, userLocation: { country: userCountry } }),
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
        
        setOriginalProduct(data.product || data.originalProduct);
        setComparisons(data.comparisons || []);
        
        // Update the URL to be more descriptive
        const newSlug = (data.product?.title || "product")
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 75);
        window.history.replaceState({}, '', `/search/${requestId}/${newSlug}`);

      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [requestId, location.state]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader />
        <div className="container mx-auto px-4 py-16">
          <LoadingState 
            title={loadingMessage} 
            description="We're analyzing the product and finding the best deals across hundreds of retailers." 
            step={loadingStep}
          />
          <SearchLoadingState />
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !originalProduct) {
    console.log("Rendering error state:", error);
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader />
        <div className="container mx-auto px-4 py-16">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center mt-8">
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show results
  console.log("Rendering results with product:", !!originalProduct, "comparisons:", comparisons.length);
  const lowestPrice = Math.min(
    originalProduct?.price || Infinity,
    ...comparisons.map((c) => c.price),
  );

  const savings = originalProduct ? originalProduct.price - lowestPrice : 0;
  const savingsPercentage = originalProduct ? (savings / originalProduct.price) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />

      <div className="container mx-auto px-4 py-12">
        {/* Enhanced Product Overview */}
        {originalProduct && (
          <div className="mb-16">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              {/* Product Image - Enhanced */}
              <div className="lg:col-span-5">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 lg:p-12 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20"></div>
                  <img
                    src={originalProduct.image}
                    alt={originalProduct.title}
                    className="w-full h-auto object-contain max-h-96 mx-auto relative z-10"
                  />
                  {/* Product badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                    {savings > 0 && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Save {originalProduct.currency}{savings.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Details - Enhanced */}
              <div className="lg:col-span-7 space-y-8">
                {/* Store Badge */}
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 text-sm font-medium bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                  >
                    {originalProduct.store}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Original listing
                  </span>
                </div>

                {/* Product Title */}
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4">
                    {originalProduct.title}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Found {comparisons.length} alternative sources
                  </p>
                </div>

                {/* Enhanced Price Section */}
                <div className="bg-card rounded-xl p-6 border">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-foreground">
                      {originalProduct.currency}
                      {originalProduct.price.toFixed(2)}
                    </span>
                    {lowestPrice < originalProduct.price && (
                      <span className="text-lg text-muted-foreground line-through">
                        Original price
                      </span>
                    )}
                  </div>
                  {lowestPrice < originalProduct.price && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      >
                        Save {originalProduct.currency}
                        {savings.toFixed(2)} ({savingsPercentage.toFixed(0)}%)
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Better prices found below
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Enhanced */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12 text-base font-medium border-2 hover:border-brand-primary hover:text-brand-primary transition-colors"
                    asChild
                  >
                    <a
                      href={originalProduct.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on {originalProduct.store}
                      <ExternalLink className="ml-2 h-5 w-5" />
                    </a>
                  </Button>

                  <Button
                    size="lg"
                    className="flex-1 h-12 text-base font-medium bg-brand-gradient hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const element =
                        document.getElementById("price-comparison");
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Compare Prices
                  </Button>
                </div>

                {/* Enhanced Quick Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand-primary">
                      {comparisons.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Alternative sources
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {savingsPercentage > 0 ? `${savingsPercentage.toFixed(0)}%` : "0%"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Max savings
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {originalProduct.currency}{lowestPrice.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Lowest price
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Savings Summary */}
        {originalProduct && savings > 0 && (
          <SavingsSummary
            originalPrice={originalProduct.price}
            lowestPrice={lowestPrice}
            currency={originalProduct.currency}
            totalComparisons={comparisons.length}
          />
        )}

        {/* Enhanced Price Comparison */}
        <div id="price-comparison" className="mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Price Comparison
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've found {comparisons.length} alternative sources for this
              product. Compare prices and find the best deal for you.
            </p>
            {comparisons.length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Search className="w-4 h-4" />
                <span>All prices verified and updated</span>
              </div>
            )}
          </div>
          <ComparisonGrid
            products={comparisons
              .filter((p) => typeof p.url === 'string' && p.url.startsWith('http'))
              .sort((a, b) => a.price - b.price) // Sort by price (lowest first)
            }
            originalPrice={originalProduct?.price}
          />
        </div>
      </div>
    </div>
  );
}
