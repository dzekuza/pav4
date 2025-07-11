import { SearchHeader } from "@/components/SearchHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Favorites() {
  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Favorite Products</h1>

          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                ⭐
              </div>
              <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
              <p className="text-muted-foreground mb-6">
                Save products you're interested in to easily track their prices
                over time and get notifications when they go on sale.
              </p>
              <Button asChild>
                <Link to="/">Find Products</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Coming soon:</strong> Price drop alerts, wishlist sharing,
              and automatic deal notifications for your favorite products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
