import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdvancedProductFilters, { ProductFilters } from "@/components/buyer/AdvancedProductFilters";
import ProductGrid from "@/components/buyer/ProductGrid";
import SearchBar from "@/components/buyer/SearchBar";
import SavedSearches from "@/components/buyer/SavedSearches";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Filter, 
  TrendingUp, 
  Zap, 
  Shield, 
  Globe, 
  Clock,
  Sparkles,
  ArrowRight,
  Settings,
  LayoutGrid
} from "lucide-react";

const defaultFilters: ProductFilters = {
  search: "",
  categoryId: "all",
  priceRange: [0, 10000],
  moqRange: [1, 50000],
  supplierCountries: [],
  supplierTypes: [],
  verifiedOnly: false,
  tradeAssuranceOnly: false,
  readyToShipOnly: false,
  sampleAvailableOnly: false,
  customizationAvailableOnly: false,
  certifications: [],
  paymentTerms: [],
  leadTimeRange: "all",
  minRating: 0,
  inStockOnly: false,
};

export default function ProductDiscovery() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load initial filters from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const categoryParam = urlParams.get('category');
    
    if (searchParam || categoryParam) {
      setFilters(prev => ({
        ...prev,
        search: searchParam || "",
        categoryId: categoryParam || "all"
      }));
    }
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;
    
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.categoryId !== 'all') params.set('category', newFilters.categoryId);
    
    const newUrl = params.toString() ? `/buyer/products?${params.toString()}` : '/buyer/products';
    window.history.replaceState({}, '', newUrl);
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
    saveRecentSearch(query);
  };

  const handleProductAction = (productId: string, action: string) => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to perform this action.",
        variant: "destructive",
      });
      return;
    }

    switch (action) {
      case "addToCart":
        // Handle add to cart logic
        toast({
          title: "Added to Cart",
          description: "Product has been added to your cart.",
        });
        break;
      case "contact":
        // Navigate to chat with supplier
        setLocation(`/messages?productId=${productId}&chatType=product`);
        break;
      case "quote":
        // Handle quote request
        toast({
          title: "Quote Requested",
          description: "Your quote request has been sent to the supplier.",
        });
        break;
      case "sample":
        // Handle sample request
        toast({
          title: "Sample Requested",
          description: "Your sample request has been sent to the supplier.",
        });
        break;
      case "favorite":
        // Handle favorite toggle
        toast({
          title: "Favorites Updated",
          description: "Product has been added to your favorites.",
        });
        break;
      case "share":
        // Handle share
        if (navigator.share) {
          navigator.share({
            title: "Check out this product",
            url: `${window.location.origin}/product/${productId}`
          });
        } else {
          navigator.clipboard.writeText(`${window.location.origin}/product/${productId}`);
          toast({
            title: "Link Copied",
            description: "Product link has been copied to clipboard.",
          });
        }
        break;
    }
  };

  const handleSaveSearch = (name: string, searchFilters: ProductFilters) => {
    // This would typically save to backend
    toast({
      title: "Search Saved",
      description: `"${name}" has been saved to your searches.`,
    });
  };

  const handleLoadSavedSearch = (searchFilters: ProductFilters) => {
    setFilters(searchFilters);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Enhanced Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-8">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>Advanced Product Discovery</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                B2B Products
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Discover thousands of verified products from trusted suppliers worldwide with advanced filtering and real-time search
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-3xl mx-auto">
              <SearchBar
                value={filters.search}
                onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                onSearch={handleSearch}
                recentSearches={recentSearches}
                onRecentSearchClick={handleSearch}
                onClearRecentSearches={clearRecentSearches}
                placeholder="Search products, suppliers, categories..."
              />
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>10,000+ Verified Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>24h Response Time</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Suppliers</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-300" />
                <span>Real-time Search</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="space-y-6 sticky top-8">
                <AdvancedProductFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onSaveSearch={handleSaveSearch}
                  onLoadSavedSearch={handleLoadSavedSearch}
                />
                
                {user && (
                  <SavedSearches
                    currentFilters={filters}
                    onLoadSearch={handleLoadSavedSearch}
                    onSaveSearch={handleSaveSearch}
                  />
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden mb-6">
                <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters & Search Options
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <div className="space-y-6">
                      <AdvancedProductFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onSaveSearch={handleSaveSearch}
                        onLoadSavedSearch={handleLoadSavedSearch}
                      />
                      
                      {user && (
                        <SavedSearches
                          currentFilters={filters}
                          onLoadSearch={handleLoadSavedSearch}
                          onSaveSearch={handleSaveSearch}
                        />
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Quick Filter Pills */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={filters.verifiedOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                    className="h-8"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Verified Only
                  </Button>
                  <Button
                    variant={filters.tradeAssuranceOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, tradeAssuranceOnly: !prev.tradeAssuranceOnly }))}
                    className="h-8"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Trade Assurance
                  </Button>
                  <Button
                    variant={filters.readyToShipOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, readyToShipOnly: !prev.readyToShipOnly }))}
                    className="h-8"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Ready to Ship
                  </Button>
                  <Button
                    variant={filters.sampleAvailableOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, sampleAvailableOnly: !prev.sampleAvailableOnly }))}
                    className="h-8"
                  >
                    <LayoutGrid className="w-3 h-3 mr-1" />
                    Sample Available
                  </Button>
                </div>
              </div>

              {/* Product Grid */}
              <ProductGrid
                filters={filters}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onProductAction={handleProductAction}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}