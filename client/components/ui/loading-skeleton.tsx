import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "landing" | "default";
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = "default",
}) => {
  if (variant === "landing") {
    return (
      <div
        className={cn(
          "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50",
          className,
        )}
      >
        {/* Landing page skeleton */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            {/* Logo skeleton */}
            <div className="w-32 h-8 bg-gray-200 rounded mx-auto mb-8 animate-pulse" />

            {/* Title skeleton */}
            <div className="w-96 h-16 bg-gray-200 rounded mx-auto mb-6 animate-pulse" />

            {/* Subtitle skeleton */}
            <div className="w-80 h-6 bg-gray-200 rounded mx-auto mb-8 animate-pulse" />

            {/* Button skeleton */}
            <div className="w-48 h-12 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>

          {/* Features grid skeleton */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-0 shadow-lg rounded-lg p-6">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse" />
                <div className="w-32 h-6 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("animate-pulse", className)}>
      <div className="w-full h-4 bg-gray-200 rounded mb-2" />
      <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
      <div className="w-1/2 h-4 bg-gray-200 rounded" />
    </div>
  );
};

export default LoadingSkeleton;
