import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";

interface BusinessStats {
  id: number;
  name: string;
  domain: string;
  logo?: string | null;
}

interface Product {
  id?: number;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  price?: string;
  isActive: boolean;
}

export default function BusinessProductsDashboard() {
  const context = useOutletContext<{ stats: BusinessStats }>();
  const stats = context?.stats;
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    url: "",
    title: "",
    description: "",
    imageUrl: "",
    isActive: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // Navigation warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    const handleNavigation = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          "You have unsaved changes. If you leave this page, your changes will be lost. Are you sure you want to continue?",
        );
        if (!confirmed) {
          e.preventDefault();
          window.history.pushState(null, "", location.pathname);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handleNavigation);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handleNavigation);
    };
  }, [hasUnsavedChanges, location.pathname]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/business/products", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedProducts = data.products || [];
        setProducts(fetchedProducts);
        setOriginalProducts(fetchedProducts);
        setHasUnsavedChanges(false);
      } else if (response.status === 401) {
        // Handle unauthorized
        return;
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch products",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProductImageUpload = (imageData: string) => {
    setNewProduct({ ...newProduct, imageUrl: imageData });
  };

  const handleNewProductImageRemove = () => {
    setNewProduct({ ...newProduct, imageUrl: "" });
  };

  const handleProductImageUpload = (index: number, imageData: string) => {
    const updatedProducts = products.map((product, i) =>
      i === index ? { ...product, imageUrl: imageData } : product,
    );
    setProducts(updatedProducts);
  };

  const handleProductImageRemove = (index: number) => {
    const updatedProducts = products.map((product, i) =>
      i === index ? { ...product, imageUrl: "" } : product,
    );
    setProducts(updatedProducts);
    setHasUnsavedChanges(true);
  };

  const checkForUnsavedChanges = () => {
    // Check if there are any changes in the products array
    if (products.length !== originalProducts.length) {
      return true;
    }

    // Check if any product has been modified
    for (let i = 0; i < products.length; i++) {
      const current = products[i];
      const original = originalProducts[i];

      if (!original) return true; // New product added

      if (
        current.url !== original.url ||
        current.title !== original.title ||
        current.description !== original.description ||
        current.imageUrl !== original.imageUrl ||
        current.isActive !== original.isActive
      ) {
        return true;
      }
    }

    return false;
  };

  const updateUnsavedChanges = () => {
    const hasChanges = checkForUnsavedChanges();
    setHasUnsavedChanges(hasChanges);
  };

  const addProduct = () => {
    if (products.length >= 10) {
      toast({
        title: "Limit Reached",
        description: "You can only add up to 10 products",
        variant: "destructive",
      });
      return;
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Adding a new product will include it in your changes. Do you want to continue?",
      );
      if (!confirmed) {
        return;
      }
    }

    if (!newProduct.url || !newProduct.title) {
      toast({
        title: "Missing Information",
        description: "Please provide both URL and title for the product",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(newProduct.url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    const product: Product = {
      url: newProduct.url,
      title: newProduct.title,
      description: newProduct.description || "",
      imageUrl: newProduct.imageUrl || "",
      isActive: newProduct.isActive || true,
    };

    setProducts([...products, product]);
    setHasUnsavedChanges(true);
    setNewProduct({
      url: "",
      title: "",
      description: "",
      imageUrl: "",
      isActive: true,
    });

    toast({
      title: "Product Added",
      description: "Product has been added to your list",
    });
  };

  const removeProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    setHasUnsavedChanges(true);
    toast({
      title: "Product Removed",
      description: "Product has been removed from your list",
    });
  };

  const toggleProductStatus = (index: number) => {
    const updatedProducts = products.map((product, i) =>
      i === index ? { ...product, isActive: !product.isActive } : product,
    );
    setProducts(updatedProducts);
    setHasUnsavedChanges(true);
  };

  const saveProducts = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/business/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ products }),
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalProducts(products);
        setHasUnsavedChanges(false);
        toast({
          title: "Products Saved",
          description:
            data.message || "Your products have been saved successfully",
        });
      } else {
        let errorMessage = "Failed to save products";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving products:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const updatedProducts = products.map((product, i) =>
      i === index ? { ...product, [field]: value } : product,
    );
    setProducts(updatedProducts);
    setHasUnsavedChanges(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Product Management
          </h2>
          <p className="text-sm md:text-base text-white/70">
            Add and manage your product links (up to 10 products)
          </p>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-400 font-medium">
                You have unsaved changes
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={saveProducts}
          disabled={isSaving}
          className={`${
            hasUnsavedChanges
              ? "bg-yellow-500 text-black hover:bg-yellow-400"
              : "bg-white text-black hover:bg-white/90"
          }`}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving
            ? "Saving..."
            : hasUnsavedChanges
              ? "Save Changes"
              : "Save Products"}
        </Button>
      </div>

      {/* Add New Product */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Plus className="h-5 w-5" />
            Add New Product
          </CardTitle>
          <CardDescription className="text-white/80">
            Add a product link to showcase on the public browse page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-url">Product URL *</Label>
              <Input
                id="product-url"
                type="url"
                placeholder="https://example.com/product"
                value={newProduct.url}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-title">Product Title *</Label>
              <Input
                id="product-title"
                placeholder="Product name"
                value={newProduct.title}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, title: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-description">Description (Optional)</Label>
            <Input
              id="product-description"
              placeholder="Brief product description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            />
          </div>

          {/* Product Image Upload */}
          <ImageUpload
            currentImage={newProduct.imageUrl}
            onImageUpload={handleNewProductImageUpload}
            onImageRemove={handleNewProductImageRemove}
            title="Product Image"
            description="Upload a product image (optional)"
            maxSize={2}
            className="mt-4"
          />

          <Button
            onClick={addProduct}
            disabled={
              products.length >= 10 || !newProduct.url || !newProduct.title
            }
            className="w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product ({products.length}/10)
          </Button>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Package className="h-5 w-5" />
            Your Products
          </CardTitle>
          <CardDescription className="text-white/80">
            Manage your product links and their visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No products added yet</p>
              <p className="text-sm text-white/40">
                Add your first product to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="border border-white/10 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                        className={
                          product.isActive ? "bg-green-500" : "bg-gray-500"
                        }
                      >
                        {product.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                      <span className="text-sm text-white/60">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProductStatus(index)}
                        className="text-white hover:bg-white/10"
                      >
                        {product.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-white/70">
                        Product URL
                      </Label>
                      <Input
                        value={product.url}
                        onChange={(e) =>
                          updateProduct(index, "url", e.target.value)
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-white/70">
                        Product Title
                      </Label>
                      <Input
                        value={product.title}
                        onChange={(e) =>
                          updateProduct(index, "title", e.target.value)
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-white/70">Description</Label>
                    <Input
                      value={product.description}
                      onChange={(e) =>
                        updateProduct(index, "description", e.target.value)
                      }
                      placeholder="Optional description"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  {/* Product Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm text-white/70">
                      Product Image
                    </Label>
                    <ImageUpload
                      currentImage={product.imageUrl}
                      onImageUpload={(imageData) =>
                        handleProductImageUpload(index, imageData)
                      }
                      onImageRemove={() => handleProductImageRemove(index)}
                      title=""
                      description=""
                      maxSize={2}
                      className="border-white/10 bg-white/5"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-white/60" />
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm truncate"
                    >
                      {product.url}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-blue-500/20 bg-blue-500/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <Package className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm text-white/80">
              Your products will be displayed on the public browse page based on
              your business category.
            </p>
            <p className="text-sm text-white/80">
              When users click on your products, they'll be redirected to your
              website and tracked for analytics.
            </p>
            <p className="text-sm text-white/80">
              Only active products will be shown to the public. You can toggle
              product visibility anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
