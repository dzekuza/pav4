"use client";

import createGlobe, { COBEOptions } from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const GLOBE_CONFIG: COBEOptions = {
  width: 600,
  height: 600,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0.05,
  diffuse: 0.8,
  mapSamples: 16000,
  mapBrightness: 2.0,
  baseColor: [1, 1, 1],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [1, 1, 1],
  markers: [
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.08 },
    { location: [51.5074, -0.1278], size: 0.08 },
    { location: [48.8566, 2.3522], size: 0.08 },
  ],
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: COBEOptions;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const [r, setR] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const globeRef = useRef<any>(null);
  const phiRef = useRef(0);
  const widthRef = useRef(0);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      setR(delta / 200);
    }
  };

  const onRender = useCallback(
    (state: Record<string, any>) => {
      if (!pointerInteracting.current) phiRef.current += 0.005;
      state.phi = phiRef.current + r;
      state.width = widthRef.current * 2;
      state.height = widthRef.current * 2;
    },
    [r],
  );

  const onResize = useCallback(() => {
    if (canvasRef.current) {
      widthRef.current = canvasRef.current.offsetWidth;
      if (globeRef.current) {
        globeRef.current.resize();
      }
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Initialize width
      widthRef.current = canvasRef.current.offsetWidth;

      // Create globe
      const globe = createGlobe(canvasRef.current, {
        ...config,
        width: widthRef.current * 2,
        height: widthRef.current * 2,
        onRender,
      });

      globeRef.current = globe;

      // Show globe after a longer delay for smooth appearance
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.style.opacity = "1";
          setIsLoaded(true);
        }
      }, 800);

      // Add resize listener
      window.addEventListener("resize", onResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", onResize);
        if (globe) {
          globe.destroy();
        }
      };
    } catch (error) {
      console.error("Globe: Error creating globe:", error);
    }
  }, [config, onRender, onResize]);

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        className={cn(
          "size-full transition-all duration-1500 ease-out [contain:layout_paint_size]",
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        ref={canvasRef}
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current,
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
        style={{
          cursor: pointerInteracting.current !== null ? "grabbing" : "grab"
        }}
      />
    </div>
  );
}
