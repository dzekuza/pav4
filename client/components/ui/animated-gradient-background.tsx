import React, { useMemo, useRef, useCallback } from "react";

import { cn } from "@/lib/utils";
import { useDimensions } from "@/hooks/use-debounced-dimensions";

interface AnimatedGradientProps {
  colors?: string[];
  speed?: number;
  blur?: "light" | "medium" | "heavy";
}

type AnimatedGradientBackgroundProps = {
  fps?: number; // kept for compatibility with HeroWave interface
  quality?: "high" | "medium" | "low"; // kept for compatibility with HeroWave interface
};

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  colors = ["#1a1a2e", "#16213e", "#0f3460", "#533483", "#7209b7"],
  speed = 5,
  blur = "light",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef);

  const circleSize = useMemo(
    () => Math.max(dimensions.width, dimensions.height),
    [dimensions.width, dimensions.height],
  );

  const blurClass =
    blur === "light"
      ? "blur-2xl"
      : blur === "medium"
        ? "blur-3xl"
        : "blur-[100px]";

  // Memoize the gradient circles to prevent re-creation on every render
  const gradientCircles = useMemo(() => {
    return colors.map((color, index) => {
      const animationProps = {
        animation: `background-gradient ${speed}s infinite ease-in-out`,
        animationDuration: `${speed}s`,
        top: `${Math.random() * 50}%`,
        left: `${Math.random() * 50}%`,
        "--tx-1": Math.random() - 0.5,
        "--ty-1": Math.random() - 0.5,
        "--tx-2": Math.random() - 0.5,
        "--ty-2": Math.random() - 0.5,
        "--tx-3": Math.random() - 0.5,
        "--ty-3": Math.random() - 0.5,
        "--tx-4": Math.random() - 0.5,
        "--ty-4": Math.random() - 0.5,
      } as React.CSSProperties;

      return (
        <svg
          key={`${color}-${index}`}
          className={cn("absolute", "animate-background-gradient")}
          width={circleSize * randomInt(0.5, 1.5)}
          height={circleSize * randomInt(0.5, 1.5)}
          viewBox="0 0 100 100"
          style={animationProps}
        >
          <circle cx="50" cy="50" r="50" fill={color} />
        </svg>
      );
    });
  }, [colors, speed, circleSize]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className={cn(`absolute inset-0`, blurClass)}>
        {gradientCircles}
      </div>
    </div>
  );
};

// Main export that matches HeroWave interface
const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = React.memo(({
  fps, // unused but kept for compatibility
  quality = "low", // unused but kept for compatibility
}) => {
  return <AnimatedGradient speed={5} blur="medium" />;
});

AnimatedGradientBackground.displayName = "AnimatedGradientBackground";

export default AnimatedGradientBackground;
export { AnimatedGradient };
