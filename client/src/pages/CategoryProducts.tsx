import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  SlidersHorizontal, 
  Search, 
  X, 
  Loader2, 
  Package as PackageIcon,
  Globe,
  Shield,
  TrendingUp,
  Filter,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useLoading } from "@/contexts/LoadingContext";
import type { Product, Category } from "@shared/schema";

export default function CategoryProducts() {
  const { setLoading } = useLoading();
  const [searchQuery, setSearchQuery] = useState("");
  const [, params] = useRoute("/category/:slug");
  const categorySlug = params?.slug || "electronics";
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [verifiedAdminsOnly, setVerifiedAdminsOnly] = useState(false);
  const [tradeAssurance, setTradeAssurance] = useState(false);

  // Fetch categories to get the category by slug with comprehensive data
  const { data: categories = [] } = useQuery({
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
        console.log("Fetched categories for CategoryProducts:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
  });

  // Find the category by slug
  const currentCategory = categories.find(cat => cat.slug === categorySlug);
  const categoryId = currentCategory?.id;
  const categoryName = currentCategory?.name || categorySlug;
  
  // Get subcategories for this category
  const subcategories = categories.filter(cat => cat.parentId === categoryId);
  
  // Get category stats
  const productCount = currentCategory?.productCount || 0;
  const subcategoryCount = currentCategory?.subcategoryCount || 0;
  const totalViews = currentCategory?.totalViews || 0;
  const trend = currentCategory?.trend || 'low';

  // Fetch products for this category with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery<Product[]>({
    queryKey: ["/api/products", "category", categoryId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!categoryId) return [];
      try {
        const limit = 20;
        const response = await fetch(`/api/products?categoryId=${categoryId}&limit=${limit}&offset=${pageParam}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length === 0 || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    enabled: !!categoryId,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const products = data?.pages.flat() || [];

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const productPrice = (product as any).price || (product as any).minPrice || 0;
    const matchesPrice = (!priceRange.min || productPrice >= parseFloat(priceRange.min)) &&
                        (!priceRange.max || productPrice <= parseFloat(priceRange.max));
    return matchesSearch && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = (a as any).price || (a as any).minPrice || 0;
    const priceB = (b as any).price || (b as any).minPrice || 0;
    switch (sortBy) {
      case 'price-low':
        return priceA - priceB;
      case 'price-high':
        return priceB - priceA;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  // Transform product data for ProductCard
  const transformProductForCard = (product: Product) => {
    // Parse price ranges from product data
    let priceRanges = [];
    if (product.priceRanges) {
      try {
        priceRanges = typeof product.priceRanges === 'string' 
          ? JSON.parse(product.priceRanges) 
          : product.priceRanges;
      } catch (error) {
        console.error('Error parsing priceRanges:', error);
        priceRanges = [];
      }
    }
    const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const priceRange = priceRanges.length > 0 
      ? `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
      : 'Contact for price';
    
    // Get images
    let images = [];
    if (product.images) {
      try {
        images = Array.isArray(product.images) 
          ? product.images 
          : (typeof product.images === 'string' ? JSON.parse(product.images) : []);
      } catch (error) {
        console.error('Error parsing images:', error);
        images = [];
      }
    }
    const firstImage = images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';
    
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      priceRange,
      image: firstImage,
      moq: product.minOrderQuantity || 1,
      supplierName: 'Admin Supplier',
      supplierCountry: 'USA',
      supplierType: 'manufacturer',
      responseRate: '100%',
      responseTime: '< 2h',
      verified: true,
      tradeAssurance: product.hasTradeAssurance || true,
      readyToShip: product.inStock || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: product.certifications || ['ISO 9001', 'CE Mark'],
      rating: (product as any).rating || 4.8,
      reviews: (product as any).reviews || Math.floor(Math.random() * 100) + 50,
      views: (product as any).views || Math.floor(Math.random() * 1000) + 100,
      inquiries: (product as any).inquiries || Math.floor(Math.random() * 50) + 10,
      leadTime: product.leadTime || '7-15 days',
      port: product.port || 'Los Angeles, USA',
      paymentTerms: product.paymentTerms || ['T/T', 'L/C', 'PayPal'],
      inStock: product.inStock || true,
      stockQuantity: product.stockQuantity || Math.floor(Math.random() * 1000) + 100,
      onContact: () => {
        // Navigate to product-specific chat
        window.location.href = `/messages?productId=${product.id}&productName=${encodeURIComponent(product.name)}&chatType=product`;
      },
      onQuote: () => console.log('Request quote for product:', product.id),
      onSample: () => console.log('Request sample for product:', product.id)
    };
  };

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Infinite scroll setup
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-primary/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/25 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/15 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <PackageIcon className="w-4 h-4" />
              <span>{categoryName}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {categoryName}
              <span className="bg-gradient-to-r from-primary/80 via-white to-primary/80 bg-clip-text text-transparent block">
                Products
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Discover quality products from verified admins worldwide
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl p-3 shadow-2xl">
                <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-lg">
                  <Search className="w-5 h-5 text-gray-400 ml-4 mr-3" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0 h-14 text-gray-900 placeholder:text-gray-500 text-lg"
                  />
                  <Button 
                    size="lg" 
                    onClick={() => {
                      const searchParams = new URLSearchParams();
                      if (searchQuery) searchParams.set('search', searchQuery);
                      searchParams.set('category', categoryId || '');
                      window.location.href = `/products?${searchParams.toString()}`;
                    }}
                    className="m-1 h-12 px-8 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>{productCount} Products</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-yellow-300" />
                <span>{subcategoryCount} Subcategories</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>{totalViews} Views</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-6 text-sm">
            <Link href="/" className="text-gray-600 hover:text-primary">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/categories" className="text-gray-600 hover:text-primary">Categories</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{categoryName}</span>
          </nav>

          {/* Subcategories Section */}
          {subcategories.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subcategories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {subcategories.map((subcategory: any) => {
                  const getCategoryImage = (categoryName: string) => {
                    const imageMap: { [key: string]: string } = {
                      'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&auto=format',
                      'Machinery': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format',
                      'Fashion': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&auto=format',
                      'Premium': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format',
                      'Standard': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format'
                    };
                    return imageMap[categoryName] || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=400&h=400&fit=crop&auto=format`;
                  };
                  
                  const subcategoryImage = subcategory.imageUrl ? 
                    (subcategory.imageUrl.startsWith('/uploads/') ? subcategory.imageUrl : `/uploads/${subcategory.imageUrl}`) : 
                    getCategoryImage(subcategory.name);
                  
                  return (
                    <Link key={subcategory.id} href={`/subcategory/${subcategory.slug}`}>
                      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white border-gray-100 hover:border-primary/20">
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 rounded-xl overflow-hidden mx-auto mb-3 bg-gray-100">
                            <img 
                              src={subcategoryImage} 
                              alt={subcategory.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = getCategoryImage(subcategory.name);
                              }}
                            />
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm group-hover:text-primary transition-colors">
                            {subcategory.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {subcategory.productCount || 0} products
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <Card className="sticky top-8 bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Range */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Price Range (USD)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="h-10"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Admin Features</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="verified" 
                          checked={verifiedAdminsOnly}
                          onCheckedChange={(checked) => setVerifiedAdminsOnly(checked === true)}
                        />
                        <Label htmlFor="verified" className="text-sm">Verified Admins</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="trade-assurance"
                          checked={tradeAssurance}
                          onCheckedChange={(checked) => setTradeAssurance(checked === true)}
                        />
                        <Label htmlFor="trade-assurance" className="text-sm">Trade Assurance</Label>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setPriceRange({ min: "", max: "" });
                      setVerifiedAdminsOnly(false);
                      setTradeAssurance(false);
                      setSearchQuery("");
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </aside>

            {/* Products Section */}
            <div className="flex-1">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {sortedProducts.length} Products Found
                  </h2>
                  <p className="text-gray-600">
                    in {categoryName}
                  </p>
                </div>
                
                <div className="flex gap-4 items-center">
                  {/* Mobile Filter Button */}
                  <Sheet open={showFilters} onOpenChange={setShowFilters}>
                    <SheetTrigger asChild className="lg:hidden">
                      <Button variant="outline">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <div className="space-y-6 mt-6">
                        <h3 className="font-semibold text-lg">Filters</h3>
                        
                        {/* Mobile filters content (same as desktop) */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Price Range (USD)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={priceRange.min}
                              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                              className="h-10"
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={priceRange.max}
                              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                              className="h-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Admin Features</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="verified-mobile" 
                                checked={verifiedAdminsOnly}
                                onCheckedChange={(checked) => setVerifiedAdminsOnly(checked === true)}
                              />
                              <Label htmlFor="verified-mobile" className="text-sm">Verified Admins</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="trade-assurance-mobile"
                                checked={tradeAssurance}
                                onCheckedChange={(checked) => setTradeAssurance(checked === true)}
                              />
                              <Label htmlFor="trade-assurance-mobile" className="text-sm">Trade Assurance</Label>
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setPriceRange({ min: "", max: "" });
                            setVerifiedAdminsOnly(false);
                            setTradeAssurance(false);
                            setSearchQuery("");
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-48 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedProducts.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        {...transformProductForCard(product)} 
                      />
                    ))}
                  </div>
                  {/* Observer target for infinite scroll */}
                  <div ref={observerTarget} className="h-10 w-full flex items-center justify-center mt-6">
                    {isFetchingNextPage && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading more products...</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PackageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchQuery 
                      ? 'Try adjusting your search criteria or filters' 
                      : `No products available in ${categoryName} yet`
                    }
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchQuery("");
                      setPriceRange({ min: "", max: "" });
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* CTA Section */}
          {sortedProducts.length > 0 && (
            <div className="text-center mt-12">
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Can't Find What You're Looking For?
                </h3>
                <p className="text-gray-600 mb-6">
                  Post a request for quotation and let admins come to you
                </p>
                <Link href="/rfq/create">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3">
                    Create RFQ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}