import { SearchHeader } from "@/components/SearchHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function History() {
  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Search History</h1>

          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                🔍
              </div>
              <h2 className="text-xl font-semibold mb-2">
                No search history yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Your recent product searches will appear here. Start by
                searching for any product URL to build your history.
              </p>
              <Button asChild>
                <Link to="/">Start Searching</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Coming soon:</strong> Sign in to sync your search history
              across devices and never lose track of great deals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
