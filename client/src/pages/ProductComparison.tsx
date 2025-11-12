import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import {
  ArrowLeft,
  Star,
  Package,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Building2,
  ShieldCheck,
  Award
} from "lucide-react";
import { Link } from "wouter";

export default function ProductComparison() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [productIds, setProductIds] = useState<string[]>([]);

  // Parse product IDs from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get('ids');
    if (ids) {
      setProductIds(ids.split(',').filter(id => id.trim()));
    }
  }, [location]);

  // Fetch products for comparison
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/compare", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      
      try {
        const promises = productIds.map(id =>
          fetch(`/api/products/${id}`).then(res => res.ok ? res.json() : null)
        );
        const results = await Promise.all(promises);
        return results.filter(p => p !== null);
      } catch (error) {
        console.error('Error fetching products for comparison:', error);
        return [];
      }
    },
    enabled: productIds.length > 0,
  });

  const getPrice = (product: Product) => {
    const priceRanges = product.priceRanges 
      ? (typeof product.priceRanges === 'string' ? JSON.parse(product.priceRanges) : product.priceRanges)
      : [];
    if (priceRanges.length === 0) return 'Contact for price';
    const minPrice = Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit)));
    const maxPrice = Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit)));
    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  };

  const getImage = (product: Product) => {
    const images = product.images && product.images.length > 0 
      ? product.images 
      : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"];
    return images[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products for comparison...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products to Compare</h2>
            <p className="text-gray-600 mb-6">Please select products from the product listing page to compare.</p>
            <Button asChild>
              <Link href="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-orange-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Link href="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Link>
            </Button>
            
            <h1 className="text-4xl font-bold mb-2">Product Comparison</h1>
            <p className="text-orange-100">Compare {products.length} products side by side</p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square bg-gray-100">
                      <img 
                        src={getImage(product)} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          <Building2 className="w-3 h-3 mr-1" />
                          Admin Supplier
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Price */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Price Range</div>
                        <div className="text-2xl font-bold text-primary">{getPrice(product)}</div>
                      </div>

                      {/* MOQ */}
                      <div className="flex items-center justify-between py-2 border-t">
                        <span className="text-sm text-gray-600">MOQ</span>
                        <span className="font-semibold">{product.minOrderQuantity || 1} pieces</span>
                      </div>

                      {/* Lead Time */}
                      <div className="flex items-center justify-between py-2 border-t">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Lead Time
                        </span>
                        <span className="font-semibold">{product.leadTime || '7-15 days'}</span>
                      </div>

                      {/* Port */}
                      <div className="flex items-center justify-between py-2 border-t">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Port
                        </span>
                        <span className="font-semibold text-sm">{product.port || 'Any port'}</span>
                      </div>

                      {/* Features */}
                      <div className="py-2 border-t">
                        <div className="text-sm text-gray-600 mb-2">Features</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {product.hasTradeAssurance ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm">Trade Assurance</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {product.inStock ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm">In Stock</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {product.sampleAvailable ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm">Sample Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {product.customizationAvailable ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" />
                            )}
                            <span className="text-sm">Customization</span>
                          </div>
                        </div>
                      </div>

                      {/* Certifications */}
                      {product.certifications && product.certifications.length > 0 && (
                        <div className="py-2 border-t">
                          <div className="text-sm text-gray-600 mb-2">Certifications</div>
                          <div className="flex flex-wrap gap-1">
                            {product.certifications.map((cert, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-4 space-y-2">
                        <Button asChild className="w-full">
                          <Link href={`/product/${product.id}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full">
                          Contact Supplier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
