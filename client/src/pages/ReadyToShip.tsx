import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Truck, 
  Clock, 
  Shield, 
  Package, 
  TrendingUp, 
  Filter,
  Grid3X3,
  List,
  Star,
  Zap,
  Globe,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function ReadyToShip() {
  const [sortBy, setSortBy] = useState("best-match");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  
  const { addToCart, isInCart, getCartItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch ready-to-ship products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products/ready-to-ship", searchQuery, selectedCategory, sortBy],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/ready-to-ship?search=${searchQuery}&category=${selectedCategory}&sort=${sortBy}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
      } catch (error) {
        console.error('Error fetching ready-to-ship products:', error);
        // Fallback to mock data
        return [
          {
            id: "rts1",
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
            name: "Premium Wireless Headphones",
            priceRange: "$25.00-$35.00 /piece",
            moq: 50,
            supplierName: "AudioTech Pro",
            supplierCountry: "China",
            responseRate: "98%",
            verified: true,
            tradeAssurance: true,
            readyToShip: true,
            shippingTime: "3-7 days",
            priceRanges: [{ minQty: 50, maxQty: 100, pricePerUnit: "25.00" }, { minQty: 100, maxQty: 500, pricePerUnit: "30.00" }],
            inStock: true,
            stockQuantity: 1000,
            views: 245,
            inquiries: 12,
            rating: 4.8,
            reviews: 156
          },
          {
            id: "rts2",
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
            name: "Classic Analog Wristwatch",
            priceRange: "$12.00-$18.00 /piece",
            moq: 100,
            supplierName: "TimeKeeper Co.",
            supplierCountry: "Hong Kong",
            responseRate: "95%",
            verified: true,
            readyToShip: true,
            shippingTime: "5-10 days",
            priceRanges: [{ minQty: 100, maxQty: 500, pricePerUnit: "12.00" }, { minQty: 500, maxQty: 1000, pricePerUnit: "15.00" }],
            inStock: true,
            stockQuantity: 500,
            views: 189,
            inquiries: 8,
            rating: 4.6,
            reviews: 89
          },
          {
            id: "rts3",
            image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
            name: "Designer Sunglasses UV Protection",
            priceRange: "$8.00-$12.00 /piece",
            moq: 200,
            supplierName: "Vision Plus",
            supplierCountry: "China",
            responseRate: "92%",
            verified: true,
            readyToShip: true,
            shippingTime: "4-8 days",
            priceRanges: [{ minQty: 200, maxQty: 1000, pricePerUnit: "8.00" }, { minQty: 1000, maxQty: 5000, pricePerUnit: "10.00" }],
            inStock: true,
            stockQuantity: 2000,
            views: 312,
            inquiries: 15,
            rating: 4.4,
            reviews: 67
          },
          {
            id: "rts4",
            image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop",
            name: "Casual Sneakers Comfortable",
            priceRange: "$15.00-$22.00 /piece",
            moq: 100,
            supplierName: "Global Footwear",
            supplierCountry: "Vietnam",
            responseRate: "96%",
            verified: true,
            readyToShip: true,
            shippingTime: "6-12 days",
            priceRanges: [{ minQty: 100, maxQty: 500, pricePerUnit: "15.00" }, { minQty: 500, maxQty: 1000, pricePerUnit: "18.00" }],
            inStock: true,
            stockQuantity: 800,
            views: 278,
            inquiries: 22,
            rating: 4.7,
            reviews: 134
          },
          {
            id: "rts5",
            image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
            name: "Stainless Steel Water Bottle",
            priceRange: "$5.00-$8.00 /piece",
            moq: 500,
            supplierName: "EcoWare Industries",
            supplierCountry: "China",
            responseRate: "99%",
            verified: true,
            tradeAssurance: true,
            readyToShip: true,
            shippingTime: "3-5 days",
            priceRanges: [{ minQty: 500, maxQty: 2000, pricePerUnit: "5.00" }, { minQty: 2000, maxQty: 10000, pricePerUnit: "6.50" }],
            inStock: true,
            stockQuantity: 5000,
            views: 156,
            inquiries: 6,
            rating: 4.9,
            reviews: 203
          },
          {
            id: "rts6",
            image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
            name: "Portable Bluetooth Speaker",
            priceRange: "$18.00-$28.00 /piece",
            moq: 100,
            supplierName: "Sound Systems Ltd",
            supplierCountry: "China",
            responseRate: "97%",
            verified: true,
            readyToShip: true,
            shippingTime: "4-9 days",
            priceRanges: [{ minQty: 100, maxQty: 500, pricePerUnit: "18.00" }, { minQty: 500, maxQty: 1000, pricePerUnit: "23.00" }],
            inStock: true,
            stockQuantity: 1200,
            views: 198,
            inquiries: 11,
            rating: 4.5,
            reviews: 78
          }
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const handleAddToCart = (product: any) => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    const priceRanges = product.priceRanges ? (typeof product.priceRanges === 'string' ? JSON.parse(product.priceRanges) : product.priceRanges) : [];
    const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;

    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      priceRange: priceRanges.length > 0 ? `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)} /piece` : 'Contact for price',
      moq: product.moq || 1,
      supplierName: product.supplierName || 'Bago Supplier',
      supplierCountry: product.supplierCountry || 'Global',
      verified: product.verified || true,
      tradeAssurance: product.tradeAssurance || false,
      readyToShip: product.readyToShip || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: product.certifications || [],
      leadTime: product.shippingTime || '7-15 days',
      port: product.port || 'Any port',
      paymentTerms: product.paymentTerms || [],
      inStock: product.inStock || false,
      stockQuantity: product.stockQuantity || 0,
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const features = [
    {
      icon: Clock,
      title: "Quick Delivery",
      description: "Ships in 3-15 days",
      color: "from-primary to-primary/80",
      bgColor: "bg-primary/5 dark:bg-primary/10"
    },
    {
      icon: Package,
      title: "Lower MOQ",
      description: "Smaller minimum orders",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      icon: Shield,
      title: "Trade Assurance",
      description: "Secure transactions",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      icon: TrendingUp,
      title: "In-Stock Items",
      description: "Ready for immediate dispatch",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    }
  ];

  const categories = [
    { id: "all", name: "All Categories", count: products.length },
    { id: "electronics", name: "Electronics", count: 24 },
    { id: "fashion", name: "Fashion", count: 18 },
    { id: "home", name: "Home & Garden", count: 12 },
    { id: "sports", name: "Sports", count: 8 },
    { id: "beauty", name: "Beauty", count: 15 }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary text-white py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-40 -translate-x-40"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Ready to Ship Products</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-primary-foreground/80 bg-clip-text text-transparent">
              Ready to Ship
            </h1>
            <p className="text-xl lg:text-2xl text-primary-foreground/80 mb-8 max-w-3xl mx-auto">
              Fast delivery on in-stock products with lower MOQ. Get your orders shipped within 3-15 days.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="relative flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center pl-4 pr-2">
                    <Search className="w-5 h-5 text-primary-foreground/60" />
                  </div>
                  <Input
                    placeholder="Search ready to ship products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0 h-14 bg-transparent text-white placeholder:text-primary-foreground/60 px-2 font-medium"
                  />
                  <div className="hidden md:block h-8 w-px bg-white/20 mx-3" />
                  <div className="hidden md:block">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-40 border-0 rounded-none focus:ring-0 bg-transparent hover:bg-white/10 transition-colors h-14 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name} ({category.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="h-14 px-8 rounded-none rounded-r-2xl m-0 shadow-none bg-white text-primary hover:bg-primary/5 font-semibold" 
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const featureId = feature.title.toLowerCase().replace(/\s+/g, '-');
              return (
                <Card key={index} className={`group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 ${feature.bgColor} hover:scale-105`} data-testid={`card-feature-${featureId}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg mx-auto group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white" data-testid={`text-feature-title-${featureId}`}>{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium" data-testid={`text-feature-desc-${featureId}`}>{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Search and Filter Bar */}
          <Card className="mb-8 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search ready to ship products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                    data-testid="input-search"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 h-12 border-gray-200 dark:border-gray-700" data-testid="select-sort">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best-match">Best Match</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="moq-low">MOQ: Low to High</SelectItem>
                      <SelectItem value="shipping-fast">Fastest Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-12 px-4 border-gray-200 dark:border-gray-700"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  
                  <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-12 px-4 rounded-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-12 px-4 rounded-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Badges */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-200 px-4 py-2 text-sm font-medium ${
                    selectedCategory === category.id
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`badge-category-${category.id}`}
                >
                  {category.name}
                  <span className="ml-2 text-xs opacity-75">({category.count})</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Results Count and Stats */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                <span className="text-primary dark:text-primary">{products.length.toLocaleString()}</span> products ready to ship
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing results for {selectedCategory === "all" ? "all categories" : categories.find(c => c.id === selectedCategory)?.name}
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Fast shipping</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-green-500" />
                <span>Global delivery</span>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <Card key={index} className="overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {products.map((product) => {
                const isInCartItem = isInCart(product.id);
                const cartItem = getCartItem(product.id);
                
                return (
                  <div key={product.id} className="relative group">
                    <Badge className="absolute top-3 left-3 z-10 bg-green-500 hover:bg-green-600 gap-1.5 shadow-lg text-white border-0">
                      <Truck className="w-3 h-3" />
                      {product.shippingTime}
                    </Badge>
                    
                    {isInCartItem && (
                      <Badge className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground border-0 shadow-lg">
                        In Cart ({cartItem?.quantity || 1})
                      </Badge>
                    )}
                    
                    <ProductCard 
                      {...product}
                      onAddToCart={() => handleAddToCart(product)}
                      onContact={() => {
                        if (!user) {
                          toast({
                            title: "Please Sign In",
                            description: "You need to be signed in to contact suppliers.",
                            variant: "destructive",
                          });
                          return;
                        }
                        toast({
                          title: "Contact Supplier",
                          description: "Opening chat with supplier...",
                        });
                      }}
                      onQuote={() => {
                        if (!user) {
                          toast({
                            title: "Please Sign In",
                            description: "You need to be signed in to request quotes.",
                            variant: "destructive",
                          });
                          return;
                        }
                        toast({
                          title: "Quote Request",
                          description: "Your quote request has been sent to the supplier.",
                        });
                      }}
                      onSample={() => {
                        if (!user) {
                          toast({
                            title: "Please Sign In",
                            description: "You need to be signed in to request samples.",
                            variant: "destructive",
                          });
                          return;
                        }
                        toast({
                          title: "Sample Request",
                          description: "Your sample request has been sent to the supplier.",
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          <div className="mt-16 text-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-load-more"
            >
              Load More Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
