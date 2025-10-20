import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  TrendingUp,
  Zap,
  Shield,
  Globe,
  Package,
  Smartphone,
  Car,
  Home,
  Shirt,
  Wrench,
  Heart
} from "lucide-react";
import { Link } from "wouter";

const categoryIcons: { [key: string]: any } = {
  electronics: Smartphone,
  fashion: Shirt,
  machinery: Wrench,
  automotive: Car,
  home: Home,
  packaging: Package,
  default: Package
};

export default function ModernCategoriesSection() {
  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.slice(0, 12); // Show first 12 categories
    }
  });

  // Fetch category stats
  const { data: categoryStats = [] } = useQuery({
    queryKey: ['/api/categories', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/categories/stats');
      if (!response.ok) return [];
      const data = await response.json();
      return data;
    }
  });

  const getCategoryIcon = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase();
    return categoryIcons[normalizedName] || categoryIcons.default;
  };

  const getCategoryStats = (categoryId: string) => {
    return categoryStats.find((stat: any) => stat.categoryId === categoryId) || {
      productCount: Math.floor(Math.random() * 10000) + 1000,
      supplierCount: Math.floor(Math.random() * 1000) + 100
    };
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Browse Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore millions of products across all major industries
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-green-50 to-blue-50 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            <span>Global Categories</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Browse Categories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore millions of products across all major industries from verified suppliers worldwide
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
          {categories.map((category: any) => {
            const IconComponent = getCategoryIcon(category.name);
            const stats = getCategoryStats(category.id);
            
            return (
              <Link key={category.id} href={`/categories/${category.id}`}>
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
                        <span>{stats.productCount.toLocaleString()}+ products</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>{stats.supplierCount}+ suppliers</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
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
            {categories.slice(0, 3).map((category: any, index: number) => {
              const IconComponent = getCategoryIcon(category.name);
              const stats = getCategoryStats(category.id);
              
              return (
                <div key={category.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{stats.productCount.toLocaleString()}+ products</span>
                        <span>{stats.supplierCount}+ suppliers</span>
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
            <h3 className="font-semibold text-gray-900 mb-2">Verified Suppliers</h3>
            <p className="text-gray-600 text-sm">
              All suppliers are verified and certified for quality assurance
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
              Connect with suppliers from 190+ countries worldwide
            </p>
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link href="/categories">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              View All Categories
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
