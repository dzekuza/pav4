import React, { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { Search, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import AnimatedGradientBackground from "./ui/animated-gradient-background";

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
  const steps = [
    "Searching product information",
    "Gathering results from retailers",
    "Filtering for best prices",
    "Evaluating delivery and quality",
    "Preparing suggestions",
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1

  useEffect(() => {
    // Total minimum duration: 7 seconds
    const totalMs = 7000;
    const minPerStep = 500; // keep each step visible
    const remaining = Math.max(totalMs - minPerStep * steps.length, 0);
    const weights = Array.from({ length: steps.length }, () => Math.random());
    const wSum = weights.reduce((a, b) => a + b, 0) || 1;
    const durations = weights.map((w) => (w / wSum) * remaining + minPerStep);

    // Schedule step changes
    let acc = 0;
    const timers: number[] = [];
    for (let i = 0; i < steps.length - 1; i++) {
      acc += durations[i];
      timers.push(window.setTimeout(() => setStepIndex(i + 1), acc));
    }

    // Progress animation
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      setProgress(Math.min(1, elapsed / totalMs));
      if (elapsed < totalMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      cancelAnimationFrame(raf);
    };
  }, []);

  const percent = progress * 100;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedGradientBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          {/* Spinner */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-xl">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-2 border-white/25"></div>
              <div className="absolute inset-0 rounded-full border-2 border-white/70 border-t-transparent animate-spin"></div>
              <Search className="absolute inset-0 m-auto h-5 w-5 text-white/80" />
            </div>
          </div>

          <h2 className="text-center text-2xl font-semibold text-white">
            Preparing your results…
          </h2>
          <p className="mt-2 text-center text-white/70">
            We are working through a few quick steps
          </p>

          {/* Steps */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <ul className="space-y-2" aria-live="polite">
              {steps.map((label, idx) => {
                const isDone = idx < stepIndex;
                const isActive = idx === stepIndex;
                return (
                  <li key={label} className="flex items-center gap-3">
                    <span
                      className={
                        "flex h-5 w-5 items-center justify-center rounded-full " +
                        (isDone
                          ? "bg-green-500/90 text-black"
                          : isActive
                            ? "bg-white text-black"
                            : "bg-white/10 text-white/60")
                      }
                    >
                      {isDone ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={
                        isDone
                          ? "text-white/90"
                          : isActive
                            ? "text-white"
                            : "text-white/60"
                      }
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Progress bar */}
          <div className="mx-auto mt-6 w-full max-w-xl">
            <div className="relative h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/10 backdrop-blur">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/80 to-white/40 transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-3 text-center text-xs text-white/60">
              This typically takes about 7 seconds
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

          <h3 className="text-lg sm:text-xl font-bold mb-2">
            Finding the best deals...
          </h3>
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
