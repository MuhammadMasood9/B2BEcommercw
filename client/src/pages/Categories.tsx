import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLoading } from "@/contexts/LoadingContext";
import type { Category } from "@shared/schema";
import { 
  Laptop, 
  Shirt, 
  Wrench, 
  Car, 
  Home as HomeIcon,
  Lightbulb,
  Package,
  Hammer,
  Pill,
  Utensils,
  Baby,
  Dumbbell,
  Briefcase,
  Palette,
  Zap,
  Factory,
  ArrowRight,
  Loader2,
  TrendingUp,
  Globe,
  Shield,
  Star,
  Users,
  Package2
} from "lucide-react";

const categoryIcons: { [key: string]: any } = {
  electronics: Laptop,
  fashion: Shirt,
  machinery: Wrench,
  automotive: Car,
  home: HomeIcon,
  lighting: Lightbulb,
  packaging: Package,
  tools: Hammer,
  health: Pill,
  food: Utensils,
  baby: Baby,
  sports: Dumbbell,
  office: Briefcase,
  art: Palette,
  energy: Zap,
  industrial: Factory,
  default: Package2
};

export default function Categories() {
  const { setLoading } = useLoading();

  // Fetch categories from API
  const { data: apiCategories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
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
    setLoading(isCategoriesLoading, "Loading categories...");
  }, [isCategoriesLoading, setLoading]);

  const getCategoryIcon = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '');
    return categoryIcons[normalizedName] || categoryIcons.default;
  };

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
              <Globe className="w-4 h-4" />
              <span>Global Categories</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Browse
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Categories
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Explore millions of products across all major industries from verified admins worldwide
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Admins</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-300" />
                <span>Trending Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Reach</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
            {isCategoriesLoading ? (
              [...Array(12)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              apiCategories.map((category) => {
                const IconComponent = getCategoryIcon(category.name);
                const productCount = Math.floor(Math.random() * 10000) + 1000; // Mock data
                const supplierCount = Math.floor(Math.random() * 1000) + 100; // Mock data
                
                return (
                  <Link key={category.id} href={`/products?category=${category.id}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer bg-white border-gray-100 hover:border-blue-200">
                      <CardContent className="p-6 text-center">
                        <div className="relative mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className="w-8 h-8 text-blue-600" />
                          </div>
                          <div className="absolute -top-2 -right-2">
                            <Badge className="bg-green-500 text-white text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Hot
                            </Badge>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                        
                        <div className="space-y-1 text-sm text-gray-500">
                          <div className="flex items-center justify-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>{productCount.toLocaleString()}+ products</span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>{supplierCount}+ admins</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>

          {/* Featured Categories */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Popular This Week
              </h3>
              <p className="text-gray-600">
                Trending categories with the most activity
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {apiCategories.slice(0, 3).map((category, index) => {
                const IconComponent = getCategoryIcon(category.name);
                const productCount = Math.floor(Math.random() * 10000) + 1000;
                const supplierCount = Math.floor(Math.random() * 1000) + 100;
                
                return (
                  <div key={category.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{category.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{productCount.toLocaleString()}+ products</span>
                          <span>{supplierCount}+ admins</span>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trust Elements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified Admins</h3>
              <p className="text-gray-600 text-sm">
                All admins are verified and certified for quality assurance
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fast Response</h3>
              <p className="text-gray-600 text-sm">
                Get instant quotes and responses within 24 hours
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Global Reach</h3>
              <p className="text-gray-600 text-sm">
                Connect with admins from 190+ countries worldwide
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Can't Find What You're Looking For?
              </h3>
              <p className="text-gray-600 mb-6">
                Create a custom RFQ and let admins come to you with competitive quotes
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/rfq/create">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    Create RFQ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3">
                    Browse All Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}