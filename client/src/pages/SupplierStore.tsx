import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin,
  Star,
  ShieldCheck,
  Building2,
  Package,
  Globe,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  Award,
  MessageSquare,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  Store,
  Search,
  Filter,
  Eye,
  Heart,
  Share2,
  ExternalLink,
  Truck,
  Shield,
  Zap,
  Factory,
  Target,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import VerificationBadge from "@/components/VerificationBadge";
import TrustIndicators from "@/components/TrustIndicators";
import SupplierReviews from "@/components/SupplierReviews";
import Breadcrumb from "@/components/Breadcrumb";

export default function SupplierStore() {
  const [, params] = useRoute("/suppliers/:slug");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const slug = params?.slug;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Fetch supplier store data
  const { data: storeData, isLoading } = useQuery({
    queryKey: ["/api/suppliers/store", slug],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/store/${slug}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!slug,
  });

  const supplier = storeData?.supplier;
  const products = storeData?.products || [];
  const categories = storeData?.categories || [];

  // Filter products based on current filters
  const filteredProducts = products.filter((product: any) => {
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !product.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== "all" && product.categoryId !== selectedCategory) {
      return false;
    }
    if (showFeaturedOnly && !product.isFeatured) {
      return false;
    }
    if (showInStockOnly && !product.inStock) {
      return false;
    }
    return true;
  });

  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'Manufacturer';
      case 'trading_company': return 'Trading Company';
      case 'wholesaler': return 'Wholesaler';
      default: return 'Supplier';
    }
  };

  const handleContact = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to contact suppliers.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    // Navigate to chat with supplier
    setLocation(`/messages?supplierId=${supplier.id}&supplierName=${encodeURIComponent(supplier.storeName)}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: supplier.storeName,
          text: `Check out ${supplier.storeName} on Bago`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Store link copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Store link copied to clipboard",
      });
    }
  };

  const handleFavorite = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to save favorites.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    toast({
      title: "Added to Favorites",
      description: "Supplier added to your favorites",
    });
  };

  const transformProductForCard = (product: any) => {
    let priceRanges = [];
    if (product.priceRanges) {
      try {
        priceRanges = typeof product.priceRanges === 'string'
          ? JSON.parse(product.priceRanges)
          : product.priceRanges;
      } catch (error) {
        priceRanges = [];
      }
    }
    const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const priceRange = priceRanges.length > 0
      ? `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
      : 'Contact for price';

    let images = [];
    if (product.images) {
      try {
        images = Array.isArray(product.images)
          ? product.images
          : (typeof product.images === 'string' ? JSON.parse(product.images) : []);
      } catch (error) {
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
      supplierName: supplier?.storeName || 'Supplier',
      supplierCountry: supplier?.country || 'USA',
      supplierType: supplier?.businessType || 'manufacturer',
      responseRate: supplier?.responseRate ? `${parseFloat(supplier.responseRate).toFixed(0)}%` : '100%',
      responseTime: supplier?.responseTime || '< 2h',
      verified: supplier?.isVerified || false,
      verificationLevel: supplier?.verificationLevel || 'none',
      tradeAssurance: product.hasTradeAssurance || false,
      readyToShip: product.inStock || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: product.certifications || [],
      rating: parseFloat(supplier?.rating || '0'),
      reviews: supplier?.totalReviews || 0,
      views: 100,
      inquiries: 10,
      leadTime: product.leadTime || '7-15 days',
      port: product.port || 'Any port',
      paymentTerms: product.paymentTerms || [],
      inStock: product.inStock || false,
      stockQuantity: product.stockQuantity || 0,
      supplierId: supplier?.id,
      supplierSlug: supplier?.storeSlug,
      supplierRating: parseFloat(supplier?.rating || '0')
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading supplier store...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-12 text-center max-w-md">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Supplier Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The supplier store you're looking for doesn't exist or is no longer available.
            </p>
            <Button onClick={() => setLocation("/suppliers")}>
              Browse All Suppliers
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const bannerImage = supplier.storeBanner || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=400&fit=crop';
  const logoImage = supplier.storeLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />

      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-secondary to-secondary/80 overflow-hidden">
        <img
          src={bannerImage}
          alt={supplier.storeName}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <main className="flex-1 -mt-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <Breadcrumb
              items={[
                { label: "Suppliers", href: "/suppliers" },
                { label: supplier.storeName, icon: Store }
              ]}
              className="text-white"
            />
          </div>

          {/* Supplier Header Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg border-4 border-white bg-white shadow-lg overflow-hidden">
                    <img
                      src={logoImage}
                      alt={supplier.storeName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{supplier.storeName}</h1>
                      <p className="text-lg text-muted-foreground mb-3">{supplier.businessName}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className="bg-primary/10 text-primary">
                          {getBusinessTypeLabel(supplier.businessType)}
                        </Badge>
                        <VerificationBadge
                          level={supplier.verificationLevel}
                          isVerified={supplier.isVerified}
                          size="md"
                        />
                        {supplier.isFeatured && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            <Award className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {supplier.city}, {supplier.country}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Since {supplier.yearEstablished || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {supplier.metrics?.totalViews || 0} views
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleFavorite}>
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button onClick={handleContact}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Supplier
                      </Button>
                    </div>
                  </div>

                  {supplier.storeDescription && (
                    <p className="text-muted-foreground mb-4">{supplier.storeDescription}</p>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <div>
                        <div className="font-semibold">{parseFloat(supplier.rating || '0').toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">{supplier.totalReviews || 0} reviews</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold">{supplier.metrics?.totalProducts || 0}</div>
                        <div className="text-xs text-muted-foreground">Products</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-semibold">{supplier.totalOrders || 0}</div>
                        <div className="text-xs text-muted-foreground">Total orders</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold">{supplier.responseTime || '< 24h'}</div>
                        <div className="text-xs text-muted-foreground">Response time</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="font-semibold">{parseFloat(supplier.responseRate || '100').toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Response rate</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className="font-semibold">{supplier.metrics?.totalInquiries || 0}</div>
                        <div className="text-xs text-muted-foreground">Inquiries</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button onClick={handleContact} size="lg">
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Supplier
              </Button>
              <Button variant="outline" onClick={handleFavorite}>
                <Heart className="w-4 h-4 mr-2" />
                Save Store
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {supplier.website && (
              <Button variant="outline" asChild>
                <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Website
                </a>
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="products" className="mb-8">
            <TabsList className="grid w-full grid-cols-5 max-w-3xl">
              <TabsTrigger value="products">
                <Package className="w-4 h-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger value="about">
                <Building2 className="w-4 h-4 mr-2" />
                About
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="w-4 h-4 mr-2" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="contact">
                <Phone className="w-4 h-4 mr-2" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="capabilities">
                <Factory className="w-4 h-4 mr-2" />
                Capabilities
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-6">
              <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Products</h2>
                    <p className="text-muted-foreground">
                      {filteredProducts.length} of {products.length} products
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                  </div>

                  {/* Product Stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span>{products.filter((p: any) => p.isFeatured).length} Featured</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4 text-green-500" />
                      <span>{products.filter((p: any) => p.inStock).length} In Stock</span>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {categories.length > 0 && (
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full md:w-[200px]">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name} ({category.productCount})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant={showFeaturedOnly ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                      >
                        <Award className="w-4 h-4 mr-1" />
                        Featured
                      </Button>
                      <Button
                        variant={showInStockOnly ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowInStockOnly(!showInStockOnly)}
                      >
                        <Package className="w-4 h-4 mr-1" />
                        In Stock
                      </Button>
                    </div>
                  </div>

                  {/* Quick Stats Bar */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span><strong>{filteredProducts.length}</strong> products shown</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span><strong>{products.filter((p: any) => p.isFeatured).length}</strong> featured</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span><strong>{products.filter((p: any) => p.inStock).length}</strong> in stock</span>
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      Updated {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product: any) => {
                    const transformedProduct = transformProductForCard(product);
                    return (
                      <ProductCard
                        key={product.id}
                        {...transformedProduct}
                        onContact={() => handleContact()}
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
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {searchQuery || selectedCategory !== "all" || showFeaturedOnly || showInStockOnly
                      ? "No Products Match Your Filters"
                      : "No Products Yet"
                    }
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedCategory !== "all" || showFeaturedOnly || showInStockOnly
                      ? "Try adjusting your search criteria or filters."
                      : "This supplier hasn't added any products yet."
                    }
                  </p>
                  {(searchQuery || selectedCategory !== "all" || showFeaturedOnly || showInStockOnly) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                        setShowFeaturedOnly(false);
                        setShowInStockOnly(false);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Card>
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Company Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {supplier.yearEstablished && (
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="font-medium">Year Established</div>
                              <div className="text-muted-foreground">{supplier.yearEstablished}</div>
                            </div>
                          </div>
                        )}
                        {supplier.employeesCount && (
                          <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="font-medium">Employees</div>
                              <div className="text-muted-foreground">{supplier.employeesCount}</div>
                            </div>
                          </div>
                        )}
                        {supplier.annualRevenue && (
                          <div className="flex items-start gap-3">
                            <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="font-medium">Annual Revenue</div>
                              <div className="text-muted-foreground">{supplier.annualRevenue}</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">Location</div>
                            <div className="text-muted-foreground">{supplier.city}, {supplier.country}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Factory className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">Business Type</div>
                            <div className="text-muted-foreground">{getBusinessTypeLabel(supplier.businessType)}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Target className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">Total Products</div>
                            <div className="text-muted-foreground">{supplier.metrics?.totalProducts || 0}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Main Products */}
                  {supplier.mainProducts && supplier.mainProducts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Main Products
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {supplier.mainProducts.map((product: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-sm">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Export Markets */}
                  {supplier.exportMarkets && supplier.exportMarkets.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Export Markets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {supplier.exportMarkets.map((market: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-sm">
                              {market}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Store Policies */}
                  {supplier.storePolicies && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Store Policies
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {supplier.storePolicies.shipping && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Shipping Policy
                            </h4>
                            <p className="text-sm text-muted-foreground">{supplier.storePolicies.shipping}</p>
                          </div>
                        )}
                        {supplier.storePolicies.returns && (
                          <div>
                            <h4 className="font-medium mb-2">Return Policy</h4>
                            <p className="text-sm text-muted-foreground">{supplier.storePolicies.returns}</p>
                          </div>
                        )}
                        {supplier.storePolicies.payment && (
                          <div>
                            <h4 className="font-medium mb-2">Payment Terms</h4>
                            <p className="text-sm text-muted-foreground">{supplier.storePolicies.payment}</p>
                          </div>
                        )}
                        {supplier.storePolicies.warranty && (
                          <div>
                            <h4 className="font-medium mb-2">Warranty</h4>
                            <p className="text-sm text-muted-foreground">{supplier.storePolicies.warranty}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Trust Indicators Sidebar */}
                <div className="lg:col-span-1">
                  <TrustIndicators
                    supplier={supplier}
                    variant="detailed"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <SupplierReviews
                supplierId={supplier.id}
                supplierName={supplier.storeName}
              />
            </TabsContent>

            <TabsContent value="contact" className="mt-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Contact Person</div>
                          <div className="text-muted-foreground">{supplier.contactPerson}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Phone</div>
                          <div className="text-muted-foreground">{supplier.phone}</div>
                        </div>
                      </div>
                      {supplier.whatsapp && (
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">WhatsApp</div>
                            <div className="text-muted-foreground">{supplier.whatsapp}</div>
                          </div>
                        </div>
                      )}
                      {supplier.website && (
                        <div className="flex items-start gap-3">
                          <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">Website</div>
                            <a
                              href={supplier.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {supplier.website}
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Address</div>
                          <div className="text-muted-foreground">
                            {supplier.address}<br />
                            {supplier.city}, {supplier.country}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <Button onClick={handleContact} className="w-full" size="lg">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Send Message to Supplier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="capabilities" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Production Capabilities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Factory className="w-5 h-5" />
                      Production Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Business Type</div>
                        <div className="font-semibold">{getBusinessTypeLabel(supplier.businessType)}</div>
                      </div>
                      {supplier.employeesCount && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Employees</div>
                          <div className="font-semibold">{supplier.employeesCount}</div>
                        </div>
                      )}
                      {supplier.annualRevenue && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Annual Revenue</div>
                          <div className="font-semibold">{supplier.annualRevenue}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Total Products</div>
                        <div className="font-semibold">{supplier.metrics?.totalProducts || 0}</div>
                      </div>
                    </div>

                    {supplier.mainProducts && supplier.mainProducts.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Main Product Categories</div>
                        <div className="flex flex-wrap gap-2">
                          {supplier.mainProducts.map((product: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Market Reach */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Market Reach
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Export Markets</div>
                      {supplier.exportMarkets && supplier.exportMarkets.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {supplier.exportMarkets.map((market: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {market}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No export markets specified</div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
                        <div className="font-semibold">{supplier.totalOrders || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Years in Business</div>
                        <div className="font-semibold">
                          {supplier.yearEstablished ? new Date().getFullYear() - supplier.yearEstablished : 'N/A'} years
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quality & Certifications */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Quality & Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="font-semibold">Verified Supplier</div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.verificationLevel} verification
                        </div>
                      </div>

                      <div className="text-center p-4 bg-muted rounded-lg">
                        <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2 fill-current" />
                        <div className="font-semibold">{parseFloat(supplier.rating || '0').toFixed(1)} Rating</div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.totalReviews || 0} customer reviews
                        </div>
                      </div>

                      <div className="text-center p-4 bg-muted rounded-lg">
                        <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                        <div className="font-semibold">{parseFloat(supplier.responseRate || '100').toFixed(0)}%</div>
                        <div className="text-sm text-muted-foreground">
                          Response rate ({supplier.responseTime || '< 24h'})
                        </div>
                      </div>
                    </div>

                    {/* Additional Quality Info */}
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3">Quality Assurance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Quality control system in place</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Regular product inspections</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Customer satisfaction guarantee</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Professional after-sales service</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* Quick Contact Button */}
        <Button
          onClick={handleContact}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 h-14 w-14 p-0"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        {/* Back to Top Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 h-12 w-12 p-0"
        >
          <TrendingUp className="w-5 h-5 rotate-[-90deg]" />
        </Button>
      </div>

      {/* Floating Chat Widget for Supplier Communication */}
      {supplier && (
        <FloatingChatWidget
          supplierId={supplier.id}
          supplierName={supplier.storeName}
          position="bottom-left"
        />
      )}

      {/* Mobile Sticky Contact Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 md:hidden z-40">
        <div className="flex gap-3">
          <Button onClick={handleContact} className="flex-1">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Supplier
          </Button>
          <Button variant="outline" onClick={handleFavorite}>
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Add bottom padding for mobile sticky bar */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
