import { ExternalLink, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";

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
}: ProductCardProps) {
  const { formatPrice } = useCurrency();
  return (
    <Card
      className={`transition-all hover:shadow-md ${
        isBestPrice ? "ring-2 ring-success border-success/50 bg-success/5" : ""
      } ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <img
            src={image}
            alt={title}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="font-semibold mb-1 line-clamp-2">{title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-primary">
                {currency}
                {price.toFixed(2)}
              </span>
              {isBestPrice && (
                <Badge className="bg-success text-success-foreground">
                  Best Price
                </Badge>
              )}
              {savings > 0 && (
                <Badge variant="outline" className="text-success">
                  Save {currency}
                  {savings.toFixed(2)}
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
          <div className="flex flex-col gap-2">
            <Button asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Now
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-3 w-3" />
                View
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
