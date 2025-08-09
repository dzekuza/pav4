import { Skeleton } from "@/components/ui/skeleton";
import { Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import HeroWave from "@/components/ui/dynamic-wave-canvas-background";

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
    <div className="relative min-h-screen overflow-hidden">
      <HeroWave />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center">
          {/* Minimal glass spinner */}
          <div className="mx-auto mb-8 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-3 backdrop-blur-xl">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent animate-spin"></div>
              <Search className="absolute inset-0 m-auto h-6 w-6 text-white/80" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-white">Preparing your results…</h2>
          <p className="mt-2 text-white/70">Scanning retailers and comparing prices</p>

          {/* Thin progress bar in glass pill */}
          <div className="mx-auto mt-8 w-full max-w-xl">
            <div className="relative h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/10 backdrop-blur">
              <div className="absolute inset-y-0 left-0 w-2/3 animate-[pulse_1.8s_ease-in-out_infinite] bg-gradient-to-r from-white/80 to-white/40"></div>
            </div>
            <p className="mt-3 text-xs text-white/60">This usually takes 10–30 seconds</p>
          </div>
        </div>
      </div>

      {/* Globe removed for a cleaner minimal loading view */}
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
