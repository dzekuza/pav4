import React, { useEffect, useRef, useState } from "react";
import HeroWave from "@/components/ui/dynamic-wave-canvas-background";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { useNavigate } from "react-router-dom";
import { Globe } from "@/components/ui/globe";

const DemoLanding: React.FC = () => {
  const [searchUrl, setSearchUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("de");
  const navigate = useNavigate();
  const searchBlockRef = useRef<HTMLDivElement | null>(null);
  const [overlayTop, setOverlayTop] = useState<number>(0);

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
      // We want the gradient to start a little below the search input
      const offset = 24; // 24px spacing
      setOverlayTop(rect.bottom + window.scrollY + offset);
    };
    updateOverlayTop();
    window.addEventListener("resize", updateOverlayTop);
    window.addEventListener("scroll", updateOverlayTop);
    return () => {
      window.removeEventListener("resize", updateOverlayTop);
      window.removeEventListener("scroll", updateOverlayTop);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroWave />

      {/* Content overlay */}
      <div className="relative z-10">
        {/* Top navbar elements */}
        {/* Logo left */}
        <div className="absolute left-6 top-6">
          <Link to="/">
            <img src="/ipicklogo.png" alt="ipick.io" className="h-8 w-auto" />
          </Link>
        </div>
        {/* Top-right buttons */}
        <div className="absolute right-4 sm:right-6 top-4 sm:top-6 flex items-center gap-2 sm:gap-4">
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
        </div>

        {/* Middle-centered hero section with heading + search */}
        <section className="container mx-auto px-6 min-h-screen flex flex-col items-center justify-center text-center">
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
            "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1))",
        }}
      />

      {/* Globe fixed to bottom as last element (fill container, centered) */}
      <div className="pointer-events-none fixed -bottom-36 md:-bottom-64 left-1/2 z-0 -translate-x-1/2 aspect-square h-[420px] md:h-[680px]">
        <Globe className="top-0" />
      </div>
    </div>
  );
};

export default DemoLanding;


