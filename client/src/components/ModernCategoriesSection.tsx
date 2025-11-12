import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
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
      console.log('Categories data:', data);
      return data.slice(0, 12); // Show first 12 categories
    }
  });

  // Note: We don't need separate categoryStats query since categories API already includes counts

  // Debug categories data
  useEffect(() => {
    if (categories.length > 0) {
      console.log('Categories loaded:', categories);
      categories.forEach((category: any) => {
        console.log(`Category: ${category.name}, ID: ${category.id}, Products: ${category.productCount}, Subcategories: ${category.subcategoryCount}`);
      });
    }
  }, [categories]);

  const getCategoryIcon = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase();
    return categoryIcons[normalizedName] || categoryIcons.default;
  };

  const getCategoryStats = (categoryId: string) => {
    // Use the category data directly since it already includes productCount and subcategoryCount
    const category = categories.find((cat: any) => cat.id === categoryId);
    console.log(`Getting stats for category ${categoryId}:`, category);
    
    return {
      productCount: category?.productCount || 0,
      subcategoryCount: category?.subcategoryCount || 0,
      supplierCount: 1 // Admin is the only supplier
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
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary to-purple-50 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-green-50 to-orange-600 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary text-primary rounded-full px-4 py-2 text-sm font-medium mb-6">
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
            console.log(`Stats for ${category.name}:`, stats);
            
            // Get category image or use specific placeholder based on category name
            const getCategoryImage = (categoryName: string) => {
              const imageMap: { [key: string]: string } = {
                'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&auto=format',
                'Machinery': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format',
                'Fashion': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&auto=format',
                'Automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop&auto=format',
                'Home & Garden': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&auto=format',
                'Packaging': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format',
                'Industrial': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format',
                'Textiles': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&auto=format',
                'Chemicals': 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=400&fit=crop&auto=format',
                'Food & Beverage': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop&auto=format',
                'Health & Beauty': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format',
                'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format',
                'Premium': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format',
                'Standard': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format'
              };
              
              const imageUrl = imageMap[categoryName] || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=400&h=400&fit=crop&auto=format`;
              console.log(`Category: ${categoryName}, Image URL: ${imageUrl}`);
              return imageUrl;
            };
            
            // Use API imageUrl if available, otherwise use category-specific fallback
            const categoryImage = category.imageUrl ? 
              (category.imageUrl.startsWith('/uploads/') ? category.imageUrl : `/uploads/${category.imageUrl}`) : 
              getCategoryImage(category.name);
            console.log(`Category: ${category.name}, API Image: ${category.imageUrl}, Final Image: ${categoryImage}`);
            
            return (
              <Link key={category.id} href={`/categories/${category.id}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer bg-white border-gray-100 hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <div className="relative mb-4">
                      {/* Category Image */}
                      <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto group-hover:scale-110 transition-transform duration-300 bg-gray-100">
                        <img 
                          src={categoryImage} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log(`Image failed to load for category: ${category.name}, URL: ${categoryImage}`);
                            e.currentTarget.src = `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format`;
                          }}
                          onLoad={() => {
                            console.log(`Image loaded successfully for category: ${category.name}`);
                          }}
                        />
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <Badge className={`text-white text-xs ${
                          category.trend === 'high' ? 'bg-green-500' : 
                          category.trend === 'medium' ? 'bg-yellow-500' : 
                          'bg-gray-500'
                        }`}>
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {category.trend === 'high' ? 'Hot' : 
                           category.trend === 'medium' ? 'Trending' : 
                           'New'}
                        </Badge>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{stats.productCount.toLocaleString()}+ products</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <IconComponent className="w-3 h-3" />
                        <span>{stats.subcategoryCount}+ subcategories</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>1 Admin Supplier</span>
                      </div>
                      {category.totalViews > 0 && (
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{category.totalViews} views</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Featured Categories */}
        <div className="bg-gradient-to-r from-primary to-purple-50 rounded-3xl p-8 mb-12">
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
              
              // Use the same image mapping function
              const getCategoryImage = (categoryName: string) => {
                const imageMap: { [key: string]: string } = {
                  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&auto=format',
                  'Machinery': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format',
                  'Fashion': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&auto=format',
                  'Automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop&auto=format',
                  'Home & Garden': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&auto=format',
                  'Packaging': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format',
                  'Industrial': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format',
                  'Textiles': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&auto=format',
                  'Chemicals': 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=400&fit=crop&auto=format',
                  'Food & Beverage': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop&auto=format',
                  'Health & Beauty': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format',
                  'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format'
                };
                
                return imageMap[categoryName] || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=400&h=400&fit=crop&auto=format`;
              };
              
              // Use API imageUrl if available, otherwise use category-specific fallback
              const categoryImage = category.imageUrl ? 
                (category.imageUrl.startsWith('/uploads/') ? category.imageUrl : `/uploads/${category.imageUrl}`) : 
                getCategoryImage(category.name);
              console.log(`Popular category: ${category.name}, API Image: ${category.imageUrl}, Final Image: ${categoryImage}`);
              
              return (
                <div key={category.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                      <img 
                        src={categoryImage} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log(`Image failed to load for category: ${category.name}, URL: ${categoryImage}`);
                          e.currentTarget.src = `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format`;
                        }}
                        onLoad={() => {
                          console.log(`Image loaded successfully for category: ${category.name}`);
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{stats.productCount.toLocaleString()}+ products</span>
                        <span>{stats.subcategoryCount}+ subcategories</span>
                        {category.totalViews > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {category.totalViews} views
                          </span>
                        )}
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
            <h3 className="font-semibold text-gray-900 mb-2">Verified Admin Supplier</h3>
            <p className="text-gray-600 text-sm">
              Our admin supplier is verified and certified for quality assurance
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast Response</h3>
            <p className="text-gray-600 text-sm">
              Get instant quotes and responses within 2 hours from our admin team
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Global Shipping</h3>
            <p className="text-gray-600 text-sm">
              Ship to 190+ countries worldwide with tracking and insurance
            </p>
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link href="/categories">
            <Button size="lg" className="bg-primary hover:bg-primary text-white px-8 py-3">
              View All Categories
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
