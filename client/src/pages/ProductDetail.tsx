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
import { Card, CardContent } from "@/components/ui/card";
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
  ShoppingCart
} from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct } from "@/contexts/ProductContext";

export default function ProductDetail() {
  const { setLoading } = useLoading();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setCurrentProduct } = useProduct();
  const [, params] = useRoute("/product/:id");
  const productId = params?.id || "1";
  const [quantity, setQuantity] = useState(100);
  const [selectedImage, setSelectedImage] = useState(0);

  // Fetch product from API
  const { data: product, isLoading: isProductLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched product:", data);
        return data;
      } catch (error) {
        console.error("Error fetching product:", error);
        throw error;
      }
    },
  });

  // Fetch related products (same category)
  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", "related", product?.categoryId],
    queryFn: async () => {
      if (!product?.categoryId) return [];
      try {
        const response = await fetch("/api/products", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Filter by same category and exclude current product
        return Array.isArray(data) 
          ? data.filter((p: Product) => p.categoryId === product.categoryId && p.id !== productId).slice(0, 4)
          : [];
      } catch (error) {
        console.error("Error fetching related products:", error);
        return [];
      }
    },
    enabled: !!product?.categoryId,
  });

  useEffect(() => {
    if (isProductLoading) {
      setLoading(true, "Loading Product Details...");
    } else {
      setLoading(false);
    }
  }, [isProductLoading, setLoading]);

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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg text-muted-foreground">Loading product details...</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Link href="/products">
              <Button>Browse All Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Parse product data
  const images = product.images && product.images.length > 0 
    ? product.images 
    : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"];
  
  const priceRanges = product.priceRanges ? (typeof product.priceRanges === 'string' ? JSON.parse(product.priceRanges) : product.priceRanges) : [];
  // Ensure priceRanges is always an array
  const safePriceRanges = Array.isArray(priceRanges) ? priceRanges : [];
  const specifications = product.specifications ? (typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications) : {};
  const keyFeatures = product.keyFeatures || [];
  const colors = product.colors || [];
  const sizes = product.sizes || [];
  const certifications = product.certifications || [];
  const paymentTerms = product.paymentTerms || [];

  const getPriceForQuantity = (qty: number) => {
    if (safePriceRanges.length === 0) return "Contact for price";
    
    // Find the appropriate price range
    for (const range of safePriceRanges) {
      if (qty >= range.minQty && (!range.maxQty || qty <= range.maxQty)) {
        return `$${Number(range.pricePerUnit).toFixed(2)}`;
      }
    }
    
    // Return the last (highest quantity) price if quantity exceeds all ranges
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
        description: "You need to be signed in to contact the supplier.",
        variant: "destructive",
      });
      return;
    }
    
    // Set the current product in context for the global chat button
    if (product) {
      setCurrentProduct(product);
    }
    
    // Show a message that directs user to the chat button
    toast({
      title: "Chat Now Available",
      description: "Click the blue chat button on the right side to start a conversation about this product.",
      duration: 5000,
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3 sm:mb-4">
                    <img 
                      src={images[selectedImage]} 
                      alt="Product" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 ${
                          selectedImage === idx ? 'border-primary' : 'border-transparent'
                        }`}
                        data-testid={`button-image-${idx}`}
                      >
                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-success text-white text-xs sm:text-sm">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verified Supplier
                    </Badge>
                    {product.hasTradeAssurance && (
                      <Badge className="bg-primary text-xs sm:text-sm">Trade Assurance</Badge>
                    )}
                    {certifications.slice(0, 3).map((cert, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs sm:text-sm">{cert}</Badge>
                    ))}
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                    {product.name}
                  </h1>

                  {product.shortDescription && (
                    <p className="text-sm text-muted-foreground mb-4">{product.shortDescription}</p>
                  )}

                  <div className="mb-4 sm:mb-6">
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                      {getPriceForQuantity(quantity)} <span className="text-base sm:text-lg text-muted-foreground">/piece</span>
                    </div>
                    {safePriceRanges.length > 0 && (
                      <div className="space-y-1 text-xs sm:text-sm">
                        {safePriceRanges.map((range: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {range.minQty}{range.maxQty ? `-${range.maxQty}` : '+'} pieces:
                            </span>
                            <span className="font-medium">${Number(range.pricePerUnit).toFixed(2)}/piece</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
                    <div>
                      <p className="text-muted-foreground">MOQ:</p>
                      <p className="font-medium">{product.minOrderQuantity} pieces</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lead Time:</p>
                      <p className="font-medium">{product.leadTime || 'Contact for details'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sample:</p>
                      <p className="font-medium">
                        {product.sampleAvailable 
                          ? `Available${product.samplePrice ? ` ($${product.samplePrice})` : ''}`
                          : 'Not Available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customization:</p>
                      <p className="font-medium">{product.customizationAvailable ? 'Available' : 'Not Available'}</p>
                    </div>
                    {colors.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">Colors:</p>
                        <p className="font-medium">{colors.join(', ')}</p>
                      </div>
                    )}
                    {sizes.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">Sizes:</p>
                        <p className="font-medium">{sizes.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link href={`/start-order/${productId}`}>
                      <Button size="lg" className="w-full bg-gray-700 hover:bg-gray-800 text-white no-default-hover-elevate" data-testid="button-start-order">
                        <Package className="w-4 h-4 mr-2" />
                        Start Bulk Order
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="flex-1" 
                        onClick={handleContactSupplier}
                        data-testid="button-contact-supplier"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Chat now</span>
                        <span className="sm:hidden">Chat</span>
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        onClick={handleFavorite}
                        className={isFavorite(productId) ? 'text-red-500 border-red-500' : ''}
                        data-testid="button-add-favorite"
                      >
                        <Heart className={`w-4 h-4 ${isFavorite(productId) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                    <Button size="lg" variant="outline" className="w-full" data-testid="button-request-quotation">
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Request Quotation</span>
                      <span className="sm:hidden">Request Quote</span>
                    </Button>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="description" className="mt-6 sm:mt-8">
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
                  <TabsTrigger value="description" className="text-xs sm:text-sm" data-testid="tab-description">Description</TabsTrigger>
                  <TabsTrigger value="specs" className="text-xs sm:text-sm" data-testid="tab-specs">Specs</TabsTrigger>
                  <TabsTrigger value="company" className="text-xs sm:text-sm" data-testid="tab-company">Company</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs sm:text-sm" data-testid="tab-reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-4 sm:mt-6">
                  <div className="prose prose-sm sm:prose max-w-none">
                    <div className="text-sm sm:text-base whitespace-pre-wrap">
                      {product.description || 'No description available.'}
                    </div>
                    
                    {keyFeatures.length > 0 && (
                      <>
                        <h3 className="text-base sm:text-lg mt-6">Key Features:</h3>
                        <ul className="text-sm sm:text-base">
                          {keyFeatures.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {product.customizationAvailable && product.customizationDetails && (
                      <>
                        <h3 className="text-base sm:text-lg mt-6">Customization Options:</h3>
                        <p className="text-sm sm:text-base">{product.customizationDetails}</p>
                      </>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="specs" className="mt-4 sm:mt-6">
                  {Object.keys(specifications).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {Object.entries(specifications).map(([key, value]) => (
                        <div key={key} className="border-b pb-2 text-sm sm:text-base">
                          <p className="text-xs sm:text-sm text-muted-foreground">{key}</p>
                          <p className="font-medium">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No specifications available</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="company" className="mt-4 sm:mt-6">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start gap-4 mb-4 sm:mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                          <Award className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1 w-full">
                          <h3 className="text-base sm:text-lg font-semibold mb-2">Admin Supplier</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{product.port || 'Unknown Location'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                              <span>Verified Seller</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-success text-white text-xs">Verified</Badge>
                            {product.hasTradeAssurance && (
                              <Badge className="bg-primary text-white text-xs">Trade Assurance</Badge>
                            )}
                            {certifications.map((cert, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm border-t pt-4">
                        <div>
                          <p className="font-semibold text-sm sm:text-base">{product.views || 0}</p>
                          <p className="text-muted-foreground text-xs">Views</p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm sm:text-base">{product.inquiries || 0}</p>
                          <p className="text-muted-foreground text-xs">Inquiries</p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm sm:text-base">{product.inStock ? 'In Stock' : 'Out of Stock'}</p>
                          <p className="text-muted-foreground text-xs">Status</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-4 sm:mt-6">
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                    <p className="text-muted-foreground">Be the first to review this product after placing an order.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <InquiryForm 
                productId={productId}
                productName={product.name}
                productPrice={getPriceForQuantity(quantity)}
                supplierName="Admin Supplier"
              />
            </div>
          </div>

          {transformedRelatedProducts.length > 0 && (
            <section className="mt-10 sm:mt-16">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Related Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {transformedRelatedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
