import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
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
  Loader2
} from "lucide-react";
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

  // Apply search and sort filters
  const filteredProducts = favoritedProducts
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.shortDescription && product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          const aPrice = a.priceRanges ? (typeof a.priceRanges === 'string' ? JSON.parse(a.priceRanges) : a.priceRanges) : [];
          const bPrice = b.priceRanges ? (typeof b.priceRanges === 'string' ? JSON.parse(b.priceRanges) : b.priceRanges) : [];
          const aMinPrice = aPrice.length > 0 ? Math.min(...aPrice.map((r: any) => Number(r.pricePerUnit))) : 0;
          const bMinPrice = bPrice.length > 0 ? Math.min(...bPrice.map((r: any) => Number(r.pricePerUnit))) : 0;
          return aMinPrice - bMinPrice;
        case 'price-high':
          const aPriceHigh = a.priceRanges ? (typeof a.priceRanges === 'string' ? JSON.parse(a.priceRanges) : a.priceRanges) : [];
          const bPriceHigh = b.priceRanges ? (typeof b.priceRanges === 'string' ? JSON.parse(b.priceRanges) : b.priceRanges) : [];
          const aMaxPrice = aPriceHigh.length > 0 ? Math.max(...aPriceHigh.map((r: any) => Number(r.pricePerUnit))) : 0;
          const bMaxPrice = bPriceHigh.length > 0 ? Math.max(...bPriceHigh.map((r: any) => Number(r.pricePerUnit))) : 0;
          return bMaxPrice - aMaxPrice;
        case 'recent':
        default:
          return 0; // Keep original order for recent
      }
    });

  const handleRemoveFavorite = (productId: string, productName: string) => {
    removeFromFavorites(productId);
    toast({
      title: "Removed from Favorites",
      description: `${productName} has been removed from your favorites.`,
    });
  };

  const handleClearAll = () => {
    // This would need to be implemented in the context
    toast({
      title: "Clear All Favorites",
      description: "This feature will be implemented soon.",
    });
  };

  const transformProductForCard = (product: Product) => {
    const priceRanges = product.priceRanges ? (typeof product.priceRanges === 'string' ? JSON.parse(product.priceRanges) : product.priceRanges) : [];
    const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const images = product.images && product.images.length > 0 ? product.images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"];
    
    return {
      id: product.id,
      image: images[0],
      name: product.name,
      priceRange: priceRanges.length > 0 ? `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)} /piece` : 'Contact for price',
      moq: product.minOrderQuantity || 1,
      supplierName: "Admin Supplier",
      supplierCountry: "Unknown",
      responseRate: "95%",
      verified: true,
      tradeAssurance: product.hasTradeAssurance || false,
      readyToShip: product.readyToShip || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: product.certifications || [],
      leadTime: product.leadTime || "7-15 days",
      port: product.port || "Any port",
      paymentTerms: product.paymentTerms || [],
      inStock: product.inStock !== false,
      stockQuantity: product.stockQuantity || 1000,
      views: product.views || 0,
      inquiries: product.inquiries || 0,
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      isFavorited: true,
      viewMode,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <PageHeader 
          title="My Favorites" 
          description="Products you've saved for later"
        />
        
        <div className="container mx-auto px-4 py-6">
        {/* Header with stats and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-lg font-semibold">
                {favoritedProducts.length} {favoritedProducts.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            {favoritedProducts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search your favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <div className="flex gap-2">
                    <Input placeholder="Min" type="number" />
                    <Input placeholder="Max" type="number" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Supplier Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="gold">Gold Suppliers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Features</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Trade Assurance</Badge>
                    <Badge variant="outline">Ready to Ship</Badge>
                    <Badge variant="outline">Sample Available</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products grid/list */}
        {favoritedProducts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding products to your favorites by clicking the heart icon on any product.
              </p>
              <Button asChild>
                <a href="/products">Browse Products</a>
              </Button>
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard
                  {...transformProductForCard(product)}
                  onFavorite={() => handleRemoveFavorite(product.id, product.name)}
                />
                {viewMode === 'grid' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveFavorite(product.id, product.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick actions for multiple products */}
        {filteredProducts.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add All to Cart
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="h-4 w-4 mr-2" />
              Compare Products
            </Button>
          </div>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
}