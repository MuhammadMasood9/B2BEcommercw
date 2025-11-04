import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useCart } from "@/contexts/CartContext";
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ShoppingCart, 
  MessageSquare,
  FileText,
  Package,
  Loader2
} from "lucide-react";
import type { Product } from "@shared/schema";

import ProductImageGallery from "@/components/buyer/ProductImageGallery";
import SupplierInfoCard from "@/components/buyer/SupplierInfoCard";
import PricingTiers from "@/components/buyer/PricingTiers";
import ProductSpecifications from "@/components/buyer/ProductSpecifications";
import RelatedProducts from "@/components/buyer/RelatedProducts";

interface ProductDetailPageProps {
  productId?: string;
}

export default function ProductDetailPage({ productId: propProductId }: ProductDetailPageProps) {
  const [, params] = useParams() as [boolean, { id?: string }];
  const productId = propProductId || params?.id || "";
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Fetch product data
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return response.json();
    },
    enabled: !!productId,
  });

  // Fetch supplier data
  const { data: supplier } = useQuery({
    queryKey: ["/api/suppliers", product?.supplierId],
    queryFn: async () => {
      if (!product?.supplierId) return null;
      const response = await fetch(`/api/suppliers/${product.supplierId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!product?.supplierId,
  });

  // Set initial quantity to MOQ
  useEffect(() => {
    if (product) {
      setQuantity(product.minOrderQuantity || 1);
    }
  }, [product]);

  const handleFavorite = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to add favorites.",
        variant: "destructive",
      });
      return;
    }

    const wasFavorite = isFavorite(productId);
    toggleFavorite(productId);
    
    toast({
      title: wasFavorite ? "Removed from Favorites" : "Added to Favorites",
      description: wasFavorite 
        ? `${product?.name} has been removed from your favorites.`
        : `${product?.name} has been added to your favorites.`,
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.shortDescription || undefined,
          url: url,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Product link copied to clipboard.",
        });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Product link copied to clipboard.",
      });
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

    // Parse price ranges
    const priceRanges = product.priceRanges ? 
      (typeof product.priceRanges === 'string' ? JSON.parse(product.priceRanges) : product.priceRanges) : [];
    const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;

    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] || '/placeholder-product.jpg',
      priceRange: priceRanges.length > 0 ? `${minPrice.toFixed(2)}-${maxPrice.toFixed(2)} /piece` : 'Contact for price',
      moq: product.minOrderQuantity || 1,
      supplierName: supplier?.businessName || 'Supplier',
      supplierCountry: supplier?.country || 'Unknown',
      verified: supplier?.isVerified || false,
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
    
    // Navigate to inquiry form or open modal
    window.location.href = `/inquiry/create?productId=${productId}&supplierId=${product?.supplierId || ""}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Product Details</h2>
          <p className="text-gray-600">Please wait while we fetch the product information...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Product Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
        <Link href="/products" className="hover:text-blue-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" asChild>
          <Link href="/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFavorite}
            className={isFavorite(productId) ? "text-red-600 border-red-200 bg-red-50" : ""}
          >
            <Heart className={`w-4 h-4 ${isFavorite(productId) ? 'fill-current' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Product Images and Basic Info */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ProductImageGallery 
                  images={product.images || []} 
                  videos={product.videos || []}
                  productName={product.name}
                />
                
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    {product.shortDescription && (
                      <p className="text-gray-600 leading-relaxed">
                        {product.shortDescription}
                      </p>
                    )}
                  </div>

                  <PricingTiers 
                    priceRanges={product.priceRanges}
                    minOrderQuantity={product.minOrderQuantity || 1}
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                  />

                  <div className="space-y-3">
                    <Button 
                      onClick={handleAddToCart}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    
                    <Button 
                      onClick={handleSendInquiry}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Inquiry
                    </Button>

                    <Button 
                      asChild
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Link href={`/rfq/create?productId=${productId}`}>
                        <FileText className="w-4 h-4 mr-2" />
                        Request Quote (RFQ)
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details Tabs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="specifications">Specifications</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-6">
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {product.description || 'No description available.'}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="specifications" className="mt-6">
                  <ProductSpecifications specifications={product.specifications} />
                </TabsContent>
                
                <TabsContent value="features" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Key Features</h3>
                    {product.keyFeatures && product.keyFeatures.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.keyFeatures.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No key features listed.</p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="shipping" className="mt-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Shipping & Payment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Shipping Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lead Time:</span>
                            <span className="font-medium">{product.leadTime || '7-15 days'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Port:</span>
                            <span className="font-medium">{product.port || 'Any port'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Payment Terms</h4>
                        <div className="space-y-2">
                          {product.paymentTerms && product.paymentTerms.length > 0 ? (
                            product.paymentTerms.map((term, idx) => (
                              <div key={idx} className="text-sm text-gray-700">• {term}</div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">Contact supplier for payment terms</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Related Products */}
          <RelatedProducts 
            currentProductId={productId}
            categoryId={product.categoryId || undefined}
            supplierId={product.supplierId || undefined}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SupplierInfoCard 
            supplier={supplier}
            productId={productId}
          />
        </div>
      </div>
    </div>
  );
}