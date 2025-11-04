import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  ArrowRight, 
  Star, 
  Package, 
  Loader2,
  ShoppingCart,
  Eye
} from "lucide-react";
import type { Product } from "@shared/schema";

interface RelatedProductsProps {
  currentProductId: string;
  categoryId?: string;
  supplierId?: string;
}

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  // Parse price ranges
  const priceRanges = product.priceRanges ? 
    (typeof product.priceRanges === 'string' ? JSON.parse(product.priceRanges) : product.priceRanges) : [];
  
  const minPrice = priceRanges.length > 0 ? 
    Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
  const maxPrice = priceRanges.length > 0 ? 
    Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;

  const priceDisplay = priceRanges.length > 0 ? 
    (minPrice === maxPrice ? 
      `$${minPrice.toFixed(2)}` : 
      `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
    ) : 'Contact for price';

  const image = product.images && product.images.length > 0 ? 
    product.images[0] : 
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <Link href={`/product/${product.id}`}>
        <CardContent className="p-0">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            <img 
              src={image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                <Button size="sm" variant="secondary">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="secondary">
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.sampleAvailable && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  Sample Available
                </Badge>
              )}
              {product.hasTradeAssurance && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  Trade Assurance
                </Badge>
              )}
            </div>

            {/* MOQ Badge */}
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="bg-white/90 text-xs">
                MOQ: {product.minOrderQuantity || 1}
              </Badge>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
              {product.shortDescription && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-blue-600 text-lg">
                  {priceDisplay}
                </div>
                {priceRanges.length > 0 && (
                  <div className="text-xs text-gray-500">per piece</div>
                )}
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">
                  {(Math.random() * 0.5 + 4.5).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-1">
              {product.certifications && product.certifications.slice(0, 2).map((cert, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {cert}
                </Badge>
              ))}
              {product.inStock && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  In Stock
                </Badge>
              )}
            </div>

            {/* Lead Time */}
            {product.leadTime && (
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Lead time: {product.leadTime}
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

export default function RelatedProducts({ currentProductId, categoryId, supplierId }: RelatedProductsProps) {
  // Fetch related products from same category
  const { data: categoryProducts = [], isLoading: isCategoryLoading } = useQuery<Product[]>({
    queryKey: ["/api/buyer/products/filtered", { categoryId, exclude: currentProductId }],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const params = new URLSearchParams({
        categoryId,
        limit: '6',
        offset: '0'
      });
      
      const response = await fetch(`/api/buyer/products/filtered?${params}`);
      if (!response.ok) return [];
      
      const products = await response.json();
      return Array.isArray(products) ? 
        products.filter(p => p.id !== currentProductId).slice(0, 4) : [];
    },
    enabled: !!categoryId,
  });

  // Fetch products from same supplier
  const { data: supplierProducts = [], isLoading: isSupplierLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/by-supplier", supplierId, { exclude: currentProductId }],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const response = await fetch(`/api/products?supplierId=${supplierId}&limit=4`);
      if (!response.ok) return [];
      
      const products = await response.json();
      return Array.isArray(products) ? 
        products.filter(p => p.id !== currentProductId).slice(0, 4) : [];
    },
    enabled: !!supplierId,
  });

  // Fetch trending/popular products as fallback
  const { data: trendingProducts = [], isLoading: isTrendingLoading } = useQuery<Product[]>({
    queryKey: ["/api/buyer/products/filtered", { sort: "popularity", exclude: currentProductId }],
    queryFn: async () => {
      const params = new URLSearchParams({
        sort: 'popularity',
        limit: '4',
        offset: '0'
      });
      
      const response = await fetch(`/api/buyer/products/filtered?${params}`);
      if (!response.ok) return [];
      
      const products = await response.json();
      return Array.isArray(products) ? 
        products.filter(p => p.id !== currentProductId).slice(0, 4) : [];
    },
  });

  const isLoading = isCategoryLoading || isSupplierLoading || isTrendingLoading;

  // Determine which products to show
  const getProductsToShow = () => {
    if (categoryProducts.length > 0) {
      return { products: categoryProducts, title: "Related Products", subtitle: "From the same category" };
    }
    if (supplierProducts.length > 0) {
      return { products: supplierProducts, title: "More from this Supplier", subtitle: "Other products from the same supplier" };
    }
    if (trendingProducts.length > 0) {
      return { products: trendingProducts, title: "Popular Products", subtitle: "Trending products you might like" };
    }
    return { products: [], title: "Related Products", subtitle: "" };
  };

  const { products, title, subtitle } = getProductsToShow();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Loading Related Products...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Related Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No related products found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={categoryId ? `/products?category=${categoryId}` : "/products"}>
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {/* View More Button */}
        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <Link href={categoryId ? `/products?category=${categoryId}` : "/products"}>
              <Package className="w-4 h-4 mr-2" />
              Explore More Products
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}