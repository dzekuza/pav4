import { useState, useEffect, useRef } from "react";
import { Search, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (url: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Paste any product URL (e.g., https://amazon.com/product/...)",
  isLoading = false,
}: SearchInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Completely disable remote search history to prevent fetch errors
  const isRemoteSearchHistoryEnabled = false; // Disabled due to CORS/network issues in production

  // Use localStorage for basic search history (always enabled)
  const isLocalSearchHistoryEnabled =
    typeof window !== "undefined" && typeof localStorage !== "undefined";

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

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3 p-2 bg-background border rounded-xl shadow-lg">
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
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="bg-brand-gradient hover:bg-brand-gradient-reverse transition-all duration-300 h-12 px-8"
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
