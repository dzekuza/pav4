import { ProductCard } from "./ProductCard";

interface Product {
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
  isLocal?: boolean;
  distance?: string;
}

interface ComparisonGridProps {
  products: Product[];
  originalPrice?: number;
  className?: string;
}

export function ComparisonGrid({
  products,
  originalPrice,
  className = "",
}: ComparisonGridProps) {
  if (products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            🔍
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Real Product Search Under Development
          </h3>
          <p className="text-muted-foreground mb-4">
            We're currently building a real product search system that will find
            actual products from Amazon, eBay, and local dealers with working
            links and real prices. The previous system showed fake data with
            broken URLs - that has been disabled.
          </p>
        </div>
      </div>
    );
  }

  // Find the lowest price to highlight the best deal
  const lowestPrice = Math.min(...products.map((p) => p.price));

  // Separate local and global dealers
  const localDealers = products.filter((p) => p.isLocal);
  const globalDealers = products.filter((p) => !p.isLocal);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Local Dealers Section */}
      {localDealers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="text-lg font-semibold">Local Dealers</h3>
            <span className="text-sm text-muted-foreground">
              ({localDealers.length} found)
            </span>
          </div>
          <div className="grid gap-4">
            {localDealers.map((product, index) => {
              const isBestPrice = product.price === lowestPrice;
              const savings =
                originalPrice && originalPrice > product.price
                  ? originalPrice - product.price
                  : 0;

              return (
                <ProductCard
                  key={`local-${index}`}
                  title={product.title}
                  price={product.price}
                  currency={product.currency}
                  url={product.url}
                  store={product.store}
                  image={product.image}
                  rating={product.rating}
                  availability={product.availability}
                  reviews={product.reviews}
                  inStock={product.inStock}
                  condition={product.condition}
                  isBestPrice={isBestPrice}
                  savings={savings}
                  isLocal={product.isLocal}
                  distance={product.distance}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Global Dealers Section */}
      {globalDealers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold">
              {localDealers.length > 0
                ? "Other Retailers"
                : "Available Retailers"}
            </h3>
            <span className="text-sm text-muted-foreground">
              ({globalDealers.length} found)
            </span>
          </div>
          <div className="grid gap-4">
            {globalDealers.map((product, index) => {
              const isBestPrice = product.price === lowestPrice;
              const savings =
                originalPrice && originalPrice > product.price
                  ? originalPrice - product.price
                  : 0;

              return (
                <ProductCard
                  key={`global-${index}`}
                  title={product.title}
                  price={product.price}
                  currency={product.currency}
                  url={product.url}
                  store={product.store}
                  image={product.image}
                  rating={product.rating}
                  availability={product.availability}
                  reviews={product.reviews}
                  inStock={product.inStock}
                  condition={product.condition}
                  isBestPrice={isBestPrice}
                  savings={savings}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface SavingsSummaryProps {
  originalPrice: number;
  lowestPrice: number;
  currency: string;
  totalComparisons: number;
}

export function SavingsSummary({
  originalPrice,
  lowestPrice,
  currency,
  totalComparisons,
}: SavingsSummaryProps) {
  const savings = originalPrice - lowestPrice;
  const savingsPercentage = ((savings / originalPrice) * 100).toFixed(0);

  if (savings <= 0) {
    return (
      <div className="bg-info/10 border border-info/20 rounded-lg p-4 mb-6">
        <p className="text-info font-semibold">
          ℹ️ This appears to be competitively priced! We found{" "}
          {totalComparisons} alternative{totalComparisons !== 1 ? "s" : ""} with
          similar pricing.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-success font-semibold text-lg">
            💰 You can save up to {currency}
            {savings.toFixed(2)}!
          </p>
          <p className="text-success/80 text-sm">
            That's {savingsPercentage}% off the original price
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            Found {totalComparisons} alternative
            {totalComparisons !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
