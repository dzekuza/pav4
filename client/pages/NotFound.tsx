import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );

    // Check if this looks like a product URL that got misdirected
    const fullPath = location.pathname + location.search;

    // Look for URL patterns that suggest this was meant to be a product search
    if (fullPath.includes("https://") || fullPath.includes("http://")) {
      let possibleUrl = "";

      if (fullPath.includes("/https://")) {
        const index = fullPath.indexOf("/https://");
        possibleUrl = fullPath.substring(index + 1);
      } else if (fullPath.includes("/http://")) {
        const index = fullPath.indexOf("/http://");
        possibleUrl = fullPath.substring(index + 1);
      }

      if (possibleUrl) {
        try {
          new URL(possibleUrl);
          setDetectedUrl(possibleUrl);
        } catch (e) {
          // Not a valid URL
        }
      }
    }
  }, [location.pathname, location.search]);

  const handleSearchDetectedUrl = () => {
    if (detectedUrl) {
      // Use the same logic as the search form
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const domain = new URL(detectedUrl).hostname.replace(/^www\./, "");
      const slug = `${domain}-product`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");

      sessionStorage.setItem(
        `product_request_${requestId}`,
        JSON.stringify({
          url: detectedUrl,
          timestamp: Date.now(),
        }),
      );

      navigate(`/search/${requestId}/${slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or may have been moved.
          </p>

          {detectedUrl && (
            <div className="mb-6 p-4 bg-info/10 border border-info/20 rounded-lg">
              <p className="text-sm text-info mb-3">
                💡 We detected a product URL in your request. Did you mean to
                search for this product?
              </p>
              <p className="text-xs text-muted-foreground mb-3 break-all">
                {detectedUrl}
              </p>
              <Button onClick={handleSearchDetectedUrl} size="sm">
                <Search className="mr-2 h-4 w-4" />
                Search This Product
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={() => navigate("/")} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
