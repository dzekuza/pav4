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
import { useCurrency } from "@/contexts/CurrencyContext";

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
  const { formatPrice, convertPrice } = useCurrency();

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
    originalProduct
      ? convertPrice(originalProduct.price, originalProduct.currency)
      : Infinity,
    ...comparisons.map((c) => convertPrice(c.price, c.currency)),
  );

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Product Overview */}
        {originalProduct && (
          <div className="mb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-3xl font-bold mb-4">
                  {originalProduct.title}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl font-bold">
                    {formatPrice(
                      originalProduct.price,
                      originalProduct.currency,
                    )}
                  </span>
                  <Badge variant="outline">Original Price</Badge>
                </div>
                <Button variant="outline" asChild>
                  <a
                    href={originalProduct.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on {originalProduct.store}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="flex justify-center">
                <img
                  src={originalProduct.image}
                  alt={originalProduct.title}
                  className="max-w-sm w-full h-auto rounded-lg shadow-lg"
                />
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Price Comparison</h2>
          <ComparisonGrid
            products={comparisons}
            originalPrice={originalProduct?.price}
          />
        </div>
      </div>
    </div>
  );
}
