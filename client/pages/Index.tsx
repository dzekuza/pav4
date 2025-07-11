import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Shield, Zap, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/SearchInput";

// Generate a simple UUID v4
function generateRequestId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Extract slug from URL
function extractSlug(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, "");
    const pathParts = urlObj.pathname
      .split("/")
      .filter((part) => part.length > 0);

    // Get the last meaningful part of the path or use domain + first part
    const productPart =
      pathParts[pathParts.length - 1] || pathParts[0] || "product";

    // Clean up the slug
    const slug = `${domain}-${productPart}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return slug || "unknown-product";
  } catch {
    return "unknown-product";
  }
}

export default function Index() {
  const [searchUrl, setSearchUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (url: string) => {
    if (!url.trim()) return;

    setIsLoading(true);

    try {
      // Validate URL first
      const validUrl = url.trim();
      new URL(validUrl);

      // Navigate directly without encoding since the path will be properly handled
      window.location.href = `/${validUrl}`;
    } catch (error) {
      console.error("Invalid URL:", error);
      setIsLoading(false);
      alert("Please enter a valid URL");
    }
  };

  const popularStores = [
    { name: "Amazon", logo: "🛒" },
    { name: "eBay", logo: "🛍️" },
    { name: "Walmart", logo: "🏪" },
    { name: "Target", logo: "🎯" },
    { name: "Best Buy", logo: "⚡" },
    { name: "Costco", logo: "📦" },
  ];

  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Smart Product Detection",
      description: "AI-powered extraction of product details from any URL",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Real-time Price Tracking",
      description: "Compare prices across multiple retailers instantly",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Trusted Sources",
      description: "Only verified retailers and marketplace sellers",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Get results in seconds with our optimized scraping",
    },
  ];

  const recentSearches = [
    { product: "Sony WH-1000XM5 Headphones", savings: "$45" },
    { product: "iPhone 15 Pro Max", savings: "$120" },
    { product: "Nike Air Max 270", savings: "$30" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent">
                PriceHunt
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                How it works
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Popular stores
              </a>
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Find the{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              best deals
            </span>{" "}
            on any product
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Paste any product URL and we'll instantly find the cheapest prices
            across hundreds of retailers. Save money on every purchase with
            AI-powered price comparison.
          </p>

          {/* Search Form */}
          <div className="mb-12">
            <SearchInput
              value={searchUrl}
              onChange={setSearchUrl}
              onSubmit={handleSearch}
              isLoading={isLoading}
            />
          </div>

          {/* Popular Stores */}
          <div className="mb-16">
            <p className="text-sm text-muted-foreground mb-4">
              We compare prices from popular stores including:
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {popularStores.map((store) => (
                <div
                  key={store.name}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-lg">{store.logo}</span>
                  <span>{store.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why choose PriceHunt?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform makes price comparison effortless and
              accurate
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-brand-gradient rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Searches */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recent success stories</h2>
            <p className="text-muted-foreground">
              See how much others have saved
            </p>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {recentSearches.map((search, index) => (
              <Card
                key={index}
                className="border border-success/20 bg-success/5"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="font-medium">{search.product}</span>
                  </div>
                  <div className="flex items-center gap-1 text-success font-semibold">
                    <Star className="h-4 w-4 fill-current" />
                    Saved {search.savings}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start saving money?
          </h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Join thousands of smart shoppers who never overpay again
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-primary hover:bg-white/90"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-brand-gradient rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">PriceHunt</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PriceHunt. Find the best deals, every time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
