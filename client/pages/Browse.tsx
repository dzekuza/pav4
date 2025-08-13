import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  ExternalLink,
  ShoppingCart,
  Star,
  Building2,
} from "lucide-react";
import { SearchHeader } from "@/components/SearchHeader";

interface Product {
  id: number;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  isActive: boolean;
  business: {
    id: number;
    name: string;
    domain: string;
    logo?: string;
    affiliateId: string;
  };
}

interface Category {
  name: string;
  icon: string;
  description: string;
}

const categories: Category[] = [
  {
    name: "Fashion",
    icon: "👗",
    description: "Clothing, accessories, and style",
  },
  {
    name: "Electronics",
    icon: "📱",
    description: "Gadgets, computers, and tech",
  },
  {
    name: "Home & Garden",
    icon: "🏠",
    description: "Furniture, decor, and outdoor",
  },
  {
    name: "Sports",
    icon: "⚽",
    description: "Fitness, equipment, and outdoor activities",
  },
  {
    name: "Beauty",
    icon: "💄",
    description: "Cosmetics, skincare, and wellness",
  },
  {
    name: "Books",
    icon: "📚",
    description: "Literature, education, and entertainment",
  },
  {
    name: "Toys",
    icon: "🧸",
    description: "Games, toys, and entertainment",
  },
  {
    name: "Automotive",
    icon: "🚗",
    description: "Cars, parts, and accessories",
  },
  {
    name: "Health",
    icon: "💊",
    description: "Medicine, supplements, and wellness",
  },
  {
    name: "Food",
    icon: "🍕",
    description: "Groceries, snacks, and beverages",
  },
  {
    name: "Baby & Kids",
    icon: "👶",
    description: "Baby products, toys, and children's items",
  },
  {
    name: "Pet Supplies",
    icon: "🐕",
    description: "Pet food, toys, and accessories",
  },
  {
    name: "Office & Business",
    icon: "💼",
    description: "Office supplies, business equipment",
  },
  {
    name: "Jewelry & Watches",
    icon: "💍",
    description: "Fine jewelry, watches, and accessories",
  },
  {
    name: "Tools & Hardware",
    icon: "🔧",
    description: "Tools, hardware, and DIY supplies",
  },
  {
    name: "Music & Instruments",
    icon: "🎵",
    description: "Musical instruments and audio equipment",
  },
  {
    name: "Art & Crafts",
    icon: "🎨",
    description: "Art supplies, crafts, and creative materials",
  },
  {
    name: "Garden & Outdoor",
    icon: "🌱",
    description: "Garden tools, plants, and outdoor living",
  },
  {
    name: "Kitchen & Dining",
    icon: "🍽️",
    description: "Kitchen appliances, cookware, and dining",
  },
  {
    name: "Bath & Personal Care",
    icon: "🛁",
    description: "Bathroom accessories and personal care",
  },
];

export default function Browse() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category || "");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategory) {
      // Set the first available category as default
      setSelectedCategory(availableCategories[0]);
    } else if (selectedCategory) {
      fetchProducts(selectedCategory);
    }
  }, [availableCategories, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/products/categories");
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async (categoryName: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/category/${encodeURIComponent(categoryName)}`);
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    // Instead of redirecting directly, use the URL for search suggestions
    const requestId = Date.now().toString();
    const slug = encodeURIComponent(product.url);
    
    // Navigate to search results page with the product URL
    navigate(`/new-search/${requestId}/${slug}`, {
      state: {
        searchUrl: product.url,
        userCountry: "Germany",
        gl: "de",
        isKeywordSearch: false,
      },
    });
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    return category?.icon || "📦";
  };

  const getCategoryDescription = (categoryName: string) => {
    const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    return category?.description || "Discover amazing products";
  };

  const formatPrice = (price: string) => {
    // Convert USD prices to EUR (approximate conversion)
    if (price && price.includes('$')) {
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericPrice)) {
        const eurPrice = (numericPrice * 0.85).toFixed(2); // Approximate USD to EUR conversion
        return `€${eurPrice}`;
      }
    }
    // If already in EUR or other currency, return as is
    return price;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SearchHeader showBackButton={false} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SearchHeader showBackButton={false} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getCategoryIcon(selectedCategory)}</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {selectedCategory || "Browse"}
                </h1>
                <p className="text-muted-foreground">
                  {selectedCategory ? getCategoryDescription(selectedCategory) : "Discover amazing products"}
                </p>
              </div>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            {products.length} products available
          </Badge>
        </div>

        {/* Category Tabs */}
        {availableCategories.length > 0 && (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <div className="overflow-x-auto">
              <TabsList className="flex w-full min-w-max space-x-1 bg-muted border border-border">
                {availableCategories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="flex-shrink-0 px-3 md:px-4 text-foreground"
                  >
                    <span className="mr-2">{getCategoryIcon(cat)}</span>
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No products found
            </h3>
            <p className="text-muted-foreground">
              No products are available in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="border-border bg-card text-card-foreground hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
                onClick={() => handleProductClick(product)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {product.business.logo ? (
                        <img
                          src={product.business.logo}
                          alt={`${product.business.name} logo`}
                          className="h-6 w-6 rounded object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground truncate">
                        {product.business.name}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Product Image */}
                  {product.imageUrl && (
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {product.business.domain}
                      </span>
                    </div>
                    {product.price && (
                      <Badge variant="secondary" className="bg-success/20 text-success">
                        {formatPrice(product.price)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Information Card */}
        <div className="mt-12">
          <Card className="border-primary/20 bg-primary/10 text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Package className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Browse products from verified businesses in your favorite categories.
              </p>
              <p className="text-sm text-muted-foreground">
                Click on any product to search for better prices across multiple retailers.
              </p>
              <p className="text-sm text-muted-foreground">
                All purchases are tracked and contribute to the business's analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
