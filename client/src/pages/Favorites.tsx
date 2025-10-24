import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Heart, 
  Trash2,
  ShoppingCart,
  Loader2,
  Globe,
  Shield,
  Clock,
  Package,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

export default function Favorites() {
  const { favorites, removeFromFavorites, isFavorite } = useFavorites();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all products to filter favorites
  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  // Filter products to only show favorited ones
  const favoritedProducts = allProducts?.filter(product => 
    favorites.includes(product.id)
  ) || [];

  // Apply search and sorting
  const filteredProducts = favoritedProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      case 'recent':
      default:
        return 0;
    }
  });

  const handleRemoveFromFavorites = (productId: string) => {
    removeFromFavorites(productId);
    toast({
      title: "Removed from favorites",
      description: "Product has been removed from your favorites",
    });
  };

  // Transform product data for ProductCard
  const transformProductForCard = (product: Product) => {
    const productPrice = (product as any).price || (product as any).minPrice || 0;
    const productMoq = (product as any).moq || (product as any).minOrderQuantity || 1;
    
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
      image: firstImage,
      name: product.name,
      priceRange: `$${productPrice.toFixed(2)} /piece`,
      moq: productMoq,
      supplierName: 'Admin Supplier',
      supplierCountry: 'Global',
      responseRate: '95%',
      verified: true,
      tradeAssurance: true,
      onContact: () => console.log('Contact supplier for product:', product.id),
      onQuote: () => console.log('Request quote for product:', product.id),
      onSample: () => console.log('Request sample for product:', product.id)
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
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
              <Heart className="w-4 h-4 text-red-300" fill="currentColor" />
              <span>My Favorites</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              My
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Favorites
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Access your saved products and find them anytime, anywhere
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-300" />
                <span>{favoritedProducts.length} Favorites</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Admins</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search favorites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Your Favorite Products
                    </h3>
                    <p className="text-gray-600">
                      You have {favoritedProducts.length} product{favoritedProducts.length !== 1 ? 's' : ''} in your favorites
                    </p>
                  </div>
                  <div className="bg-white rounded-full p-4">
                    <Heart className="w-8 h-8 text-red-500" fill="currentColor" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
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
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {sortedProducts.map((product) => (
                <div key={product.id} className="relative group">
                  <ProductCard {...transformProductForCard(product)} />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => handleRemoveFromFavorites(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No products found' : 'No favorites yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search criteria' 
                  : 'Start adding products to your favorites to see them here'
                }
              </p>
              {!searchQuery && (
                <Link href="/products">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Browse Products
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* CTA Section */}
          {sortedProducts.length > 0 && (
            <div className="text-center mt-12">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Order?
                </h3>
                <p className="text-gray-600 mb-6">
                  Contact admins directly or send inquiries for your favorite products
                </p>
                <Link href="/products">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    Browse More Products
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