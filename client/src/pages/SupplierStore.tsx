import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Store
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import VerificationBadge from "@/components/VerificationBadge";
import TrustIndicators from "@/components/TrustIndicators";
import SupplierReviews from "@/components/SupplierReviews";
import  Breadcrumb  from "@/components/Breadcrumb";

export default function SupplierStore() {
  const [, params] = useRoute("/suppliers/:slug");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const slug = params?.slug;

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

      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-blue-900 to-blue-700 overflow-hidden">
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
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {getBusinessTypeLabel(supplier.businessType)}
                        </Badge>
                        <VerificationBadge 
                          level={supplier.verificationLevel}
                          isVerified={supplier.isVerified}
                          size="md"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <div>
                        <div className="font-semibold">{parseFloat(supplier.rating).toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">{supplier.totalReviews} reviews</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-semibold">{supplier.totalOrders}</div>
                        <div className="text-xs text-muted-foreground">Total orders</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-semibold">{supplier.responseTime || '< 24h'}</div>
                        <div className="text-xs text-muted-foreground">Response time</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="font-semibold">{parseFloat(supplier.responseRate).toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">Response rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="products" className="mb-8">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">Products</h2>
                <p className="text-muted-foreground">{products.length} products available</p>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product: any) => {
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
                  <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
                  <p className="text-gray-600">
                    This supplier hasn't added any products yet.
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Company Information</h3>
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
                    </div>
                  </div>

                  {supplier.mainProducts && supplier.mainProducts.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Main Products</h3>
                      <div className="flex flex-wrap gap-2">
                        {supplier.mainProducts.map((product: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {supplier.exportMarkets && supplier.exportMarkets.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Export Markets</h3>
                      <div className="flex flex-wrap gap-2">
                        {supplier.exportMarkets.map((market: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {market}
                          </Badge>
                        ))}
                      </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Floating Chat Widget for Supplier Communication */}
      {supplier && (
        <FloatingChatWidget
          supplierId={supplier.id}
          supplierName={supplier.storeName}
          position="bottom-right"
        />
      )}
    </div>
  );
}
