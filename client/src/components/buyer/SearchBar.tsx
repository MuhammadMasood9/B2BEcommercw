import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  Star,
  Package,
  Filter,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "product" | "category" | "supplier" | "recent";
  count?: number;
  category?: string;
  image?: string;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  onClearRecentSearches?: () => void;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search products, suppliers, or categories...",
  showSuggestions = true,
  recentSearches = [],
  onRecentSearchClick,
  onClearRecentSearches,
  className
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch trending searches
  const { data: trendingSearches = [] } = useQuery<string[]>({
    queryKey: ["/api/search/trending"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/search/trending", { credentials: "include" });
        if (response.ok) {
          return response.json();
        }
        return [];
      } catch (error) {
        console.error("Error fetching trending searches:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch search suggestions
  useEffect(() => {
    if (value.length >= 2 && showSuggestions) {
      setIsLoadingSuggestions(true);
      
      const fetchSuggestions = async () => {
        try {
          const response = await fetch(
            `/api/search/suggestions?q=${encodeURIComponent(value)}&limit=8`,
            { credentials: "include" }
          );
          
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      };

      const debounceTimer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
    }
  }, [value, showSuggestions]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSearch(suggestion.text);
    setIsOpen(false);
  };

  const handleRecentSearchClick = (search: string) => {
    onChange(search);
    onSearch(search);
    onRecentSearchClick?.(search);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package className="w-4 h-4 text-blue-500" />;
      case "category":
        return <Filter className="w-4 h-4 text-green-500" />;
      case "supplier":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "recent":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const showDropdown = isOpen && (
    value.length >= 2 || 
    recentSearches.length > 0 || 
    trendingSearches.length > 0
  );

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="pl-10 pr-20 h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 shadow-xl border-2 border-gray-100">
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {/* Loading State */}
            {isLoadingSuggestions && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Searching...</span>
              </div>
            )}

            {/* Search Suggestions */}
            {!isLoadingSuggestions && suggestions.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Suggestions
                  </h4>
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                  >
                    {suggestion.image ? (
                      <img
                        src={suggestion.image}
                        alt=""
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      getSuggestionIcon(suggestion.type)
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.text}
                        </span>
                        {suggestion.type !== "recent" && (
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.type}
                          </Badge>
                        )}
                      </div>
                      {suggestion.category && (
                        <p className="text-xs text-gray-500 truncate">
                          in {suggestion.category}
                        </p>
                      )}
                    </div>
                    {suggestion.count && (
                      <span className="text-xs text-gray-400">
                        {suggestion.count} results
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Recent Searches
                  </h4>
                  {onClearRecentSearches && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearRecentSearches}
                      className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 truncate">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Trending Searches */}
            {trendingSearches.length > 0 && value.length < 2 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Trending Searches
                  </h4>
                </div>
                {trendingSearches.slice(0, 6).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                  >
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-700 truncate">{search}</span>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoadingSuggestions && 
             value.length >= 2 && 
             suggestions.length === 0 && 
             recentSearches.length === 0 && (
              <div className="px-4 py-6 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No suggestions found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching for products, categories, or suppliers
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}