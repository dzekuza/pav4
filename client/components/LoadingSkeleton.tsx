import { Skeleton } from "@/components/ui/skeleton";
import { Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingSkeletonProps {
  count?: number;
  showProductHeader?: boolean;
}

export function LoadingSkeleton({
  count = 3,
  showProductHeader = false,
}: LoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      {showProductHeader && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="w-80 h-80 rounded-lg" />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="mobile-card">
            <CardContent className="p-4 sm:p-6 mobile-card-content">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SearchLoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          {/* Enhanced loading animation */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-primary animate-bounce" />
            </div>
            {/* Rotating border effect */}
            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-spin"></div>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Searching for the best deals...</h2>
          <p className="text-muted-foreground mb-8 mobile-text-sm">
            We're scanning hundreds of retailers to find the lowest prices for you
          </p>
          
          {/* Animated search steps */}
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm mobile-text-sm">Extracting product details...</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.5s]"></div>
              <span className="text-sm mobile-text-sm">Searching across retailers...</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:1s]"></div>
              <span className="text-sm mobile-text-sm">Comparing prices...</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:1.5s]"></div>
              <span className="text-sm mobile-text-sm">Preparing results...</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse w-3/5"></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This usually takes 10-30 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchLoadingOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background border rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md mx-4">
        <div className="text-center">
          {/* Enhanced animated search icon */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-bounce" />
            </div>
            {/* Rotating border effect */}
            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-spin"></div>
          </div>
          
          <h3 className="text-lg sm:text-xl font-bold mb-2">Finding the best deals...</h3>
          <p className="text-muted-foreground mb-6 mobile-text-sm">
            Scanning retailers and comparing prices
          </p>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
          </div>
          
          {/* Animated progress bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse w-3/5"></div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            This usually takes 10-30 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="animate-pulse mobile-card">
      <CardContent className="p-4 sm:p-6 mobile-card-content">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0"></div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="w-20 h-10 bg-muted rounded"></div>
            <div className="w-20 h-8 bg-muted rounded"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
