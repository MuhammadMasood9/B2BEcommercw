import { useState, useRef, useCallback, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import { Grid3X3, List, Loader2, AlertCircle } from "lucide-react";
import type { Product } from "@shared/schema";
import type { ProductFilters } from "./AdvancedProductFilters";

export interface SortOption {
  value: string;
  label: string;
}

interface ProductGridProps {
  filters: ProductFilters;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onProductAction?: (productId: string, action: string) => void;
  className?: string;
}

const sortOptions: SortOption[] = [
  { value: "relevance", label: "Best Match" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Highest Rated" },
  { value: "popularity", label: "Most Popular" },
  { value: "moq-low", label: "MOQ: Low to High" },
  { value: "moq-high", label: "MOQ: High to Low" },
  { value: "lead-time", label: "Shortest Lead Time" },
];

export default function ProductGrid({
  filters,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  onProductAction,
  className = ""
}: ProductGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Build query parameters from filters
  const buildQueryParams = (pageParam: number = 0) => {
    const params = new URLSearchParams({
      limit: "20",
      offset: pageParam.toString(),
      isPublished: "true",
      sort: sortBy,
    });

    // Add search query
    if (filters.search) {
      params.append("search", filters.search);
    }

    // Add category filter
    if (filters.categoryId && filters.categoryId !== "all") {
      params.append("categoryId", filters.categoryId);
    }

    // Add price range
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
      params.append("minPrice", filters.priceRange[0].toString());
      params.append("maxPrice", filters.priceRange[1].toString());
    }

    // Add MOQ range
    if (filters.moqRange[0] > 1 || filters.moqRange[1] < 50000) {
      params.append("minMoq", filters.moqRange[0].toString());
      params.append("maxMoq", filters.moqRange[1].toString());
    }

    // Add supplier filters
    if (filters.supplierCountries.length > 0) {
      params.append("supplierCountries", filters.supplierCountries.join(","));
    }

    if (filters.supplierTypes.length > 0) {
      params.append("supplierTypes", filters.supplierTypes.join(","));
    }

    // Add boolean filters
    if (filters.verifiedOnly) params.append("verifiedOnly", "true");
    if (filters.tradeAssuranceOnly) params.append("tradeAssuranceOnly", "true");
    if (filters.readyToShipOnly) params.append("readyToShipOnly", "true");
    if (filters.sampleAvailableOnly) params.append("sampleAvailableOnly", "true");
    if (filters.customizationAvailableOnly) params.append("customizationAvailableOnly", "true");
    if (filters.inStockOnly) params.append("inStockOnly", "true");

    // Add certifications
    if (filters.certifications.length > 0) {
      params.append("certifications", filters.certifications.join(","));
    }

    // Add payment terms
    if (filters.paymentTerms.length > 0) {
      params.append("paymentTerms", filters.paymentTerms.join(","));
    }

    // Add lead time range
    if (filters.leadTimeRange && filters.leadTimeRange !== "all") {
      params.append("leadTimeRange", filters.leadTimeRange);
    }

    // Add minimum rating
    if (filters.minRating > 0) {
      params.append("minRating", filters.minRating.toString());
    }

    return params;
  };

  // Fetch products with infinite scroll
  const {
    data: productPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery<Product[]>({
    queryKey: ["/api/products/filtered", filters, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const params = buildQueryParams(pageParam as number);
        const response = await fetch(`/api/products?${params.toString()}`, {
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.products || []);
        
        // Filter to only show published products
        return products.filter((p: Product) => p.isPublished === true);
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      // Continue fetching if we got a full page
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const products = productPages?.pages.flat() || [];

  // Infinite scroll setup
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  // Transform product for ProductCard component
  const transformProductForCard = (product: Product) => {
    // Get price ranges from product data
    let priceRanges = [];
    if (product.priceRanges) {
      try {
        priceRanges = typeof product.priceRanges === 'string' 
          ? JSON.parse(product.priceRanges) 
          : product.priceRanges;
      } catch (error) {
        console.error('Error parsing priceRanges:', error);
        priceRanges = [];
      }
    }
    
    const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges.map((r: any) => Number(r.pricePerUnit))) : 0;
    const priceRange = priceRanges.length > 0 
      ? `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
      : 'Contact for price';

    // Get images
    let images = [];
    if (product.images) {
      try {
        images = Array.isArray(product.images) 
          ? product.images 
          : (typeof product.images === 'string' ? JSON.parse(product.images) : []);
      } catch (error) {
        console.error('Error parsing images:', error);
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
      supplierName: 'Verified Supplier',
      supplierCountry: 'Global',
      supplierType: 'manufacturer',
      responseRate: '98%',
      responseTime: '< 2h',
      verified: true,
      tradeAssurance: product.hasTradeAssurance || true,
      readyToShip: product.inStock || false,
      sampleAvailable: product.sampleAvailable || false,
      customizationAvailable: product.customizationAvailable || false,
      certifications: product.certifications || ['ISO 9001', 'CE Mark'],
      rating: 4.8,
      reviews: Math.floor(Math.random() * 100) + 50,
      views: Math.floor(Math.random() * 1000) + 100,
      inquiries: Math.floor(Math.random() * 50) + 10,
      leadTime: product.leadTime || '7-15 days',
      port: product.port || 'Any Port',
      paymentTerms: product.paymentTerms || ['T/T', 'L/C', 'PayPal'],
      inStock: product.inStock || true,
      stockQuantity: product.stockQuantity || Math.floor(Math.random() * 1000) + 100
    };
  };

  const handleProductAction = (productId: string, action: string) => {
    onProductAction?.(productId, action);
  };

  if (isError) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : "Failed to load products"}
            </p>
            <Button onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLoading ? "Loading..." : `${products.length} Products Found`}
          </h2>
          {filters.search && (
            <p className="text-gray-600">
              Showing results for "{filters.search}"
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.categoryId !== "all" || filters.verifiedOnly || filters.tradeAssuranceOnly) && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
            </Badge>
          )}
          {filters.categoryId !== "all" && (
            <Badge variant="secondary">
              Category Filter Applied
            </Badge>
          )}
          {filters.verifiedOnly && (
            <Badge variant="secondary">
              Verified Only
            </Badge>
          )}
          {filters.tradeAssuranceOnly && (
            <Badge variant="secondary">
              Trade Assurance
            </Badge>
          )}
          {filters.readyToShipOnly && (
            <Badge variant="secondary">
              Ready to Ship
            </Badge>
          )}
        </div>
      )}

      {/* Products Grid/List */}
      {isLoading ? (
        <div className={`grid gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        }`}>
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          }`}>
            {products.map((product) => {
              const transformedProduct = transformProductForCard(product);
              
              return (
                <ProductCard
                  key={product.id}
                  {...transformedProduct}
                  viewMode={viewMode}
                  onAddToCart={() => handleProductAction(product.id, "addToCart")}
                  onContact={() => handleProductAction(product.id, "contact")}
                  onQuote={() => handleProductAction(product.id, "quote")}
                  onSample={() => handleProductAction(product.id, "sample")}
                  onFavorite={() => handleProductAction(product.id, "favorite")}
                  onShare={() => handleProductAction(product.id, "share")}
                />
              );
            })}
          </div>

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more products...</span>
              </div>
            )}
            {!hasNextPage && products.length > 0 && (
              <p className="text-gray-500 text-center">
                You've reached the end of the results
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Grid3X3 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't find any products matching your current filters. Try adjusting your search criteria or browse all products.
            </p>
            <Button onClick={() => window.location.href = "/products"}>
              Browse All Products
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}