import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  title: string;
  standardPrice: string | null;
  discountPrice: string | null;
  site: string;
  link: string;
  image: string;
}

interface MainProduct {
  title: string;
  price: string;
  image: string;
  url: string | null;
}

interface N8nResponse {
  mainProduct: MainProduct;
  suggestions: Suggestion[];
}

const NewSearch = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<N8nResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/n8n-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          requestId: Date.now().toString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data);
      toast({
        title: "Success",
        description: `Found ${data.suggestions?.length || 0} price comparisons`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: string | null) => {
    if (!price) return 'Price not available';
    return price;
  };

  const getSiteName = (site: string) => {
    return site.replace('www.', '').replace('.com', '').replace('.', '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to="/new-landing">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Price Comparison
          </h1>
        </div>

        {/* Search Form */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Find Better Prices</CardTitle>
            <CardDescription>
              Paste any product URL and we'll find better prices across multiple retailers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Paste product URL here (e.g., https://www.amazon.com/product...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSearch} 
                disabled={isLoading || !url.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Main Product */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Original Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <img 
                    src={results.mainProduct.image} 
                    alt={results.mainProduct.title}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{results.mainProduct.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {results.mainProduct.price}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Price Comparisons ({results.suggestions.length})</h2>
              <div className="grid gap-4">
                {results.suggestions.map((suggestion, index) => (
                  <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <img 
                          src={suggestion.image} 
                          alt={suggestion.title}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2 line-clamp-2">{suggestion.title}</h3>
                          <div className="flex items-center gap-4 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {getSiteName(suggestion.site)}
                            </Badge>
                            {suggestion.discountPrice && (
                              <Badge variant="secondary" className="text-green-600">
                                {formatPrice(suggestion.discountPrice)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(suggestion.link, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Deal
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Searching for better prices...</h3>
              <p className="text-gray-600">This may take a few moments</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NewSearch; 