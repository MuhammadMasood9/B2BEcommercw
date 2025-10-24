import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Search, X, Loader2, Package as PackageIcon, Filter, ArrowRight, CheckCircle, Shield, Globe } from "lucide-react";
import { useLoading } from "@/contexts/LoadingContext";
import type { Product, Category } from "@shared/schema";

export default function SubcategoryProducts() {
  const { setLoading } = useLoading();
  const [searchQuery, setSearchQuery] = useState("");
  const [, params] = useRoute("/subcategory/:slug");
  const subcategorySlug = params?.slug || "";

  // Fetch categories to get the subcategory by slug
  const { data: categories = [] } = useQuery<Category[]>({
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

  // Find the subcategory by slug
  const currentSubcategory = categories.find(cat => cat.slug === subcategorySlug);
  const subcategoryId = currentSubcategory?.id;
  const subcategoryName = currentSubcategory?.name || subcategorySlug;

  // Find parent category
  const parentCategory = categories.find(cat => cat.id === currentSubcategory?.parentId);

  // Fetch products for this subcategory
  const { data: apiProducts = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", subcategoryId],
    queryFn: async () => {
      try {
        const response = await fetch("/api/products", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Filter products by subcategory
        const filtered = Array.isArray(data) 
          ? data.filter((p: Product) => p.categoryId === subcategoryId)
          : [];
        console.log("Filtered products for subcategory:", filtered);
        return filtered;
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    enabled: !!subcategoryId, // Only run query if we have a subcategoryId
  });

  useEffect(() => {
    if (isProductsLoading) {
      setLoading(true, `Loading ${subcategoryName} products...`);
    } else {
      setLoading(false);
    }
  }, [isProductsLoading, subcategoryName, setLoading]);

  // Transform API products for display
  const products = apiProducts.map(product => {
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
  });


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <PackageIcon className="w-4 h-4" />
              <span>{subcategoryName}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {subcategoryName}
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
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
                      searchParams.set('category', subcategoryId || '');
                      window.location.href = `/products?${searchParams.toString()}`;
                    }}
                    className="m-1 h-12 px-8 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
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
                <span>{products.length} Products</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-yellow-300" />
                <span>Verified Admins</span>
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
          {/* Breadcrumb */}
          <nav className="flex mb-6 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/categories" className="text-gray-600 hover:text-blue-600">Categories</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href={`/category/${parentCategory?.slug}`} className="text-gray-600 hover:text-blue-600">{parentCategory?.name || "Category"}</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{subcategoryName}</span>
          </nav>

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
                        className="h-10"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Admin Features</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="verified" />
                        <Label htmlFor="verified" className="text-sm">Verified Admins</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="trade-assurance" />
                        <Label htmlFor="trade-assurance" className="text-sm">Trade Assurance</Label>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
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
                    {products.length} Products Found
                  </h2>
                  <p className="text-gray-600">
                    in {subcategoryName}
                  </p>
                </div>
                
                <div className="flex gap-4 items-center">
                  {/* Mobile Filter Button */}
                  <Sheet>
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
                              className="h-10"
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              className="h-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Admin Features</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="verified-mobile" />
                              <Label htmlFor="verified-mobile" className="text-sm">Verified Admins</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="trade-assurance-mobile" />
                              <Label htmlFor="trade-assurance-mobile" className="text-sm">Trade Assurance</Label>
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          className="w-full"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort */}
                      <Select defaultValue="relevant" data-testid="select-sort">
                    <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevant">Most Relevant</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="moq">Minimum Order</SelectItem>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
              </div>

              {/* Products Grid */}
              {isProductsLoading ? (
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
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
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
                      : `No products available in ${subcategoryName} yet`
                    }
                  </p>
                  <Button 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* CTA Section */}
          {products.length > 0 && (
            <div className="text-center mt-12">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Can't Find What You're Looking For?
                </h3>
                <p className="text-gray-600 mb-6">
                  Post a request for quotation and let admins come to you
                </p>
                <Link href="/rfq/create">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
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
