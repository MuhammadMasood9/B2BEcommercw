import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLoading } from "@/contexts/LoadingContext";
import type { Product, Category } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Search, 
  Filter,
  Grid3X3,
  List,
  Star,
  Shield,
  Clock,
  Globe,
  TrendingUp,
  Zap
} from "lucide-react";
import { Link } from "wouter";

export default function Products() {
  const { setLoading } = useLoading();
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [moqRange, setMoqRange] = useState([0, 10000]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("best-match");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  
  // B2B specific filters
  const [verifiedAdminsOnly, setVerifiedAdminsOnly] = useState(false);
  const [tradeAssuranceOnly, setTradeAssuranceOnly] = useState(false);
  const [readyToShipOnly, setReadyToShipOnly] = useState(false);

  // Fetch products from API
  const { data: apiProducts = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/products", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });

  // Fetch categories from API
  const { data: apiCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/categories", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
  });

  useEffect(() => {
    setLoading(isProductsLoading, "Loading products...");
  }, [isProductsLoading, setLoading]);

  // Filter products based on search and filters
  const filteredProducts = apiProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    const productPrice = (product as any).minPrice || (product as any).price || 0;
    const productMaxPrice = (product as any).maxPrice || (product as any).price || 1000;
    const matchesPrice = productPrice >= priceRange[0] && productMaxPrice <= priceRange[1];
    const productMoq = (product as any).moq || 1;
    const matchesMoq = productMoq >= moqRange[0] && productMoq <= moqRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice && matchesMoq;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return ((a as any).minPrice || (a as any).price || 0) - ((b as any).minPrice || (b as any).price || 0);
      case "price-high":
        return ((b as any).minPrice || (b as any).price || 0) - ((a as any).minPrice || (a as any).price || 0);
      case "newest":
        return new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime();
      case "rating":
        return ((b as any).rating || 0) - ((a as any).rating || 0);
      default:
        return 0;
    }
  });

  const transformProductForCard = (product: Product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: (product as any).minPrice || (product as any).price || 0,
    maxPrice: (product as any).maxPrice || (product as any).price || 1000,
    priceRange: `${(product as any).minPrice || (product as any).price || 0} - ${(product as any).maxPrice || (product as any).price || 1000}`,
    image: (product as any).images?.[0] || '/placeholder-product.jpg',
    rating: (product as any).rating || 0,
    reviewCount: (product as any).reviewCount || 0,
    supplier: (product as any).supplierName || 'Admin Supplier',
    supplierName: (product as any).supplierName || 'Admin Supplier',
    supplierCountry: (product as any).supplierCountry || 'Global',
    moq: (product as any).moq || 1,
    isVerified: true,
    isTradeAssurance: true,
    responseTime: '24h',
    responseRate: '99%',
    views: (product as any).views || 0,
    inquiries: (product as any).inquiries || 0
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>Discover Products</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Products
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Browse thousands of verified products from trusted admins worldwide
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl p-3 shadow-2xl">
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-white rounded-xl overflow-hidden shadow-lg">
                    <div className="flex items-center px-4">
                      <Search className="w-5 h-5 text-gray-400 mr-3" />
            <Input
                        placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border-0 focus-visible:ring-0 h-14 text-gray-900 placeholder:text-gray-500 text-lg"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48 border-0 border-l border-gray-200 rounded-none focus:ring-0 text-gray-700 bg-gray-50">
                        <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
                        {apiCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
                  </div>
                  <Button size="lg" className="h-14 px-8 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Admins</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>24h Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Shipping</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters and Controls */}
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Price Range</Label>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={1000}
            step={10}
                          className="mt-2"
          />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}</span>
                        </div>
          </div>
                      
                      <div>
                        <Label className="text-sm font-medium">MOQ Range</Label>
            <Slider
              value={moqRange}
              onValueChange={setMoqRange}
              max={10000}
              step={100}
                          className="mt-2"
            />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>{moqRange[0]}</span>
                          <span>{moqRange[1]}</span>
                        </div>
            </div>

                      <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
                            id="verified" 
                            checked={verifiedAdminsOnly}
                            onCheckedChange={(checked) => setVerifiedAdminsOnly(checked === true)}
                          />
                          <Label htmlFor="verified" className="text-sm">Verified Admins Only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="trade-assurance" 
              checked={tradeAssuranceOnly}
              onCheckedChange={(checked) => setTradeAssuranceOnly(checked === true)}
            />
                          <Label htmlFor="trade-assurance" className="text-sm">Trade Assurance</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
                            id="ready-ship" 
              checked={readyToShipOnly}
              onCheckedChange={(checked) => setReadyToShipOnly(checked === true)}
            />
                          <Label htmlFor="ready-ship" className="text-sm">Ready to Ship</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:block lg:w-64">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">Price Range</Label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000}
                      step={10}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">MOQ Range</Label>
                    <Slider
                      value={moqRange}
                      onValueChange={setMoqRange}
                      max={10000}
                      step={100}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>{moqRange[0]}</span>
                      <span>{moqRange[1]}</span>
                    </div>
          </div>
          
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="verified-desktop" 
                        checked={verifiedAdminsOnly}
                        onCheckedChange={(checked) => setVerifiedAdminsOnly(checked === true)}
                      />
                      <Label htmlFor="verified-desktop" className="text-sm">Verified Admins Only</Label>
                    </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
                        id="trade-assurance-desktop" 
                        checked={tradeAssuranceOnly}
                        onCheckedChange={(checked) => setTradeAssuranceOnly(checked === true)}
                      />
                      <Label htmlFor="trade-assurance-desktop" className="text-sm">Trade Assurance</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
                        id="ready-ship-desktop" 
                        checked={readyToShipOnly}
                        onCheckedChange={(checked) => setReadyToShipOnly(checked === true)}
                      />
                      <Label htmlFor="ready-ship-desktop" className="text-sm">Ready to Ship</Label>
                    </div>
          </div>
        </CardContent>
      </Card>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {sortedProducts.length} Products Found
                  </h2>
                  <p className="text-gray-600">
                    Showing results for "{searchQuery || 'all products'}"
                      </p>
                    </div>
                    
                <div className="flex items-center gap-4">
                  {/* Sort */}
                      <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="best-match">Best Match</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      </SelectContent>
                    </Select>
                      
                  {/* View Mode */}
                  <div className="flex border rounded-lg">
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

              {/* Products Grid */}
              {isProductsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-[4/3] bg-gray-200 rounded-t-lg" />
                      <CardContent className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <div className={`grid gap-6 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                }`}>
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id} {...transformProductForCard(product)} />
                ))}
              </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setPriceRange([0, 1000]);
                    setMoqRange([0, 10000]);
                  }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}