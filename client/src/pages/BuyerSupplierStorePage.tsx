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
  Building2,
  Package,
  Globe,
  Phone,
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
  Eye,
  Heart,
  Share2,
  ExternalLink,
  Truck,
  Shield,
  Zap,
  Factory,
  Target,
  BarChart3,
  Mail,
  ArrowLeft,
  Filter
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import VerificationBadge from "@/components/VerificationBadge";
import TrustIndicators from "@/components/TrustIndicators";
import SupplierReviews from "@/components/SupplierReviews";

export default function BuyerSupplierStorePage() {
  const [, params] = useRoute("/store/:slug");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const slug = params?.slug;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

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

  // Filter and sort products
  let filteredProducts = products.filter((product: any) => {
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

  // Sort products
  filteredProducts = filteredProducts.sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "featured":
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      default:
        return 0;
    }
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
      views: product.views || 0,
      inquiries: product.inquiries || 0,
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
            <h3 className="text-xl font-semibold mb-2">Supplier Store Not Found</h3>
            <p className="text-gray-600 mb-4">
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

      {/* Hero Section with Store Banner */}
      <div className="relative h-80 bg-gradient-to-r from-primary to-orange-600 overflow-hidden">
        <img
          src={bannerImage}
          alt={supplier.storeName}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Button
            variant="outline"
            onClick={() => setLocation("/suppliers")}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Button>
        </div>

        {/* Store Logo and Basic Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto flex items-end gap-6">
            <div className="w-24 h-24 rounded-xl border-4 border-white bg-white shadow-xl overflow-hidden flex-shrink-0">
              <img
                src={logoImage}
                alt={supplier.storeName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-white flex-1 pb-2">
              <h1 className="text-3xl font-bold mb-2">{supplier.storeName}</h1>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {supplier.city}, {supplier.country}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  {parseFloat(supplier.rating || '0').toFixed(1)} ({supplier.totalReviews || 0} reviews)
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {supplier.metrics?.totalProducts || 0} products
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary">
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
                  Featured Supplier
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleFavorite}>
                <Heart className="w-4 h-4 mr-2" />
                Save Store
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleContact} size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Supplier
              </Button>
            </div>
          </div>

          {/* Store Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card className="text-center p-4">
              <Star className="w-8 h-8 text-yellow-500 fill-current mx-auto mb-2" />
              <div className="font-bold text-lg">{parseFloat(supplier.rating || '0').toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">{supplier.totalReviews || 0} reviews</div>
            </Card>
            <Card className="text-center p-4">
              <Package className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="font-bold text-lg">{supplier.metrics?.totalProducts || 0}</div>
              <div className="text-xs text-muted-foreground">Products</div>
            </Card>
            <Card className="text-center p-4">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="font-bold text-lg">{supplier.totalOrders || 0}</div>
              <div className="text-xs text-muted-foreground">Orders</div>
            </Card>
            <Card className="text-center p-4">
              <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="font-bold text-lg">{supplier.responseTime || '< 24h'}</div>
              <div className="text-xs text-muted-foreground">Response time</div>
            </Card>
            <Card className="text-center p-4">
              <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="font-bold text-lg">{parseFloat(supplier.responseRate || '100').toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Response rate</div>
            </Card>
            <Card className="text-center p-4">
              <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="font-bold text-lg">{supplier.yearEstablished ? new Date().getFullYear() - supplier.yearEstablished : 'N/A'}</div>
              <div className="text-xs text-muted-foreground">Years in business</div>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="products" className="mb-8">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                About
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              {/* Product Filters */}
              <Card className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
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
                      <SelectTrigger className="w-full lg:w-[200px]">
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

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full lg:w-[150px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="featured">Featured First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={showFeaturedOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Featured Only
                  </Button>
                  <Button
                    variant={showInStockOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowInStockOnly(!showInStockOnly)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    In Stock Only
                  </Button>

                  {(searchQuery || selectedCategory !== "all" || showFeaturedOnly || showInStockOnly) && (
                    <Button
                      variant="ghost"
                      size="sm"
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
                </div>

                {/* Results Summary */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
                      {searchQuery && ` for "${searchQuery}"`}
                    </span>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{products.filter((p: any) => p.isFeatured).length} featured</span>
                      <span>{products.filter((p: any) => p.inStock).length} in stock</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Products Grid */}
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
                            title: "Quote Request Sent",
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
                      : "No Products Available"
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || selectedCategory !== "all" || showFeaturedOnly || showInStockOnly
                      ? "Try adjusting your search criteria or filters."
                      : "This supplier hasn't added any products yet."
                    }
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Company Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {supplier.storeDescription && (
                        <p className="text-muted-foreground mb-6">{supplier.storeDescription}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="font-medium text-sm text-muted-foreground">Business Name</div>
                            <div className="font-semibold">{supplier.businessName}</div>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-muted-foreground">Business Type</div>
                            <div className="font-semibold">{getBusinessTypeLabel(supplier.businessType)}</div>
                          </div>
                          {supplier.yearEstablished && (
                            <div>
                              <div className="font-medium text-sm text-muted-foreground">Year Established</div>
                              <div className="font-semibold">{supplier.yearEstablished}</div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="font-medium text-sm text-muted-foreground">Location</div>
                            <div className="font-semibold">{supplier.city}, {supplier.country}</div>
                          </div>
                          {supplier.employeesCount && (
                            <div>
                              <div className="font-medium text-sm text-muted-foreground">Employees</div>
                              <div className="font-semibold">{supplier.employeesCount}</div>
                            </div>
                          )}
                          {supplier.annualRevenue && (
                            <div>
                              <div className="font-medium text-sm text-muted-foreground">Annual Revenue</div>
                              <div className="font-semibold">{supplier.annualRevenue}</div>
                            </div>
                          )}
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

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <SupplierReviews
                supplierId={supplier.id}
                supplierName={supplier.storeName}
              />
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Contact Person</div>
                        <div className="text-muted-foreground">{supplier.contactPerson}</div>
                        {supplier.position && (
                          <div className="text-sm text-muted-foreground">{supplier.position}</div>
                        )}
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Send Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Get in touch with {supplier.storeName} directly for inquiries, quotes, or more information about their products.
                      </p>
                      <Button onClick={handleContact} className="w-full" size="lg">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Start Conversation
                      </Button>
                      <div className="text-center text-sm text-muted-foreground">
                        Average response time: {supplier.responseTime || '< 24h'}
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

      {/* Mobile Sticky Contact Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 md:hidden z-50">
        <div className="flex gap-3">
          <Button onClick={handleContact} className="flex-1">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact
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