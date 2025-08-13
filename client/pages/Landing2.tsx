import React, { lazy, Suspense, useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { motion, stagger, useAnimate } from "motion/react";
import Floating, { FloatingElement } from "@/components/ui/parallax-floating";
import { Search } from "lucide-react";

// Real product images with actual product URLs for the animated gallery
const productImages = [
  {
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
    title: "Sony WH-1000XM4 Wireless Headphones",
    link: "https://www.amazon.com/Sony-WH-1000XM4-Canceling-Headphones-phone-call/dp/B0863TXGM3/",
    searchQuery: "Sony WH-1000XM4 wireless noise cancelling headphones",
  },
  {
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
    title: "Apple Watch Series 9",
    link: "https://www.apple.com/apple-watch-series-9/",
    searchQuery: "Apple Watch Series 9 GPS smartwatch",
  },
  {
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
    title: "Nike Air Zoom Pegasus 40",
    link: "https://www.nike.com/t/air-zoom-pegasus-40-road-running-shoes-lq7PZZ",
    searchQuery: "Nike Air Zoom Pegasus 40 running shoes",
  },
  {
    url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=2126&auto=format&fit=crop",
    title: "MacBook Air M2",
    link: "https://www.apple.com/macbook-air-m2/",
    searchQuery: "MacBook Air M2 13-inch laptop",
  },
  {
    url: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?q=80&w=1974&auto=format&fit=crop",
    title: "Canon EOS R6 Mark II",
    link: "https://www.canon.com/cameras/eos-r6-mark-ii/",
    searchQuery: "Canon EOS R6 Mark II mirrorless camera",
  },
  {
    url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=2070&auto=format&fit=crop",
    title: "iPhone 15 Pro",
    link: "https://www.apple.com/iphone-15-pro/",
    searchQuery: "iPhone 15 Pro smartphone",
  },
  {
    url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=2064&auto=format&fit=crop",
    title: "iPad Air 5th Generation",
    link: "https://www.apple.com/ipad-air/",
    searchQuery: "iPad Air 5th generation tablet",
  },
  {
    url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=2080&auto=format&fit=crop",
    title: "Ray-Ban Aviator Classic",
    link: "https://www.ray-ban.com/usa/sunglasses/RB3025%20AVIATOR%20CLASSIC%20GOLD%20FLASH%20LENS-805289602057.html",
    searchQuery: "Ray-Ban Aviator Classic sunglasses",
  },
];

const Landing2: React.FC = () => {
  const [searchUrl, setSearchUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("ua");
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const navigate = useNavigate();
  const searchBlockRef = useRef<HTMLDivElement | null>(null);
  const [overlayTop, setOverlayTop] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);
  const [scope, animate] = useAnimate();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animate images after component mounts
  useEffect(() => {
    if (isClient && scope.current) {
      animate("img", { opacity: [0, 1] }, { duration: 0.5, delay: stagger(0.15) });
    }
  }, [isClient, animate, scope]);

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

  const handleProductClick = (product: typeof productImages[0]) => {
    // Use the search query to find similar products instead of the direct link
    handleSearch(product.searchQuery);
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
    <div ref={scope} className="relative h-screen overflow-hidden bg-black">
      {/* Animated Gallery Background */}
      <Floating sensitivity={-1} className="overflow-hidden">
        <FloatingElement depth={0.5} className="top-[8%] left-[11%]">
          <div className="relative group">
            <motion.img
              initial={{ opacity: 0 }}
              src={productImages[0].url}
              alt={productImages[0].title}
              className="w-16 h-16 md:w-24 md:h-24 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredProduct(productImages[0].title)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => handleProductClick(productImages[0])}
            />
            {hoveredProduct === productImages[0].title && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-all duration-300">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(productImages[0]);
                  }}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            )}
          </div>
        </FloatingElement>

        <FloatingElement depth={1} className="top-[10%] left-[32%]">
          <div className="relative group">
            <motion.img
              initial={{ opacity: 0 }}
              src={productImages[1].url}
              alt={productImages[1].title}
              className="w-20 h-20 md:w-28 md:h-28 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredProduct(productImages[1].title)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => handleProductClick(productImages[1])}
            />
            {hoveredProduct === productImages[1].title && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-all duration-300">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(productImages[1]);
                  }}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            )}
          </div>
        </FloatingElement>

        <FloatingElement depth={2} className="top-[2%] left-[53%]">
          <div className="relative group">
            <motion.img
              initial={{ opacity: 0 }}
              src={productImages[2].url}
              alt={productImages[2].title}
              className="w-28 h-40 md:w-40 md:h-52 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredProduct(productImages[2].title)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => handleProductClick(productImages[2])}
            />
            {hoveredProduct === productImages[2].title && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-all duration-300">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(productImages[2]);
                  }}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            )}
          </div>
        </FloatingElement>

        <FloatingElement depth={1} className="top-[0%] left-[83%]">
          <div className="relative group">
            <motion.img
              initial={{ opacity: 0 }}
              src={productImages[3].url}
              alt={productImages[3].title}
              className="w-24 h-24 md:w-32 md:h-32 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredProduct(productImages[3].title)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => handleProductClick(productImages[3])}
            />
            {hoveredProduct === productImages[3].title && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-all duration-300">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(productImages[3]);
                  }}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            )}
          </div>
        </FloatingElement>

        <FloatingElement depth={1} className="top-[40%] left-[2%]">
          <div className="relative group">
            <motion.img
              initial={{ opacity: 0 }}
              src={productImages[4].url}
              alt={productImages[4].title}
              className="w-28 h-28 md:w-36 md:h-36 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredProduct(productImages[4].title)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => handleProductClick(productImages[4])}
            />
            {hoveredProduct === productImages[4].title && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-all duration-300">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(productImages[4]);
                  }}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            )}
          </div>
        </FloatingElement>

        <FloatingElement depth={2} className="top-[70%] left-[77%]">
          <div className="relative group">
            <motion.img
              initial={{ opacity: 0 }}
              src={productImages[5].url}
              alt={productImages[5].title}
              className="w-28 h-28 md:w-36 md:h-48 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredProduct(productImages[5].title)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => handleProductClick(productImages[5])}
            />
            {hoveredProduct === productImages[5].title && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-all duration-300">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(productImages[5].link);
                  }}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            )}
          </div>
        </FloatingElement>

        <FloatingElement depth={4} className="top-[73%] left-[15%]">
          <div className="relative group">
            <motion.img
              initial={{ opacity: 0 }}
              src={productImages[6].url}
              alt={productImages[6].title}
              className="w-40 md:w-52 h-full object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredProduct(productImages[6].title)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => handleProductClick(productImages[6].link)}
            />
            {hoveredProduct === productImages[6].title && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-all duration-300">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(productImages[6].link);
                  }}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            )}
          </div>
        </FloatingElement>

        <FloatingElement depth={1} className="top-[80%] left-[50%]">
          <div className="relative group">
            <motion.img
              initial={{ opacity: 0 }}
              src={productImages[7].url}
              alt={productImages[7].title}
              className="w-24 h-24 md:w-32 md:h-32 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredProduct(productImages[7].title)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => handleProductClick(productImages[7].link)}
            />
            {hoveredProduct === productImages[7].title && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-all duration-300">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(productImages[7].link);
                  }}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            )}
          </div>
        </FloatingElement>
      </Floating>

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
    </div>
  );
};

export default Landing2;
