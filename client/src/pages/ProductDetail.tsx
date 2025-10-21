import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLoading } from "@/contexts/LoadingContext";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { Product } from "@shared/schema";
import { 
  ShieldCheck, 
  MapPin, 
  Star, 
  Heart,
  MessageSquare,
  Package,
  Truck,
  Award,
  FileText,
  Loader2,
  ShoppingCart,
  ArrowLeft,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Eye,
  Download,
  Share2,
  Minus,
  Plus,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Target,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Info,
  AlertTriangle,
  ThumbsUp,
  Verified,
  Crown,
  Star as StarIcon,
  Play,
  Image as ImageIcon,
  Maximize2,
  RotateCcw,
  RefreshCw
} from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct } from "@/contexts/ProductContext";

export default function ProductDetail() {
  const { setLoading } = useLoading();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setCurrentProduct } = useProduct();
  const [, params] = useRoute("/product/:id");
  const productId = params?.id || "1";
  const [quantity, setQuantity] = useState(100);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Fetch product from API
  const { data: product, isLoading: isProductLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        return response.json();
      } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
      }
    },
  });

  // Fetch related products
  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        return Array.isArray(data) ? data.slice(0, 4) : [];
      } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
      }
    },
  });

  useEffect(() => {
    if (product) {
      setQuantity(product.minOrderQuantity || 100);
    }
  }, [product]);

  // Set current product in context
  useEffect(() => {
    if (product) {
      setCurrentProduct({
        id: product.id,
        name: product.name
      });
    }
    return () => {
      setCurrentProduct(null);
    };
  }, [product, setCurrentProduct]);

  if (isProductLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Product Details</h2>
            <p className="text-gray-600">Please wait while we fetch the product information...</p>
            <div className="mt-4 w-64 bg-gray-200 rounded-full h-2 mx-auto">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Product Not Found</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">The product you're looking for doesn't exist or has been removed from our marketplace.</p>
            <div className="flex gap-4 justify-center">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
            <Link href="/products">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Browse All Products
                </Link>
              </Button>
              <Button variant="outline" asChild className="px-8 py-3">
                <Link href="/">
                  Go to Homepage
            </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Parse product data
  const images = product.images && product.images.length > 0 
    ? product.images.filter(img => img && img.trim() !== '') // Filter out empty or invalid images
    : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"];
  
  // Ensure we have at least 2 images for thumbnails, duplicate the first image if needed
  const displayImages = images.length >= 2 ? images : [images[0], images[0]];
  
  const priceRanges = product.priceRanges ? (typeof product.priceRanges === 'string' ? JSON.parse(product.priceRanges) : product.priceRanges) : [];
  const safePriceRanges = Array.isArray(priceRanges) ? priceRanges : [];
  const specifications = product.specifications ? (typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications) : {};
  const keyFeatures = product.keyFeatures || [];
  const colors = product.colors || [];
  const sizes = product.sizes || [];
  const certifications = product.certifications || [];
  const paymentTerms = product.paymentTerms || [];

  const getPriceForQuantity = (qty: number) => {
    if (safePriceRanges.length === 0) return "Contact for price";
    
    for (const range of safePriceRanges) {
      if (qty >= range.minQty && (!range.maxQty || qty <= range.maxQty)) {
        return `$${Number(range.pricePerUnit).toFixed(2)}`;
      }
    }
    
    return `$${Number(safePriceRanges[safePriceRanges.length - 1].pricePerUnit).toFixed(2)}`;
  };

  const handleFavorite = () => {
    const wasFavorite = isFavorite(productId);
    toggleFavorite(productId);
    
    toast({
      title: wasFavorite ? "Removed from Favorites" : "Added to Favorites",
      description: wasFavorite 
        ? `${product.name} has been removed from your favorites.`
        : `${product.name} has been added to your favorites.`,
    });
  };

  const handleContactSupplier = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to contact the admin.",
        variant: "destructive",
      });
      return;
    }
    
      setCurrentProduct(product);
    
    toast({
      title: "Chat Now Available",
      description: "Click the blue chat button on the right side to start a conversation about this product.",
      duration: 5000,
    });
  };

  const handleRequestQuote = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to request a quote.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Quote Request Sent",
      description: "Your quote request has been sent to the admin. You'll receive a response within 24 hours.",
    });
  };

  const handleDownloadCatalog = () => {
    toast({
      title: "Catalog Download",
      description: "The product catalog is being prepared for download.",
    });
  };

  const handleScheduleMeeting = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to schedule a meeting.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Meeting Request",
      description: "Your meeting request has been sent to the admin.",
    });
  };

  const handleCallAdmin = () => {
    toast({
      title: "Call Admin",
      description: "Calling admin at +1 (555) 123-4567",
    });
  };

  const handleEmailAdmin = () => {
    toast({
      title: "Email Admin",
      description: "Opening email client to contact admin@globaltradehub.com",
    });
  };

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to add items to cart.",
        variant: "destructive",
      });
      return;
    }
    
    if (!product) return;

    // Transform product data for cart
    const priceRanges = product.priceRanges ? (typeof product.priceRanges === 'string' ? JSON.parse(product.priceRanges) : product.priceRanges) : [];
    const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;

    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] || '/placeholder-product.jpg',
      priceRange: priceRanges.length > 0 ? `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)} /piece` : 'Contact for price',
      moq: product.minOrderQuantity || 1,
      supplierName: 'Global Trade Hub Supplier',
      supplierCountry: 'Global',
      verified: true,
      tradeAssurance: product.hasTradeAssurance || false,
      readyToShip: product.inStock || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: product.certifications || [],
      leadTime: product.leadTime || '7-15 days',
      port: product.port || 'Any port',
      paymentTerms: product.paymentTerms || [],
      inStock: product.inStock || false,
      stockQuantity: product.stockQuantity || 0,
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} (${quantity} pieces) has been added to your cart.`,
    });
  };

  const handleSendInquiry = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to send an inquiry.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Inquiry Sent",
      description: "Your inquiry has been sent to the admin. You'll receive a response within 24 hours.",
    });
  };

  // Transform related products for ProductCard
  const transformedRelatedProducts = relatedProducts.map(p => {
    const pPriceRanges = p.priceRanges ? (typeof p.priceRanges === 'string' ? JSON.parse(p.priceRanges) : p.priceRanges) : [];
    const minPrice = pPriceRanges.length > 0 ? Math.min(...pPriceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const maxPrice = pPriceRanges.length > 0 ? Math.max(...pPriceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const pImages = p.images && p.images.length > 0 ? p.images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"];
    
    return {
      id: p.id,
      image: pImages[0],
      name: p.name,
      priceRange: pPriceRanges.length > 0 ? `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)} /piece` : 'Contact for price',
      moq: p.minOrderQuantity || 1,
      supplierName: "Admin Supplier",
      supplierCountry: "Unknown",
      responseRate: "95%",
      verified: true,
      tradeAssurance: p.hasTradeAssurance || false,
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Enhanced Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-12 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Link href="/products">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Products
                </Link>
              </Button>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium Product
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Verified className="w-3 h-3 mr-1" />
                    Verified Admin
                  </Badge>
                  {product.hasTradeAssurance && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Shield className="w-3 h-3 mr-1" />
                      Trade Assurance
                    </Badge>
                  )}
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium Quality
                  </Badge>
                </div>
                
                <h1 className="text-4xl font-bold mb-4 leading-tight">{product.name}</h1>
                <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                  {product.shortDescription || 'High-quality product from verified admin with trade assurance and premium quality guarantee.'}
                </p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>MOQ: {product.minOrderQuantity || 1} pieces</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Lead Time: {product.leadTime || '7-15 days'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Port: {product.port || 'Any port'}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-5xl font-bold mb-2">
                    {getPriceForQuantity(quantity)}
                  </div>
                  <div className="text-blue-100 text-lg mb-4">per piece</div>
                  <div className="text-sm text-blue-200">
                    For {quantity.toLocaleString()} pieces
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Enhanced Product Images */}
              <Card className="bg-white border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                      <div className="relative group">
                        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden mb-6">
                    <img 
                            src={displayImages[selectedImage]} 
                      alt="Product" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              onClick={() => setIsImageModalOpen(true)}
                            >
                              <Maximize2 className="w-4 h-4 mr-2" />
                              View Full Size
                            </Button>
                          </div>
                  </div>
                        <div className="grid grid-cols-2 gap-3">
                          {displayImages.slice(0, 2).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                selectedImage === idx 
                                  ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                              }`}
                      >
                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                        </div>
                  </div>
                </div>

                    <div className="space-y-8">
                <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h2>
                        {product.shortDescription && (
                          <p className="text-gray-600 text-sm leading-relaxed">{product.shortDescription}</p>
                        )}
                  </div>
                  
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {getPriceForQuantity(quantity)} <span className="text-sm text-gray-500">/piece</span>
                    </div>
                    {safePriceRanges.length > 0 && (
                            <div className="space-y-2 text-sm">
                              <div className="text-gray-600 font-medium mb-2">Volume Pricing:</div>
                        {safePriceRanges.map((range: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                                  <span className="text-gray-700">{range.minQty}{range.maxQty ? `-${range.maxQty}` : '+'} pieces:</span>
                                  <span className="font-semibold text-blue-600">${Number(range.pricePerUnit).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Order Quantity:</label>
                            <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuantity(Math.max(quantity - 10, product.minOrderQuantity || 1))}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(Number(e.target.value), product.minOrderQuantity || 1))}
                                className="w-20 h-8 text-center border-0 font-medium text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuantity(quantity + 10)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                    </div>
                    </div>
                          
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <div className="flex items-center gap-2 text-yellow-800 text-sm">
                              <Info className="w-3 h-3" />
                              <span className="font-medium">Minimum Order Quantity: {product.minOrderQuantity || 1} pieces</span>
                    </div>
                      </div>
                      </div>
                  </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Button 
                            onClick={handleAddToCart}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                          <Button 
                            onClick={handleSendInquiry}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Send an Inquiry to Admin
                      </Button>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleContactSupplier}
                              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded text-sm"
                      >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Contact Admin
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleFavorite}
                              className={`px-3 py-2 rounded border text-sm ${
                                isFavorite(productId) 
                                  ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100' 
                                  : 'hover:border-gray-300'
                              }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite(productId) ? 'fill-current' : ''}`} />
                      </Button>
                            <Button variant="outline" className="px-3 py-2 rounded border text-sm hover:border-gray-300">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                    </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" className="py-2 rounded border text-sm" onClick={handleRequestQuote}>
                            <FileText className="w-4 h-4 mr-1" />
                            Request Quote
                          </Button>
                          <Button variant="outline" className="py-2 rounded border text-sm" onClick={handleDownloadCatalog}>
                            <Download className="w-4 h-4 mr-1" />
                            Download Catalog
                    </Button>
                  </div>
                </div>
              </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Product Details Tabs */}
              <Card className="bg-white border-gray-100 shadow-xl">
                <CardContent className="p-8">
                  <Tabs defaultValue="description" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-xl p-1">
                      <TabsTrigger value="description" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Description
                      </TabsTrigger>
                      <TabsTrigger value="specifications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Layers className="w-4 h-4 mr-2" />
                        Specifications
                      </TabsTrigger>
                      <TabsTrigger value="features" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Features
                      </TabsTrigger>
                      <TabsTrigger value="shipping" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Truck className="w-4 h-4 mr-2" />
                        Shipping
                      </TabsTrigger>
                </TabsList>
                
                    <TabsContent value="description" className="mt-8">
                      <div className="prose max-w-none">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Product Description</h3>
                          <p className="text-gray-700 leading-relaxed text-lg">
                            {product.description || 'This is a high-quality product designed to meet your business needs. Our verified admin ensures premium quality and reliable delivery.'}
                          </p>
                        </div>
                    </div>
                    </TabsContent>
                    
                    <TabsContent value="specifications" className="mt-8">
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Technical Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-4 px-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                              <span className="font-semibold text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <span className="text-gray-600 font-medium">{String(value)}</span>
                            </div>
                          ))}
                          {Object.keys(specifications).length === 0 && (
                            <div className="col-span-2 text-center py-12">
                              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500 text-lg">No specifications available.</p>
                            </div>
                          )}
                        </div>
                  </div>
                </TabsContent>
                
                    <TabsContent value="features" className="mt-8">
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Features & Benefits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {keyFeatures.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                          {keyFeatures.length === 0 && (
                            <div className="col-span-2 text-center py-12">
                              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500 text-lg">No key features listed.</p>
                    </div>
                  )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="shipping" className="mt-8">
                      <div className="space-y-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Shipping & Payment Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-600" />
                                Shipping Information
                              </h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-gray-600">Lead Time:</span>
                                  <span className="font-semibold text-gray-900">{product.leadTime || '7-15 days'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-gray-600">Port:</span>
                                  <span className="font-semibold text-gray-900">{product.port || 'Any port'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-gray-600">Shipping Method:</span>
                                  <span className="font-semibold text-gray-900">Sea/Air/FedEx</span>
                                </div>
                            </div>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-green-600" />
                                Payment Terms
                              </h4>
                              <div className="space-y-3">
                                {paymentTerms.length > 0 ? (
                                  paymentTerms.map((term, idx) => (
                                    <div key={idx} className="flex items-center gap-3 py-2">
                                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      <span className="text-gray-700">{term}</span>
                                    </div>
                                  ))
                                ) : (
                                  <>
                                    <div className="flex items-center gap-3 py-2">
                                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      <span className="text-gray-700">T/T (Telegraphic Transfer)</span>
                                    </div>
                                    <div className="flex items-center gap-3 py-2">
                                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      <span className="text-gray-700">L/C (Letter of Credit)</span>
                                    </div>
                                    <div className="flex items-center gap-3 py-2">
                                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      <span className="text-gray-700">Western Union</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Admin Information */}
              <Card className="bg-white border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Admin Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                        <div>
                      <h3 className="font-bold text-gray-900 text-lg">Admin Supplier</h3>
                      <p className="text-sm text-gray-600">Verified Admin</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          {(Math.random() * 0.5 + 4.5).toFixed(1)} ({Math.floor(Math.random() * 200) + 50} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Location: Global</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Response Time: Within 24h</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Response Rate: {Math.floor(Math.random() * 10) + 90}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <ThumbsUp className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Transaction Level: {['Bronze', 'Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 4)]}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm" onClick={handleContactSupplier}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Admin
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="py-2 rounded border text-sm" onClick={handleCallAdmin}>
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm" className="py-2 rounded border text-sm" onClick={handleEmailAdmin}>
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Signals */}
              <Card className="bg-white border-gray-100 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                    Trust & Safety
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Verified className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                        <p className="font-semibold text-gray-900">Verified Admin</p>
                        <p className="text-xs text-gray-600">Identity verified</p>
                      </div>
                    </div>
                    
                    {product.hasTradeAssurance && (
                      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Trade Assurance</p>
                          <p className="text-xs text-gray-600">Order protection</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Award className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Quality Guarantee</p>
                        <p className="text-xs text-gray-600">High quality products</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inquiry Form */}
              <Card className="bg-white border-gray-100 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Send Inquiry to Admin
                  </CardTitle>
                  <p className="text-sm text-gray-600">Get more information about this product from our admin team</p>
                </CardHeader>
                <CardContent>
                  <InquiryForm 
                    productId={productId}
                    productName={product?.name || "Product"}
                    productPrice={product?.priceRanges ? (Array.isArray(product.priceRanges) && product.priceRanges.length > 0 ? `$${product.priceRanges[0].pricePerUnit}` : "Contact for price") : "Contact for price"}
                    supplierName="Global Trade Hub Admin"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Related Products */}
          {transformedRelatedProducts.length > 0 && (
            <section className="mt-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Products</h2>
                <p className="text-gray-600 text-lg">Discover more products from our verified admins</p>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mt-4 rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {transformedRelatedProducts.map((relatedProduct) => (
                  <ProductCard 
                    key={relatedProduct.id} 
                    {...relatedProduct}
                    onAddToCart={() => {
                      if (!user) {
                        toast({
                          title: "Please Sign In",
                          description: "You need to be signed in to add items to cart.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      addToCart({
                        productId: relatedProduct.id,
                        name: relatedProduct.name,
                        image: relatedProduct.image,
                        priceRange: relatedProduct.priceRange,
                        moq: relatedProduct.moq,
                        supplierName: relatedProduct.supplierName,
                        supplierCountry: relatedProduct.supplierCountry,
                        verified: relatedProduct.verified,
                        tradeAssurance: relatedProduct.tradeAssurance,
                        readyToShip: false,
                        sampleAvailable: false,
                        customizationAvailable: false,
                        certifications: [],
                        leadTime: '7-15 days',
                        port: 'Any port',
                        paymentTerms: [],
                        inStock: true,
                        stockQuantity: 0,
                      });

                      toast({
                        title: "Added to Cart",
                        description: `${relatedProduct.name} has been added to your cart.`,
                      });
                    }}
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
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Button variant="outline" size="sm" asChild className="px-6 py-2 rounded border text-sm">
                  <Link href="/products">
                    View All Products
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}