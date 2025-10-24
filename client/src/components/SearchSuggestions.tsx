import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useSearch } from '@/contexts/SearchContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Package, Tag, TrendingUp, Clock, Star } from 'lucide-react';

export default function SearchSuggestions() {
  const { 
    searchQuery, 
    suggestions, 
    isLoadingSuggestions, 
    showSuggestions, 
    setShowSuggestions,
    performSearch 
  } = useSearch();
  
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            performSearch(suggestions[selectedIndex].name);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedIndex, performSearch, setShowSuggestions]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  if (!showSuggestions || searchQuery.length < 2) {
    return null;
  }

  const handleSuggestionClick = (suggestion: any) => {
    performSearch(suggestion.name);
  };

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2">
      <Card className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {isLoadingSuggestions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {/* Search Results Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>Search Results for "{searchQuery}"</span>
                  <Badge variant="secondary" className="ml-auto">
                    {suggestions.length} found
                  </Badge>
                </div>
              </div>

              {/* Suggestions List */}
              <div className="divide-y divide-gray-100">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.id}`}
                    ref={el => itemRefs.current[index] = el}
                    className={`px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                      selectedIndex === index ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Product/Category Image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={suggestion.image}
                          alt={suggestion.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = suggestion.type === 'product' 
                              ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop'
                              : 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100&h=100&fit=crop';
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {suggestion.name}
                          </h4>
                          <Badge 
                            variant={suggestion.type === 'product' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {suggestion.type === 'product' ? (
                              <>
                                <Package className="w-3 h-3 mr-1" />
                                Product
                              </>
                            ) : (
                              <>
                                <Tag className="w-3 h-3 mr-1" />
                                Category
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {suggestion.type === 'product' && suggestion.price && (
                            <span className="font-medium text-green-600">
                              {suggestion.price}
                            </span>
                          )}
                          {suggestion.category && (
                            <span className="truncate">
                              in {suggestion.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Indicator */}
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <Search className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Results */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => performSearch(searchQuery)}
                  className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm py-2 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 text-sm mb-4">
                Try searching for products or categories
              </p>
              <button
                onClick={() => performSearch(searchQuery)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Search anyway
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
