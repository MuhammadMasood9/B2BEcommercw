import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import StatsSection from "@/components/StatsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Award, ArrowRight, Star, MapPin, Clock, Eye, MessageSquare } from "lucide-react";
import { useLoading } from "@/contexts/LoadingContext";
import { Link } from "wouter";

export default function Home() {
  const { setLoading } = useLoading();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFeaturedCategory, setSelectedFeaturedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.slice(0, 8); // Show only first 8 categories
    }
  });

  // Fetch featured parent categories
  const { data: parentCategories = [], isLoading: parentCategoriesLoading } = useQuery({
    queryKey: ['/api/categories', 'featured'],
    queryFn: async () => {
      const response = await fetch('/api/categories?parentId=null&featured=true');
      if (!response.ok) throw new Error('Failed to fetch featured categories');
      const data = await response.json();
      return data.slice(0, 3); // Show only first 3 featured categories
    }
  });

  // Fetch subcategories for selected featured category
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['/api/categories', 'subcategories', selectedFeaturedCategory],
    queryFn: async () => {
      if (!selectedFeaturedCategory) return [];
      const response = await fetch(`/api/categories?parentId=${selectedFeaturedCategory}`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data = await response.json();
      return data;
    },
    enabled: !!selectedFeaturedCategory
  });

  // Fetch products for selected subcategory
  const { data: subcategoryProducts = [], isLoading: subcategoryProductsLoading } = useQuery({
    queryKey: ['/api/products', 'subcategory', selectedSubcategory],
    queryFn: async () => {
      if (!selectedSubcategory) return [];
      const response = await fetch(`/api/products?categoryId=${selectedSubcategory}&limit=8`);
      if (!response.ok) throw new Error('Failed to fetch subcategory products');
      const data = await response.json();
      return data;
    },
    enabled: !!selectedSubcategory
  });

  // Fetch featured products
  const { data: featuredProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', 'featured'],
    queryFn: async () => {
      const response = await fetch('/api/products?featured=true&limit=8');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data;
    }
  });

  // Fetch products by category
  const { data: categoryProducts = [], isLoading: categoryProductsLoading } = useQuery({
    queryKey: ['/api/products', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const response = await fetch(`/api/products?categoryId=${selectedCategory}&limit=4`);
      if (!response.ok) throw new Error('Failed to fetch category products');
      const data = await response.json();
      return data;
    },
    enabled: !!selectedCategory
  });

  useEffect(() => {
    setLoading(categoriesLoading || productsLoading, "Loading Global Trade Hub...");
  }, [categoriesLoading, productsLoading, setLoading]);

  // Auto-select first parent category and first subcategory
  useEffect(() => {
    if (parentCategories.length > 0 && !selectedFeaturedCategory) {
      setSelectedFeaturedCategory(parentCategories[0].id);
    }
  }, [parentCategories, selectedFeaturedCategory]);

  useEffect(() => {
    if (subcategories.length > 0 && !selectedSubcategory) {
      setSelectedSubcategory(subcategories[0].id);
    }
  }, [subcategories, selectedSubcategory]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleFeaturedCategoryChange = (categoryId: string) => {
    setSelectedFeaturedCategory(categoryId);
    setSelectedSubcategory(null); // Reset subcategory when parent changes
  };

  // Helper function to transform product data for ProductCard
  const transformProductForCard = (product: any) => {
    // Get first image from images array or use placeholder
    const image = Array.isArray(product.images) && product.images.length > 0 
      ? product.images[0] 
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';
    
    // Get price range from priceRanges
    const priceRange = Array.isArray(product.priceRanges) && product.priceRanges.length > 0
      ? `$${product.priceRanges[0].pricePerUnit} - $${product.priceRanges[product.priceRanges.length - 1].pricePerUnit}`
      : '$0.00';
    
    return {
      ...product,
      image,
      priceRange,
      moq: product.minOrderQuantity || 1,
      supplierName: product.supplierName || 'Verified Supplier',
      supplierCountry: product.supplierCountry || 'China',
      responseRate: product.responseRate || '95%',
      responseTime: product.responseTime || '< 24h',
      verified: product.verified || false,
      tradeAssurance: product.tradeAssurance || false,
      readyToShip: product.readyToShip || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: product.certifications || [],
      rating: product.rating || 4.5,
      reviews: product.reviews || 0,
      views: product.views || 0,
      inquiries: product.inquiries || 0
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        
        {/* Featured Categories Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Featured Categories
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore millions of products across all major industries from verified suppliers worldwide
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 md:gap-8">
              {categories.map((category: any) => (
                <Card 
                  key={category.id} 
                  className={`group relative overflow-hidden hover-elevate transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                    selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      {/* Category Image */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                            <span className="text-4xl text-white font-bold">
                              {category.name?.charAt(0) || 'C'}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      
                      {/* Category Info */}
                      <div className="p-4 sm:p-6 text-center space-y-2">
                        <h3 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                          {category.productCount || '0'} products
                        </p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-1">
                          <ArrowRight className="w-5 h-5 text-primary mx-auto" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* Hover Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-gray-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Card>
              ))}
            </div>

            {/* View All Categories Button */}
            <div className="text-center mt-12">
              <Link href="/categories">
                <Button size="lg" variant="outline" className="group h-12 px-8 border-2">
                  View All Categories
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Category Products Section */}
        {selectedCategory && (
          <section className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold">
                  {categories.find((c: any) => c.id === selectedCategory)?.name} Products
                </h2>
                <Link href={`/products?category=${selectedCategory}`}>
                  <Button variant="outline" className="group">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              {categoryProductsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-[4/3] bg-muted" />
                      <CardContent className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {categoryProducts.map((product: any) => (
                    <ProductCard key={product.id} {...transformProductForCard(product)} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">Featured Products</h2>
              <Link href="/products">
                <Button variant="outline" className="group">
                  View All Products
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-[4/3] bg-muted" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product: any) => (
                  <ProductCard key={product.id} {...transformProductForCard(product)} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Categories with Subcategories Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Featured Categories
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover our most popular categories with curated subcategories and products
              </p>
            </div>

            {/* Featured Category Cards */}
            <div className="space-y-16">
              {parentCategories.slice(0, 3).map((category: any) => (
                <div key={category.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-primary to-primary/90 p-8 text-white">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/30 flex items-center justify-center">
                            <span className="text-3xl font-bold">
                              {category.name?.charAt(0) || 'C'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold mb-2">{category.name}</h3>
                        <p className="text-white/90 text-lg">
                          {category.productCount || 0} products available
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subcategories and Products */}
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold text-foreground">Popular Subcategories</h4>
                      <Link href={`/products?category=${category.id}`}>
                        <Button variant="outline" size="sm" className="group">
                          View All
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>

                    {/* Subcategory Tabs */}
                    <Tabs
                      value={selectedFeaturedCategory === category.id ? selectedSubcategory : undefined}
                      onValueChange={(value) => {
                        setSelectedFeaturedCategory(category.id);
                        setSelectedSubcategory(value);
                      }}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 mb-8">
                        {subcategories.slice(0, 6).map((subcategory: any) => (
                          <TabsTrigger
                            key={subcategory.id}
                            value={subcategory.id}
                            className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                          >
                            {subcategory.name}
                            <span className="ml-1 text-xs opacity-70">
                              ({subcategory.productCount || 0})
                            </span>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {/* Products for each subcategory */}
                      {subcategories.slice(0, 6).map((subcategory: any) => (
                        <TabsContent key={subcategory.id} value={subcategory.id} className="mt-0">
                          {subcategoryProductsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {[...Array(4)].map((_, i) => (
                                <Card key={i} className="animate-pulse">
                                  <div className="aspect-[4/3] bg-muted" />
                                  <CardContent className="p-4 space-y-2">
                                    <div className="h-4 bg-muted rounded" />
                                    <div className="h-3 bg-muted rounded w-2/3" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : subcategoryProducts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {subcategoryProducts.slice(0, 4).map((product: any) => (
                                <ProductCard key={product.id} {...transformProductForCard(product)} />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <p className="text-lg text-muted-foreground">
                                No products found in this subcategory yet.
                              </p>
                            </div>
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <StatsSection />
        
        {/* Trade Assurance Section */}
        <section className="py-20 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-gray-400/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 text-sm text-white/90">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Trade Assurance Protection</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                  Trade with <span className="bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">Confidence</span>
                </h2>
                
                <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                  Our Trade Assurance protects your orders from payment to delivery. 
                  Get refunds for orders that don't ship on time or meet quality requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Secure Payments</h3>
                  <p className="text-white/80 text-sm">
                    Your payments are protected until you confirm receipt of your order
                  </p>
                    </div>
                
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Quality Guarantee</h3>
                  <p className="text-white/80 text-sm">
                    Get refunds if products don't meet the quality standards described
                  </p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">On-Time Delivery</h3>
                  <p className="text-white/80 text-sm">
                    Receive compensation if your order doesn't arrive on time
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 h-12 px-8">
                  Learn More About Trade Assurance
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8">
                  Start Trading Now
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}