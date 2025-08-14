import { useState } from "react";
import { ExternalLink, Heart, Star, Package, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { generateAffiliateLink, trackAffiliateClick, getStoredUtmParameters, trackSale, handleProductClick } from "@/lib/tracking";

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
  isLocal?: boolean;
  distance?: string;
  affiliateId?: string;
  productId?: string;
  businessId?: number; // Add business ID for sales tracking
  businessDomain?: string; // Add business domain for Shopify tracking
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
  showBuyNow?: boolean; // New prop to show Buy Now button
}

export function ProductCard({
  title,
  price,
  currency,
  url,
  store,
  image,
  rating,
  availability,
  reviews,
  inStock,
  condition,
  isBestPrice,
  savings,
  isLocal,
  distance,
  affiliateId,
  productId,
  businessId,
  businessDomain,
  onFavoriteToggle,
  isFavorited,
  showBuyNow = false,
}: ProductCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBuyNow = async () => {
    setIsProcessing(true);

    try {
      // If we have a business domain, use the enhanced tracking
      if (businessDomain) {
        const result = await handleProductClick(
          { url, title, name: title }, // product object
          businessDomain
        );
        
        if (result.success) {
          // Open the tracked URL in a new tab
          window.open(result.targetUrl, '_blank');
        } else {
          // Fallback to regular affiliate link if Shopify tracking fails
          const affiliateUrl = generateAffiliateLink(url, store || "unknown");
          window.open(affiliateUrl, '_blank');
        }
      } else {
        // Use existing affiliate tracking for non-business products
        const affiliateUrl = generateAffiliateLink(url, store || "unknown");

        // Track the purchase intent (only once)
        const utmParams = getStoredUtmParameters();
        const sessionId =
          sessionStorage.getItem("pricehunt_session_id") ||
          `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Track affiliate click with purchase intent
        trackAffiliateClick({
          productUrl: url,
          productTitle: title,
          productPrice: `${price} ${currency}`,
          retailer: store,
          sessionId: sessionId,
          referrer: document.referrer,
          utmSource: utmParams.utm_source,
          utmMedium: utmParams.utm_medium,
          utmCampaign: utmParams.utm_campaign,
        });

        // If we have a business ID, track the sale
        if (businessId) {
          const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Use the new trackSale function
          const saleTracked = await trackSale({
            orderId: orderId,
            businessId: businessId,
            productUrl: url,
            productTitle: title,
            productPrice: `${price} ${currency}`,
            retailer: store,
            sessionId: sessionId,
            referrer: document.referrer,
            utmSource: utmParams.utm_source,
            utmMedium: utmParams.utm_medium,
            utmCampaign: utmParams.utm_campaign,
          });

          if (saleTracked) {
            console.log("Sale tracked successfully for business:", businessId);
          }
        }

        // Open the affiliate link
        window.open(affiliateUrl, '_blank');
      }
    } catch (error) {
      console.error("Error handling purchase:", error);
      // Fallback: open the original URL
      window.open(url, '_blank');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFavoriteToggle = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle();
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  const getStoreIcon = (storeName: string) => {
    const store = storeName.toLowerCase();
    if (store.includes('amazon')) return '🛒';
    if (store.includes('ebay')) return '🛍️';
    if (store.includes('walmart')) return '🏪';
    if (store.includes('target')) return '🎯';
    if (store.includes('best buy')) return '⚡';
    if (store.includes('apple')) return '🍎';
    if (store.includes('costco')) return '📦';
    if (store.includes('newegg')) return '💻';
    return '🛒';
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-20 h-20 object-cover rounded-lg"
                loading="lazy"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
                  {title}
                </h3>
                
                {/* Store and Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getStoreIcon(store)}</span>
                  <span className="text-sm text-muted-foreground">{store}</span>
                  {rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{rating}</span>
                      {reviews && (
                        <span className="text-xs text-muted-foreground">
                          ({reviews})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Price and Savings */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(price, currency)}
                  </span>
                  {savings && savings > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Save {formatPrice(savings, currency)}
                    </Badge>
                  )}
                  {isBestPrice && (
                    <Badge variant="default" className="text-xs">
                      Best Price
                    </Badge>
                  )}
                </div>

                {/* Additional Info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {condition && (
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {condition}
                    </div>
                  )}
                  {isLocal && distance && (
                    <div className="flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {distance}
                    </div>
                  )}
                  {inStock !== undefined && (
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {inStock ? "In Stock" : "Out of Stock"}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {onFavoriteToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFavoriteToggle}
                    className="h-8 w-8 p-0"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isFavorited
                          ? "fill-red-500 text-red-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
                )}

                {showBuyNow && (
                  <Button
                    onClick={handleBuyNow}
                    disabled={isProcessing}
                    className="text-xs h-8 px-3"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Buy Now
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
