import { ExternalLink, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getUserId } from "@/lib/userTracking";

interface ProductCardProps {
  title: string;
  price: number;
  currency: string;
  url: string;
  store: string;
  image?: string;
  rating?: number;
  availability?: string;
  reviews?: number;
  inStock?: boolean;
  condition?: string;
  isBestPrice?: boolean;
  savings?: number;
  className?: string;
  requestId?: string; // For tracking
}

export function ProductCard({
  title,
  price,
  currency,
  url,
  store,
  image = "/placeholder.svg",
  rating,
  availability = "In Stock",
  reviews,
  inStock = true,
  condition,
  isBestPrice = false,
  savings = 0,
  className = "",
  requestId,
}: ProductCardProps) {
  const { formatPrice } = useCurrency();

  const handleProductClick = async (actionType: "view" | "buy") => {
    try {
      // Track the click
      const response = await fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestId || "unknown",
          productUrl: url,
          store,
          price,
          currency,
          userId: localStorage.getItem("ph_user_id") || undefined,
        }),
      });

      if (response.ok) {
        const { trackingUrl } = await response.json();

        // Open the tracking URL
        if (actionType === "buy") {
          window.open(trackingUrl, "_blank");
        } else {
          window.open(trackingUrl, "_blank");
        }
      } else {
        // Fallback to original URL if tracking fails
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Click tracking failed:", error);
      // Fallback to original URL
      window.open(url, "_blank");
    }
  };
  return (
    <Card
      className={`transition-all hover:shadow-md ${
        isBestPrice ? "ring-2 ring-success border-success/50 bg-success/5" : ""
      } ${className}`}
    >
      <CardContent className="p-4 sm:p-6">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="space-y-3">
            {/* Product Info Row */}
            <div className="flex gap-3">
              <img
                src={image}
                alt={title}
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
                  {title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  📍 <span className="font-medium">{store}</span>
                </div>
              </div>
            </div>

            {/* Price and Badges Row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(price, currency)}
                </span>
                {savings > 0 && (
                  <span className="text-xs text-success font-medium">
                    Save {formatPrice(savings, currency)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {isBestPrice && (
                  <Badge className="bg-success text-success-foreground text-xs px-2 py-0">
                    Best Price
                  </Badge>
                )}
                {condition && condition !== "New" && (
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    {condition}
                  </Badge>
                )}
              </div>
            </div>

            {/* Rating and Stock Status */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-yellow-400" />
                  <span>{rating}</span>
                  {reviews && (
                    <span>
                      (
                      {reviews > 1000
                        ? `${Math.round(reviews / 1000)}k`
                        : reviews}
                      )
                    </span>
                  )}
                </div>
              )}
              <span
                className={`flex items-center gap-1 ${!inStock ? "text-destructive" : "text-success"}`}
              >
                {inStock ? "✅" : "❌"} {availability}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleProductClick("buy")}
                className="flex-1 h-9 text-sm"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Now
              </Button>
              <Button
                variant="outline"
                onClick={() => handleProductClick("view")}
                className="px-4 h-9 text-sm"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block">
          <div className="flex items-center gap-4">
            <img
              src={image}
              alt={title}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1 line-clamp-2">{title}</h3>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(price, currency)}
                </span>
                {isBestPrice && (
                  <Badge className="bg-success text-success-foreground">
                    Best Price
                  </Badge>
                )}
                {savings > 0 && (
                  <Badge variant="outline" className="text-success">
                    Save {formatPrice(savings, currency)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  📍 <span className="font-medium">{store}</span>
                </span>
                {rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    <span>{rating}</span>
                    {reviews && (
                      <span className="text-xs">
                        ({reviews.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                <span
                  className={`flex items-center gap-1 ${!inStock ? "text-destructive" : "text-success"}`}
                >
                  {inStock ? "✅" : "❌"} {availability}
                </span>
                {condition && condition !== "New" && (
                  <Badge variant="outline" className="text-xs">
                    {condition}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button onClick={() => handleProductClick("buy")}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProductClick("view")}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                View
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
