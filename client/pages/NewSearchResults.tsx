import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { SearchHeader } from "../components/SearchHeader";
import { ComparisonGrid } from "../components/ComparisonGrid";
import { ProductCard } from "../components/ProductCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { Bot, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { ProductData, PriceComparison } from "../../shared/api";

interface N8NSearchData {
  product: ProductData;
  comparisons: PriceComparison[];
  requestId: string;
}

export default function NewSearchResults() {
  const { requestId, slug } = useParams<{ requestId: string; slug: string }>();
  const location = useLocation();
  const [searchData, setSearchData] = useState<N8NSearchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");

  useEffect(() => {
    // Get data from navigation state or try to fetch from API
    if (location.state?.searchData) {
      setSearchData(location.state.searchData);
      setOriginalUrl(location.state.originalUrl || "");
    } else {
      // If no state, try to fetch the data (fallback)
      fetchSearchData();
    }
  }, [location.state, requestId]);

  const fetchSearchData = async () => {
    if (!requestId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/n8n-scrape/${requestId}`);
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

  const handleRefresh = async () => {
    if (!originalUrl) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/n8n-scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: originalUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to refresh results");
      }

      const data = await response.json();
      setSearchData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh results");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !searchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <SearchHeader title="N8N Search Results" />
        <div className="container mx-auto px-4 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error && !searchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <SearchHeader title="N8N Search Results" />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchSearchData} variant="outline">
                  Try Again
                </Button>
                <Button asChild variant="outline">
                  <Link to="/new">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    New Search
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!searchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <SearchHeader title="N8N Search Results" />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600">No search data found.</p>
            <Button asChild className="mt-4">
              <Link to="/new">Start New Search</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SearchHeader title="N8N Search Results" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with N8N branding */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  N8N Price Comparison Results
                </h1>
                <p className="text-sm text-gray-600">
                  Powered by N8N automation workflow
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {originalUrl && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Original URL:</strong> {originalUrl}
              </p>
            </div>
          )}
        </div>

        {/* Main Product */}
        <div className="max-w-4xl mx-auto mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Main Product
          </h2>
          <ProductCard
            title={searchData.product.title}
            price={searchData.product.price}
            currency={searchData.product.currency}
            url={searchData.product.url}
            store={searchData.product.store}
            image={searchData.product.image}
          />
        </div>

        {/* Price Comparisons */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Price Comparisons ({searchData.comparisons.length} found)
            </h2>
            <p className="text-sm text-gray-600">
              Found via N8N workflow
            </p>
          </div>
          
          {searchData.comparisons.length > 0 ? (
            <ComparisonGrid 
              products={searchData.comparisons.map(comp => ({
                title: comp.title,
                price: comp.price,
                currency: comp.currency,
                url: comp.url,
                store: comp.store,
                image: comp.image,
                condition: comp.condition,
                inStock: true,
                availability: "In Stock"
              }))}
              originalPrice={searchData.product.price}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No price comparisons found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              Results generated by N8N automation workflow
            </p>
            <div className="flex gap-4 justify-center mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to="/new">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  New N8N Search
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/">
                  Original Search
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 