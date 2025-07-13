import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SearchHeader } from "@/components/SearchHeader";
import { ComparisonGrid, SavingsSummary } from "@/components/ComparisonGrid";
import { SearchLoadingState } from "@/components/LoadingSkeleton";
import { ProductData, PriceComparison, ScrapeResponse } from "@shared/api";
import { useLocation } from "@/hooks/use-location";

export default function SearchResults() {
  const { requestId, slug } = useParams<{
    requestId: string;
    slug: string;
  }>();
  const [originalProduct, setOriginalProduct] = useState<ProductData | null>(
    null,
  );
  const [comparisons, setComparisons] = useState<PriceComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location, localDealers } = useLocation();

  useEffect(() => {
    if (!requestId) return;

    const fetchProductData = async () => {
      try {
        // Get the original URL from sessionStorage
        const storedData = sessionStorage.getItem(
          `product_request_${requestId}`,
        );
        if (!storedData) {
          setError("Product request not found");
          setLoading(false);
          return;
        }

        const { url } = JSON.parse(storedData);

        // Call the scraping API
        const response = await fetch("/api/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            requestId,
            userLocation: location, // Pass user location for local dealers
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to scrape product data");
        }

        const data: ScrapeResponse = await response.json();
        setOriginalProduct(data.originalProduct);
        setComparisons(data.comparisons || []);
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError("Failed to load product data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [requestId]);

  if (loading) {
    return <SearchLoadingState />;
  }

  if (error && !originalProduct) {
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

  const lowestPrice = Math.min(
    originalProduct?.price || Infinity,
    ...comparisons.map((c) => c.price),
  );

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />

      <div className="container mx-auto px-4 py-12">
        {/* Modern Product Overview */}
        {originalProduct && (
          <div className="mb-16">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              {/* Product Image - Clean & Modern */}
              <div className="lg:col-span-5">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 lg:p-12">
                  <img
                    src={originalProduct.image}
                    alt={originalProduct.title}
                    className="w-full h-auto object-contain max-h-96 mx-auto"
                  />
                </div>
              </div>

              {/* Product Details - Enhanced Typography */}
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
                </div>

                {/* Price Section */}
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
                        {(originalProduct.price - lowestPrice).toFixed(2)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Better prices found below
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
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
                    Compare Prices
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
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
                      {originalProduct.price > lowestPrice
                        ? `${Math.round(((originalProduct.price - lowestPrice) / originalProduct.price) * 100)}%`
                        : "0%"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Max savings
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Savings Summary */}
        {originalProduct && (
          <SavingsSummary
            originalPrice={originalProduct.price}
            lowestPrice={lowestPrice}
            currency={originalProduct.currency}
            totalComparisons={comparisons.length}
          />
        )}

        {/* Price Comparison */}
        <div id="price-comparison" className="mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Price Comparison
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've found {comparisons.length} alternative sources for this
              product. Compare prices and find the best deal for you.
            </p>
          </div>
          <ComparisonGrid
            products={comparisons}
            originalPrice={originalProduct?.price}
          />
        </div>
      </div>
    </div>
  );
}
