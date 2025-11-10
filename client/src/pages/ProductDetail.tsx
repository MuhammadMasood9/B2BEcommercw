import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Store,
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
import InquiryDialog from "@/components/InquiryDialog";
import FloatingActionButtons from "@/components/FloatingActionButtons";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct } from "@/contexts/ProductContext";
import SupplierInfoCard from "@/components/SupplierInfoCard";
import type { SupplierProfile } from "@shared/schema";
import Breadcrumb from "@/components/Breadcrumb";

export default function ProductDetail() {
  const queryClient = useQueryClient();
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
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");

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

  // Fetch supplier information if product has supplierId
  const { data: supplier } = useQuery<SupplierProfile>({
    queryKey: ["/api/suppliers", product?.supplierId],
    queryFn: async () => {
      if (!product?.supplierId) return null;
      try {
        const response = await fetch(`/api/suppliers/${product.supplierId}/profile`);
        if (!response.ok) return null;
        return response.json();
      } catch (error) {
        console.error('Error fetching supplier:', error);
        return null;
      }
    },
    enabled: !!product?.supplierId,
  });

  // Fetch related products (limit to 4 products)
  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/related"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/products?limit=4');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        return Array.isArray(data) ? data.slice(0, 4) : [];
      } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
      }
    },
  });

  // Fetch product reviews
  const { data: productReviews = [], isLoading: isReviewsLoading } = useQuery<any[]>({
    queryKey: ["/api/products", productId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/reviews`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Derived review stats
  const totalReviews = Array.isArray(productReviews) ? productReviews.length : 0;
  const averageRating = totalReviews > 0 ? (
    productReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / totalReviews
  ) : 0;
  const ratingBuckets = [5,4,3,2,1].map(star => ({
    star,
    count: productReviews.filter((r: any) => Number(r.rating) === star).length
  }));

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
    
    // Navigate to product-specific chat
    window.location.href = `/messages?productId=${product.id}&productName=${encodeURIComponent(product.name)}&chatType=product`;
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

  const submitReview = async () => {
    if (!user) {
      toast({ title: "Please Sign In", description: "Login to leave a review.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, rating: reviewRating, comment: reviewComment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to submit review');
      setReviewComment("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
      toast({ title: "Review submitted", description: "Thanks for your feedback!" });
    } catch (e: any) {
      toast({ title: "Cannot submit review", description: e.message, variant: "destructive" });
    }
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
    setIsInquiryDialogOpen(true);
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
            {/* Breadcrumb Navigation */}
            <div className="mb-4">
              <Breadcrumb 
                items={[
                  { label: "Products", href: "/products" },
                  ...(supplier ? [
                    { label: supplier.storeName, href: `/suppliers/${supplier.storeSlug}`, icon: Store }
                  ] : []),
                  { label: product.name }
                ]}
                className="text-white/80"
              />
            </div>

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
                <p className="text-blue-100 text-lg mb-6 leading-relaxed whitespace-pre-wrap">
                  {product.shortDescription?.replace(/\\n/g, '\n').replace(/@/g, '') || 'High-quality product from verified admin with trade assurance and premium quality guarantee.'}
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
                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {product.shortDescription.replace(/\\n/g, '\n').replace(/@/g, '')}
                          </p>
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
                          <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                            {product.description?.replace(/\\n/g, '\n').replace(/@/g, '') || 'This is a high-quality product designed to meet your business needs. Our verified admin ensures premium quality and reliable delivery.'}
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
              {/* Supplier Information */}
              <SupplierInfoCard
                supplierId={supplier?.id || product.supplierId}
                supplierName={supplier?.storeName || supplier?.businessName || "Admin Supplier"}
                supplierSlug={supplier?.storeSlug}
                supplierLogo={supplier?.storeLogo}
                supplierCountry={supplier?.country || "Global"}
                supplierCity={supplier?.city}
                supplierType={supplier?.businessType || "manufacturer"}
                supplierRating={supplier?.rating ? Number(supplier.rating) : 4.8}
                supplierReviews={supplier?.totalReviews || 0}
                supplierResponseRate={supplier?.responseRate ? Number(supplier.responseRate) : 95}
                supplierResponseTime={supplier?.responseTime || "< 24h"}
                supplierVerified={supplier?.isVerified || true}
                supplierYearEstablished={supplier?.yearEstablished}
                supplierTotalProducts={0}
                onContact={handleContactSupplier}
                onVisitStore={() => {
                  if (supplier?.storeSlug) {
                    window.location.href = `/supplier/${supplier.storeSlug}`;
                  }
                }}
              />

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
                  <Button 
                    onClick={handleSendInquiry}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Send Inquiry to Admin
                  </Button>
                </CardContent>
              </Card>

              {/* Request for Quotation Section */}
              <Card className="shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Request for Quotation (RFQ)
                  </CardTitle>
                  <p className="text-sm text-gray-600">Get a customized quote for bulk orders of this product</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700 mb-4">
                      Need this product in large quantities? Create an RFQ and get competitive quotes from our verified admin.
                    </p>
                    
                    <Button 
                      asChild
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      <Link href={`/rfq/create?productId=${productId}&productName=${encodeURIComponent(product.name)}`}>
                        <FileText className="w-5 h-5 mr-2" />
                        Create RFQ for This Product
                      </Link>
                    </Button>

                    <div className="mt-4 p-4 bg-white/50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">What's included:</h4>
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Custom pricing for bulk orders
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Flexible payment terms
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Trade assurance protection
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Fast response from admin
                        </li>
                      </ul>
                    </div>
                  </div>
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

      {/* Inquiry Dialog */}
      {product && (
        <InquiryDialog
          isOpen={isInquiryDialogOpen}
          onClose={() => setIsInquiryDialogOpen(false)}
          product={{
            id: productId,
            name: product.name,
            priceRange: product.priceRanges ? (Array.isArray(product.priceRanges) && product.priceRanges.length > 0 ? `$${product.priceRanges[0].pricePerUnit}` : "Contact for price") : "Contact for price",
            moq: 1,
            supplierName: "Global Trade Hub Admin",
            supplierCountry: "USA",
            leadTime: product.leadTime || undefined,
            paymentTerms: product.paymentTerms || undefined,
            image: product.images?.[0]
          }}
        />
      )}

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-12">
        <Card className="shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="w-5 h-5 text-yellow-500" />
              Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-gray-100 p-6 bg-gradient-to-br from-gray-50 to-white">
                  <div className="text-4xl font-bold text-gray-900 mb-1">{averageRating.toFixed(1)}</div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
                  <div className="mt-4 space-y-2">
                    {ratingBuckets.map(b => {
                      const pct = totalReviews ? Math.round((b.count / totalReviews) * 100) : 0;
                      return (
                        <div key={b.star} className="flex items-center gap-2">
                          <span className="w-8 text-xs text-gray-700">{b.star}★</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400" style={{ width: pct + '%' }} />
                          </div>
                          <span className="w-10 text-xs text-gray-500 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reviews list + form */}
              <div className="lg:col-span-2 space-y-8">
                {/* List reviews */}
                <div className="space-y-4">
                  {isReviewsLoading ? (
                    <div className="text-sm text-gray-500">Loading reviews...</div>
                  ) : productReviews.length === 0 ? (
                    <div className="text-sm text-gray-500">No reviews yet. Be the first to review this product.</div>
                  ) : (
                    productReviews.slice(0, 6).map((r: any) => (
                      <div key={r.id} className="border border-gray-100 rounded-2xl p-4 bg-white/60">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                            {(r.buyerName?.[0] || String(r.buyerId || '?').slice(0,1)).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">{r.buyerName || 'Verified Buyer'}</span>
                                {r.orderReference && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Order #{String(r.orderReference).slice(-6)}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < Number(r.rating || 0) ? 'fill-current' : ''}`} />
                              ))}
                            </div>
                            {r.comment && <p className={`text-sm text-gray-700 mt-2 whitespace-pre-wrap ${r.comment.length>180?'leading-6':''}`}>{r.comment}</p>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add review */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                  <h4 className="font-semibold text-gray-900 mb-3">Write a review</h4>
                  <div className="flex items-center gap-2 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setReviewRating(i + 1)} className="focus:outline-none">
                        <Star className={`w-6 h-6 ${i < reviewRating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="min-h-[90px] bg-white"
                  />
                  <div className="mt-3">
                    <Button onClick={submitReview} className="bg-blue-600 hover:bg-blue-700 text-white">Submit Review</Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Only buyers with shipped or delivered orders can submit a review. We’ll verify your order automatically.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />

      {/* Floating Action Buttons for Product Chat */}
      <FloatingActionButtons 
        // unreadCount={0} 
        chatType="product" 
        productId={productId}
        productName={product.name}
      />

      {/* Floating Chat Widget for Supplier Communication */}
      {product.supplierId && supplier && (
        <FloatingChatWidget
          supplierId={product.supplierId}
          supplierName={supplier.storeName}
          productId={product.id}
          productName={product.name}
          position="bottom-right"
        />
      )}
    </div>
  );
}