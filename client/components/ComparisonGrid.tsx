import { ProductCard } from "./ProductCard";
import { useCurrency } from "@/contexts/CurrencyContext";

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
  const { convertPrice } = useCurrency();

  if (products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            🔍
          </div>
          <h3 className="text-lg font-semibold mb-2">No alternatives found</h3>
          <p className="text-muted-foreground mb-4">
            We couldn't find any alternative prices for this product at the
            moment. Try checking back later or searching for a different
            product.
          </p>
        </div>
      </div>
    );
  }

  // Find the lowest price to highlight the best deal (in converted currency)
  const lowestPrice = Math.min(
    ...products.map((p) => convertPrice(p.price, p.currency)),
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {products.map((product, index) => {
        const isBestPrice = product.price === lowestPrice;
        const savings =
          originalPrice && originalPrice > product.price
            ? originalPrice - product.price
            : 0;

        return (
          <ProductCard
            key={index}
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
  const { formatPrice } = useCurrency();
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
