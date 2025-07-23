import { useState, useEffect, useRef } from "react";
import { Search, Clock, ArrowRight, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (url: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  selectedCountry?: string;
  onCountryChange?: (country: string) => void;
  align?: 'left' | 'center';
}

const countries = [
  { code: "us", name: "United States", flag: "🇺🇸" },
  { code: "de", name: "Germany", flag: "🇩🇪" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { code: "lt", name: "Lithuania", flag: "🇱🇹" },
  { code: "lv", name: "Latvia", flag: "🇱🇻" },
  { code: "ee", name: "Estonia", flag: "🇪🇪" },
  { code: "fr", name: "France", flag: "🇫🇷" },
  { code: "es", name: "Spain", flag: "🇪🇸" },
  { code: "it", name: "Italy", flag: "🇮🇹" },
  { code: "pl", name: "Poland", flag: "🇵🇱" },
  { code: "cz", name: "Czech Republic", flag: "🇨🇿" },
  { code: "sk", name: "Slovakia", flag: "🇸🇰" },
  { code: "hu", name: "Hungary", flag: "🇭🇺" },
  { code: "ro", name: "Romania", flag: "🇷🇴" },
  { code: "bg", name: "Bulgaria", flag: "🇧🇬" },
  { code: "hr", name: "Croatia", flag: "🇭🇷" },
  { code: "si", name: "Slovenia", flag: "🇸🇮" },
  { code: "at", name: "Austria", flag: "🇦🇹" },
  { code: "be", name: "Belgium", flag: "🇧🇪" },
  { code: "nl", name: "Netherlands", flag: "🇳🇱" },
  { code: "dk", name: "Denmark", flag: "🇩🇰" },
  { code: "se", name: "Sweden", flag: "🇸🇪" },
  { code: "no", name: "Norway", flag: "🇳🇴" },
  { code: "fi", name: "Finland", flag: "🇫🇮" },
  { code: "is", name: "Iceland", flag: "🇮🇸" },
  { code: "ie", name: "Ireland", flag: "🇮🇪" },
  { code: "pt", name: "Portugal", flag: "🇵🇹" },
  { code: "gr", name: "Greece", flag: "🇬🇷" },
  { code: "cy", name: "Cyprus", flag: "🇨🇾" },
  { code: "mt", name: "Malta", flag: "🇲🇹" },
  { code: "lu", name: "Luxembourg", flag: "🇱🇺" },
  { code: "ae", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "ai", name: "Anguilla", flag: "🇦🇮" },
  { code: "ar", name: "Argentina", flag: "🇦🇷" },
  { code: "au", name: "Australia", flag: "🇦🇺" },
  { code: "bm", name: "Bermuda", flag: "🇧🇲" },
  { code: "br", name: "Brazil", flag: "🇧🇷" },
  { code: "ca", name: "Canada", flag: "🇨🇦" },
  { code: "cl", name: "Chile", flag: "🇨🇱" },
  { code: "co", name: "Colombia", flag: "🇨🇴" },
  { code: "cr", name: "Costa Rica", flag: "🇨🇷" },
  { code: "do", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "ec", name: "Ecuador", flag: "🇪🇨" },
  { code: "sv", name: "El Salvador", flag: "🇸🇻" },
  { code: "gt", name: "Guatemala", flag: "🇬🇹" },
  { code: "hn", name: "Honduras", flag: "🇭🇳" },
  { code: "mx", name: "Mexico", flag: "🇲🇽" },
  { code: "ni", name: "Nicaragua", flag: "🇳🇮" },
  { code: "pa", name: "Panama", flag: "🇵🇦" },
  { code: "py", name: "Paraguay", flag: "🇵🇾" },
  { code: "pe", name: "Peru", flag: "🇵🇪" },
  { code: "uy", name: "Uruguay", flag: "🇺🇾" },
  { code: "ve", name: "Venezuela", flag: "🇻🇪" }
];

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Paste any product URL (e.g., https://amazon.com/product/...)",
  isLoading = false,
  selectedCountry = "de",
  onCountryChange,
  align = "center",
}: SearchInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openCountrySelect, setOpenCountrySelect] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Completely disable remote search history to prevent fetch errors
  const isRemoteSearchHistoryEnabled = false; // Disabled due to CORS/network issues in production

  // Use localStorage for basic search history (always enabled)
  const isLocalSearchHistoryEnabled =
    typeof window !== "undefined" && typeof localStorage !== "undefined";

  // Auto-detect user's country on component mount
  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        const response = await fetch('/api/location', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.location && data.location.countryCode) {
            const countryCode = data.location.countryCode.toLowerCase();
            setDetectedCountry(countryCode);
            
            // Only update the country if no country is currently selected or if it's different
            if (!selectedCountry || selectedCountry !== countryCode) {
              onCountryChange?.(countryCode);
            }
          }
        }
      } catch (error) {
        console.log('Failed to detect user location:', error);
        // Keep the default country if detection fails
      }
    };

    // Only detect if we haven't already detected and if onCountryChange is provided
    if (!detectedCountry && onCountryChange) {
      detectUserCountry();
    }
  }, [detectedCountry, onCountryChange, selectedCountry]);

  // Get user key for search history (IP-based simulation)
  const getUserKey = () => {
    // In a real app, this would be the user's IP or session ID
    // For now, use a simple browser fingerprint
    return `user_${navigator.userAgent.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "")}`;
  };

  // Local storage search history functions
  const getLocalSearchHistory = (): string[] => {
    if (!isLocalSearchHistoryEnabled) return [];
    try {
      const stored = localStorage.getItem("pricehunt_search_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveToLocalHistory = (url: string) => {
    if (!isLocalSearchHistoryEnabled || !url) return;
    try {
      const history = getLocalSearchHistory();
      const newHistory = [url, ...history.filter((h) => h !== url)].slice(
        0,
        10,
      ); // Keep last 10
      localStorage.setItem(
        "pricehunt_search_history",
        JSON.stringify(newHistory),
      );
      setSuggestions(newHistory);
    } catch {
      // Silent fail
    }
  };

  // Load search history with complete error isolation
  const loadSearchHistory = async () => {
    // Try localStorage first (always available)
    if (isLocalSearchHistoryEnabled) {
      const localHistory = getLocalSearchHistory();
      if (localHistory.length > 0) {
        setSuggestions(localHistory);
      }
    }

    // Remote search history completely disabled - early return
    return;
  };

  // Save to search history with complete error isolation
  const saveToHistory = async (url: string) => {
    if (!url) return;

    // Always try localStorage first (primary method)
    saveToLocalHistory(url);

    // Remote search history completely disabled - early return
    return;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    // Process the main submission first
    const trimmedValue = value.trim();
    onSubmit(trimmedValue);
    setShowSuggestions(false);

    // Save to history in completely isolated way that can never affect main flow
    try {
      saveToHistory(trimmedValue);
    } catch {
      // Completely silent - should never happen but just in case
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    onSubmit(suggestion);
    setShowSuggestions(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (focusedIndex >= 0) {
          e.preventDefault();
          handleSuggestionSelect(suggestions[focusedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Load history on component mount (only if enabled)
  useEffect(() => {
    if (isLocalSearchHistoryEnabled) {
      loadSearchHistory();
    }
  }, [isLocalSearchHistoryEnabled]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCountryData = countries.find(c => c.code === selectedCountry);

  return (
    <div className={`relative w-full ${align === 'left' ? '' : 'mx-auto'}`}>
      <form onSubmit={handleSubmit}>
        <div className="p-2 bg-background border rounded-xl shadow-lg">
          <div className="flex flex-row gap-3 w-full">
            {/* Searchable Country Selector */}
            <div className="flex-shrink-0 w-28">
              <Popover open={openCountrySelect} onOpenChange={setOpenCountrySelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCountrySelect}
                    className="w-full h-12 justify-between border-0 focus-visible:ring-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedCountryData?.flag}</span>
                      <span className="text-sm font-medium">{selectedCountryData?.code}</span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            key={country.code}
                            value={`${country.name} ${country.code}`}
                            onSelect={() => {
                              onCountryChange?.(country.code);
                              setOpenCountrySelect(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{country.flag}</span>
                              <span>{country.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="url"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => {
                  if (isLocalSearchHistoryEnabled && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="pl-10 border-0 focus-visible:ring-0 h-12 text-base"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="bg-brand-gradient hover:bg-brand-gradient-reverse transition-all duration-300 h-12 px-8 w-full mt-3 sm:mt-0 sm:w-auto sm:ml-3 sm:inline-block"
          >
            {isLoading ? "Searching..." : "Compare Prices"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isLocalSearchHistoryEnabled &&
        showSuggestions &&
        suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Recent searches
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                    index === focusedIndex
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }`}
                >
                  <div className="truncate">{suggestion}</div>
                </button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
