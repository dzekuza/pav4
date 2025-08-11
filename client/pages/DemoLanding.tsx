import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
const HeroWave = lazy(() => import("@/components/ui/dynamic-wave-canvas-background"));
import HeroWaveFallback from "@/components/ui/hero-wave-fallback";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { useNavigate } from "react-router-dom";
const Globe = lazy(() => import("@/components/ui/globe").then(m => ({ default: m.Globe })));

const DemoLanding: React.FC = () => {
  const [searchUrl, setSearchUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("de");
  const navigate = useNavigate();
  const searchBlockRef = useRef<HTMLDivElement | null>(null);
  const [overlayTop, setOverlayTop] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = (input: string) => {
    if (!input.trim()) return;
    setIsLoading(true);
    const requestId = Date.now().toString();
    const searchQuery = "product-search";
    const resultsUrl = `/new-search/${requestId}/${searchQuery}`;
    navigate(resultsUrl, {
      state: {
        searchUrl: input.trim(),
        userCountry: selectedCountry,
        gl: selectedCountry,
        requestId,
      },
    });
  };

  // Position the gradient to start right after the search input block
  useEffect(() => {
    const updateOverlayTop = () => {
      if (!searchBlockRef.current) return;
      const rect = searchBlockRef.current.getBoundingClientRect();
      const offset = 150; // Increased offset to create better fade over globe
      setOverlayTop(rect.bottom + window.scrollY + offset);
    };

    let rafId = 0;
    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateOverlayTop();
        rafId = 0;
      });
    };

    updateOverlayTop();
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    return () => {
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {isClient ? (
        <Suspense fallback={<HeroWaveFallback />}>
          <HeroWave />
        </Suspense>
      ) : (
        <HeroWaveFallback />
      )}

      {/* Content overlay */}
      <div className="relative z-10">
        {/* Top navbar elements */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo left */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/ipicklogo.png" alt="ipick.io" className="h-8 w-auto" />
              </Link>
            </div>
            {/* Top-right buttons */}
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/login">
                <Button className="rounded-full bg-black text-white hover:bg-black/90 px-4 sm:px-6 text-sm sm:text-base">
                  Customer<span className="hidden sm:inline"> portal</span>
                </Button>
              </Link>
              <Link to="/business/dashboard">
                <Button
                  variant="outline"
                  className="rounded-full bg-white text-black border border-black/10 hover:bg-white/90 hover:text-black px-4 sm:px-6 text-sm sm:text-base"
                >
                  Business<span className="hidden sm:inline"> portal</span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>

        {/* Middle-centered hero section with heading + search */}
        <section className="container mx-auto px-6 min-h-screen flex flex-col items-center justify-start text-center pt-32 md:pt-40">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-sm">
            Find best prices
          </h1>
          <div ref={searchBlockRef} className="mt-8 w-full max-w-3xl">
            <SearchInput
              value={searchUrl}
              onChange={setSearchUrl}
              onSubmit={handleSearch}
              isLoading={isLoading}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              align="center"
              submitLabel="SEARCH"
              placeholder="Paste a product URL"
            />
          </div>
        </section>
      </div>

      {/* Gradient overlay from just below search to page bottom */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[5]"
        style={{
          top: overlayTop,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.6))",
        }}
      />

      {/* Globe fixed to bottom as last element (fill container, centered) */}
      {isClient && (
        <div className="pointer-events-none fixed bottom-0 left-1/2 z-[1] -translate-x-1/2 aspect-square h-[500px] md:h-[700px] translate-y-96">
          <Suspense fallback={
            <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full animate-pulse" />
          }>
            <Globe className="top-0" />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default DemoLanding;


