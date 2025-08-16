import React, {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
const AnimatedGradientBackground = lazy(
  () => import("@/components/ui/animated-gradient-background"),
);
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { useNavigate } from "react-router-dom";
const Globe = lazy(() =>
  import("@/components/ui/globe").then((m) => ({ default: m.Globe })),
);

const DemoLanding: React.FC = () => {
  const [searchUrl, setSearchUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("ua");
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

  // Memoize background components to prevent re-rendering when search input changes
  const backgroundComponents = useMemo(
    () => ({
      animatedBackground: (
        <Suspense
          fallback={
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
          }
        >
          <AnimatedGradientBackground />
        </Suspense>
      ),
      globe: isClient ? (
        <div className="pointer-events-none fixed bottom-0 left-1/2 z-[1] -translate-x-1/2 aspect-square h-[400px] md:h-[600px] translate-y-32 md:translate-y-64">
          <Suspense
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full animate-pulse" />
            }
          >
            <Globe className="top-0" />
          </Suspense>
        </div>
      ) : null,
    }),
    [isClient],
  );

  return (
    <div className="relative h-screen overflow-hidden">
      {isClient ? (
        backgroundComponents.animatedBackground
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      )}

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top navbar elements */}
        <div className="container mx-auto px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Logo left */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src="/ipicklogo.png"
                  alt="ipick.io"
                  className="h-8 w-auto"
                />
              </Link>
            </div>
            {/* Top-right buttons */}
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/browse">
                <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700 px-4 sm:px-6 text-sm sm:text-base">
                  Browse<span className="hidden sm:inline"> Products</span>
                </Button>
              </Link>
              <Link to="/login">
                <Button className="rounded-full bg-black text-white hover:bg-black/90 px-4 sm:px-6 text-sm sm:text-base">
                  Customer<span className="hidden sm:inline"> portal</span>
                </Button>
              </Link>
              <Link to="/business/dashboard">
                <Button className="rounded-full bg-black text-white hover:bg-black/90 px-4 sm:px-6 text-sm sm:text-base">
                  Business<span className="hidden sm:inline"> portal</span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>

        {/* Middle-centered hero section with heading + search */}
        <section className="container mx-auto px-6 flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-sm mb-4 md:mb-8">
            Find best prices
          </h1>
          <div ref={searchBlockRef} className="w-full max-w-3xl">
            <SearchInput
              value={searchUrl}
              onChange={setSearchUrl}
              onSubmit={handleSearch}
              isLoading={isLoading}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              align="center"
              submitLabel="SEARCH"
              placeholder="Enter product URL or search for related keywords"
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
      {backgroundComponents.globe}
    </div>
  );
};

export default DemoLanding;
