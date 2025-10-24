import { Search, ArrowRight, Globe, Users, TrendingUp, Shield, Award, Zap, Star, Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";

export default function HeroSection() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch categories for dynamic dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.slice(0, 10); // Show first 10 categories
    }
  });

  // Fetch search suggestions
  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['/api/search/suggestions', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        return [];
      }
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = (query: string, category?: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    const categoryParam = category || selectedCategory;
    // Navigate to products page with search query and category
    const searchParams = new URLSearchParams();
    if (query) searchParams.set('search', query);
    if (categoryParam && categoryParam !== 'all') searchParams.set('category', categoryParam);
    window.location.href = `/products?${searchParams.toString()}`;
  };

  return (
    <div className="relative min-h-[700px] md:min-h-[800px] flex items-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating Elements */}
        <div className="absolute top-32 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-48 right-1/3 w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-32 left-1/3 w-5 h-5 bg-white/25 rounded-full animate-bounce" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 overflow-visible">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 overflow-visible">
            <div className="space-y-6">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Trusted by 10M+ Buyers Worldwide</span>
                <Star className="w-4 h-4 text-yellow-300" />
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-white">Global B2B</span>
                <br />
                <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent">
                  Marketplace
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl">
                Connect with verified suppliers worldwide. Source products, get competitive quotes, and scale your business globally with confidence.
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div className="space-y-6 relative">
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl p-3 shadow-2xl relative overflow-visible z-30" ref={searchRef}>
                  <div className="flex gap-3 relative z-20">
                    <div className="flex-1 flex items-center bg-white rounded-xl overflow-hidden shadow-lg">
                      <div className="flex items-center px-4">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <Input
                          placeholder="What are you looking for?"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(e.target.value.length >= 2);
                          }}
                          onFocus={() => {
                            setIsSearchFocused(true);
                            if (searchQuery.length >= 2) {
                              setShowSuggestions(true);
                            }
                          }}
                          onBlur={() => setIsSearchFocused(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              performSearch(searchQuery, selectedCategory);
                            }
                          }}
                          className="flex-1 border-0 focus-visible:ring-0 h-16 text-gray-900 placeholder:text-gray-500 text-lg"
                          data-testid="input-hero-search"
                        />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-48 border-0 border-l border-gray-200 rounded-none focus:ring-0 text-gray-700 bg-gray-50" data-testid="select-hero-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      size="lg" 
                      onClick={() => performSearch(searchQuery, selectedCategory)}
                      className="h-16 px-8 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700 relative z-10" 
                      data-testid="button-hero-search"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search
                    </Button>
                  </div>
                  
                  {/* Search Suggestions */}
                  {showSuggestions && searchQuery.length >= 2 && (
                    <div className="absolute top-[60px] left-0 right-0 z-[9999] shadow-2xl">
                      <Card className="bg-white border border-gray-200 shadow-2xl rounded-3xl overflow-hidden relative z-[9999]">
                        <CardContent className="p-0">
                          {isLoadingSuggestions ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-600 font-medium">Searching...</span>
                              </div>
                            </div>
                          ) : suggestions.length > 0 ? (
                            <div className="max-h-80 overflow-y-auto">
                              {/* Header */}
                              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  <Search className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-semibold text-gray-700">Search Suggestions</span>
                                  <div className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                    {suggestions.length} found
                                  </div>
                                </div>
                              </div>
                              
                              {/* Suggestions List */}
                              <div className="divide-y divide-gray-100">
                                {suggestions.map((suggestion: any, index: number) => (
                                  <div
                                    key={suggestion.id}
                                    className="group flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200"
                                    onClick={() => performSearch(suggestion.name)}
                                  >
                                    <div className="flex-shrink-0">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        suggestion.type === 'product' 
                                          ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600' 
                                          : 'bg-gradient-to-br from-green-100 to-green-200 text-green-600'
                                      }`}>
                                        {suggestion.type === 'product' ? (
                                          <Package className="w-5 h-5" />
                                        ) : (
                                          <Tag className="w-5 h-5" />
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                          {suggestion.name}
                                        </span>
                                        <div className={`text-xs px-2 py-1 rounded-full ${
                                          suggestion.type === 'product' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {suggestion.type}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="truncate">{suggestion.category}</span>
                                        {suggestion.price && (
                                          <>
                                            <span>•</span>
                                            <span className="font-semibold text-green-600">{suggestion.price}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Search className="w-4 h-4 text-gray-400" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Footer */}
                              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                                <button
                                  onClick={() => performSearch(searchQuery)}
                                  className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  View all results for "{searchQuery}"
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8" />
                              </div>
                              <p className="font-medium">No suggestions found</p>
                              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="h-14 px-8 bg-white text-blue-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 group font-semibold" data-testid="button-start-sourcing">
                  Start Sourcing
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 bg-white/10 border-white/40 text-white hover:bg-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 font-semibold" data-testid="button-contact-admin">
                  Contact Admin
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Instant Quotes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-300" />
                  <span>Trade Assurance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-300" />
                  <span>Verified Suppliers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Enhanced Stats Cards */}
          <div className="hidden lg:block space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white/15 backdrop-blur-xl border-white/30 text-white hover:bg-white/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400/30 to-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">200K+</div>
                      <div className="text-sm text-white/80 font-medium">Active Suppliers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/15 backdrop-blur-xl border-white/30 text-white hover:bg-white/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400/30 to-green-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">50M+</div>
                      <div className="text-sm text-white/80 font-medium">Products</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/15 backdrop-blur-xl border-white/30 text-white hover:bg-white/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400/30 to-purple-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Globe className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">190+</div>
                      <div className="text-sm text-white/80 font-medium">Countries</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/15 backdrop-blur-xl border-white/30 text-white hover:bg-white/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400/30 to-orange-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">10M+</div>
                      <div className="text-sm text-white/80 font-medium">Buyers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
