import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, TrendingUp, MapPin, ShoppingCart } from "lucide-react";
import { generateAffiliateLink, trackAffiliateClick, trackSale, getStoredUtmParameters } from "@/lib/tracking";

interface ProductCardProps {
  product: {
    title: string;
    price: string;
    url: string;
    image?: string;
    retailer?: string;
    savings?: string;
    isLocal?: boolean;
    distance?: string;
    businessId?: number; // Add business ID for sales tracking
  };
  onFavoriteToggle?: () => void;
  isFavorited?: boolean;
  showBuyNow?: boolean; // New prop to show Buy Now button
}

export function ProductCard({ product, onFavoriteToggle, isFavorited, showBuyNow = false }: ProductCardProps) {
  const handleViewDeal = () => {
    // Generate affiliate link
    const affiliateUrl = generateAffiliateLink(product.url, product.retailer || 'unknown');

    // Track the click
    const utmParams = getStoredUtmParameters();
    trackAffiliateClick({
      productUrl: product.url,
      productTitle: product.title,
      productPrice: product.price,
      retailer: product.retailer,
      sessionId: sessionStorage.getItem('pricehunt_session_id') || undefined,
      referrer: document.referrer,
      utmSource: utmParams.utm_source,
      utmMedium: utmParams.utm_medium,
      utmCampaign: utmParams.utm_campaign,
    });

    // Open the affiliate link
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBuyNow = async () => {
    try {
      // Generate affiliate link
      const affiliateUrl = generateAffiliateLink(product.url, product.retailer || 'unknown');

      // Track the purchase intent
      const utmParams = getStoredUtmParameters();
      const sessionId = sessionStorage.getItem('pricehunt_session_id') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Track affiliate click with purchase intent
      trackAffiliateClick({
        productUrl: product.url,
        productTitle: product.title,
        productPrice: product.price,
        retailer: product.retailer,
        sessionId: sessionId,
        referrer: document.referrer,
        utmSource: utmParams.utm_source,
        utmMedium: utmParams.utm_medium,
        utmCampaign: utmParams.utm_campaign,
      });

      // If we have a business ID, track the sale
      if (product.businessId) {
        const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Use the new trackSale function
        const saleTracked = await trackSale({
          orderId: orderId,
          businessId: product.businessId,
          productUrl: product.url,
          productTitle: product.title,
          productPrice: product.price,
          retailer: product.retailer,
          sessionId: sessionId,
          referrer: document.referrer,
          utmSource: utmParams.utm_source,
          utmMedium: utmParams.utm_medium,
          utmCampaign: utmParams.utm_campaign,
        });

        if (saleTracked) {
          console.log('Sale tracked successfully for business:', product.businessId);
        }
      }

      // Open the affiliate link
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');

    } catch (error) {
      console.error('Error tracking purchase:', error);
      // Fallback to regular affiliate link
      const affiliateUrl = generateAffiliateLink(product.url, product.retailer || 'unknown');
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getRetailerName = (url: string): string => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname.includes('amazon')) return 'Amazon';
      if (hostname.includes('ebay')) return 'eBay';
      if (hostname.includes('walmart')) return 'Walmart';
      if (hostname.includes('target')) return 'Target';
      if (hostname.includes('bestbuy')) return 'Best Buy';
      if (hostname.includes('apple')) return 'Apple';
      if (hostname.includes('playstation')) return 'PlayStation';
      if (hostname.includes('newegg')) return 'Newegg';
      if (hostname.includes('costco')) return 'Costco';
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Store';
    }
  };

  const retailerName = product.retailer || getRetailerName(product.url);

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2">
              {product.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-green-600">
                {product.price}
              </span>
              {product.savings && (
                <Badge variant="secondary" className="text-xs">
                  Save {product.savings}
                </Badge>
              )}
            </div>
          </div>
          {product.image && (
            <img
              src={product.image}
              alt={product.title}
              className="w-16 h-16 object-cover rounded ml-3 flex-shrink-0"
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{retailerName}</span>
            {product.isLocal && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600">Local</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onFavoriteToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFavoriteToggle}
                className="p-1 h-8 w-8"
              >
                <Star
                  className={`w-4 h-4 ${isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                    }`}
                />
              </Button>
            )}

            {showBuyNow ? (
              // Show both View Deal and Buy Now buttons
              <div className="flex items-center gap-1">
                <Button
                  onClick={handleViewDeal}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </Button>
                <Button
                  onClick={handleBuyNow}
                  size="sm"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Buy Now
                </Button>
              </div>
            ) : (
              // Show only View Deal button
              <Button
                onClick={handleViewDeal}
                size="sm"
                className="flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                View Deal
              </Button>
            )}
          </div>
        </div>

        {product.distance && (
          <div className="mt-2 text-xs text-gray-500">
            {product.distance}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
