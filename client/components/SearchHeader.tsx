import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CurrencySelector } from "@/components/CurrencySelector";

interface SearchHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function SearchHeader({
  showBackButton = true,
  title = "PriceHunt",
}: SearchHeaderProps) {
  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
                {title}
              </span>
            </Link>
            {showBackButton && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  New Search
                </Link>
              </Button>
            )}
          </div>
          <nav className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/history">History</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/favorites">Favorites</Link>
            </Button>
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
