import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";
import ModernCategoriesSection from "@/components/ModernCategoriesSection";
import TrustAndTestimonialsSection from "@/components/TrustAndTestimonialsSection";
import StatsSection from "@/components/StatsSection";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Award, ArrowRight, Star, MapPin, Clock, Eye, MessageSquare, TrendingUp, Users, Globe, Package } from "lucide-react";
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
      // Handle both array and object with products property
      const products = Array.isArray(data) ? data : (data.products || []);
      return products.filter((p: any) => p.isFeatured === true);
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
      supplierName: 'Admin Supplier', // Admin is the supplier
      supplierCountry: 'USA',
      supplierType: 'manufacturer',
      responseRate: '100%',
      responseTime: '< 2h',
      verified: true,
      tradeAssurance: true,
      readyToShip: product.readyToShip || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: product.certifications || ['ISO 9001', 'CE Mark'],
      rating: product.rating || 4.8,
      reviews: product.reviews || Math.floor(Math.random() * 100) + 50,
      views: product.views || Math.floor(Math.random() * 1000) + 100,
      inquiries: product.inquiries || Math.floor(Math.random() * 50) + 10,
      leadTime: product.leadTime || '7-15 days',
      port: product.port || 'Los Angeles, USA',
      paymentTerms: ['T/T', 'L/C', 'PayPal'],
      inStock: true,
      stockQuantity: product.stockQuantity || Math.floor(Math.random() * 1000) + 100
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        
        {/* Featured Products Carousel */}
        <FeaturedProductsCarousel />
        
        {/* Featured Products Section with ProductCard */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                <span>Featured Products</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Discover Trending Products
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From verified suppliers worldwide with competitive pricing and fast delivery
              </p>
            </div>
            
            {/* Products Grid using ProductCard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {Array.isArray(featuredProducts) && featuredProducts.slice(0, 8).map((product: any) => (
                <ProductCard
                  key={product.id}
                  {...transformProductForCard(product)}
                  onContact={() => {
                    // Navigate to product-specific chat
                    window.location.href = `/messages?productId=${product.id}&productName=${encodeURIComponent(product.name)}&chatType=product`;
                  }}
                  onQuote={() => {
                    // Handle request quote
                    console.log('Request quote for product:', product.id);
                  }}
                  onSample={() => {
                    // Handle request sample
                    console.log('Request sample for product:', product.id);
                  }}
                />
              ))}
            </div>
            
            <div className="text-center">
              <Link href="/products">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  View All Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Modern Categories Section */}
        <ModernCategoriesSection />
        
        {/* Trust and Testimonials Section */}
        <TrustAndTestimonialsSection />
        
        {/* Stats Section */}
        <StatsSection />
        
        {/* Featured Suppliers Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
                <Users className="w-4 h-4" />
                <span>Verified Suppliers</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Trusted Global Suppliers
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Connect with verified manufacturers and wholesalers from around the world
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Sample Supplier Cards */}
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <Package className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">TechManufacturing Co.</h3>
                      <p className="text-sm text-gray-600">Electronics Manufacturer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>4.9 (234 reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>China</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Specializing in consumer electronics with 15+ years experience and ISO 9001 certification.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">View Store</Button>
                    <Button size="sm" variant="outline">Contact</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                      <Globe className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Global Textiles Ltd.</h3>
                      <p className="text-sm text-gray-600">Textile Wholesaler</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>4.8 (189 reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>India</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Premium quality fabrics and textiles with sustainable manufacturing practices.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">View Store</Button>
                    <Button size="sm" variant="outline">Contact</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Precision Tools Inc.</h3>
                      <p className="text-sm text-gray-600">Industrial Equipment</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>4.9 (156 reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>Germany</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    High-precision industrial tools and machinery with worldwide shipping.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">View Store</Button>
                    <Button size="sm" variant="outline">Contact</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center">
              <Link href="/suppliers">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Browse All Suppliers
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Supplier Success Stories */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4" />
                <span>Success Stories</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Supplier Success on Our Platform
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join thousands of suppliers who have grown their business with us
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Active Suppliers</div>
                <div className="text-gray-600">From 190+ countries worldwide</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">$2.5B+</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Total Sales Volume</div>
                <div className="text-gray-600">Generated by our suppliers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">Satisfaction Rate</div>
                <div className="text-gray-600">Supplier satisfaction score</div>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="/supplier/signup">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                  Start Selling Today
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Ready to Ship Section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
                <Clock className="w-4 h-4" />
                <span>Fast Delivery</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Ready to Ship
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get products delivered quickly with our ready-to-ship inventory
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Same Day Shipping
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Orders placed before 2 PM ship the same day
                  </p>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Global Shipping
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Ship to 190+ countries with tracking and insurance
                  </p>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Secure Delivery
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Protected delivery with signature confirmation
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center mt-12">
              <Link href="/ready-to-ship">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Browse Ready to Ship Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join millions of buyers and suppliers in the world's largest B2B marketplace
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 font-semibold">
                  Start Sourcing Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/supplier/signup">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 font-semibold">
                  Become a Supplier
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}