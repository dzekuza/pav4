import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Search, Clock, ArrowRight, Globe, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (input: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  selectedCountry?: string;
  onCountryChange?: (country: string) => void;
  align?: "left" | "center";
  submitLabel?: string;
}

const countries = [
  { code: "ua", name: "Ukraine", flag: "🇺🇦" },
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
  { code: "ve", name: "Venezuela", flag: "🇻🇪" },
];

export const SearchInput = memo(({
  value,
  onChange,
  onSubmit,
  placeholder = "Enter product URL or search for related keywords",
  isLoading = false,
  selectedCountry = "ua",
  onCountryChange,
  align = "center",
  submitLabel = "Search",
}: SearchInputProps) => {
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
        const response = await fetch("/api/location", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
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
        console.log("Failed to detect user location:", error);
        // Keep the default country if detection fails
      }
    };

    // Only detect if we haven't already detected and if onCountryChange is provided
    if (!detectedCountry && onCountryChange) {
      detectUserCountry();
    }
  }, [detectedCountry, onCountryChange, selectedCountry]);

  // Get user key for search history (IP-based simulation)
  const getUserKey = useCallback(() => {
    // In a real app, this would be the user's IP or session ID
    // For now, use a simple browser fingerprint
    return `user_${navigator.userAgent.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "")}`;
  }, []);

  // Local storage search history functions
  const getLocalSearchHistory = useCallback((): string[] => {
    if (!isLocalSearchHistoryEnabled) return [];
    try {
      const stored = localStorage.getItem("pricehunt_search_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [isLocalSearchHistoryEnabled]);

  const saveToLocalHistory = useCallback((url: string) => {
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
  }, [isLocalSearchHistoryEnabled, getLocalSearchHistory]);

  // Load search history with complete error isolation
  const loadSearchHistory = useCallback(async () => {
    // Try localStorage first (always available)
    if (isLocalSearchHistoryEnabled) {
      const localHistory = getLocalSearchHistory();
      if (localHistory.length > 0) {
        setSuggestions(localHistory);
      }
    }

    // Remote search history completely disabled - early return
    return;
  }, [isLocalSearchHistoryEnabled, getLocalSearchHistory]);

  // Save to search history with complete error isolation
  const saveToHistory = useCallback(async (url: string) => {
    if (!url) return;

    // Always try localStorage first (primary method)
    saveToLocalHistory(url);

    // Remote search history completely disabled - early return
    return;
  }, [saveToLocalHistory]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
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
  }, [value, onSubmit, saveToHistory]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    onChange(suggestion);
    onSubmit(suggestion);
    setShowSuggestions(false);
  }, [onChange, onSubmit]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
  }, [showSuggestions, suggestions, focusedIndex, handleSuggestionSelect]);

  // Load history on component mount (only if enabled)
  useEffect(() => {
    if (isLocalSearchHistoryEnabled) {
      loadSearchHistory();
    }
  }, [isLocalSearchHistoryEnabled, loadSearchHistory]);

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

  const selectedCountryData = countries.find((c) => c.code === selectedCountry);

  return (
    <div className={`relative w-full ${align === "left" ? "" : "mx-auto"}`}>
      <form onSubmit={handleSubmit}>
        {/* Main container - dark themed rounded rectangle */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-700/30 bg-gray-800/50 backdrop-blur-sm focus-within:outline-none focus-within:ring-0 [&_*:focus-visible]:ring-0 [&_*:focus-visible]:ring-offset-0">
          <div className="relative flex w-full flex-col gap-3 p-4">
            {/* Search input field - at the top */}
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => {
                  if (isLocalSearchHistoryEnabled && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="h-12 rounded-xl border-gray-600/30 bg-gray-700/30 px-4 text-base text-gray-300 placeholder:text-gray-500 focus-visible:ring-0 focus:border-gray-500/50"
                disabled={isLoading}
              />
            </div>

            {/* Bottom row - Country selector and Submit button */}
            <div className="flex items-center justify-between gap-3">
              {/* Country selector */}
              <div className="flex items-center">
                <Popover
                  open={openCountrySelect}
                  onOpenChange={setOpenCountrySelect}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      role="combobox"
                      aria-expanded={openCountrySelect}
                      className="h-10 px-3 rounded-xl bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 focus-visible:ring-0 focus-visible:ring-offset-0 border border-gray-600/30"
                    >
                      <span className="text-lg mr-2">
                        {selectedCountryData?.flag}
                      </span>
                      <span className="text-sm font-medium">
                        Country
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 border-gray-700/50 bg-gray-800/90 backdrop-blur-md">
                    <Command>
                      <CommandInput placeholder="Search country..." className="text-gray-300" />
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
                              className="text-gray-300 hover:bg-gray-700/50"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xl">
                                  {country.flag}
                                </span>
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

              {/* Submit button - square with arrow icon */}
              <div className="flex items-center">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading}
                  variant="ghost"
                  className="h-10 w-10 rounded-xl bg-gray-700/50 text-white border border-gray-600/30 hover:bg-gray-600/50 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                  ) : (
                    <ExternalLink className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isLocalSearchHistoryEnabled &&
        showSuggestions &&
        suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto rounded-xl border border-gray-700/50 bg-gray-800/90 backdrop-blur-md shadow-xl"
          >
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                Recent searches
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700/50 transition-colors ${
                    index === focusedIndex ? "bg-gray-700/50" : ""
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
});

SearchInput.displayName = "SearchInput";
